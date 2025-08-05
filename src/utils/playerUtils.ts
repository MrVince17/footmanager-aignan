import { Player, Performance } from '../types';

export const getPlayerById = (allPlayers: Player[], playerId: string): Player | undefined => {
  if (!allPlayers || !playerId) {
    return undefined;
  }
  return allPlayers.find(p => p.id === playerId);
};

export const getPlayerStats = (player: Player) => {
  const stats = {
    totalMatches: 0,
    totalMinutes: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    cleanSheets: 0,
  };

  if (player.performances) {
    player.performances.forEach(p => {
      if (p.type === 'match' && p.present) {
        stats.totalMatches++;
        stats.totalMinutes += p.minutesPlayed || 0;
        stats.yellowCards += p.yellowCards || 0;
        stats.redCards += p.redCards || 0;
        if (p.cleanSheet && player.position === 'Gardien') {
          stats.cleanSheets++;
        }
        if (p.scorers) {
          stats.goals += p.scorers.filter(s => s.playerId === player.id).length;
        }
        if (p.assisters) {
          stats.assists += p.assisters.filter(a => a.playerId === player.id).length;
        }
      }
    });
  }

  return stats;
};

export const getMatchStats = (performances: Performance[]): Record<string, number> => {
  const matchTypes = ['D2', 'R2', 'CdF', 'CO', 'CR', 'ChD', 'CG', 'CS', 'Match Amical'];
  const matchStats: Record<string, number> = {};

  matchTypes.forEach(type => {
    matchStats[type] = 0;
  });

  const processedMatches = new Set<string>();

  performances.forEach(performance => {
    if (performance.type === 'match' && performance.present) {
      const matchId = `${performance.date}-${performance.opponent}`;
      if (!processedMatches.has(matchId)) {
        const matchType = performance.matchType || 'N/A';
        if (matchStats.hasOwnProperty(matchType)) {
          matchStats[matchType]++;
        } else {
          matchStats[matchType] = 1;
        }
        processedMatches.add(matchId);
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

// This function was originally in storage.ts and is pure data manipulation.
// It's moved here to be a standalone utility function.
export const getTotalTeamEvents = (
  allPlayers: Player[],
  type: 'training' | 'match',
  teamName?: import('../types').Team,
  season?: string, // Optional season filter
  matchType?: string // Optional match type filter
): { date: string, opponent?: string, season: string }[] => {
  const uniqueEvents = new Map<string, { date: string, opponent?: string, season: string }>();

  for (const player of allPlayers) {
    if (teamName && !player.teams.includes(teamName)) {
      continue;
    }
    if (Array.isArray(player.performances)) {
      for (const perf of player.performances) {
        if (
          perf.type === type &&
          (!season || perf.season === season) &&
          (type !== 'match' || !matchType || matchType === 'all' || perf.matchType === matchType)
        ) {
          const key = type === 'match'
            ? `${perf.season}-${perf.date}-${perf.opponent || 'unknown'}`
            : `${perf.season}-${perf.date}`;
          if (!uniqueEvents.has(key)) {
            uniqueEvents.set(key, { date: perf.date, opponent: perf.opponent, season: perf.season });
          }
        }
      }
    }
  }
  return Array.from(uniqueEvents.values());
};

// Other utility functions that might have been in storage.ts can also be moved here.
export const isDateInUnavailabilityPeriod = (player: Player, date: string): boolean => {
    const checkDate = new Date(date);
    if (!player.unavailabilities) return false;
    return player.unavailabilities.some(unavailability => {
      const startDate = new Date(unavailability.startDate);
      const endDate = unavailability.endDate ? new Date(unavailability.endDate) : new Date();
      return checkDate >= startDate && checkDate <= endDate;
    });
};
