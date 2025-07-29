// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZPu3Y0WqRsJLPy3z1V26c-coNFHkedqo",
  authDomain: "usaignanpresence.firebaseapp.com",
  projectId: "usaignanpresence",
  storageBucket: "usaignanpresence.firebasestorage.app",
  messagingSenderId: "623909412721",
  appId: "1:623909412721:web:48b69618d41d9d598760d0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
