import React from 'react';
// Attempt to import shared types. If these don't exist, we'll need to define them locally or adjust.
import { Player, MatchDisplayData, Scorer, Assister, CardDetail, GoalConcededDetail } from '../types';
import { getPlayerById } from '../utils/playerUtils'; // Utility to find player details

interface MatchCardProps {
  match: MatchDisplayData;
  allPlayers: Player[];
  onEdit: (match: MatchDisplayData) => void;
}

const formatPlayerEvent = (eventItems: (Scorer | Assister | CardDetail | GoalConcededDetail)[] | undefined, allPlayers: Player[], type: 'scorer' | 'assister' | 'card' | 'conceded') => {
  if (!eventItems || eventItems.length === 0) return '-';
  return eventItems.map(item => {
    const player = getPlayerById(allPlayers, item.playerId);
    const playerName = player ? `${player.firstName || ''} ${player.lastName || ''}`.trim() : 'Joueur inconnu';
    let detail = '';
    if ('minute' in item && typeof item.minute === 'number') { // Explicitly check for number type, including 0
      detail += ` (${item.minute}')`;
    }
    if (type === 'card' && 'cardType' in item && typeof item.cardType === 'string' && item.cardType) { // Ensure cardType is a string
      detail += ` [${item.cardType}]`;
    }
    return `${playerName}${detail}`;
  }).join(', ');
};

export const MatchCard: React.FC<MatchCardProps> = ({ match, allPlayers, onEdit }) => {
  const {
    date,
    opponent,
    scoreHome,
    scoreAway,
    location,
    scorers,
    assisters,
    yellowCardsDetails,
    redCardsDetails,
    goalsConcededDetails,
  } = match;

  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const renderScore = () => {
    const home = scoreHome ?? '?';
    const away = scoreAway ?? '?';
    if (location === 'home') {
      return <strong>{home} - {away}</strong>;
    } else if (location === 'away') {
      return `${home} - <strong>${away}</strong>`;
    }
    return `${home} - ${away}`;
  };

  return (
    <div className="bg-gray-800 shadow-lg rounded-lg p-4 mb-4 border border-gray-700 hover:border-red-600 transition-all duration-300">
      <div className="flex justify-between items-center mb-3 text-white">
        <div>
          <h5 className="text-lg font-bold uppercase tracking-wide">
            {location === 'home' ? 'US Aignan' : opponent} vs {location === 'home' ? opponent : 'US Aignan'}
          </h5>
          <p className="text-sm text-gray-400">{formattedDate} - {location === 'home' ? 'Domicile' : 'Extérieur'}</p>
        </div>
        <button
          onClick={() => onEdit(match)}
          className="text-sm bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md transition-colors"
        >
          Modifier
        </button>
      </div>

      <div className="mb-4 text-center text-white">
        <p className="text-3xl font-bold tracking-tighter" dangerouslySetInnerHTML={{ __html: renderScore() }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-300">
        <div><strong className="text-gray-100">Buteurs:</strong> {formatPlayerEvent(scorers, allPlayers, 'scorer')}</div>
        <div><strong className="text-gray-100">Passeurs:</strong> {formatPlayerEvent(assisters, allPlayers, 'assister')}</div>
        <div><strong className="text-gray-100">Cartons Jaunes:</strong> {formatPlayerEvent(yellowCardsDetails, allPlayers, 'card')}</div>
        <div><strong className="text-gray-100">Cartons Rouges:</strong> {formatPlayerEvent(redCardsDetails, allPlayers, 'card')}</div>
        {goalsConcededDetails && goalsConcededDetails.length > 0 && ( // Only show if data exists
            <div><strong className="text-gray-100">Buts Encaissés (gardien):</strong> {formatPlayerEvent(goalsConcededDetails, allPlayers, 'conceded')}</div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
