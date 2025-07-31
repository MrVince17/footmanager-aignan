import React, { useState, useEffect, useMemo } from 'react';
import { Player } from '../types';
import { storage } from '../utils/storage';
import { getAvailableSeasons } from '../utils/seasonUtils';
import { getTotalTeamEvents } from '../utils/playerUtils';
import PresenceTable from './PresenceTable';
import { Header } from './Header';

interface PresencePageProps {
  onUpdatePlayerStorage: (type: string, refData: any, value?: any) => void;
}

export const PresencePage: React.FC<PresencePageProps> = ({ onUpdatePlayerStorage }) => {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'trainings' | 'matches'>('trainings');

  useEffect(() => {
    const fetchPlayers = async () => {
      const players = await storage.getPlayers();
      setAllPlayers(players);
      const seasons = getAvailableSeasons(players);
      if (seasons.length > 0) {
        setSelectedSeason(seasons[0]);
      }
    };
    fetchPlayers();
  }, []);

  const availableSeasons = useMemo(() => getAvailableSeasons(allPlayers), [allPlayers]);

  const trainings = useMemo(() => {
    const allTrainings = getTotalTeamEvents(allPlayers, 'training', undefined, selectedSeason);

    return allTrainings.map(training => {
      const presentPlayers = allPlayers.filter(player =>
        player.performances && player.performances.some(p =>
          p.type === 'training' &&
          p.date === training.date &&
          p.present
        )
      );

      const teams = new Set<string>();
      presentPlayers.forEach(p => p.teams.forEach(t => teams.add(t)));

      const sortedPresentPlayers = presentPlayers.sort((a, b) => {
        const lastNameComparison = a.lastName.localeCompare(b.lastName);
        if (lastNameComparison !== 0) return lastNameComparison;
        return a.firstName.localeCompare(b.firstName);
      });

      return {
        date: training.date,
        team: Array.from(teams).join(', ') || 'N/A',
        presentCount: sortedPresentPlayers.length,
        presentPlayers: sortedPresentPlayers.map(p => `${p.firstName} ${p.lastName}`),
      };
    });
  }, [allPlayers, selectedSeason]);

  const matches = useMemo(() => {
    const allMatches = getTotalTeamEvents(allPlayers, 'match', undefined, selectedSeason);

    return allMatches.map(match => {
      const presentPlayers = allPlayers.filter(player =>
        player.performances && player.performances.some(p =>
          p.type === 'match' &&
          p.date === match.date &&
          p.opponent === match.opponent &&
          p.present &&
          (p.minutesPlayed ?? 0) > 0
        )
      );

      const teams = new Set<string>();
      presentPlayers.forEach(p => p.teams.forEach(t => teams.add(t)));

      const sortedPresentPlayers = presentPlayers.sort((a, b) => {
        const lastNameComparison = a.lastName.localeCompare(b.lastName);
        if (lastNameComparison !== 0) return lastNameComparison;
        return a.firstName.localeCompare(b.firstName);
      });

      return {
        date: match.date,
        team: Array.from(teams).join(', ') || 'N/A',
        presentCount: sortedPresentPlayers.length,
        presentPlayers: sortedPresentPlayers.map(p => `${p.firstName} ${p.lastName}`),
      };
    });
  }, [allPlayers, selectedSeason]);

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
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>
          <div className="flex border-b border-gray-200">
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
                onUpdatePlayerStorage('trainingDelete', date);
              }
            }}
          />
        )}
        {activeTab === 'matches' && (
          <PresenceTable
            data={matches}
            type="match"
            allPlayers={allPlayers}
            selectedSeason={selectedSeason}
          />
        )}
      </div>
    </div>
  );
};
