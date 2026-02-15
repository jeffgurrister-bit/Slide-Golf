import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
