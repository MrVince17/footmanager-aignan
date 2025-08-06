export type Team = 'Senior' | 'U20' | 'U19' | 'U18' | 'U17' | 'U6-U11' | 'Arbitre' | 'Dirigeant/Dirigeante';

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  licenseNumber: string;
  teams: Team[];
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
  licenseValidationDate?: string;
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
  scorers?: Scorer[];
  assisters?: Assister[];
  yellowCardsDetails?: CardDetail[];
  redCardsDetails?: CardDetail[];
  goalsConcededDetails?: GoalConcededDetail[];
  excused?: boolean;
  matchType?: 'D2' | 'R2' | 'CdF' | 'CO' | 'CG' | 'ChD' | 'CR' | 'CS' | 'Match Amical';
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
}

export interface GoalConcededDetail {
  minute: number;
}

export interface TeamStats {
  totalPlayers: number;
  seniorsCount: number;
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
  originalPerformanceRef: Performance;
  matchType?: 'D2' | 'R2' | 'CdF' | 'CO' | 'CG' | 'ChD' | 'CR' | 'CS' | 'Match Amical';
}

export interface MatchDetails {
  id: string;
  date: string;
  jourSemaine: string;
  domicile: boolean;
  adversaire: string;
  scoreEquipe: number;
  scoreAdverse: number;
  saison: string;
  buteurs: { nom: string; minute: number }[];
  passeurs: { nom: string }[];
  gardien: { nom: string; cleanSheet: boolean };
  cartonsJaunes: { nom: string; minute: number }[];
  cartonsRouges: { nom: string; minute: number }[];
  prochainMatch?: string;
}