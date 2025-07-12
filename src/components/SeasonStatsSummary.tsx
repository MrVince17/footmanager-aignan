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
    <div className="p-4 my-6 bg-black text-white rounded-lg shadow-md border border-gray-700">
      <h3 className="text-xl font-bold uppercase tracking-wider mb-4 text-center">Résumé de la Saison</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
        <div className="p-3 bg-gray-800 rounded-md">
          <div className="text-2xl font-bold">{totalMatches}</div>
          <div className="text-sm text-gray-400">Matchs Joués</div>
        </div>
        <div className="p-3 bg-gray-800 rounded-md">
          <div className="text-2xl font-bold text-green-400">{victories}</div>
          <div className="text-sm text-gray-400">Victoires</div>
        </div>
        <div className="p-3 bg-gray-800 rounded-md">
          <div className="text-2xl font-bold text-yellow-400">{draws}</div>
          <div className="text-sm text-gray-400">Nuls</div>
        </div>
        <div className="p-3 bg-gray-800 rounded-md">
          <div className="text-2xl font-bold text-red-500">{defeats}</div>
          <div className="text-sm text-gray-400">Défaites</div>
        </div>
        <div className="p-3 bg-gray-800 rounded-md">
          <div className="text-2xl font-bold">{goalsScoredByTeam}</div>
          <div className="text-sm text-gray-400">Buts Marqués</div>
        </div>
        <div className="p-3 bg-gray-800 rounded-md">
          <div className="text-2xl font-bold">{goalsConcededByTeam}</div>
          <div className="text-sm text-gray-400">Buts Encaissés</div>
        </div>
      </div>
       <div className="mt-4 text-center">
        <p className={`text-lg font-semibold ${goalDifference >= 0 ? 'text-green-400' : 'text-red-500'}`}>
          Différence de buts : {goalDifference > 0 ? '+' : ''}{goalDifference}
        </p>
      </div>
    </div>
  );
};

export default SeasonStatsSummary;
