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

export const getAge = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
