import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Login from './Login';
import { Dashboard } from './src/components/Dashboard';
import { getAvailableSeasons } from './src/utils/seasonUtils';
import { auth } from './src/firebase';
import { User, signOut } from 'firebase/auth';
import { Player } from './src/types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');

  // Charger les joueurs et définir la saison par défaut
  useEffect(() => {
    // TODO: This logic should be moved to a component that uses firestore
    // For now, we just initialize the state with empty arrays
    setPlayers([]);
    const seasons = getAvailableSeasons([]);
    if (seasons.length > 0) {
      setSelectedSeason(seasons[0]);
    }
  }, []);

  // Vérifier l'état de l'utilisateur connecté
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return user ? (
    <div className="p-4">
      <Dashboard
        players={players}
        allPlayers={players}
        selectedSeason={selectedSeason}
        onSeasonChange={setSelectedSeason}
      />
      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600"
      >
        Déconnexion
      </button>
    </div>
  ) : (
    <Login setUser={setUser} />
  );
};

// Rendu de l'application
ReactDOM.render(<App />, document.getElementById('root'));