import React from 'react';
import { Player, MatchDisplayData, Scorer, Assister, CardDetail, GoalConcededDetail } from '../types';
import { getPlayerById } from '../utils/playerUtils';
import { Edit } from 'lucide-react'; // Import the Edit icon

interface MatchCardProps {
  match: MatchDisplayData;
  allPlayers: Player[];
  onEdit: (match: MatchDisplayData) => void;
}

const formatPlayerEvent = (eventItems: (Scorer | Assister | CardDetail | GoalConcededDetail)[] | undefined, allPlayers: Player[], type: 'scorer' | 'assister' | 'card' | 'conceded') => {
  if (!eventItems || eventItems.length === 0) return '-';
  return eventItems.map(item => {
    // Handle cases where playerId might not exist (like GoalConcededDetail)
    if (!item.playerId) {
      if ('minute' in item && typeof item.minute === 'number') {
        return `But encaissé (${item.minute}')`;
      }
      return 'N/A';
    }

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
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {location === 'home' ? 'US Aignan' : opponent} vs {location === 'home' ? opponent : 'US Aignan'}
                </h3>
                <p className="text-sm text-gray-600">{formattedDate} - {location === 'home' ? 'Domicile' : 'Extérieur'}</p>
            </div>
            <button
                onClick={() => onEdit(match)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                title="Modifier le match"
            >
                <Edit size={16} />
            </button>
        </div>

        <div className="text-center mb-4">
            <p className="text-3xl font-bold text-black" dangerouslySetInnerHTML={{ __html: renderScore() }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
            <div><strong className="text-gray-900">Buteurs:</strong> {formatPlayerEvent(scorers, allPlayers, 'scorer')}</div>
            <div><strong className="text-gray-900">Passeurs:</strong> {formatPlayerEvent(assisters, allPlayers, 'assister')}</div>
            <div><strong className="text-gray-900">Cartons Jaunes:</strong> {formatPlayerEvent(yellowCardsDetails, allPlayers, 'card')}</div>
            <div><strong className="text-gray-900">Cartons Rouges:</strong> {formatPlayerEvent(redCardsDetails, allPlayers, 'card')}</div>
            {goalsConcededDetails && goalsConcededDetails.length > 0 && (
                <div><strong className="text-gray-900">Buts Encaissés:</strong> {formatPlayerEvent(goalsConcededDetails, allPlayers, 'conceded')}</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
