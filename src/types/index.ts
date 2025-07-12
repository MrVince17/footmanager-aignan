export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  licenseNumber: string;
  teams: ('Seniors 1' | 'Seniors 2')[];
  position: 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant';
  
  // Statistics
  totalMatches: number;
  totalMinutes: number;
  totalTrainings: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  trainingAttendanceRate: number;
  matchAttendanceRate: number;
  
  // Administrative
  licenseValid: boolean;
  paymentValid: boolean;
  
  // History
  absences: Absence[];
  injuries: Injury[];
  unavailabilities: Unavailability[];
  performances: Performance[];
}

export interface Absence {
  id: string;
  date: string;
  type: 'training' | 'match';
  reason: string;
  excused: boolean; // Si l'absence est justifiée par une indisponibilité
}

export interface Injury {
  id: string;
  startDate: string;
  endDate?: string;
  description: string;
  severity: 'Légère' | 'Modérée' | 'Grave';
}

export interface Unavailability {
  id: string;
  startDate: string;
  endDate?: string;
  reason: string;
  type: 'injury' | 'personal' | 'other';
  description: string;
}

export interface Performance {
  id: string;
  date: string;
  type: 'training' | 'match';
  present: boolean;
  season: string; // e.g., "2024-2025"
  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  cleanSheet?: boolean;
  opponent?: string;
  scoreHome?: number;
  scoreAway?: number;
  location?: 'home' | 'away';
  // Detailed match events - might be duplicated across all player performances for a single match
  scorers?: Scorer[];
  assisters?: Assister[];
  yellowCardsDetails?: CardDetail[];
  redCardsDetails?: CardDetail[];
  goalsConcededDetails?: GoalConcededDetail[];
  excused?: boolean; // Si l'absence est couverte par une indisponibilité
}

export interface Scorer {
  playerId: string;
  minute: number;
}

export interface Assister {
  playerId: string;
}

export interface CardDetail {
  playerId: string;
  minute: number;
  cardType?: 'Jaune' | 'Rouge'; // Optional, can be inferred from the list it's in
}

export interface GoalConcededDetail {
  minute: number;
  playerId?: string; // Optional: to specify which keeper if multiple can play
}

export interface TeamStats {
  totalPlayers: number;
  seniors1Count: number;
  seniors2Count: number;
  averageAge: number;
  totalGoals: number;
  totalMatches: number;
  totalTrainings: number;
  averageMatchAttendance: number;
  averageTrainingAttendance: number;
}

export interface MatchDisplayData {
  id: string;
  date: string;
  opponent?: string;
  scoreHome?: number;
  scoreAway?: number;
  location?: 'home' | 'away';
  scorers?: Scorer[];
  assisters?: Assister[];
  yellowCardsDetails?: CardDetail[];
  redCardsDetails?: CardDetail[];
  goalsConcededDetails?: GoalConcededDetail[];
  originalPerformanceRef: Performance; // Référence à une des performances du match pour accès facile
}