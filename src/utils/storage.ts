import { Player, Performance, Absence, Injury, Unavailability } from '../types';

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
    return data ? JSON.parse(data) : [];
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

  deletePlayer: (playerId: string) => {
    const players = storage.getPlayers().filter(p => p.id !== playerId);
    storage.savePlayers(players);
  },

  // Unavailability management
  addUnavailability: (playerId: string, unavailability: Unavailability) => {
    const players = storage.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
      player.unavailabilities.push(unavailability);
      storage.recalculateAttendanceRates(player);
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
        storage.recalculateAttendanceRates(player);
        storage.savePlayers(players);
      }
    }
  },

  deleteUnavailability: (playerId: string, unavailabilityId: string) => {
    const players = storage.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
      player.unavailabilities = player.unavailabilities.filter(u => u.id !== unavailabilityId);
      storage.recalculateAttendanceRates(player);
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

  // Recalculate attendance rates excluding unavailability periods
  recalculateAttendanceRates: (player: Player) => {
    const trainingPerformances = player.performances.filter(p => p.type === 'training');
    const matchPerformances = player.performances.filter(p => p.type === 'match');
    
    // Filter out performances during unavailability periods
    const validTrainingPerformances = trainingPerformances.filter(p => 
      !storage.isDateInUnavailabilityPeriod(player, p.date)
    );
    const validMatchPerformances = matchPerformances.filter(p => 
      !storage.isDateInUnavailabilityPeriod(player, p.date)
    );
    
    player.trainingAttendanceRate = validTrainingPerformances.length > 0 
      ? (validTrainingPerformances.filter(p => p.present).length / validTrainingPerformances.length) * 100 
      : 0;
    
    player.matchAttendanceRate = validMatchPerformances.length > 0 
      ? (validMatchPerformances.filter(p => p.present).length / validMatchPerformances.length) * 100 
      : 0;
  },

  // Performance tracking
  addPerformance: (playerId: string, performance: Performance) => {
    const players = storage.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
      // Check if this performance is during an unavailability period
      performance.excused = storage.isDateInUnavailabilityPeriod(player, performance.date);
      
      player.performances.push(performance);
      
      // Update statistics
      if (performance.present) {
        if (performance.type === 'match') {
          player.totalMatches++;
          player.totalMinutes += performance.minutesPlayed || 0;
          player.goals += performance.goals || 0;
          player.assists += performance.assists || 0;
          player.yellowCards += performance.yellowCards || 0;
          player.redCards += performance.redCards || 0;
          if (performance.cleanSheet && player.position === 'Gardien') {
            player.cleanSheets++;
          }
        } else if (performance.type === 'training') {
          player.totalTrainings++;
        }
      }
      
      // Recalculate attendance rates
      storage.recalculateAttendanceRates(player);
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
          teams: ['Seniors 1'],
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
          teams: ['Seniors 1', 'Seniors 2'],
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
          teams: ['Seniors 2'],
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
          teams: ['Seniors 1'],
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