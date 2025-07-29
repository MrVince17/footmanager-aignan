import React, { useState, useEffect } from 'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.development.js';
import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.development.js';
import Login from './Login.js';

// Ton composant principal existant (remplace par ton code existant)
const MainApp = ({ user }) => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Bienvenue, {user.email}</h1>
      {/* Insère ici le code de tes pages existantes */}
      <button
        onClick={() => firebase.auth().signOut()}
        className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600"
      >
        Déconnexion
      </button>
    </div>
  );
};

// Composant principal de l'application
const App = () => {
  const [user, setUser] = useState(null);

  // Vérifier l'état de l'utilisateur connecté
  useEffect(() => {
    const auth = firebase.auth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return user ? <MainApp user={user} /> : <Login setUser={setUser} />;
};

// Rendu de l'application
ReactDOM.render(<App />, document.getElementById('root'));