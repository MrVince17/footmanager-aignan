import React from 'react';
import { MatchDisplayData } from '../types'; // Assuming MatchDisplayData is exported from types

interface SeasonStatsSummaryProps {
  matches: MatchDisplayData[];
}

export const SeasonStatsSummary: React.FC<SeasonStatsSummaryProps> = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return (
        <div className="p-4 my-4 text-center text-gray-500 bg-gray-100 rounded-lg shadow">
            Aucune donnée de match pour générer le résumé.
        </div>
    );
  }

  let victories = 0;
  let draws = 0;
  let defeats = 0;
  let goalsScoredByTeam = 0; // Renamed for clarity
  let goalsConcededByTeam = 0; // Renamed for clarity

  matches.forEach(match => {
    const homeScore = match.scoreHome;
    const awayScore = match.scoreAway;

    if (typeof homeScore === 'number' && typeof awayScore === 'number') {
      if (match.location === 'home') {
        goalsScoredByTeam += homeScore;
        goalsConcededByTeam += awayScore;
        if (homeScore > awayScore) victories++;
        else if (homeScore < awayScore) defeats++;
        else draws++;
      } else if (match.location === 'away') {
        goalsScoredByTeam += awayScore;
        goalsConcededByTeam += homeScore;
        if (awayScore > homeScore) victories++;
        else if (awayScore < homeScore) defeats++;
        else draws++;
      }
      // If location is not 'home' or 'away', or scores are not numbers, it's ambiguous.
      // Current logic only processes if location and scores are valid.
    }
  });

  const totalMatches = matches.length;
  const goalDifference = goalsScoredByTeam - goalsConcededByTeam;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Résumé de la Saison</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">{totalMatches}</div>
          <div className="text-sm text-gray-600">Matchs Joués</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{victories}</div>
          <div className="text-sm text-green-600">Victoires</div>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-700">{draws}</div>
          <div className="text-sm text-yellow-600">Nuls</div>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-700">{defeats}</div>
          <div className="text-sm text-red-600">Défaites</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">{goalsScoredByTeam}</div>
          <div className="text-sm text-blue-600">Buts Marqués</div>
        </div>
        <div className="p-3 bg-pink-50 rounded-lg">
          <div className="text-2xl font-bold text-pink-700">{goalsConcededByTeam}</div>
          <div className="text-sm text-pink-600">Buts Encaissés</div>
        </div>
      </div>
       <div className="mt-4 text-center">
        <p className={`text-lg font-semibold ${goalDifference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          Différence de buts : {goalDifference > 0 ? '+' : ''}{goalDifference}
        </p>
      </div>
    </div>
  );
};

export default SeasonStatsSummary;
