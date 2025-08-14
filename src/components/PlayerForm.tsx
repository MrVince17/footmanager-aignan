import React, { useState, useEffect } from 'react';
import { Player, Team } from '../types';
import { Save, X, User, Calendar, Hash, Users, MapPin } from 'lucide-react';

interface PlayerFormProps {
  player?: Player;
  onSave: (player: Player) => void;
  onCancel: () => void;
}

export const PlayerForm: React.FC<PlayerFormProps> = ({ player, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Player>>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    licenseNumber: '',
    teams: [],
    position: 'Défenseur',
    licenseValid: true,
    licenseFee: 0,
    payments: [],
    absences: [],
    injuries: [],
    unavailabilities: [],
    performances: []
  });

  useEffect(() => {
    if (player) {
      console.log('Player data received in form:', player);
      console.log('dateOfBirth:', player.dateOfBirth);
      console.log('licenseValidationDate:', player.licenseValidationDate);
      setFormData(player);
    }
  }, [player]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const playerData: Player = {
      ...formData,
      id: player?.id || Date.now().toString(),
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      dateOfBirth: formData.dateOfBirth || '',
      licenseNumber: formData.licenseNumber || '',
      teams: formData.teams || [],
      position: formData.position || 'Défenseur',
      licenseValid: formData.licenseValid ?? true,
      paymentValid: formData.paymentValid ?? true, // conservé pour compatibilité mais non affiché
      licenseValidationDate: formData.licenseValidationDate || undefined,
      licenseFee: typeof formData.licenseFee === 'number' ? formData.licenseFee : 0,
      payments: formData.payments || [],
      absences: formData.absences || [],
      injuries: formData.injuries || [],
      unavailabilities: formData.unavailabilities || [],
      performances: formData.performances || []
    };

    onSave(playerData);
  };

  const handleTeamChange = (team: Team, checked: boolean) => {
    const currentTeams = formData.teams || [];
    if (checked) {
      setFormData({ ...formData, teams: [...currentTeams, team] });
    } else {
      setFormData({ ...formData, teams: currentTeams.filter(t => t !== team) });
    }
  };

  const teams: Team[] = ['Senior', 'U20', 'U19', 'U18', 'U17', 'U6-U11', 'Arbitre', 'Dirigeant/Dirigeante'];
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-black rounded-xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">US AIGNAN</h1>
        <h2 className="text-2xl font-semibold mb-2">
          {player ? 'Modifier le joueur' : 'Nouveau joueur'}
        </h2>
        <p className="text-red-100">
          {player ? 'Modifiez les informations du joueur' : 'Ajoutez un nouveau joueur à votre équipe'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User size={20} />
              <span>Informations personnelles</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>Date de naissance *</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Hash size={16} />
                  <span>Numéro de licence *</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.licenseNumber || ''}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Team and Position */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users size={20} />
              <span>Équipe et position</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Équipe(s) *
                </label>
                <div className="space-y-2">
                  {teams.map(team => (
                    <label key={team} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.teams?.includes(team) || false}
                        onChange={(e) => handleTeamChange(team, e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{team}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <MapPin size={16} />
                  <span>Position *</span>
                </label>
                <select
                  required
                  value={formData.position || ''}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="Gardien">Gardien</option>
                  <option value="Défenseur">Défenseur</option>
                  <option value="Milieu">Milieu</option>
                  <option value="Attaquant">Attaquant</option>
                </select>
              </div>
            </div>
          </div>


          {/* Administrative Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Statut administratif</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.licenseValid ?? true}
                  onChange={(e) => setFormData({ ...formData, licenseValid: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Licence valide</span>
              </label>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant licence (€)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={formData.licenseFee ?? 0}
                  onChange={(e) => setFormData({ ...formData, licenseFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Validation Licence
                </label>
                <input
                  type="date"
                  value={formData.licenseValidationDate || ''}
                  onChange={(e) => setFormData({ ...formData, licenseValidationDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <X size={20} />
              <span>Annuler</span>
            </button>
            
            <button
              type="submit"
              className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              <Save size={20} />
              <span>{player ? 'Modifier' : 'Ajouter'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};