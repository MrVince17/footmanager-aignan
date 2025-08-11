import React, { useState, useEffect } from 'react';
import { Player, Performance, MatchDisplayData } from '../types';

interface PlayerPerformanceData {
  playerId: string;
  present: boolean;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

interface MatchPlayerPerformanceFormProps {
  match: MatchDisplayData;
  allPlayers: Player[];
  onSave: (performances: PlayerPerformanceData[]) => void;
  onClose: () => void;
}

const MatchPlayerPerformanceForm: React.FC<MatchPlayerPerformanceFormProps> = ({ match, allPlayers, onSave, onClose }) => {
  const [performances, setPerformances] = useState<PlayerPerformanceData[]>([]);

  useEffect(() => {
    const initialPerformances = allPlayers.map(player => {
                  const existingPerf = player.performances.find(p => {
        if (p.type !== 'match' || p.date !== match.date) {
          return false;
        }
        const normalizedPOpponent = p.opponent === null || p.opponent === undefined ? '' : p.opponent;
        const normalizedMatchOpponent = match.opponent === null || match.opponent === undefined ? '' : match.opponent;
        return normalizedPOpponent === normalizedMatchOpponent;
      });
      return {
        playerId: player.id,
        present: existingPerf?.present || false,
        minutesPlayed: existingPerf?.minutesPlayed || 0,
        goals: existingPerf?.goals || 0,
        assists: existingPerf?.assists || 0,
        yellowCards: existingPerf?.yellowCards || 0,
        redCards: existingPerf?.redCards || 0,
      };
    });
    setPerformances(initialPerformances);
  }, [allPlayers, match]);

  const handlePerformanceChange = (playerId: string, field: keyof PlayerPerformanceData, value: any) => {
    setPerformances(prev =>
      prev.map(p => (p.playerId === playerId ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = () => {
    onSave(performances);
  };

  const sortedPlayers = [...allPlayers].sort((a, b) => a.lastName.localeCompare(b.lastName));

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative p-8 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800">Feuille de match du {new Date(match.date).toLocaleDateString('fr-FR')}</h3>
        <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-3">Joueur</th>
                <th className="px-4 py-3 text-center">Présent</th>
                <th className="px-4 py-3">Minutes</th>
                <th className="px-4 py-3">Buts</th>
                <th className="px-4 py-3">Passes</th>
                <th className="px-4 py-3">CJ</th>
                <th className="px-4 py-3">CR</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map(player => {
                const perf = performances.find(p => p.playerId === player.id);
                if (!perf) return null;

                return (
                  <tr key={player.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{player.firstName} {player.lastName}</td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        checked={perf.present}
                        onChange={e => handlePerformanceChange(player.id, 'present', e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-2">
                                          <input
                      type="number"
                      className="w-20 p-1 border border-gray-300 rounded-md text-sm"
                      value={perf.minutesPlayed}
                      onChange={e => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        handlePerformanceChange(player.id, 'minutesPlayed', val);
                        if (val > 0 && !perf.present) {
                          handlePerformanceChange(player.id, 'present', true);
                        }
                      }}
                    />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-16 p-1 border border-gray-300 rounded-md text-sm"
                        disabled={!perf.present}
                        value={perf.goals}
                        onChange={e => handlePerformanceChange(player.id, 'goals', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-16 p-1 border border-gray-300 rounded-md text-sm"
                        disabled={!perf.present}
                        value={perf.assists}
                        onChange={e => handlePerformanceChange(player.id, 'assists', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-16 p-1 border border-gray-300 rounded-md text-sm"
                        disabled={!perf.present}
                        value={perf.yellowCards}
                        onChange={e => handlePerformanceChange(player.id, 'yellowCards', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-16 p-1 border border-gray-300 rounded-md text-sm"
                        disabled={!perf.present}
                        value={perf.redCards}
                        onChange={e => handlePerformanceChange(player.id, 'redCards', parseInt(e.target.value) || 0)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">Annuler</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm">Enregistrer</button>
        </div>
      </div>
    </div>
  );
};

export default MatchPlayerPerformanceForm;
