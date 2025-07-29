import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Login from './Login';
import { Dashboard } from './src/components/Dashboard';
import { storage } from './src/utils/storage';
import { getAvailableSeasons } from './src/utils/seasonUtils';

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.auth.User | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');

  // Charger les joueurs et définir la saison par défaut
  useEffect(() => {
    const loadedPlayers = storage.getPlayers();
    setPlayers(loadedPlayers);
    const seasons = getAvailableSeasons(loadedPlayers);
    if (seasons.length > 0) {
      setSelectedSeason(seasons[0]);
    }
  }, []);

  // Vérifier l'état de l'utilisateur connecté
  useEffect(() => {
    const auth = firebase.auth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return user ? (
    <div className="p-4">
      <Dashboard
        players={players}
        allPlayers={players}
        selectedSeason={selectedSeason}
        onSeasonChange={setSelectedSeason}
      />
      <button
        onClick={() => firebase.auth().signOut()}
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