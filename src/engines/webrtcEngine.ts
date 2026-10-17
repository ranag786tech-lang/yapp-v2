/**
 * ============================================================================
 * ENGINE 4: WEBRTC SIGNALING BROKER (Audio/Video Calls)
 * ============================================================================
 * 
 * Firestore-backed WebRTC signaling broker for "Yapp It".
 * Synchronizes SDP Offers, SDP Answers, and ICE Candidates.
 * 
 * Features:
 * - PeerConnection setup with public Google STUN servers.
 * - Call creation (`createCall`) with SDP Offer and caller candidate streaming.
 * - Call answering (`answerCall`) with SDP Answer and callee candidate streaming.
 * - Real-time call state synchronization (`listenToCall`).
 * - Graceful hang-up and cleanup (`endCall`).
 * - Strictly typed: Zero 'any' types.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ---------------------------------------------------------------------------
// Types & WebRTC Configuration
// ---------------------------------------------------------------------------

export type CallType = 'audio' | 'video';
export type CallStatus = 'calling' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'busy';

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
}

export interface CallSessionDocument {
  id: string;
  callType: CallType;
  status: CallStatus;
  caller: CallParticipant;
  receiver: CallParticipant;
  offer?: {
    type: 'offer';
    sdp: string;
  };
  answer?: {
    type: 'answer';
    sdp: string;
  };
  createdAt: string;
  endedAt?: string;
}

export interface SerializedIceCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  usernameFragment: string | null;
}

export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

/**
 * Initialize a new RTCPeerConnection and attach local media tracks.
 */
export function initializePeerConnection(
  localStream: MediaStream,
  onRemoteStream: (remoteStream: MediaStream) => void
): RTCPeerConnection {
  const pc = new RTCPeerConnection(RTC_CONFIGURATION);
  const remoteStream = new MediaStream();

  // Attach local audio/video tracks to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Handle incoming remote tracks
  pc.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    onRemoteStream(remoteStream);
  };

  return pc;
}

/**
 * Engine Function: Create and initiate a WebRTC call session.
 * 
 * 1. Creates call document in Firestore `calls/{callId}`.
 * 2. Gathers caller ICE candidates and writes to subcollection `offerCandidates`.
 * 3. Creates SDP Offer and stores it in the call document.
 * 4. Listens for callee's answer and `answerCandidates`.
 */
export async function createCallSession(
  pc: RTCPeerConnection,
  caller: CallParticipant,
  receiver: CallParticipant,
  callType: CallType
): Promise<{
  callId: string;
  unsubscribeListeners: () => void;
}> {
  const callDocRef = doc(collection(db, 'calls'));
  const callId = callDocRef.id;

  const offerCandidatesCol = collection(db, 'calls', callId, 'offerCandidates');
  const answerCandidatesCol = collection(db, 'calls', callId, 'answerCandidates');

  // Stream local ICE candidates to Firestore offerCandidates subcollection
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidatePayload: SerializedIceCandidate = {
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        usernameFragment: event.candidate.usernameFragment,
      };
      addDoc(offerCandidatesCol, candidatePayload).catch((err) => {
        console.warn('[WebRTC] Failed to write offer candidate:', err);
      });
    }
  };

  // Create WebRTC Offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const initialCallDoc: CallSessionDocument = {
    id: callId,
    callType,
    status: 'calling',
    caller,
    receiver,
    offer: {
      type: 'offer',
      sdp: offerDescription.sdp || '',
    },
    createdAt: new Date().toISOString(),
  };

  await setDoc(callDocRef, {
    ...initialCallDoc,
    serverTime: serverTimestamp(),
  });

  // Listen for the callee's answer
  const unsubscribeCallDoc = onSnapshot(callDocRef, (snapshot) => {
    const data = snapshot.data();
    if (data && !pc.currentRemoteDescription && data.answer) {
      const answerDescription = new RTCSessionDescription({
        type: data.answer.type,
        sdp: data.answer.sdp,
      });
      pc.setRemoteDescription(answerDescription).catch((err) => {
        console.error('[WebRTC] Error setting remote description for answer:', err);
      });
    }
  });

  // Listen for remote ICE candidates added by callee
  const unsubscribeAnswerCandidates = onSnapshot(answerCandidatesCol, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data() as SerializedIceCandidate;
        const candidate = new RTCIceCandidate({
          candidate: data.candidate,
          sdpMid: data.sdpMid,
          sdpMLineIndex: data.sdpMLineIndex,
          usernameFragment: data.usernameFragment,
        });
        pc.addIceCandidate(candidate).catch((err) => {
          console.warn('[WebRTC] Error adding answer candidate:', err);
        });
      }
    });
  });

  const unsubscribeListeners = () => {
    unsubscribeCallDoc();
    unsubscribeAnswerCandidates();
  };

  return { callId, unsubscribeListeners };
}

