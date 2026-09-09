import { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  ShieldCheck, 
  Volume2, 
  Monitor, 
  Sparkles,
  Signal,
  UserPlus,
  Wifi,
  Gauge,
  Check,
  X,
  LayoutGrid,
  Users,
  Globe,
  Headphones,
  Radio
} from 'lucide-react';
import { Chat, User, CallParticipant } from '../types';

interface CallModalProps {
  chat: Chat;
  callType: 'audio' | 'video';
  currentUser: User;
  registeredUsers?: User[];
  onEndCall: () => void;
}

export const CallModal = ({
  chat,
  callType: initialCallType,
  currentUser,
  registeredUsers = [],
  onEndCall,
}: CallModalProps) => {
  const [callType, setCallType] = useState<'audio' | 'video'>(initialCallType);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(initialCallType === 'audio');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLowDataMode, setIsLowDataMode] = useState(false);
  const [isSpatialAudio, setIsSpatialAudio] = useState(true);
  const [isNoiseSuppression, setIsNoiseSuppression] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected'>('connecting');
  const [viewMode, setViewMode] = useState<'grid' | 'speaker'>('grid');
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);

  // Initialize participants based on chat type (for direct chat: 2 people; for group: existing participants or up to 8-16)
  const [participants, setParticipants] = useState<CallParticipant[]>(() => {
    if (chat.type === 'direct') {
      const otherUser = chat.participants.find((p) => p.id !== currentUser.id) || {
        id: 'other-user',
        name: chat.name,
        avatar: chat.avatar,
      };
      return [
        {
          id: currentUser.id,
          name: `${currentUser.name} (You)`,
          avatar: currentUser.avatar,
          isMuted: false,
          isVideoOff: initialCallType === 'audio',
          isSpeaking: false,
          networkQuality: 'excellent',
        },
        {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          isMuted: false,
          isVideoOff: initialCallType === 'audio',
          isSpeaking: true,
          networkQuality: 'excellent',
        },
      ];
    } else {
      // Group call: initialize with existing group members (e.g. 6 to 8 participants)
      const callMembers = chat.participants.slice(0, 8);
      return callMembers.map((member, idx) => ({
        id: member.id,
        name: member.id === currentUser.id ? `${member.name} (You)` : member.name,
        avatar: member.avatar,
        isMuted: idx % 3 === 1,
        isVideoOff: initialCallType === 'audio' || idx % 4 === 2,
        isSpeaking: idx === 1,
        networkQuality: idx % 2 === 0 ? 'excellent' : 'good',
      }));
    }
  });

  const [activeSpeakerId, setActiveSpeakerId] = useState<string>(
    participants.length > 1 ? participants[1].id : participants[0].id
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Duration timer
  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallStatus('connected');
    }, 1200);

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(interval);
    };
  }, []);

  // Simulate active speaker cycling in group call
  useEffect(() => {
    if (participants.length <= 1) return;

    const speakerInterval = setInterval(() => {
      // Pick random non-muted participant other than user
      const candidateParticipants = participants.filter((p) => p.id !== currentUser.id && !p.isMuted);
      if (candidateParticipants.length > 0) {
        const randomSpeaker = candidateParticipants[Math.floor(Math.random() * candidateParticipants.length)];
        setActiveSpeakerId(randomSpeaker.id);
        setParticipants((prev) =>
          prev.map((p) => ({
            ...p,
            isSpeaking: p.id === randomSpeaker.id,
          }))
        );
      }
    }, 4000);

    return () => clearInterval(speakerInterval);
  }, [participants, currentUser.id]);

  // Real webcam access if supported
  useEffect(() => {
    if (callType === 'video' && !isVideoOff) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            setCameraStream(stream);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.log('Using simulated video stream fallback:', err);
          });
      }
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    }

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [callType, isVideoOff]);

  const handleAddParticipant = (user: User) => {
    if (participants.some((p) => p.id === user.id)) return;
    if (participants.length >= 16) return;

    const newParticipant: CallParticipant = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      isMuted: false,
      isVideoOff: callType === 'audio',
      isSpeaking: false,
      networkQuality: 'good',
    };

    setParticipants((prev) => [...prev, newParticipant]);
    setShowAddParticipantModal(false);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine grid columns based on participant count
  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 12) return 'grid-cols-3 sm:grid-cols-4';
    return 'grid-cols-4';
  };

  const activeSpeaker = participants.find((p) => p.id === activeSpeakerId) || participants[0];

  return (
    <div id="call-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-2 sm:p-4">
      <div 
        id="call-container"
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-[90vh] max-h-[780px]"
      >
        {/* Top Header info */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between z-20 shrink-0 bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden xs:inline">E2E Encrypted</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Yapp It Web Calling</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="font-semibold text-white">{chat.name}</span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-emerald-400 font-semibold">{formatTime(seconds)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Spatial Audio Toggle */}
            <button
              onClick={() => setIsSpatialAudio((prev) => !prev)}
              title="Spatial Audio: Designed to feel like you're in the same room"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                isSpatialAudio
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Same Room Audio</span>
            </button>

            {/* Low Data Mode Toggle Button */}
            <button
              id="low-data-mode-btn"
              onClick={() => setIsLowDataMode((prev) => !prev)}
              title="Adaptive Low-Data Mode for slow 2G/3G mobile networks"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                isLowDataMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isLowDataMode ? 'Low Data (2G/3G)' : 'Low Data Mode'}
              </span>
              <span className="sm:hidden">2G/3G</span>
            </button>

            {/* View Mode Toggle (for 3+ participants) */}
            {participants.length > 2 && (
              <button
                onClick={() => setViewMode((prev) => (prev === 'grid' ? 'speaker' : 'grid'))}
                title={viewMode === 'grid' ? 'Switch to Active Speaker View' : 'Switch to Grid View'}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            )}

            {/* Add Participant to Call (up to 16) */}
            <button
              id="add-call-participant-btn"
              onClick={() => setShowAddParticipantModal(true)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
              title="Invite participants (Supports up to 16 in group call)"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Add</span>
              <span className="font-mono bg-indigo-700 px-1.5 py-0.2 rounded text-[10px]">
                {participants.length}/16
              </span>
            </button>
          </div>
        </div>

        {/* Notice banner if Low Data Mode is active */}
        {isLowDataMode && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1 text-[11px] text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-amber-400" />
              Low Data Mode enabled: Opus audio optimized (12 kbps) for slow phone networks.
            </span>
            <span className="font-mono text-[10px] text-amber-400 font-semibold">Adaptive Bitrate</span>
          </div>
        )}

        {/* Main Participants Stage */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-950 flex flex-col justify-center">
          {viewMode === 'speaker' && participants.length > 2 ? (
            /* ACTIVE SPEAKER VIEW */
            <div className="flex-1 flex flex-col h-full gap-3">
              {/* Large Active Speaker Tile */}
              <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-850 border-2 border-emerald-500/80 shadow-2xl flex items-center justify-center">
                {activeSpeaker.id === currentUser.id && cameraStream && !isVideoOff ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                    <img
                      src={activeSpeaker.avatar}
                      alt={activeSpeaker.name}
                      className="w-full h-full object-cover filter brightness-50 blur-sm"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center">
                      <div className="relative">
                        <div className="absolute -inset-3 rounded-full bg-emerald-500/30 animate-pulse" />
                        <img
                          src={activeSpeaker.avatar}
                          alt={activeSpeaker.name}
                          className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-400 shadow-2xl relative z-10"
                        />
                      </div>
                      <h4 className="text-lg font-bold text-white mt-3">{activeSpeaker.name}</h4>
                      <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Speaking now
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-2">
                  <span>{activeSpeaker.name}</span>
                  {activeSpeaker.isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                </div>
              </div>

              {/* Other Participants Carousel Strip */}
              <div className="h-24 sm:h-28 flex gap-2 overflow-x-auto pb-1 shrink-0">
                {participants
                  .filter((p) => p.id !== activeSpeaker.id)
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setActiveSpeakerId(p.id)}
                      className="w-28 sm:w-32 h-full rounded-xl bg-slate-850 border border-slate-700/80 hover:border-indigo-400 cursor-pointer overflow-hidden relative shrink-0 transition-all flex flex-col items-center justify-center"
                    >
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-10 h-10 rounded-full object-cover mb-1 ring-1 ring-slate-600"
                      />
                      <span className="text-[11px] font-medium text-slate-200 truncate max-w-[90%]">
                        {p.name}
                      </span>
                      {p.isMuted && (
                        <MicOff className="w-3 h-3 text-red-400 absolute top-1.5 right-1.5" />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* GRID VIEW (Dynamic 1 to 16 participants) */
            <div className={`grid ${getGridClass(participants.length)} gap-2 sm:gap-3 h-full auto-rows-fr`}>
              {participants.map((p) => {
                const isMe = p.id === currentUser.id;
                const isSpeaking = p.isSpeaking;

                return (
                  <div
                    key={p.id}
                    className={`relative rounded-2xl overflow-hidden bg-slate-850 border flex flex-col items-center justify-center p-3 transition-all ${
                      isSpeaking
                        ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Video Content or Avatar Fallback */}
                    {isMe && cameraStream && !isVideoOff ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover mirror rounded-xl"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center my-auto">
                        <div className="relative mb-2">
                          {isSpeaking && (
                            <div className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-pulse" />
                          )}
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shadow-lg relative z-10 ${
                              isSpeaking ? 'ring-2 ring-emerald-400' : 'ring-1 ring-slate-700'
                            }`}
                          />
                        </div>

                        {/* Speaking Waveform / Status */}
                        {isSpeaking && !p.isMuted ? (
                          <div className="flex items-center gap-0.5 h-3 mt-1">
                            <span className="w-0.5 h-full bg-emerald-400 animate-pulse rounded-full" />
                            <span className="w-0.5 h-2 bg-emerald-400 animate-pulse rounded-full" />
                            <span className="w-0.5 h-3 bg-emerald-400 animate-pulse rounded-full" />
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Participant Name Badge */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                      <div className="bg-slate-900/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-semibold text-white truncate max-w-[80%] flex items-center gap-1.5 border border-slate-800">
                        <span className="truncate">{p.name}</span>
                        {isMe && <span className="text-indigo-300 text-[10px]">(You)</span>}
                      </div>

                      <div className="flex items-center gap-1">
                        {p.isMuted ? (
                          <span className="p-1 bg-red-600/90 rounded-md text-white">
                            <MicOff className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="p-1 bg-emerald-600/80 rounded-md text-white">
                            <Mic className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Network quality indicator */}
                    <div className="absolute top-2 right-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          p.networkQuality === 'excellent'
                            ? 'bg-emerald-400'
                            : p.networkQuality === 'good'
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                        }`}
                        title={`Connection: ${p.networkQuality}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Call Action Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3 sm:gap-4 shrink-0 z-20">
          {/* Mute Microphone */}
          <button
            id="toggle-mute-btn"
            onClick={() => {
              setIsMuted((prev) => !prev);
              setParticipants((prev) =>
                prev.map((p) =>
                  p.id === currentUser.id ? { ...p, isMuted: !p.isMuted } : p
                )
              );
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
            className={`p-3 sm:p-3.5 rounded-full transition-all ${
              isMuted
                ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-500/50'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Camera */}
          <button
            id="toggle-video-btn"
            onClick={() => {
              if (callType === 'audio') {
                setCallType('video');
                setIsVideoOff(false);
              } else {
                setIsVideoOff((prev) => !prev);
              }
              setParticipants((prev) =>
                prev.map((p) =>
                  p.id === currentUser.id ? { ...p, isVideoOff: !p.isVideoOff } : p
                )
              );
            }}
            title={isVideoOff ? 'Turn on Camera' : 'Turn off Camera'}
            className={`p-3 sm:p-3.5 rounded-full transition-all ${
              isVideoOff
                ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                : 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-500/50'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* AI Noise Suppression */}
          <button
            id="toggle-noise-suppression-btn"
            onClick={() => setIsNoiseSuppression((prev) => !prev)}
            title={isNoiseSuppression ? 'AI Noise Suppression: Enabled' : 'AI Noise Suppression: Disabled'}
            className={`p-3 sm:p-3.5 rounded-full transition-all ${
              isNoiseSuppression
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Screen Share */}
          <button
            id="toggle-screen-share-btn"
            onClick={() => setIsScreenSharing((prev) => !prev)}
            title="Share Screen"
            className={`p-3 sm:p-3.5 rounded-full transition-all ${
              isScreenSharing
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* End Call */}
          <button
            id="end-call-btn"
            onClick={onEndCall}
            title="End Call"
            className="p-3.5 sm:p-4 bg-red-600 hover:bg-red-500 text-white rounded-full transition-transform active:scale-95 shadow-xl ring-4 ring-red-600/30"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

        {/* Invite/Add Participant Modal Overlay */}
        {showAddParticipantModal && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col max-h-[80%]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">Add to Group Call</h3>
                </div>
                <button
                  onClick={() => setShowAddParticipantModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400 my-2">
                Yapp It supports up to 16 participants on clear encrypted audio/video calls.
              </p>

              {/* User list */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 my-2">
                {INITIAL_USERS.map((u) => {
                  const alreadyInCall = participants.some((p) => p.id === u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => !alreadyInCall && handleAddParticipant(u)}
                      className={`p-2.5 flex items-center justify-between rounded-xl cursor-pointer transition-colors ${
                        alreadyInCall
                          ? 'opacity-40 cursor-not-allowed bg-slate-850/50'
                          : 'hover:bg-slate-800 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-100">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.phone}</p>
                        </div>
                      </div>

                      {alreadyInCall ? (
                        <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> In Call
                        </span>
                      ) : (
                        <button className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-md">
                          Invite
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setShowAddParticipantModal(false)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
