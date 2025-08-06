import { Player, Performance, PlayerSeasonStats } from '../types';

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

export const getPlayerStatsForSeason = (
  player: Player,
  season: string,
  allPlayersForContext: Player[]
): PlayerSeasonStats => {
  const seasonPerformances = (player.performances || []).filter(p =>
    p.season === season
  );

  let stats: Omit<PlayerSeasonStats, 'trainingAttendanceRateSeason' | 'matchAttendanceRateSeason'> = {
    totalMatches: 0, totalMinutes: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, presentTrainings: 0, presentMatches: 0
  };

  seasonPerformances.forEach(p => {
    if (p.present) {
      if (p.type === 'match') {
        stats.totalMatches++;
        stats.presentMatches++;
        stats.totalMinutes += p.minutesPlayed || 0;
        stats.goals += p.goals || 0;
        stats.assists += p.assists || 0;
        stats.yellowCards += p.yellowCards || 0;
        stats.redCards += p.redCards || 0;
        if (p.cleanSheet && player.position === 'Gardien') {
          stats.cleanSheets++;
        }
      } else if (p.type === 'training') {
        stats.presentTrainings++;
      }
    }
  });

  const allTeamTrainingsForSeason = getTotalTeamEvents(allPlayersForContext, 'training', undefined, season).length;
  let allTeamMatchesForPlayerForSeason = 0;
  const uniqueMatchEventsForPlayerSeason = new Set<string>();
  player.teams.forEach(team => {
    const teamMatchEvents = getTotalTeamEvents(allPlayersForContext, 'match', team, season);
    teamMatchEvents.forEach(event => uniqueMatchEventsForPlayerSeason.add(`${event.date}-${event.opponent || 'unknown'}`));
  });
  allTeamMatchesForPlayerForSeason = uniqueMatchEventsForPlayerSeason.size;

  const trainingAttendanceRateSeason = allTeamTrainingsForSeason > 0
    ? (stats.presentTrainings / allTeamTrainingsForSeason) * 100
    : player.trainingAttendanceRate;
  const matchAttendanceRateSeason = allTeamMatchesForPlayerForSeason > 0
    ? (stats.presentMatches / allTeamMatchesForPlayerForSeason) * 100
    : player.matchAttendanceRate;

  return { ...stats, trainingAttendanceRateSeason, matchAttendanceRateSeason };
};
