import React from 'react';
import { Player, Performance, MatchDisplayData } from '../types'; // MatchDisplayData sera utilisé plus tard

interface MatchResultsPageProps {
  allPlayers: Player[];
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
  onUpdatePlayerStorage: (type: string, refData: any, value?: any) => void; // Signature temporaire
}

export const MatchResultsPage: React.FC<MatchResultsPageProps> = ({
  allPlayers,
  selectedSeason,
  onSeasonChange,
  onUpdatePlayerStorage,
}) => {
  // Logique pour getAvailableSeasons, displayedMatches etc. viendra ici plus tard

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-sky-400 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Résultats Saison</h1>
        <p className="text-blue-100">
          Consultation des résultats des matchs de la saison sélectionnée.
        </p>
      </div>

      {/* Sélecteur de saison (sera ajouté ici) */}
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-gray-700">Sélecteur de saison (Saison actuelle: {selectedSeason})</p>
        {/* TODO: Ajouter le composant de sélection de saison */}
      </div>

      <div className="text-center py-8 text-gray-500">
        <p>Affichage des résultats de la saison en cours de développement.</p>
        <p className="mt-2">Nombre de joueurs reçus: {allPlayers.length}</p>
      </div>

      {/* Liste des MatchCard (sera ajoutée ici) */}
      {/* Modale d'édition (sera ajoutée ici) */}
    </div>
  );
};
