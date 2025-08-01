import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCY1jFW7BNp8fLoRxeflIS8c2BFAI28FII",
  authDomain: "gestion-equipe-football.firebaseapp.com",
  projectId: "gestion-equipe-football",
  storageBucket: "gestion-equipe-football.firebasestorage.app",
  messagingSenderId: "714709524979",
  appId: "1:714709524979:web:3bd368ddd08f59098fb286"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you will use
export const db = getFirestore(app);
export const auth = getAuth(app);
