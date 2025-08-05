import React, { useState, useRef } from 'react';
import { Player } from '../types';
import { Search, Plus, Edit, Trash2, Users, Upload, Download, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Header } from './Header';
import { Link, useNavigate } from 'react-router-dom';
import { formatDateToYYYYMMDD } from '../utils/dateUtils';

interface PlayerListProps {
  players: Player[];
  onDeletePlayer: (playerId: string) => void;
  onImportPlayers: (importedPlayers: Player[]) => void;
  onDeleteMultiple: (playerIds: string[]) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  // onSelectPlayer, // Supprimé
  // onEditPlayer, // Supprimé
  onDeletePlayer,
  onImportPlayers,
  onDeleteMultiple
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const excelHeaders = [
    'Nom',
    'Prénom',
    'Date de Naissance',
    'N° Licence',
    'Équipes',
    'Poste',
    'Licence Valide',
    'Date_Validation_Licence',
    'Paiement Valide',
  ];

  const handleExport = () => {
    const dataToExport = players.map(p => ({
      [excelHeaders[0]]: p.lastName,
      [excelHeaders[1]]: p.firstName,
      [excelHeaders[2]]: p.dateOfBirth,
      [excelHeaders[3]]: p.licenseNumber,
      [excelHeaders[4]]: p.teams.join(', '),
      [excelHeaders[5]]: p.position,
      [excelHeaders[6]]: p.licenseValid ? 'Oui' : 'Non',
      [excelHeaders[7]]: p.licenseValidationDate,
      [excelHeaders[8]]: p.paymentValid ? 'Oui' : 'Non',
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport, { header: excelHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Joueurs");
    XLSX.writeFile(wb, "export_joueurs.xlsx");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 1) {
          alert("Le fichier est vide.");
          return;
        }

        const headerFromFile = rows[0];
        if (JSON.stringify(headerFromFile) !== JSON.stringify(excelHeaders)) {
          alert("Les en-têtes de colonnes du fichier importé ne correspondent pas au format attendu.");
          console.error("Expected headers:", JSON.stringify(excelHeaders));
          console.error("File headers:", JSON.stringify(headerFromFile));
          return;
        }

        const dataRows = rows.slice(1);

        const importedPlayers = dataRows.map(row => {
          const lastName = row[0] || '';
          const firstName = row[1] || '';
          const dateOfBirth = formatDateToYYYYMMDD(row[2]);
          const licenseNumber = row[3];
          let teams = (row[4] || '').split(',').map((t: string) => t.trim());
          if (teams.includes('Senior')) {
            teams = teams.filter(t => t !== 'Senior');
            teams.push('Senior 1', 'Senior 2');
          }
          const position = row[5] || 'Non défini';
          const licenseValid = row[6] === 'Oui';
          const licenseValidationDate = formatDateToYYYYMMDD(row[7]);
          const paymentValid = row[8] === 'Oui';

          const playerObject: Player = {
            id: licenseNumber ? String(licenseNumber) : `${Date.now()}-${Math.random()}`,
            firstName: firstName,
            lastName: lastName,
            dateOfBirth: dateOfBirth || '',
            licenseNumber: String(licenseNumber || ''),
            teams: teams,
            position: position,
            licenseValid: licenseValid,
            licenseValidationDate: licenseValidationDate,
            paymentValid: paymentValid,
            // Default values for all other fields to ensure they are not undefined
            totalMatches: 0,
            totalMinutes: 0,
            totalTrainings: 0,
            goals: 0,
            assists: 0,
            cleanSheets: 0,
            yellowCards: 0,
            redCards: 0,
            trainingAttendanceRate: 0,
            matchAttendanceRate: 0,
            absences: [],
            injuries: [],
            unavailabilities: [],
            performances: [],
          };

          return playerObject;
        });

        onImportPlayers(importedPlayers as Player[]);
      } catch (error) {
        alert("Une erreur est survenue lors de la lecture du fichier. Assurez-vous qu'il est au bon format.");
        console.error("Erreur d'importation:", error);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedPlayers.length} joueur(s) ?`)) {
      onDeleteMultiple(selectedPlayers);
      setSelectedPlayers([]);
    }
  };

  const sortedAndFilteredPlayers = players
    .filter(player => {
      const matchesSearch =
        player.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTeam = filterTeam === 'all' ||
        (filterTeam === 'Senior' && player.teams.some(team => team.toLowerCase().includes('senior'))) ||
        (filterTeam === 'Dirigeant/Dirigeante' && player.teams.some(team => team.toLowerCase().includes('dirigeant'))) ||
        (filterTeam !== 'Senior' && filterTeam !== 'Dirigeant/Dirigeante' && player.teams.includes(filterTeam as any));
      const matchesPosition = filterPosition === 'all' || player.position === filterPosition;

      return matchesSearch && matchesTeam && matchesPosition;
    })
    .sort((a, b) => {
      const lastNameComparison = a.lastName.localeCompare(b.lastName);
      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }
      return a.firstName.localeCompare(b.firstName);
    });

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'Gardien': return 'bg-yellow-100 text-yellow-800';
      case 'Défenseur': return 'bg-blue-100 text-blue-800';
      case 'Milieu': return 'bg-green-100 text-green-800';
      case 'Attaquant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <Header
        title="Gestion des Joueurs"
        subtitle="Gérez vos joueurs et consultez leurs statistiques"
      />

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un joueur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">Toutes les équipes</option>
            <option value="Senior">Senior</option>
            <option value="U20">U20</option>
            <option value="U19">U19</option>
            <option value="U18">U18</option>
            <option value="U17">U17</option>
            <option value="U6-U11">U6-U11</option>
            <option value="Arbitre">Arbitre</option>
            <option value="Dirigeant/Dirigeante">Dirigeant/Dirigeante</option>
          </select>
          
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">Tous les postes</option>
            <option value="Gardien">Gardien</option>
            <option value="Défenseur">Défenseur</option>
            <option value="Milieu">Milieu</option>
            <option value="Attaquant">Attaquant</option>
          </select>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".xlsx, .xls"
          />
          <button
            onClick={handleImportClick}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Upload size={20} />
            <span>Importer</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <Download size={20} />
            <span>Exporter</span>
          </button>
          <Link
            to="/players/add"
            className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <Plus size={20} />
            <span>Ajouter</span>
          </Link>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
            <button
                onClick={() => {
                    const allVisiblePlayerIds = sortedAndFilteredPlayers.map(p => p.id);
                    const allVisibleSelected = selectedPlayers.length === allVisiblePlayerIds.length && allVisiblePlayerIds.every(id => selectedPlayers.includes(id));
                    if (allVisibleSelected) {
                        setSelectedPlayers(selectedPlayers.filter(id => !allVisiblePlayerIds.includes(id)));
                    } else {
                        setSelectedPlayers([...new Set([...selectedPlayers, ...allVisiblePlayerIds])]);
                    }
                }}
                className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 text-sm"
            >
                Tout sélectionner / désélectionner (visibles)
            </button>
          <span>{sortedAndFilteredPlayers.length} joueur(s) trouvé(s)</span>
          {selectedPlayers.length > 0 && (
            <div className="flex items-center space-x-4">
              <span>{selectedPlayers.length} sélectionné(s)</span>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <Trash2 size={16} />
                <span>Supprimer la sélection</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAndFilteredPlayers.map((player) => (
          <div key={player.id} className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${selectedPlayers.includes(player.id) ? 'ring-2 ring-red-500' : ''}`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedPlayers.includes(player.id)}
                    onChange={() => handleSelectPlayer(player.id)}
                    className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {player.firstName} {player.lastName}
                    </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <Calendar size={16} />
                    <span>{getAge(player.dateOfBirth)} ans</span>
                  </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/players/edit/${player.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => onDeletePlayer(player.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                    {player.position}
                  </span>
                  <span className="text-sm text-gray-600">#{player.licenseNumber}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users size={16} />
                  <span>{player.teams.join(', ')}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{player.goals}</div>
                    <div className="text-gray-600">Buts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{player.assists}</div>
                    <div className="text-gray-600">Passes</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${player.licenseValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-600">Licence</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${player.paymentValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-600">Paiement</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Présence matchs</span>
                    <span className="font-medium">{player.matchAttendanceRate.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <Link
                to={`/players/${player.id}`}
                className="w-full mt-4 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 block text-center" // Ajout de block et text-center pour style de lien
              >
                Voir les détails
              </Link>
            </div>
          </div>
        ))}
      </div>

      {sortedAndFilteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun joueur trouvé</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterTeam !== 'all' || filterPosition !== 'all' 
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par ajouter votre premier joueur'
            }
          </p>
          <Link
            to="/players/add"
            className="inline-flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <Plus size={20} />
            <span>Ajouter un joueur</span>
          </Link>
        </div>
      )}
    </div>
  );
};