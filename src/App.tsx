import React, { useState, useEffect } from 'react';
import { Player } from './types';
import { storage } from './utils/storage';
import { Dashboard } from './components/Dashboard';
import { PlayerList } from './components/PlayerList';
import { PlayerForm } from './components/PlayerForm';
import { PlayerDetail } from './components/PlayerDetail';
import { PerformanceEntry } from './components/PerformanceEntry';
import { Statistics } from './components/Statistics';
import { MatchResultsPage } from './components/MatchResultsPage';
import { PresencePage } from './components/PresencePage';
import { Routes, Route, Link as RouterLink, Navigate, Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Unavailability, Performance } from './types';

import { 
  Home, 
  Users, 
  Plus, 
  Activity, 
  BarChart3,
  ClipboardList,
  Menu, 
  X,
  FileText
} from 'lucide-react';
import { getAvailableSeasons } from './utils/seasonUtils';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const AppLayout: React.FC<{
  menuItems: MenuItem[];
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  children: React.ReactNode;
}> = ({ menuItems, sidebarOpen, setSidebarOpen, children }) => {
  const location = useLocation(); // Hook pour obtenir la localisation actuelle

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-black rounded-lg flex items-center justify-center">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">US AIGNAN</h1>
              <p className="text-sm text-gray-500">Gestion d'équipe</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <RouterLink
                to={item.path}
                key={item.id}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-secondary'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary' : 'text-gray-500 group-hover:text-secondary'} />
                <span className="font-medium">{item.label}</span>
              </RouterLink>
            );
          })}
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <RouterLink
            to="/players/add"
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-3 rounded-lg hover:bg-primary-hover transition-colors duration-200"
          >
            <Plus size={20} />
            <span>Nouveau joueur</span>
          </RouterLink>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-black rounded-lg flex items-center justify-center">
                <Users className="text-white" size={20} />
              </div>
              <span className="font-bold text-gray-900">US AIGNAN</span>
            </div>
            <div className="w-10" />
          </div>
        </div>
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children} {/* Utilisation de children pour rendre le contenu des routes */}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const navigate = useNavigate();
  const [user, setUser] = useState<import('firebase/auth').User | null>(null);

  // Effect for Firebase anonymous authentication
  useEffect(() => {
    const { onAuthStateChanged, signInAnonymously } = require('firebase/auth');
    const { auth } = require('./firebase');

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          setUser(userCredential.user);
        } catch (error) {
          console.error("Anonymous sign-in failed:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Effect for loading player data, now dependent on user authentication
  useEffect(() => {
    if (user) { // Only run if user is authenticated
      const fetchPlayers = async () => {
        const allPlayers = await storage.getPlayers();
        setPlayers(allPlayers);
        const seasons = getAvailableSeasons(allPlayers);
        if (seasons.length > 0) {
          setSelectedSeason(seasons[0]);
        }
      };
      fetchPlayers();
    }
  }, [user]); // Rerun when user state changes

  const refreshPlayers = async () => {
    setPlayers(await storage.getPlayers());
  };

  const handleSavePlayer = async (player: Player) => {
    const existingPlayer = players.find(p => p.id === player.id);
    if (existingPlayer) {
      await storage.updatePlayer(player);
    } else {
      await storage.addPlayer(player);
    }
    await refreshPlayers();
    navigate('/players');
  };

  const handleImportPlayers = async (importedPlayers: Player[]) => {
    const newPlayers = importedPlayers.map(p => ({
      ...p,
      id: p.id || `imported-${Date.now()}-${Math.random()}`,
    }));
    await storage.addMultiplePlayers(newPlayers);
    await refreshPlayers();
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce joueur ?')) {
      await storage.deletePlayer(playerId);
      await refreshPlayers();
      if(window.location.pathname.includes(`/players/${playerId}`)) {
        navigate('/players');
      }
    }
  };

  const handleDeleteMultiplePlayers = async (playerIds: string[]) => {
    await storage.deleteMultiplePlayers(playerIds);
    await refreshPlayers();
  };

  const handleSavePerformance = async (playerId: string, performanceData: Omit<Performance, 'id' | 'season' | 'excused'>) => {
    const performanceWithSeason: Omit<Performance, 'id' | 'excused'> = {
      ...performanceData,
      season: selectedSeason,
    };
    await storage.addPerformance(playerId, performanceWithSeason);
    await refreshPlayers();
  };

  const handleUpdatePlayerStorage = async (
    type: 'unavailabilityDelete' | 'unavailabilityAdd' | 'matchUpdate' | 'matchDelete',
    refData: any,
    value?: any
  ) => {
    // This function needs a significant refactor for async operations.
    // For now, we will just refresh from DB after any operation.
    // A more granular approach would be to update the player state directly.
    await refreshPlayers();
  };

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home, path: '/' },
    { id: 'players', label: 'Joueurs', icon: Users, path: '/players' },
    { id: 'performance', label: 'Performances', icon: Activity, path: '/performance' },
    { id: 'presence', label: 'Présence', icon: FileText, path: '/presence' },
    { id: 'statistics', label: 'Statistiques', icon: BarChart3, path: '/statistics' },
    { id: 'results', label: 'Résultats Saison', icon: ClipboardList, path: '/results' },
  ];

  return (
      <AppLayout
        menuItems={menuItems}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      >
        <Routes>
          <Route path="/" element={<Dashboard players={players} selectedSeason={selectedSeason} onSeasonChange={setSelectedSeason} allPlayers={players} />} />
          <Route path="/players" element={<PlayerList players={players} onDeletePlayer={handleDeletePlayer} onImportPlayers={handleImportPlayers} onDeleteMultiple={handleDeleteMultiplePlayers} />} />
          <Route path="/players/add" element={<PlayerFormWrapper onSave={handleSavePlayer} players={players} />} />
          <Route path="/players/edit/:playerId" element={<PlayerFormWrapper players={players} onSave={handleSavePlayer} />} />
          <Route path="/players/:playerId" element={<PlayerDetailWrapper players={players} onPlayerUpdate={handleUpdatePlayerStorage} onDeletePlayer={handleDeletePlayer} onEditPlayerRedirect={(id) => navigate(`/players/edit/${id}`)} />} />
          <Route path="/performance" element={<PerformanceEntry players={players} onSavePerformance={handleSavePerformance} />} />
          <Route path="/presence" element={<PresencePage />} />
          <Route path="/statistics" element={<Statistics players={players} selectedSeason={selectedSeason} onSeasonChange={setSelectedSeason} allPlayers={players} />} />
          <Route path="/results" element={<MatchResultsPage allPlayers={players} selectedSeason={selectedSeason} onSeasonChange={setSelectedSeason} onUpdatePlayerStorage={handleUpdatePlayerStorage} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
  );
}

const PlayerFormWrapper: React.FC<{players?: Player[], onSave: (player: Player) => void}> = ({players, onSave}) => {
  const navigate = useNavigate();
  const { playerId } = useParams<{ playerId: string }>();
  const playerToEdit = playerId && players ? players.find(p => p.id === playerId) : undefined;

  return <PlayerForm player={playerToEdit} onSave={onSave} onCancel={() => navigate('/players')} />;
};

const PlayerDetailWrapper: React.FC<{players: Player[], onPlayerUpdate: Function, onDeletePlayer: (id: string) => void, onEditPlayerRedirect: (id: string) => void}> = ({players, onPlayerUpdate, onDeletePlayer, onEditPlayerRedirect }) => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const player = players.find(p => p.id === playerId);

  if (!player) return <Navigate to="/players" />;

  return <PlayerDetail
            player={player}
            onBack={() => navigate('/players')}
            onEdit={() => onEditPlayerRedirect(player.id)}
            onPlayerUpdate={onPlayerUpdate}
         />;
};

export default App;