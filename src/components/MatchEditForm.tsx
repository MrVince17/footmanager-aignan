import React, { useState, useEffect, useMemo } from 'react';
import { MatchDisplayData, Player, Performance } from '../types';

interface MatchEditFormProps {
  matchToEdit: MatchDisplayData;
  allPlayers: Player[];
  onSave: (updatedMatchData: Partial<Performance>, originalPerformanceRef: Performance) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const MatchEditForm: React.FC<MatchEditFormProps> = ({
  matchToEdit,
  allPlayers,
  onSave,
  onClose,
  isVisible,
}) => {
  const [date, setDate] = useState(matchToEdit.date || '');
  const [opponent, setOpponent] = useState(matchToEdit.opponent || '');
  const [scoreHome, setScoreHome] = useState<string | number>(matchToEdit.scoreHome ?? '');
  const [scoreAway, setScoreAway] = useState<string | number>(matchToEdit.scoreAway ?? '');
  const [scoreHomePenalties, setScoreHomePenalties] = useState<string | number>(matchToEdit.scoreHomePenalties ?? '');
  const [scoreAwayPenalties, setScoreAwayPenalties] = useState<string | number>(matchToEdit.scoreAwayPenalties ?? '');
  const [location, setLocation] = useState<'home' | 'away' | undefined>(matchToEdit.location);
  const [matchType, setMatchType] = useState(matchToEdit.matchType);
  const [localScorers, setLocalScorers] = useState(
    matchToEdit.scorers?.map(s => ({ ...s, minute: String(s.minute) })) || []
  );
  const [localAssisters, setLocalAssisters] = useState(
    matchToEdit.assisters?.map(a => ({ ...a })) || []
  );
  const [localYellowCards, setLocalYellowCards] = useState(
    matchToEdit.yellowCardsDetails?.map(yc => ({ ...yc, minute: String(yc.minute) })) || []
  );
  const [localRedCards, setLocalRedCards] = useState(
    matchToEdit.redCardsDetails?.map(rc => ({ ...rc, minute: String(rc.minute) })) || []
  );

  const isCupMatch = useMemo(() => {
    const cupTypes = ['CdF', 'CO', 'CG', 'CR'];
    return cupTypes.includes(matchType || '');
  }, [matchType]);

  const isDraw = useMemo(() => {
    const sh = Number(scoreHome);
    const sa = Number(scoreAway);
    return !isNaN(sh) && !isNaN(sa) && sh === sa;
  }, [scoreHome, scoreAway]);

  const showPenalties = isCupMatch && isDraw;

  const sortedPlayers = useMemo(() => {
    return [...allPlayers].sort((a, b) => {
      const lastNameComparison = a.lastName.localeCompare(b.lastName);
      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }
      return a.firstName.localeCompare(b.firstName);
    });
  }, [allPlayers]);

