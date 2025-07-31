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
import { Routes, Route, Link as RouterLink, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Performance } from './types';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './firebase';

import { 
  Home, 
  Users, 
  Plus, 
  Activity, 
  BarChart3,
  ClipboardList,
  Menu, 
  X,
  FileText,
  LogOut
} from 'lucide-react';
import { getAvailableSeasons } from './utils/seasonUtils';
import { User } from 'firebase/auth';

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
  user: User;
}> = ({ menuItems, sidebarOpen, setSidebarOpen, children, user }) => {
  const location = useLocation(); // Hook pour obtenir la localisation actuelle

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

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
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
           <div className="text-xs text-center text-gray-500 truncate px-2" title={user.email || 'Admin'}>
            Connecté: {user.email || 'Admin'}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
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

const SignInScreen: React.FC = () => {
  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-10 bg-white rounded-xl shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-2">Gestion US Aignan</h1>
        <p className="text-gray-600 mb-6">Veuillez vous connecter pour continuer</p>
        <button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          <svg className="w-6 h-6" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
          <span>Se connecter avec Google</span>
        </button>
      </div>
    </div>
  );
};

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Effect for Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
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
    const performance: Performance = {
      ...performanceData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      season: selectedSeason,
      excused: false, // Or determine based on logic
    };
    await storage.addPerformance(playerId, performance);
    await refreshPlayers();
  };

  const handleUpdatePlayerStorage = async () => {
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

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  return (
    <AppLayout
      user={user}
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

const PlayerDetailWrapper: React.FC<{players: Player[], onPlayerUpdate: () => Promise<void>, onDeletePlayer: (id: string) => Promise<void>, onEditPlayerRedirect: (id: string) => void}> = ({players, onPlayerUpdate, onDeletePlayer, onEditPlayerRedirect }) => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const player = players.find(p => p.id === playerId);

  if (!player) return <Navigate to="/players" />;

  return <PlayerDetail
            player={player}
            onBack={() => navigate('/players')}
            onEdit={() => onEditPlayerRedirect(player.id)}
            onPlayerUpdate={onPlayerUpdate}
            onDelete={() => onDeletePlayer(player.id)}
         />;
};

export default App;