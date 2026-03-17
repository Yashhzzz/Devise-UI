// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBju5m5jdhrlMBeUjnxSqMJUS4Hs8jpGDg",
  authDomain: "steadfast-wares-481309-m5.firebaseapp.com",
  projectId: "steadfast-wares-481309-m5",
  storageBucket: "steadfast-wares-481309-m5.firebasestorage.app",
  messagingSenderId: "1017722427416",
  appId: "1:1017722427416:web:ed0a9b4f3ab392bf4acb6d",
  measurementId: "G-1D8PQZKEY0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);