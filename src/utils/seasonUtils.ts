import { Player } from '../types';

export const getSeasonFromDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 for January, 6 for July)

  if (month >= 6) {
    // July or later, so it's the start of a new season
    return `${year}-${year + 1}`;
  } else {
    // Before July, so it's the end of the previous season
    return `${year - 1}-${year}`;
  }
};

export const getAvailableSeasons = (allPlayers: Player[]): string[] => {
  const seasons = new Set<string>();
  allPlayers.forEach(p => {
    (p.performances || []).forEach(perf => {
      const season = getSeasonFromDate(new Date(perf.date));
      seasons.add(season);
    });
  });

  if (seasons.size === 0) {
    const currentSeason = getSeasonFromDate(new Date());
    return [currentSeason];
  }

  return Array.from(seasons).sort((a, b) => b.localeCompare(a));
};
