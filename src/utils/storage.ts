import { Player, Performance, Absence, Injury, Unavailability, Team } from '../types';
import { getSeasonFromDate } from './seasonUtils';

const STORAGE_KEYS = {
  PLAYERS: 'football_players',
  PERFORMANCES: 'football_performances',
  ABSENCES: 'football_absences',
  INJURIES: 'football_injuries',
  UNAVAILABILITIES: 'football_unavailabilities'
};

export const storage = {
  // Players
  getPlayers: (): Player[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!data) return [];

    let players: Player[] = JSON.parse(data);

    // Data migration: ensure all players have necessary fields and correct team names
    return players.map(player => {
      const migratedTeams = (player.teams || []).map(team => {
        if ((team as any) === 'Seniors 1') return 'Senior 1';
        if ((team as any) === 'Seniors 2') return 'Senior 2';
        if ((team as any) === 'U13-U17') return 'U17';
        return team;
      });

      return {
        ...player,
        teams: migratedTeams,
        performances: player.performances || [],
        unavailabilities: player.unavailabilities || [],
        absences: player.absences || [],
        injuries: player.injuries || [],
        totalMatches: player.totalMatches || 0,
        totalMinutes: player.totalMinutes || 0,
        totalTrainings: player.totalTrainings || 0,
        goals: player.goals || 0,
        assists: player.assists || 0,
        cleanSheets: player.cleanSheets || 0,
        yellowCards: player.yellowCards || 0,
        redCards: player.redCards || 0,
        trainingAttendanceRate: player.trainingAttendanceRate || 0,
        matchAttendanceRate: player.matchAttendanceRate || 0,
      };
    });
  },

  savePlayers: (players: Player[]) => {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  },

  addPlayer: (player: Player) => {
    const players = storage.getPlayers();
    players.push(player);
    storage.savePlayers(players);
  },

  updatePlayer: (updatedPlayer: Player) => {
    const players = storage.getPlayers();
    const index = players.findIndex(p => p.id === updatedPlayer.id);
    if (index !== -1) {
      players[index] = updatedPlayer;
      storage.savePlayers(players);
    }
  },

  deleteMatch: (matchPerformance: Performance) => {
    const players = storage.getPlayers();
    const updatedPlayers = players.map(player => {
      const performances = player.performances.filter(p => {
        return !(p.type === 'match' &&
                 p.date === matchPerformance.date &&
                 p.opponent === matchPerformance.opponent &&
                 p.location === matchPerformance.location &&
                 p.scoreHome === matchPerformance.scoreHome &&
                 p.scoreAway === matchPerformance.scoreAway);
      });
      return { ...player, performances };
    });
    storage.savePlayers(updatedPlayers);
  },

  deletePlayer: (playerId: string) => {
    const players = storage.getPlayers().filter(p => p.id !== playerId);
    storage.savePlayers(players);
  },

  deleteMultiplePlayers: (playerIds: string[]) => {
    const players = storage.getPlayers().filter(p => !playerIds.includes(p.id));
    storage.savePlayers(players);
  },

  addMultiplePlayers: (newPlayers: Player[]) => {
    const players = storage.getPlayers();
    // A simple merge, could be improved with more complex logic
    const updatedPlayers = [...players, ...newPlayers];
    storage.savePlayers(updatedPlayers);
  },

  // Unavailability management
  addUnavailability: (playerId: string, unavailability: Unavailability) => {
    const players = storage.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
      player.unavailabilities.push(unavailability);
      storage.recalculateAttendanceRates(player, players); // Pass allPlayers
      storage.savePlayers(players);
    }
  },

  updateUnavailability: (playerId: string, unavailability: Unavailability) => {
    const players = storage.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
      const index = player.unavailabilities.findIndex(u => u.id === unavailability.id);
      if (index !== -1) {
        player.unavailabilities[index] = unavailability;
        storage.recalculateAttendanceRates(player, players); // Pass allPlayers
        storage.savePlayers(players);
      }
    }
  },

  deleteUnavailability: (playerId: string, unavailabilityId: string) => {
    const players = storage.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
      player.unavailabilities = player.unavailabilities.filter(u => u.id !== unavailabilityId);
      storage.recalculateAttendanceRates(player, players); // Pass allPlayers
      storage.savePlayers(players);
    }
  },

  // Check if a date falls within any unavailability period
  isDateInUnavailabilityPeriod: (player: Player, date: string): boolean => {
    const checkDate = new Date(date);
    return player.unavailabilities.some(unavailability => {
      const startDate = new Date(unavailability.startDate);
      const endDate = unavailability.endDate ? new Date(unavailability.endDate) : new Date();
      return checkDate >= startDate && checkDate <= endDate;
    });
  },

  // Get all unique team events (trainings or matches)
  getTotalTeamEvents: (
    allPlayers: Player[],
    type: 'training' | 'match',
    teamName?: Team,
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
  },

  // Recalculate attendance rates excluding unavailability periods
  recalculateAttendanceRates: (player: Player, allPlayers: Player[]) => {
    const playerTrainingPerformances = player.performances.filter(p => p.type === 'training');
    const playerMatchPerformances = player.performances.filter(p => p.type === 'match');
    
    // Filter out player's performances during their unavailability periods
    const validPlayerTrainingPerformances = playerTrainingPerformances.filter(p =>
      !storage.isDateInUnavailabilityPeriod(player, p.date)
    );
    const validPlayerMatchPerformances = playerMatchPerformances.filter(p =>
      !storage.isDateInUnavailabilityPeriod(player, p.date)
    );

    const playerPresentTrainings = validPlayerTrainingPerformances.filter(p => p.present).length;
    const playerPresentMatches = validPlayerMatchPerformances.filter(p => p.present).length;

    // Calculate total number of trainings for the specific team(s) of the player
    const uniqueTrainingEventsForPlayer = new Set<string>();
    player.teams.forEach(team => {
      const teamTrainingEvents = storage.getTotalTeamEvents(allPlayers, 'training', team);
      teamTrainingEvents.forEach(event => {
        uniqueTrainingEventsForPlayer.add(`${event.date}`);
      });
    });
    const totalTrainingsForPlayerTeams = uniqueTrainingEventsForPlayer.size;

    player.trainingAttendanceRate = totalTrainingsForPlayerTeams > 0
      ? (playerPresentTrainings / totalTrainingsForPlayerTeams) * 100
      : 0;
    
    // Calculate total number of matches for the specific team(s) of the player
    let totalMatchesForPlayerTeams = 0;
    const uniqueMatchEventsForPlayer = new Set<string>();

    player.teams.forEach(team => {
      const teamMatchEvents = storage.getTotalTeamEvents(allPlayers, 'match', team);
      teamMatchEvents.forEach(event => {
        uniqueMatchEventsForPlayer.add(`${event.date}-${event.opponent || 'unknown'}`);
      });
    });
    totalMatchesForPlayerTeams = uniqueMatchEventsForPlayer.size;

    player.matchAttendanceRate = totalMatchesForPlayerTeams > 0
      ? (playerPresentMatches / totalMatchesForPlayerTeams) * 100
      : 0;
  },

  // Performance tracking
  addPerformance: (playerId: string, performanceData: Omit<Performance, 'id' | 'excused' | 'season'>) => {
    const players = storage.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
      const season = getSeasonFromDate(new Date(performanceData.date));
      const performance: Performance = {
        ...performanceData,
        id: `${Date.now().toString()}-${playerId}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
        excused: storage.isDateInUnavailabilityPeriod(player, performanceData.date),
        season: season,
      };
      
      // Ensure performances array exists
      if (!player.performances) {
        player.performances = [];
      }
      player.performances.push(performance);
      
      // Update global player statistics (these are all-time, not season-specific at this storage level)
      if (performance.present) {
        if (performance.type === 'match') {
          player.totalMatches = (player.totalMatches || 0) + 1;
          player.totalMinutes = (player.totalMinutes || 0) + (performance.minutesPlayed || 0);
          player.goals = (player.goals || 0) + (performance.goals || 0);
          player.assists = (player.assists || 0) + (performance.assists || 0);
          player.yellowCards = (player.yellowCards || 0) + (performance.yellowCards || 0);
          player.redCards = (player.redCards || 0) + (performance.redCards || 0);
          if (performance.cleanSheet && player.position === 'Gardien') {
            player.cleanSheets = (player.cleanSheets || 0) + 1;
          }
        } else if (performance.type === 'training') {
          player.totalTrainings = (player.totalTrainings || 0) + 1;
        }
      }
      
      // Recalculate attendance rates for the affected player
      // This requires all players to calculate team totals correctly.
      storage.recalculateAttendanceRates(player, players);
      storage.savePlayers(players);
    }
  },

  // Generate sample data
  initializeSampleData: () => {
    if (storage.getPlayers().length === 0) {
      const samplePlayers: Player[] = [
        {
          id: '1',
          firstName: 'Antoine',
          lastName: 'Dubois',
          dateOfBirth: '1995-03-15',
          licenseNumber: 'LIC001',
          teams: ['Senior 1'],
          position: 'Gardien',
          totalMatches: 12,
          totalMinutes: 1080,
          totalTrainings: 18,
          goals: 0,
          assists: 2,
          cleanSheets: 8,
          yellowCards: 1,
          redCards: 0,
          trainingAttendanceRate: 85,
          matchAttendanceRate: 92,
          licenseValid: true,
          paymentValid: true,
          absences: [],
          injuries: [],
          unavailabilities: [],
          performances: []
        },
        {
          id: '2',
          firstName: 'Lucas',
          lastName: 'Martin',
          dateOfBirth: '1998-07-22',
          licenseNumber: 'LIC002',
          teams: ['Senior 1', 'Senior 2'],
          position: 'Attaquant',
          totalMatches: 15,
          totalMinutes: 1200,
          totalTrainings: 20,
          goals: 8,
          assists: 3,
          cleanSheets: 0,
          yellowCards: 2,
          redCards: 0,
          trainingAttendanceRate: 78,
          matchAttendanceRate: 88,
          licenseValid: true,
          paymentValid: false,
          absences: [],
          injuries: [],
          unavailabilities: [],
          performances: []
        },
        {
          id: '3',
          firstName: 'Marie',
          lastName: 'Leroy',
          dateOfBirth: '1997-11-08',
          licenseNumber: 'LIC003',
          teams: ['Senior 2'],
          position: 'Milieu',
          totalMatches: 10,
          totalMinutes: 850,
          totalTrainings: 16,
          goals: 2,
          assists: 5,
          cleanSheets: 0,
          yellowCards: 0,
          redCards: 0,
          trainingAttendanceRate: 92,
          matchAttendanceRate: 85,
          licenseValid: true,
          paymentValid: true,
          absences: [],
          injuries: [],
          unavailabilities: [],
          performances: []
        },
        {
          id: '4',
          firstName: 'Thomas',
          lastName: 'Rousseau',
          dateOfBirth: '1996-09-12',
          licenseNumber: 'LIC004',
          teams: ['Senior 1'],
          position: 'Défenseur',
          totalMatches: 14,
          totalMinutes: 1260,
          totalTrainings: 22,
          goals: 1,
          assists: 4,
          cleanSheets: 0,
          yellowCards: 3,
          redCards: 1,
          trainingAttendanceRate: 88,
          matchAttendanceRate: 90,
          licenseValid: true,
          paymentValid: true,
          absences: [],
          injuries: [],
          unavailabilities: [
            {
              id: 'unav1',
              startDate: '2024-01-15',
              endDate: '2024-02-15',
              reason: 'Blessure au genou',
              type: 'injury',
              description: 'Entorse du genou droit suite à un tacle'
            }
          ],
          performances: []
        }
      ];
      storage.savePlayers(samplePlayers);
    }
  }
};