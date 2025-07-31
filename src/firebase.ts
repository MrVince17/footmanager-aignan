// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual configuration values
const firebaseConfig = {
  apiKey: "AIzaSyCY1jFW7BNp8fLoRxeflIS8c2BFAI28FII",
  authDomain: "gestion-equipe-football.firebaseapp.com",
  projectId: "gestion-equipe-football",
  storageBucket: "gestion-equipe-football.firebasestorage.app",
  messagingSenderId: "714709524979",
  appId: "1:714709524979:web:3bd368ddd08f59098fb286",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
