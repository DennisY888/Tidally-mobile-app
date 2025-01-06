// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "tidally-33f78.firebaseapp.com",
  projectId: "tidally-33f78",
  storageBucket: "tidally-33f78.firebasestorage.app",
  messagingSenderId: "572404761850",
  appId: "1:572404761850:web:6794661fc722eb86417543",
  measurementId: "G-1Y88SN7JYD"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db=getFirestore(app)
export const storage=getStorage(app)
// const analytics = getAnalytics(app);