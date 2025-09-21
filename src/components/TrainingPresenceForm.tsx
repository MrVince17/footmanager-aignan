import React, { useState, useEffect } from 'react';
import { Player, Performance as PlayerPerformance } from '../types';

interface PlayerPresenceData {
  playerId: string;
  present: boolean;
}

interface TrainingPresenceFormProps {
  training: PlayerPerformance;
  allPlayers: Player[];
  onSave: (presences: PlayerPresenceData[]) => void;
  onClose: () => void;
}

const TrainingPresenceForm: React.FC<TrainingPresenceFormProps> = ({ training, allPlayers, onSave, onClose }) => {
  const [presences, setPresences] = useState<PlayerPresenceData[]>([]);

  useEffect(() => {
    try {
      const initialPresences = allPlayers.map(player => {
        const existingPerf = player.performances.find(p => p.id === training.id || (p.type === 'training' && p.date === training.date));
        return {
          playerId: player.id,
          present: existingPerf?.present || false,
        };
      });
      setPresences(initialPresences);
    } catch (error) {
      console.error("Error in TrainingPresenceForm useEffect:", error);
    }
  }, [allPlayers, training]);

  const handlePresenceChange = (playerId: string, isPresent: boolean) => {
    setPresences(prev =>
      prev.map(p => (p.playerId === playerId ? { ...p, present: isPresent } : p))
    );
  };

  const handleSubmit = () => {
    onSave(presences);
  };

  const sortedPlayers = [...allPlayers].sort((a, b) => a.lastName.localeCompare(b.lastName));

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative p-8 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800">Présences pour l'entraînement du {new Date(training.date).toLocaleDateString('fr-FR')}</h3>
        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          <ul className="space-y-2">
            {sortedPlayers.map(player => {
              const presence = presences.find(p => p.playerId === player.id);
              if (!presence) return null;

              return (
                <li key={player.id} className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50">
                  <span className="font-medium text-gray-800">{player.firstName} {player.lastName}</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    checked={presence.present}
                    onChange={e => handlePresenceChange(player.id, e.target.checked)}
                  />
                </li>
              );
            })}
          </ul>
        </div>
        <div className="pt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">Annuler</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm">Enregistrer</button>
        </div>
      </div>
    </div>
  );
};

export default TrainingPresenceForm;