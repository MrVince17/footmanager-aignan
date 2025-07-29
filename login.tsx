import React, { useState, useEffect } from 'react';
import { auth } from './src/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

interface LoginProps {
  setUser: (user: User | null) => void;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  // Vérifier l'état de l'utilisateur connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [setUser]);

  // Gérer la connexion
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Gérer l’inscription (optionnel)
  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
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