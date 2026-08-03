import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "mmk-player-finance-89971",
  appId: "1:753906579477:web:3bb644fe93853f6188b61c",
  storageBucket: "mmk-player-finance-89971.firebasestorage.app",
  apiKey: "AIzaSyDorwnQeO-sFBpeyRYVVDyJ9WYb-LPOGxk",
  authDomain: "mmk-player-finance-89971.firebaseapp.com",
  messagingSenderId: "753906579477",
  measurementId: "G-L4JXJTY5FV"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with multi-tab offline persistence enabled
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Firebase Auth
const auth = getAuth(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, db, auth, googleProvider };
