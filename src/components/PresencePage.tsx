import React, { useState, useEffect, useMemo } from 'react';
import { Player, MatchDisplayData, Performance as PlayerPerformance } from '../types';
import { getAvailableSeasons } from '../utils/seasonUtils';
import { getTotalTeamEvents } from '../utils/playerUtils';
import PresenceTable from './PresenceTable';
import { Header } from './Header';
import MatchPlayerPerformanceForm from './MatchPlayerPerformanceForm';
import TrainingPresenceForm from './TrainingPresenceForm';

interface PresencePageProps {
  allPlayers: Player[];
  onUpdatePlayerStorage: (type: string, refData: any, value?: any) => void;
}

export const PresencePage: React.FC<PresencePageProps> = ({ allPlayers, onUpdatePlayerStorage }) => {
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'trainings' | 'matches'>('trainings');
  
  const [isMatchEditModalOpen, setMatchEditModalOpen] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState<MatchDisplayData | null>(null);

  const [isTrainingEditModalOpen, setTrainingEditModalOpen] = useState(false);
  const [trainingToEdit, setTrainingToEdit] = useState<PlayerPerformance | null>(null);

  useEffect(() => {
    const seasons = getAvailableSeasons(allPlayers);
    if (seasons.length > 0 && !seasons.includes(selectedSeason)) {
      setSelectedSeason(seasons[0]);
    } else if (seasons.length === 0) {
      setSelectedSeason('');
    }
  }, [allPlayers, selectedSeason]);

  const availableSeasons = useMemo(() => getAvailableSeasons(allPlayers), [allPlayers]);

  const trainings = useMemo(() => {
    return getTotalTeamEvents(allPlayers, 'training', undefined, selectedSeason)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(training => {
        const presentPlayers = allPlayers.filter(player =>
          player.performances?.some(p => p.type === 'training' && p.date === training.date && p.present)
        );
        const teams = new Set<string>();
        presentPlayers.forEach(p => p.teams.forEach(t => teams.add(t)));
        return {
          date: training.date,
          team: Array.from(teams).join(', ') || 'N/A',
          presentCount: presentPlayers.length,
          presentPlayers: presentPlayers.map(p => `${p.firstName} ${p.lastName}`),
          originalPerformanceRef: training,
        };
      });
  }, [allPlayers, selectedSeason]);

  const matches = useMemo(() => {
    return getTotalTeamEvents(allPlayers, 'match', undefined, selectedSeason).map(match => {
      const presentPlayers = allPlayers.filter(player =>
        player.performances?.some(p =>
          p.type === 'match' &&
          p.date === match.date &&
          p.opponent === match.opponent &&
          p.present &&
          (p.minutesPlayed ?? 0) > 0
        )
      );
      const teams = new Set<string>();
      presentPlayers.forEach(p => p.teams.forEach(t => teams.add(t)));
      return {
        date: match.date,
        opponent: match.opponent,
        team: Array.from(teams).join(', ') || 'N/A',
        presentCount: presentPlayers.length,
        presentPlayers: presentPlayers.map(p => `${p.firstName} ${p.lastName}`),
        originalPerformanceRef: match,
      };
    });
  }, [allPlayers, selectedSeason]);

  const handleEdit = (item: any) => {
    try {
      if (item.originalPerformanceRef.type === 'match') {
        const matchPerformance = item.originalPerformanceRef as PlayerPerformance;
        const fullMatchDisplayData: MatchDisplayData = {
          id: matchPerformance.id || '',
          date: matchPerformance.date,
          opponent: matchPerformance.opponent,
          scoreHome: matchPerformance.scoreHome,
          scoreAway: matchPerformance.scoreAway,
          location: matchPerformance.location,
          scorers: matchPerformance.scorers,
          assisters: matchPerformance.assisters,
          yellowCardsDetails: matchPerformance.yellowCardsDetails,
          redCardsDetails: matchPerformance.redCardsDetails,
          goalsConcededDetails: matchPerformance.goalsConcededDetails,
          originalPerformanceRef: matchPerformance,
          matchType: matchPerformance.matchType,
        };
        setMatchToEdit(fullMatchDisplayData);
        setMatchEditModalOpen(true);
      } else if (item.originalPerformanceRef.type === 'training') {
        setTrainingToEdit(item.originalPerformanceRef as PlayerPerformance);
        setTrainingEditModalOpen(true);
      }
    } catch (error) {
      console.error("Error in handleEdit:", error);
    }
  };

  const handleSaveMatchPerformances = (performances: any[]) => {
    onUpdatePlayerStorage('matchPerformancesUpdate', { match: matchToEdit, performances });
    setMatchEditModalOpen(false);
    setMatchToEdit(null);
  };

  const handleSaveTrainingPresence = (presences: any[]) => {
    onUpdatePlayerStorage('trainingPresenceUpdate', { training: trainingToEdit, presences });
    setTrainingEditModalOpen(false);
    setTrainingToEdit(null);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Gestion des Présences"
        subtitle="Suivez la présence de vos joueurs aux entraînements et aux matchs."
      />

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <label htmlFor="season-select-presence" className="text-sm font-medium text-gray-700">Saison :</label>
            <select
              id="season-select-presence"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {availableSeasons.map(season => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>
          </div>
          <div className="flex border-b space-x-4">
            <button
              onClick={() => setActiveTab('trainings')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'trainings' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Présence Entraînements
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'matches' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Présence Matchs
            </button>
          </div>
        </div>
      </div>

      <div>
        {activeTab === 'trainings' && (
          <PresenceTable
            data={trainings}
            type="training"
            allPlayers={allPlayers}
            selectedSeason={selectedSeason}
            onDelete={(date) => {
              if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'entraînement du ${new Date(date).toLocaleDateString('fr-FR')}?`)) {
                onUpdatePlayerStorage('trainingDelete', { date });
              }
            }}
            onEdit={handleEdit}
          />
        )}
        {activeTab === 'matches' && (
          <PresenceTable
            data={matches}
            type="match"
            allPlayers={allPlayers}
            selectedSeason={selectedSeason}
            onDelete={(date, opponent) => {
              if (window.confirm(`Supprimer le match du ${new Date(date).toLocaleDateString('fr-FR')} contre ${opponent}?`)) {
                onUpdatePlayerStorage('matchDelete', { date, opponent });
              }
            }}
            onEdit={handleEdit}
          />
        )}
      </div>

      {isMatchEditModalOpen && matchToEdit && (
        <MatchPlayerPerformanceForm
          match={matchToEdit}
          allPlayers={allPlayers}
          onSave={handleSaveMatchPerformances}
          onClose={() => setMatchEditModalOpen(false)}
        />
      )}

      {isTrainingEditModalOpen && trainingToEdit && (
        <TrainingPresenceForm
          training={trainingToEdit}
          allPlayers={allPlayers}
          onSave={handleSaveTrainingPresence}
          onClose={() => setTrainingEditModalOpen(false)}
        />
      )}
    </div>
  );
};