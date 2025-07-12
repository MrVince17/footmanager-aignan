import { Player, Performance } from '../types';

export const getPlayerById = (allPlayers: Player[], playerId: string): Player | undefined => {
  if (!allPlayers || !playerId) {
    return undefined;
  }
  return allPlayers.find(p => p.id === playerId);
};

export const getMatchStats = (performances: Performance[]): Record<string, number> => {
  const matchStats: Record<string, number> = {};

  performances.forEach(performance => {
    if (performance.type === 'match' && performance.present) {
      const matchType = performance.matchType || 'N/A';
      if (matchStats[matchType]) {
        matchStats[matchType]++;
      } else {
        matchStats[matchType] = 1;
      }
    }
  });

  return matchStats;
};
