import React, { useState } from 'react';
import { Player, Performance } from '../types';
import { Save, Calendar, Target, Users, AlertTriangle, Home, Bus } from 'lucide-react';
import { Header } from './Header';

interface PerformanceEntryProps {
  players: Player[];
  onSavePerformance: (playerId: string, performance: Omit<Performance, 'id' | 'season'>) => void;
}

export const PerformanceEntry: React.FC<PerformanceEntryProps> = ({ players, onSavePerformance }) => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [filterTeamPerformance, setFilterTeamPerformance] = useState<string>('all');
  const [performanceData, setPerformanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'match' as 'match' | 'training',
    opponent: '',
    scoreHome: undefined as number | undefined,
    scoreAway: undefined as number | undefined,
    location: 'home' as 'home' | 'away',
    minutesPlayed: {} as Record<string, number>,
    goals: {} as Record<string, number>,
    assists: {} as Record<string, number>,
    yellowCards: {} as Record<string, number>,
    redCards: {} as Record<string, number>,
    cleanSheets: {} as Record<string, boolean>,
    present: {} as Record<string, boolean>,
    matchType: 'D2' as 'D2' | 'R2' | 'CdF' | 'CO' | 'CG' | 'ChD' | 'CR' | 'CS'
  });

  const handlePlayerSelection = (playerId: string, selected: boolean) => {
    if (selected) {
      setSelectedPlayers([...selectedPlayers, playerId]);
      setPerformanceData(prev => {
        const updatedPresent = { ...prev.present, [playerId]: true };
        let updatedMinutes = { ...prev.minutesPlayed };
        if (prev.type === 'match') {
          updatedMinutes[playerId] = 90;
        }
        return {
          ...prev,
          present: updatedPresent,
          minutesPlayed: updatedMinutes,
        };
      });
    } else {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
      // Clean up performance data for deselected player
      const newData = { ...performanceData };
      delete newData.present[playerId];
      delete newData.minutesPlayed[playerId];
      delete newData.goals[playerId];
      delete newData.assists[playerId];
      delete newData.yellowCards[playerId];
      delete newData.redCards[playerId];
      delete newData.cleanSheets[playerId];
      setPerformanceData(newData);
    }
  };

  const updatePlayerData = (playerId: string, field: keyof typeof performanceData, value: any) => {
    setPerformanceData(prev => {
      if (field === 'minutesPlayed' || field === 'goals' || field === 'assists' || field === 'yellowCards' || field === 'redCards' || field === 'cleanSheets' || field === 'present') {
        return {
          ...prev,
          [field]: { ...(prev[field] as object), [playerId]: value }
        };
      }
      return prev; // Should not happen with current usage
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const matchScorers: { playerId: string; minute: number }[] = [];
    const matchAssisters: { playerId: string }[] = [];
    const matchYellowCards: { playerId: string; minute: number }[] = [];
    const matchRedCards: { playerId: string; minute: number }[] = [];

    if (performanceData.type === 'match') {
      selectedPlayers.forEach(playerId => {
        const goals = performanceData.goals[playerId] || 0;
        const assists = performanceData.assists[playerId] || 0;
        const yellowCards = performanceData.yellowCards[playerId] || 0;
        const redCards = performanceData.redCards[playerId] || 0;

        for (let i = 0; i < goals; i++) {
          matchScorers.push({ playerId: playerId, minute: 0 }); // Default minute 0
        }
        for (let i = 0; i < assists; i++) {
          matchAssisters.push({ playerId: playerId });
        }
        for (let i = 0; i < yellowCards; i++) {
          matchYellowCards.push({ playerId: playerId, minute: 0 }); // Default minute 0
        }
        for (let i = 0; i < redCards; i++) {
          matchRedCards.push({ playerId: playerId, minute: 0 }); // Default minute 0
        }
      });
    }
    
    selectedPlayers.forEach(playerId => {
      // Constructing without id, season, excused (handled by App.tsx and storage.ts)
      const performanceDetails = {
        date: performanceData.date,
        type: performanceData.type,
        present: performanceData.present[playerId] || false,
        opponent: performanceData.type === 'match' ? performanceData.opponent : null,
        scoreHome: performanceData.type === 'match' ? (performanceData.scoreHome ?? null) : null,
        scoreAway: performanceData.type === 'match' ? (performanceData.scoreAway ?? null) : null,
        location: performanceData.type === 'match' ? performanceData.location : null,
        minutesPlayed: performanceData.minutesPlayed[playerId] || 0,
        goals: performanceData.goals[playerId] || 0,
        assists: performanceData.assists[playerId] || 0,
        yellowCards: performanceData.yellowCards[playerId] || 0,
        redCards: performanceData.redCards[playerId] || 0,
        cleanSheet: performanceData.cleanSheets[playerId] || false,
        scorers: performanceData.type === 'match' ? matchScorers : null,
        assisters: performanceData.type === 'match' ? matchAssisters : null,
        yellowCardsDetails: performanceData.type === 'match' ? matchYellowCards : null,
        redCardsDetails: performanceData.type === 'match' ? matchRedCards : null,
        goalsConcededDetails: performanceData.type === 'match' ? [] : null,
        matchType: performanceData.type === 'match' ? performanceData.matchType : null,
      };
      
      onSavePerformance(playerId, performanceDetails as any);
    });

    // Reset form
    setSelectedPlayers([]);
    setPerformanceData({
      date: new Date().toISOString().split('T')[0],
      type: 'match',
      opponent: '',
      scoreHome: undefined,
      scoreAway: undefined,
      location: 'home',
      minutesPlayed: {},
      goals: {},
      assists: {},
      yellowCards: {},
      redCards: {},
      cleanSheets: {},
      present: {},
      matchType: 'D2'
    });

    alert('Performances enregistrées avec succès !');
  };

  const filteredPlayersToDisplay = players
    .filter(player => {
      if (filterTeamPerformance === 'all') return true;
      if (filterTeamPerformance === 'Senior') {
        return player.teams.some(team => team.toLowerCase().includes('senior'));
      }
      if (filterTeamPerformance === 'Dirigeant/Dirigeante') {
        return player.teams.some(team => team.toLowerCase().includes('dirigeant'));
      }
      return player.teams.includes(filterTeamPerformance as any);
    })
    .sort((a, b) => {
      const lastNameComparison = a.lastName.localeCompare(b.lastName);
      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }
      return a.firstName.localeCompare(b.firstName);
    });

  const selectedPlayersList = filteredPlayersToDisplay.filter(p => selectedPlayers.includes(p.id));

  return (
    <div className="space-y-6">
      <Header
        title="Saisie des Performances"
        subtitle="Enregistrez les performances de vos joueurs"
      />

      <div className="bg-white rounded-xl shadow-md p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Calendar size={20} />
              <span>Informations de l'événement</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={performanceData.date}
                  onChange={(e) => setPerformanceData({ ...performanceData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  required
                  value={performanceData.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'match' | 'training';
                    setPerformanceData(prev => {
                      let updatedMinutes = { ...prev.minutesPlayed };
                      if (newType === 'match') {
                        // Pre-fill minutes for already selected and present players
                        selectedPlayers.forEach(playerId => {
                          if (prev.present[playerId]) {
                            updatedMinutes[playerId] = 90;
                          }
                        });
                      } else {
                        // Clear minutes if switching to training
                        updatedMinutes = {};
                      }
                      return {
                        ...prev,
                        type: newType,
                        minutesPlayed: updatedMinutes,
                        // Reset opponent if switching to training
                        opponent: newType === 'training' ? '' : prev.opponent
                      };
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="match">Match</option>
                  <option value="training">Entraînement</option>
                </select>
              </div>
              
              {performanceData.type === 'match' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adversaire
                    </label>
                    <input
                      type="text"
                      value={performanceData.opponent}
                      onChange={(e) => setPerformanceData({ ...performanceData, opponent: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Nom de l'équipe adverse"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de Match
                    </label>
                    <select
                      value={performanceData.matchType}
                      onChange={(e) => setPerformanceData({ ...performanceData, matchType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="D2">Championnat D2</option>
                      <option value="R2">Championnat R2</option>
                      <option value="CdF">Coupe de France</option>
                      <option value="CO">Coupe Occitannie</option>
                      <option value="CG">Coupe du Gers</option>
                      <option value="ChD">Challenge District</option>
                      <option value="CR">Coupe des Réserves</option>
                      <option value="CS">Coupe Savoldelli</option>
                      <option value="Match Amical">Match Amical</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            {performanceData.type === 'match' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score Domicile
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={performanceData.scoreHome === undefined ? '' : performanceData.scoreHome}
                    onChange={(e) => setPerformanceData({ ...performanceData, scoreHome: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Buts Domicile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score Extérieur
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={performanceData.scoreAway === undefined ? '' : performanceData.scoreAway}
                    onChange={(e) => setPerformanceData({ ...performanceData, scoreAway: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Buts Extérieur"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lieu
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setPerformanceData({ ...performanceData, location: 'home' })}
                      className={`flex-1 flex items-center justify-center px-3 py-2 border rounded-lg transition-colors ${
                        performanceData.location === 'home' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                      }`}
                    >
                      <Home size={18} className="mr-2" /> Domicile
                    </button>
                    <button
                      type="button"
                      onClick={() => setPerformanceData({ ...performanceData, location: 'away' })}
                      className={`flex-1 flex items-center justify-center px-3 py-2 border rounded-lg transition-colors ${
                        performanceData.location === 'away' ? 'bg-black text-white border-black' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                      }`}
                    >
                      <Bus size={18} className="mr-2" /> Extérieur
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Player Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users size={20} />
              <span>Sélection des joueurs</span>
            </h3>

            <div className="flex items-center space-x-4 mb-4">
              <label htmlFor="team-filter-perf" className="text-sm font-medium text-gray-700">
                Filtrer par équipe :
              </label>
              <select
                id="team-filter-perf"
                value={filterTeamPerformance}
                onChange={(e) => {
                  setFilterTeamPerformance(e.target.value);
                  // Optionnel: déselectionner les joueurs qui ne sont plus visibles
                  // setSelectedPlayers(prev => prev.filter(playerId => players.find(p=>p.id === playerId)?.teams.includes(e.target.value) || e.target.value === 'all'));
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">Toutes les équipes</option>
                <option value="Senior">Senior</option>
                <option value="U20">U20</option>
                <option value="U19">U19</option>
                <option value="U18">U18</option>
                <option value="U17">U17</option>
                <option value="Arbitre">Arbitre</option>
                <option value="Dirigeant/Dirigeante">Dirigeant/Dirigeante</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  const visiblePlayerIds = filteredPlayersToDisplay.map(p => p.id);

                  const currentlyVisibleAndSelected = selectedPlayers.filter(id => visiblePlayerIds.includes(id));

                  if (currentlyVisibleAndSelected.length === visiblePlayerIds.length && visiblePlayerIds.length > 0) {
                    // All visible are selected, so deselect them
                    setSelectedPlayers(prev => prev.filter(id => !visiblePlayerIds.includes(id)));
                  } else {
                    // Not all visible are selected (or none are), so select all visible
                    const newSelectedIds = [...new Set([...selectedPlayers, ...visiblePlayerIds])];
                    setSelectedPlayers(newSelectedIds);
                    if (performanceData.type === 'match') {
                      setPerformanceData(prev => {
                        const updatedMinutes = { ...prev.minutesPlayed };
                        const updatedPresent = { ...prev.present };
                        visiblePlayerIds.forEach(id => {
                          if (!selectedPlayers.includes(id)) { // only for newly selected
                            updatedMinutes[id] = 90;
                            updatedPresent[id] = true;
                          }
                        });
                        return { ...prev, minutesPlayed: updatedMinutes, present: updatedPresent };
                      });
                    } else {
                       // Ensure newly selected are marked present even for trainings
                       setPerformanceData(prev => {
                        const updatedPresent = { ...prev.present };
                        visiblePlayerIds.forEach(id => {
                           if (!selectedPlayers.includes(id)) {
                            updatedPresent[id] = true;
                           }
                        });
                        return { ...prev, present: updatedPresent };
                      });
                    }
                  }
                }}
                className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 text-sm"
              >
                Tout sélectionner / désélectionner (visibles)
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPlayersToDisplay.map(player => (
                <label key={player.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPlayers.includes(player.id)}
                    onChange={(e) => handlePlayerSelection(player.id, e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{player.firstName} {player.lastName}</p>
                    <p className="text-sm text-gray-600">{player.position} - {player.teams.join(', ')}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Performance Details */}
          {selectedPlayersList.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Target size={20} />
                <span>Détails des performances</span>
                <span className="text-sm font-normal text-gray-500">({selectedPlayersList.length} joueur(s))</span>
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Joueur</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Présent</th>
                      {performanceData.type === 'match' && (
                        <>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Minutes</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Buts</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Passes</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cartons J</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cartons R</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedPlayersList.map(player => (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{player.firstName} {player.lastName}</p>
                            <p className="text-sm text-gray-600">{player.position}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={performanceData.present[player.id] || false}
                            onChange={(e) => updatePlayerData(player.id, 'present', e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </td>
                        {performanceData.type === 'match' && performanceData.present[player.id] && (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                max="120"
                                value={performanceData.minutesPlayed[player.id] || ''}
                                onChange={(e) => updatePlayerData(player.id, 'minutesPlayed', parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={performanceData.goals[player.id] || ''}
                                onChange={(e) => updatePlayerData(player.id, 'goals', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={performanceData.assists[player.id] || ''}
                                onChange={(e) => updatePlayerData(player.id, 'assists', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={performanceData.yellowCards[player.id] || ''}
                                onChange={(e) => updatePlayerData(player.id, 'yellowCards', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={performanceData.redCards[player.id] || ''}
                                onChange={(e) => updatePlayerData(player.id, 'redCards', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              />
                            </td>
                          </>
                        )}
                        {performanceData.type === 'match' && !performanceData.present[player.id] && (
                          <td colSpan={5} className="px-4 py-3 text-sm text-gray-500 italic">
                            Joueur absent
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Clean Sheets for Goalkeepers */}
              {performanceData.type === 'match' && selectedPlayersList.some(p => p.position === 'Gardien' && performanceData.present[p.id]) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-3">Clean Sheets (Gardiens)</h4>
                  <div className="space-y-2">
                    {selectedPlayersList
                      .filter(p => p.position === 'Gardien' && performanceData.present[p.id])
                      .map(player => (
                        <label key={player.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={performanceData.cleanSheets[player.id] || false}
                            onChange={(e) => updatePlayerData(player.id, 'cleanSheets', e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm font-medium text-red-800">
                            {player.firstName} {player.lastName} - Clean Sheet
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          {selectedPlayersList.length > 0 && (
            <div className="flex justify-end pt-6 border-t">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <Save size={20} />
                <span>Enregistrer les performances</span>
              </button>
            </div>
          )}

          {selectedPlayersList.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Sélectionnez au moins un joueur pour commencer la saisie</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};