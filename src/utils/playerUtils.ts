import { Player, Performance } from '../types';

export const getPlayerById = (allPlayers: Player[], playerId: string): Player | undefined => {
  if (!allPlayers || !playerId) {
    return undefined;
  }
  return allPlayers.find(p => p.id === playerId);
};

export const getMatchStats = (performances: Performance[]): Record<string, number> => {
  const matchTypes = ['D2', 'R2', 'CdF', 'CO', 'CR', 'ChD', 'CG', 'CS'];
  const matchStats: Record<string, number> = {};

  matchTypes.forEach(type => {
    matchStats[type] = 0;
  });

  performances.forEach(performance => {
    if (performance.type === 'match' && performance.present) {
      const matchType = performance.matchType || 'N/A';
      if (matchStats.hasOwnProperty(matchType)) {
        matchStats[matchType]++;
      } else {
        matchStats[matchType] = 1;
      }
    }
  });

  return matchStats;
};
