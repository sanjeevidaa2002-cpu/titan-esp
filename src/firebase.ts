/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  setLogLevel
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Injected config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAAUjOz09JI4PX6_PiVey1QTRMPMcol73E",
  authDomain: "gen-lang-client-0214369161.firebaseapp.com",
  projectId: "gen-lang-client-0214369161",
  storageBucket: "gen-lang-client-0214369161.firebasestorage.app",
  messagingSenderId: "87360915147",
  appId: "1:87360915147:web:3e7251f42a24fcfe69bd4e"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if provided, otherwise default
const firestoreDatabaseId = "ai-studio-22a89eb0-4b83-4567-8432-43908d6700dc";
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
}, firestoreDatabaseId);

const storage = getStorage(app);

// Silence internal SDK logs to maintain clean logs and handle connectivity fallback beautifully
setLogLevel('silent');

const auth = getAuth(app);
// Ensure auth persistence is set to local
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Auth persistence failed:");
});

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export { app, auth, db, storage, googleProvider, signOut, signInWithPopup };