  useEffect(() => {
    setDate(matchToEdit.date || '');
    setOpponent(matchToEdit.opponent || '');
    setScoreHome(matchToEdit.scoreHome ?? '');
    setScoreAway(matchToEdit.scoreAway ?? '');
    setScoreHomePenalties(matchToEdit.scoreHomePenalties ?? '');
    setScoreAwayPenalties(matchToEdit.scoreAwayPenalties ?? '');
    setLocation(matchToEdit.location);
    setMatchType(matchToEdit.matchType);
    setLocalScorers(
      matchToEdit.scorers?.map(s => ({ ...s, minute: String(s.minute) })) || []
    );
    setLocalAssisters(
      matchToEdit.assisters?.map(a => ({ ...a })) || []
    );
    setLocalYellowCards(
      matchToEdit.yellowCardsDetails?.map(yc => ({ ...yc, minute: String(yc.minute) })) || []
    );
    setLocalRedCards(
      matchToEdit.redCardsDetails?.map(rc => ({ ...rc, minute: String(rc.minute) })) || []
    );
  }, [matchToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPerformanceData: Partial<Performance> = {
      date,
      opponent,
      scoreHome: scoreHome === '' ? undefined : Number(scoreHome),
      scoreAway: scoreAway === '' ? undefined : Number(scoreAway),
      scoreHomePenalties: showPenalties && scoreHomePenalties !== '' ? Number(scoreHomePenalties) : undefined,
      scoreAwayPenalties: showPenalties && scoreAwayPenalties !== '' ? Number(scoreAwayPenalties) : undefined,
      location,
      matchType,
      scorers: localScorers
        .filter(s => s.playerId && s.minute !== '')
        .map(s => ({ playerId: s.playerId, minute: Number(s.minute) })),
      assisters: localAssisters
        .filter(a => a.playerId)
        .map(a => ({ playerId: a.playerId })),
      yellowCardsDetails: localYellowCards
        .filter(yc => yc.playerId && yc.minute !== '')
        .map(yc => ({ playerId: yc.playerId, minute: Number(yc.minute) })),
      redCardsDetails: localRedCards
        .filter(rc => rc.playerId && rc.minute !== '')
        .map(rc => ({ playerId: rc.playerId, minute: Number(rc.minute) })),
    };

    if (!matchToEdit.originalPerformanceRef) {
        console.error("Original performance reference is missing in matchToEdit");
        return;
    }

    onSave(updatedPerformanceData, matchToEdit.originalPerformanceRef);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50 flex justify-center items-center">
      <div className="relative border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] flex flex-col">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-2xl font-semibold text-center text-gray-700">Modifier le Match</h3>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label htmlFor="match-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              id="match-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="match-opponent" className="block text-sm font-medium text-gray-700 mb-1">Adversaire</label>
            <input
              type="text"
              id="match-opponent"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Nom de l'adversaire"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="match-scoreHome" className="block text-sm font-medium text-gray-700 mb-1">Score Domicile</label>
              <input
                type="number"
                id="match-scoreHome"
                value={scoreHome}
                onChange={(e) => setScoreHome(e.target.value === '' ? '' : Number(e.target.value))}
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="match-scoreAway" className="block text-sm font-medium text-gray-700 mb-1">Score Extérieur</label>
              <input
                type="number"
                id="match-scoreAway"
                value={scoreAway}
                onChange={(e) => setScoreAway(e.target.value === '' ? '' : Number(e.target.value))}
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0"
              />
            </div>
          </div>

          {showPenalties && (
            <div className="grid grid-cols-2 gap-4 p-4 border-t border-dashed mt-4">
                <h4 className="col-span-2 text-sm font-medium text-gray-800 mb-2">Tirs au but</h4>
              <div>
                <label htmlFor="match-scoreHomePenalties" className="block text-sm font-medium text-gray-700 mb-1">T.A.B Domicile</label>
                <input
                  type="number"
                  id="match-scoreHomePenalties"
                  value={scoreHomePenalties}
                  onChange={(e) => setScoreHomePenalties(e.target.value === '' ? '' : Number(e.target.value))}
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="match-scoreAwayPenalties" className="block text-sm font-medium text-gray-700 mb-1">T.A.B Extérieur</label>
                <input
                  type="number"
                  id="match-scoreAwayPenalties"
                  value={scoreAwayPenalties}
                  onChange={(e) => setScoreAwayPenalties(e.target.value === '' ? '' : Number(e.target.value))}
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="match-location" className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
            <select
              id="match-location"
              value={location || ''}
              onChange={(e) => setLocation(e.target.value as 'home' | 'away' | undefined)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value="" disabled>Sélectionner le lieu</option>
              <option value="home">Domicile</option>
              <option value="away">Extérieur</option>
            </select>
          </div>

          <div>
            <label htmlFor="match-type" className="block text-sm font-medium text-gray-700 mb-1">Type de Match</label>
            <select
              id="match-type"
              value={matchType || ''}
              onChange={(e) => setMatchType(e.target.value as any)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="" disabled>Sélectionner le type</option>
              <option value="D2">Championnat D2</option>
              <option value="R2">Championnat R2</option>
              <option value="CdF">Coupe de France</option>
              <option value="CO">Coupe Occitannie</option>
              <option value="CG">Coupe du Gers</option>
              <option value="ChD">Challenge District</option>
              <option value="CR">Coupe des Réserves</option>
              <option value="CS">Coupe Savoldelli</option>
            </select>
          </div>

          {/* Scorers Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buteurs</label>
            {localScorers.map((scorer, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
                <select
                  value={scorer.playerId}
                  onChange={(e) => {
                    const newScorers = [...localScorers];
                    newScorers[index].playerId = e.target.value;
                    setLocalScorers(newScorers);
                  }}
                  className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="" disabled>Sélectionner joueur</option>
                  {sortedPlayers.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.firstName} {player.lastName}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Minute"
                  value={scorer.minute}
                  onChange={(e) => {
                    const newScorers = [...localScorers];
                    newScorers[index].minute = e.target.value;
                    setLocalScorers(newScorers);
                  }}
                  className="mt-1 block w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newScorers = localScorers.filter((_, i) => i !== index);
                    setLocalScorers(newScorers);
                  }}
                  className="p-2 text-red-500 hover:text-red-700"
                  title="Supprimer buteur"
                >
                  &#x2716;
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLocalScorers([...localScorers, { playerId: '', minute: '' }])}
              className="mt-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-md shadow-sm"
            >
              + Ajouter Buteur
            </button>
          </div>

          {/* Assisters Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Passeurs Décisifs</label>
            {localAssisters.map((assister, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
                <select
                  value={assister.playerId}
                  onChange={(e) => {
                    const newAssisters = [...localAssisters];
                    newAssisters[index].playerId = e.target.value;
                    setLocalAssisters(newAssisters);
                  }}
                  className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="" disabled>Sélectionner joueur</option>
                  {sortedPlayers.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.firstName} {player.lastName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const newAssisters = localAssisters.filter((_, i) => i !== index);
                    setLocalAssisters(newAssisters);
                  }}
                  className="p-2 text-red-500 hover:text-red-700"
                  title="Supprimer passeur"
                >
                  &#x2716;
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLocalAssisters([...localAssisters, { playerId: '' }])}
              className="mt-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-md shadow-sm"
            >
              + Ajouter Passeur
            </button>
          </div>

          {/* Yellow Cards Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cartons Jaunes</label>
            {localYellowCards.map((card, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
                <select
                  value={card.playerId}
                  onChange={(e) => {
                    const newYellowCards = [...localYellowCards];
                    newYellowCards[index].playerId = e.target.value;
                    setLocalYellowCards(newYellowCards);
                  }}
                  className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="" disabled>Sélectionner joueur</option>
                  {sortedPlayers.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.firstName} {player.lastName}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Minute"
                  value={card.minute}
                  onChange={(e) => {
                    const newYellowCards = [...localYellowCards];
                    newYellowCards[index].minute = e.target.value;
                    setLocalYellowCards(newYellowCards);
                  }}
                  className="mt-1 block w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newYellowCards = localYellowCards.filter((_, i) => i !== index);
                    setLocalYellowCards(newYellowCards);
                  }}
                  className="p-2 text-red-500 hover:text-red-700"
                  title="Supprimer carton jaune"
                >
                  &#x2716;
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLocalYellowCards([...localYellowCards, { playerId: '', minute: '' }])}
              className="mt-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-md shadow-sm"
            >
              + Ajouter Carton Jaune
            </button>
          </div>

          {/* Red Cards Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cartons Rouges</label>
            {localRedCards.map((card, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
                <select
                  value={card.playerId}
                  onChange={(e) => {
                    const newRedCards = [...localRedCards];
                    newRedCards[index].playerId = e.target.value;
                    setLocalRedCards(newRedCards);
                  }}
                  className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="" disabled>Sélectionner joueur</option>
                  {sortedPlayers.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.firstName} {player.lastName}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Minute"
                  value={card.minute}
                  onChange={(e) => {
                    const newRedCards = [...localRedCards];
                    newRedCards[index].minute = e.target.value;
                    setLocalRedCards(newRedCards);
                  }}
                  className="mt-1 block w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newRedCards = localRedCards.filter((_, i) => i !== index);
                    setLocalRedCards(newRedCards);
                  }}
                  className="p-2 text-red-500 hover:text-red-700"
                  title="Supprimer carton rouge"
                >
                  &#x2716;
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLocalRedCards([...localRedCards, { playerId: '', minute: '' }])}
              className="mt-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-md shadow-sm"
            >
              + Ajouter Carton Rouge
            </button>
          </div>

          <div className="pt-6 flex justify-end space-x-3 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Enregistrer les Modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchEditForm;