import React, { useState, useEffect } from 'react';
import { Player } from './types';
import { storage } from './utils/storage';
import { Dashboard } from './components/Dashboard';
import { PlayerList } from './components/PlayerList';
import { PlayerForm } from './components/PlayerForm';
import { PlayerDetail } from './components/PlayerDetail';
import { PerformanceEntry } from './components/PerformanceEntry';
import { Statistics } from './components/Statistics';
import { 
  Home, 
  Users, 
  Plus, 
  Activity, 
  BarChart3, 
  Menu, 
  X 
} from 'lucide-react';

type View = 'dashboard' | 'players' | 'add-player' | 'edit-player' | 'player-detail' | 'performance' | 'statistics';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // TODO: Déterminer dynamiquement la saison actuelle (par ex., la plus récente dans les données ou basée sur la date)
  const [selectedSeason, setSelectedSeason] = useState<string>('2024-2025');

  useEffect(() => {
    // Initialize sample data and load players
    storage.initializeSampleData();
    setPlayers(storage.getPlayers());
  }, []);

  const refreshPlayers = () => {
    setPlayers(storage.getPlayers());
  };

  const handleSavePlayer = (player: Player) => {
    if (selectedPlayer) {
      storage.updatePlayer(player);
    } else {
      storage.addPlayer(player);
    }
    refreshPlayers();
    setSelectedPlayer(null);
    setCurrentView('players');
  };

  const handleDeletePlayer = (playerId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce joueur ?')) {
      storage.deletePlayer(playerId);
      refreshPlayers();
    }
  };

  const handleSavePerformance = (playerId: string, performanceData: Omit<Performance, 'id' | 'season' | 'excused'>) => {
    const performanceWithSeason: Omit<Performance, 'id' | 'excused'> = {
      ...performanceData,
      season: selectedSeason,
    };
    storage.addPerformance(playerId, performanceWithSeason); // addPerformance will handle id and excused
    refreshPlayers();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { id: 'players', label: 'Joueurs', icon: Users },
    { id: 'performance', label: 'Performances', icon: Activity },
    { id: 'statistics', label: 'Statistiques', icon: BarChart3 },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard players={players} selectedSeason={selectedSeason} onSeasonChange={setSelectedSeason} allPlayers={players} />;
      
      case 'players':
        return (
          <PlayerList
            players={players}
            onSelectPlayer={(player) => {
              setSelectedPlayer(player);
              setCurrentView('player-detail');
            }}
            onEditPlayer={(player) => {
              setSelectedPlayer(player);
              setCurrentView('edit-player');
            }}
            onDeletePlayer={handleDeletePlayer}
            onAddPlayer={() => {
              setSelectedPlayer(null);
              setCurrentView('add-player');
            }}
          />
        );
      
      case 'add-player':
      case 'edit-player':
        return (
          <PlayerForm
            player={selectedPlayer || undefined}
            onSave={handleSavePlayer}
            onCancel={() => {
              setSelectedPlayer(null);
              setCurrentView('players');
            }}
          />
        );
      
      case 'player-detail':
        return selectedPlayer ? (
          <PlayerDetail
            player={selectedPlayer}
            onBack={() => setCurrentView('players')}
            onEdit={(player) => {
              setSelectedPlayer(player);
              setCurrentView('edit-player');
            }}
            onPlayerUpdate={() => {
              refreshPlayers();
              // Update selected player with fresh data
              const updatedPlayer = storage.getPlayers().find(p => p.id === selectedPlayer.id);
              if (updatedPlayer) {
                setSelectedPlayer(updatedPlayer);
              }
            }}
          />
        ) : null;
      
      case 'performance':
        return (
          <PerformanceEntry
            players={players}
            onSavePerformance={handleSavePerformance}
          />
        );
      
      case 'statistics':
        return <Statistics players={players} selectedSeason={selectedSeason} onSeasonChange={setSelectedSeason} allPlayers={players} />;
      
      default:
        return <Dashboard players={players} selectedSeason={selectedSeason} onSeasonChange={setSelectedSeason} allPlayers={players} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as View);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-secondary'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary' : 'text-gray-500 group-hover:text-secondary'} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={() => {
              setSelectedPlayer(null);
              setCurrentView('add-player');
              setSidebarOpen(false);
            }}
            className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-3 rounded-lg hover:bg-primary-hover transition-colors duration-200"
          >
            <Plus size={20} />
            <span>Nouveau joueur</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
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
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;