/**
 * Engine Function: Callee answers an incoming WebRTC call.
 * 
 * 1. Reads remote SDP Offer from `calls/{callId}`.
 * 2. Sets remote description.
 * 3. Creates SDP Answer and writes it back to Firestore.
 * 4. Gathers callee ICE candidates into `answerCandidates`.
 * 5. Listens for caller's `offerCandidates`.
 */
export async function answerCallSession(
  callId: string,
  pc: RTCPeerConnection
): Promise<{ unsubscribeListeners: () => void }> {
  const callDocRef = doc(db, 'calls', callId);
  const offerCandidatesCol = collection(db, 'calls', callId, 'offerCandidates');
  const answerCandidatesCol = collection(db, 'calls', callId, 'answerCandidates');

  // Fetch offer
  const callSnapshot = await getDoc(callDocRef);
  if (!callSnapshot.exists()) {
    throw new Error(`Call session with ID ${callId} does not exist.`);
  }

  const callData = callSnapshot.data() as CallSessionDocument;
  if (!callData.offer) {
    throw new Error('Call does not contain a valid SDP Offer.');
  }

  // Stream callee's ICE candidates to Firestore answerCandidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidatePayload: SerializedIceCandidate = {
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        usernameFragment: event.candidate.usernameFragment,
      };
      addDoc(answerCandidatesCol, candidatePayload).catch((err) => {
        console.warn('[WebRTC] Failed to write answer candidate:', err);
      });
    }
  };

  // Set Remote Offer
  await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

  // Create Local Answer
  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  await updateDoc(callDocRef, {
    status: 'connected',
    answer: {
      type: 'answer',
      sdp: answerDescription.sdp || '',
    },
    answeredAt: new Date().toISOString(),
  });

  // Listen to remote offerCandidates
  const unsubscribeOfferCandidates = onSnapshot(offerCandidatesCol, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data() as SerializedIceCandidate;
        const candidate = new RTCIceCandidate({
          candidate: data.candidate,
          sdpMid: data.sdpMid,
          sdpMLineIndex: data.sdpMLineIndex,
          usernameFragment: data.usernameFragment,
        });
        pc.addIceCandidate(candidate).catch((err) => {
          console.warn('[WebRTC] Error adding offer candidate:', err);
        });
      }
    });
  });

  return {
    unsubscribeListeners: unsubscribeOfferCandidates,
  };
}

/**
 * Engine Function: Observe call state changes (connected, ended, rejected).
 */
export function listenToCallSession(
  callId: string,
  onUpdate: (session: CallSessionDocument) => void
): Unsubscribe {
  const callDocRef = doc(db, 'calls', callId);
  return onSnapshot(callDocRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as CallSessionDocument);
    }
  });
}

/**
 * Engine Function: End or reject a call and clean up connection.
 */
export async function terminateCallSession(
  callId: string,
  pc?: RTCPeerConnection | null,
  localStream?: MediaStream | null,
  finalStatus: 'ended' | 'rejected' | 'busy' = 'ended'
): Promise<void> {
  // 1. Update Firestore call document
  try {
    const callDocRef = doc(db, 'calls', callId);
    await updateDoc(callDocRef, {
      status: finalStatus,
      endedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[WebRTC] Error terminating call session in Firestore:', err);
  }

  // 2. Stop local audio/video hardware tracks
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }

  // 3. Close RTCPeerConnection
  if (pc) {
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.close();
  }
}
