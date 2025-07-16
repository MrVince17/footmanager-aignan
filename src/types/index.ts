export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  licenseNumber: string;
  teams: ('Seniors 1' | 'Seniors 2')[];
  position: 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant';
  licenseValid: boolean;
  paymentValid: boolean;
  unavailabilities: Unavailability[];
  performances: Performance[];
  club_id: string;
}

export interface Absence {
  id: string;
  date: string;
  type: 'training' | 'match';
  reason: string;
  excused: boolean;
  player_id: string;
  club_id: string;
}

export interface Injury {
  id: string;
  startDate: string;
  endDate?: string;
  description: string;
  severity: 'Légère' | 'Modérée' | 'Grave';
  player_id: string;
  club_id: string;
}

export interface Unavailability {
  id: string;
  startDate: string;
  endDate?: string;
  reason: string;
  type: 'injury' | 'personal' | 'other';
  description: string;
  player_id: string;
  club_id: string;
}

export interface Performance {
  id: string;
  date: string;
  type: 'training' | 'match';
  present: boolean;
  season: string;
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
  matchType?: 'D2' | 'R2' | 'CdF' | 'CO' | 'CG' | 'ChD' | 'CR' | 'CS';
  player_id: string;
  club_id: string;
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
  originalPerformanceRef: Performance;
  matchType?: 'D2' | 'R2' | 'CdF' | 'CO' | 'CG' | 'ChD' | 'CR' | 'CS';
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