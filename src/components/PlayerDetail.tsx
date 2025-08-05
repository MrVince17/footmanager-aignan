import React, { useState } from 'react';
import { Player, Unavailability } from '../types';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Trophy, 
  Target, 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle,
  Download,
  Edit,
  Activity,
  Plus,
  X,
  Save,
  Home,
  Bus
} from 'lucide-react';
import { exportPlayerStats, exportToPDF } from '../utils/export';
import { storage } from '../utils/storage';
import { getMatchStats, getAge } from '../utils/playerUtils';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

interface PlayerDetailProps {
  player: Player;
  onBack: () => void;
  onEdit: (player: Player) => void;
  onPlayerUpdate: () => void;
}

export const PlayerDetail: React.FC<PlayerDetailProps> = ({ player, onBack, onEdit, onPlayerUpdate }) => {
  const [showUnavailabilityForm, setShowUnavailabilityForm] = useState(false);
  const [unavailabilityForm, setUnavailabilityForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'injury' as 'injury' | 'personal' | 'other',
    description: ''
  });

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'Gardien': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Défenseur': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Milieu': return 'bg-green-100 text-green-800 border-green-200';
      case 'Attaquant': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAddUnavailability = () => {
    if (!unavailabilityForm.startDate || !unavailabilityForm.reason) {
      alert('Veuillez remplir au minimum la date de début et la raison');
      return;
    }

    const newUnavailability: Unavailability = {
      id: Date.now().toString(),
      startDate: unavailabilityForm.startDate,
      endDate: unavailabilityForm.endDate || undefined,
      reason: unavailabilityForm.reason,
      type: unavailabilityForm.type,
      description: unavailabilityForm.description
    };

    storage.addUnavailability(player.id, newUnavailability);
    setShowUnavailabilityForm(false);
    setUnavailabilityForm({
      startDate: '',
      endDate: '',
      reason: '',
      type: 'injury',
      description: ''
    });
    onPlayerUpdate();
  };

  const handleDeleteUnavailability = (unavailabilityId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette indisponibilité ?')) {
      storage.deleteUnavailability(player.id, unavailabilityId);
      onPlayerUpdate();
    }
  };

  const StatCard: React.FC<{ title: string; value?: string | number; color: string; stats?: Record<string, number> }> =
    ({ title, value, color, stats }) => (
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 hover:shadow-lg transition-shadow duration-300 h-full" style={{ borderLeftColor: color }}>
        <div className="flex justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600">{title}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className="flex flex-col items-center">
            {stats && (
              <div className="mt-1 space-y-0.5">
                {Object.entries(stats).map(([matchType, count]) => (
                  <div key={matchType} className="text-2xs text-gray-600">
                    <span className="font-semibold">{matchType}:</span> {count}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );

  console.log('player.performances', player.performances);
  console.log('getMatchStats(player.performances)', getMatchStats(player.performances));
  console.log('player.trainingAttendanceRate', player.trainingAttendanceRate);

  return (
    <div id="player-detail-content" className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-black rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors duration-200"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {player.lastName} {player.firstName}
              </h1>
              <p className="text-red-100">Fiche joueur détaillée - US Aignan</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => exportToPDF('player-detail-content', `fiche_${player.firstName}_${player.lastName}_US_Aignan.pdf`)}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Download size={20} />
              <span>PDF</span>
            </button>
            <button
              onClick={() => exportPlayerStats(player)}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Download size={20} />
              <span>Excel</span>
            </button>
            <button
              onClick={() => onEdit(player)}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Edit size={20} />
              <span>Modifier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Player Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar size={20} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Âge</p>
                <p className="font-medium">{getAge(player.dateOfBirth)} ans</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin size={20} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getPositionColor(player.position)}`}>
                  {player.position}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Users size={20} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Équipe(s)</p>
                <p className="font-medium">{player.teams.join(', ')}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-gray-400 text-sm">#</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Licence</p>
                <p className="font-medium">{player.licenseNumber}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut administratif</h3>
          <div className="flex flex-col justify-between flex-grow">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Licence</span>
              <div className="flex items-center space-x-2">
                {player.licenseValid ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <AlertCircle size={20} className="text-red-500" />
                )}
                <span className={`font-medium ${player.licenseValid ? 'text-green-600' : 'text-red-600'}`}>
                  {player.licenseValid ? 'Valide' : 'Non valide'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Paiement</span>
              <div className="flex items-center space-x-2">
                {player.paymentValid ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <AlertCircle size={20} className="text-red-500" />
                )}
                <span className={`font-medium ${player.paymentValid ? 'text-green-600' : 'text-red-600'}`}>
                  {player.paymentValid ? 'À jour' : 'En retard'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Date Validation Licence</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {formatDateToDDMMYYYY(player.licenseValidationDate)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assiduité</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Présence matchs</span>
                <span className="font-medium">{player.matchAttendanceRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${player.matchAttendanceRate}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Présence entraînements</span>
                <span className="font-medium">{player.trainingAttendanceRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-black h-2 rounded-full transition-all duration-500"
                  style={{ width: `${player.trainingAttendanceRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <StatCard
            title="Matchs joués"
            value={player.totalMatches}
            icon={<Trophy size={24} />}
            color="#DC2626"
            stats={getMatchStats(player.performances)}
          />
        </div>
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Entraînements"
              value={player.totalTrainings}
              icon={<Activity size={24} />}
              color="#000000"
            />
            <StatCard
              title="Minutes jouées"
              value={player.totalMinutes}
              icon={<Clock size={24} />}
              color="#DC2626"
            />
            <StatCard
              title="Buts marqués"
              value={player.goals}
              icon={<Target size={24} />}
              color="#000000"
            />
            <StatCard
              title="Passes décisives"
              value={player.assists}
              icon={<Users size={24} />}
              color="#DC2626"
            />
            {player.position === 'Gardien' && (
              <StatCard
                title="Clean Sheets"
                value={player.cleanSheets}
                icon={<CheckCircle size={24} />}
                color="#000000"
              />
            )}
            <StatCard
              title="Cartons jaunes"
              value={player.yellowCards}
              icon={<AlertCircle size={24} />}
              color="#F59E0B"
            />
            <StatCard
              title="Cartons rouges"
              value={player.redCards}
              icon={<AlertCircle size={24} />}
              color="#EF4444"
            />
          </div>
        </div>
      </div>

      {/* Unavailabilities Management */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Gestion des Indisponibilités</h3>
          <button
            onClick={() => setShowUnavailabilityForm(true)}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <Plus size={20} />
            <span>Ajouter</span>
          </button>
        </div>

        {showUnavailabilityForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">Nouvelle indisponibilité</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                <input
                  type="date"
                  value={unavailabilityForm.startDate}
                  onChange={(e) => setUnavailabilityForm({ ...unavailabilityForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                <input
                  type="date"
                  value={unavailabilityForm.endDate}
                  onChange={(e) => setUnavailabilityForm({ ...unavailabilityForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={unavailabilityForm.type}
                  onChange={(e) => setUnavailabilityForm({ ...unavailabilityForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="injury">Blessure</option>
                  <option value="personal">Personnel</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison *</label>
                <input
                  type="text"
                  value={unavailabilityForm.reason}
                  onChange={(e) => setUnavailabilityForm({ ...unavailabilityForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ex: Entorse cheville"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={unavailabilityForm.description}
                onChange={(e) => setUnavailabilityForm({ ...unavailabilityForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={2}
                placeholder="Détails supplémentaires..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddUnavailability}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <Save size={20} />
                <span>Enregistrer</span>
              </button>
              <button
                onClick={() => setShowUnavailabilityForm(false)}
                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                <X size={20} />
                <span>Annuler</span>
              </button>
            </div>
          </div>
        )}

        {player.unavailabilities.length > 0 ? (
          <div className="space-y-3">
            {player.unavailabilities.map((unavailability) => (
              <div key={unavailability.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      unavailability.type === 'injury' ? 'bg-red-100 text-red-800' :
                      unavailability.type === 'personal' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {unavailability.type === 'injury' ? 'Blessure' : 
                       unavailability.type === 'personal' ? 'Personnel' : 'Autre'}
                    </span>
                    <span className="font-medium">{unavailability.reason}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Du {formatDateToDDMMYYYY(unavailability.startDate)}
                    {unavailability.endDate && ` au ${formatDateToDDMMYYYY(unavailability.endDate)}`}
                    {!unavailability.endDate && ' (en cours)'}
                  </p>
                  {unavailability.description && (
                    <p className="text-sm text-gray-500 mt-1">{unavailability.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteUnavailability(unavailability.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Aucune indisponibilité enregistrée</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
        {player.performances.length > 0 ? (
          <div className="space-y-3">
            {player.performances.slice(-5).reverse().map((performance) => (
              <div key={performance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    performance.type === 'match' ? 'bg-red-600' : 'bg-black'
                  }`}></div>
                  <div>
                    <p className="font-medium">{performance.type === 'match' ? 'Match' : 'Entraînement'}</p>
                    <p className="text-sm text-gray-600">{formatDateToDDMMYYYY(performance.date)}</p>
                  </div>
                  {performance.excused && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Excusé
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className={`font-medium ${performance.present ? 'text-green-600' : 'text-red-600'}`}>
                    {performance.present ? 'Présent' : 'Absent'}
                  </p>
                  {performance.present && performance.type === 'match' && (
                    <div className="text-sm text-gray-600">
                      {performance.minutesPlayed && <span>{performance.minutesPlayed} min</span>}
                      {performance.scoreHome !== undefined && performance.scoreAway !== undefined && (
                        <span className="ml-2">
                          ({performance.location === 'home' ? <Home size={12} className="inline mr-1" /> : <Bus size={12} className="inline mr-1" />}
                          {performance.scoreHome} - {performance.scoreAway}
                          {performance.opponent && ` vs ${performance.opponent}`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Aucune activité enregistrée</p>
          </div>
        )}
      </div>
    </div>
  );
};
