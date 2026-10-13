import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the project's provisioned database ID
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Enforce browserLocalPersistence to maintain authentic sessions across reloads
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase Auth persistence configuration warning:', err);
});

/**
 * Observe authentic Firebase Auth state changes
 * Zero mock logic: returns null when unauthenticated
 */
export function observeAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

/**
 * Sign out current Firebase user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
