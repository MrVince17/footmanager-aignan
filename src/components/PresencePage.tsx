import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { storage } from '../utils/storage';
import { getAvailableSeasons } from '../utils/seasonUtils';
import { PresenceTable } from './PresenceTable';

export const PresencePage: React.FC = () => {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'trainings' | 'matches'>('trainings');

  useState(() => {
    const players = storage.getPlayers();
    setAllPlayers(players);
    const seasons = getAvailableSeasons(players);
    if (seasons.length > 0) {
      setSelectedSeason(seasons[0]);
    }
  });

  const availableSeasons = useMemo(() => getAvailableSeasons(allPlayers), [allPlayers]);

  const trainings = useMemo(() => {
    const allTrainings = storage.getTotalTeamEvents(allPlayers, 'training', undefined, selectedSeason);

    return allTrainings.map(training => {
      const presentPlayers = allPlayers.filter(player =>
        player.performances.some(p =>
          p.type === 'training' &&
          p.date === training.date &&
          p.present
        )
      );

      const teams = new Set<string>();
      presentPlayers.forEach(p => p.teams.forEach(t => teams.add(t)));

      return {
        date: training.date,
        team: Array.from(teams).join(', ') || 'N/A',
        presentCount: presentPlayers.length,
        presentPlayers: presentPlayers.map(p => `${p.firstName} ${p.lastName}`),
      };
    });
  }, [allPlayers, selectedSeason]);

  const matches = useMemo(() => {
    const allMatches = storage.getTotalTeamEvents(allPlayers, 'match', undefined, selectedSeason);

    return allMatches.map(match => {
      const presentPlayers = allPlayers.filter(player =>
        player.performances.some(p =>
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
        team: Array.from(teams).join(', ') || 'N/A',
        presentCount: presentPlayers.length,
        presentPlayers: presentPlayers.map(p => `${p.firstName} ${p.lastName}`),
      };
    });
  }, [allPlayers, selectedSeason]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-black rounded-xl p-8 text-white relative">
        <h1 className="text-4xl font-bold mb-2">US AIGNAN</h1>
        <h2 className="text-2xl font-semibold mb-2">Gestion des Présences</h2>
        <p className="text-red-100">Suivez la présence de vos joueurs aux entraînements et aux matchs.</p>
      </div>

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
