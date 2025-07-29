import React, { useState, useEffect } from 'react';

// Configuration Firebase (remplace par tes propres clés)
const firebaseConfig = {
  apiKey: "AIzaSyBZPu3Y0WqRsJLPy3z1V26c-coNFHkedqo",
  authDomain: "usaignanpresence.firebaseapp.com",
  projectId: "usaignanpresence",
  storageBucket: "usaignanpresence.firebasestorage.app",
  messagingSenderId: "623909412721",
  appId: "1:623909412721:web:48b69618d41d9d598760d0"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

interface LoginProps {
  setUser: (user: firebase.auth.User | null) => void;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  // Vérifier l'état de l'utilisateur connecté
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [setUser]);

  // Gérer la connexion
  const handleLogin = async () => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Gérer l’inscription (optionnel)
  const handleSignUp = async () => {
    try {
      await auth.createUserWithEmailAndPassword(email, password);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      handleSignUp();
    } else {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">{isSignUp ? 'Inscription' : 'Connexion'}</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full p-2 mb-4 border rounded"
            required
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            {isSignUp ? 'S’inscrire' : 'Se connecter'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 text-blue-500 hover:underline"
        >
          {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S’inscrire'}
        </button>
      </div>
    </div>
  );
};

export default Login;