import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDZxfwd7c038P8qSNS2N_JoDAvXSZxsnKM",
  authDomain: "slide-golf.firebaseapp.com",
  projectId: "slide-golf",
  storageBucket: "slide-golf.firebasestorage.app",
  messagingSenderId: "339570748437",
  appId: "1:339570748437:web:1822cfd2ec3c3d5c06721c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// Force local persistence so the sign-in session survives the
// iOS Safari OAuth-redirect handoff. Without this, Safari sometimes
// drops the session as soon as it lands back on the app domain.
setPersistence(auth, browserLocalPersistence).catch(() => {});
