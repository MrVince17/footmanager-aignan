import React, { useState, useMemo } from 'react';
import { Player, Performance } from '../types'; // Added Performance
import { BarChart3, TrendingUp, Download, Filter, Trophy, Target, Clock, Users, Activity } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/export';
import { storage } from '../utils/storage'; // For getTotalTeamEvents

// Re-using types and helpers from Dashboard (consider moving to a shared utils file)
interface PlayerSeasonStats {
  totalMatches: number;
  totalMinutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  presentTrainings: number;
  presentMatches: number;
  // Specific for Statistics table
  trainingAttendanceRateSeason: number;
  matchAttendanceRateSeason: number;
}

const getAvailableSeasons = (players: Player[]): string[] => {
  const seasons = new Set<string>();
  players.forEach(p => {
    (p.performances || []).forEach(perf => seasons.add(perf.season));
  });
  if (seasons.size === 0) return [new Date().getFullYear() + "-" + (new Date().getFullYear() + 1)];
  return Array.from(seasons).sort((a, b) => b.localeCompare(a));
};

const getPlayerStatsForSeason = (player: Player, season: string, allPlayersForContext: Player[]): PlayerSeasonStats => {
  const seasonPerformances = (player.performances || []).filter(p => p.season === season);

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

  const allTeamTrainingsForSeason = storage.getTotalTeamEvents(allPlayersForContext, 'training', undefined, season).length;
  let allTeamMatchesForPlayerForSeason = 0;
  const uniqueMatchEventsForPlayerSeason = new Set<string>();
  player.teams.forEach(team => {
    const teamMatchEvents = storage.getTotalTeamEvents(allPlayersForContext, 'match', team, season);
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


interface StatisticsProps {
  players: Player[];
  allPlayers: Player[];
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
}

export const Statistics: React.FC<StatisticsProps> = ({ players, selectedSeason, onSeasonChange, allPlayers }) => {
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('goals'); // Default sort by season goals

  const availableSeasons = useMemo(() => getAvailableSeasons(allPlayers), [allPlayers]);

  const playersWithSeasonStats = useMemo(() => {
    return players.map(p => ({
      ...p,
      seasonStats: getPlayerStatsForSeason(p, selectedSeason, allPlayers),
    }));
  }, [players, selectedSeason, allPlayers]);

  const filteredPlayersByTeam = playersWithSeasonStats.filter(player =>
    filterTeam === 'all' || player.teams.includes(filterTeam as any)
  );

  const sortedPlayers = [...filteredPlayersByTeam].sort((a, b) => {
    // Sort using seasonStats
    switch (sortBy) {
      case 'goals': return b.seasonStats.goals - a.seasonStats.goals;
      case 'assists': return b.seasonStats.assists - a.seasonStats.assists;
      case 'matches': return b.seasonStats.totalMatches - a.seasonStats.totalMatches;
      // 'trainings' needs presentTrainings from seasonStats
      case 'trainings': return b.seasonStats.presentTrainings - a.seasonStats.presentTrainings;
      case 'minutes': return b.seasonStats.totalMinutes - a.seasonStats.totalMinutes;
      case 'matchAttendance': return b.seasonStats.matchAttendanceRateSeason - a.seasonStats.matchAttendanceRateSeason;
      case 'trainingAttendance': return b.seasonStats.trainingAttendanceRateSeason - a.seasonStats.trainingAttendanceRateSeason;
      case 'cards': return (b.seasonStats.yellowCards + b.seasonStats.redCards * 2) - (a.seasonStats.yellowCards + a.seasonStats.redCards * 2);
      default: return 0;
    }
  });

  const teamStats = useMemo(() => {
    const currentTeamPlayers = filteredPlayersByTeam; // Already filtered by team, now use their season stats
    const totalPlayers = currentTeamPlayers.length;

    const totalGoals = currentTeamPlayers.reduce((sum, p) => sum + p.seasonStats.goals, 0);
    const totalAssists = currentTeamPlayers.reduce((sum, p) => sum + p.seasonStats.assists, 0);

    // Total matches and trainings for the selected team(s) and season
    let uniqueTeamMatchesForSeason = 0;
    let uniqueTeamTrainingsForSeason = 0;

    if (filterTeam === 'all') {
      uniqueTeamMatchesForSeason = storage.getTotalTeamEvents(allPlayers, 'match', undefined, selectedSeason).length;
      uniqueTeamTrainingsForSeason = storage.getTotalTeamEvents(allPlayers, 'training', undefined, selectedSeason).length;
    } else {
      uniqueTeamMatchesForSeason = storage.getTotalTeamEvents(allPlayers, 'match', filterTeam as 'Seniors 1' | 'Seniors 2', selectedSeason).length;
      uniqueTeamTrainingsForSeason = storage.getTotalTeamEvents(allPlayers, 'training', filterTeam as 'Seniors 1' | 'Seniors 2', selectedSeason).length; // Assuming trainings can be team specific for stats display
    }

    const totalMinutes = currentTeamPlayers.reduce((sum, p) => sum + p.seasonStats.totalMinutes, 0);

    const averageMatchAttendance = totalPlayers > 0
      ? currentTeamPlayers.reduce((sum, p) => sum + p.seasonStats.matchAttendanceRateSeason, 0) / totalPlayers
      : 0;
    const averageTrainingAttendance = totalPlayers > 0
      ? currentTeamPlayers.reduce((sum, p) => sum + p.seasonStats.trainingAttendanceRateSeason, 0) / totalPlayers
      : 0;

    const totalYellowCards = currentTeamPlayers.reduce((sum, p) => sum + p.seasonStats.yellowCards, 0);
    const totalRedCards = currentTeamPlayers.reduce((sum, p) => sum + p.seasonStats.redCards, 0);

    return {
      totalPlayers,
      totalGoals,
      totalAssists,
      totalMatches: uniqueTeamMatchesForSeason,
      totalTrainings: uniqueTeamTrainingsForSeason,
      totalMinutes,
      averageMatchAttendance,
      averageTrainingAttendance,
      totalYellowCards,
      totalRedCards,
    };
  }, [filteredPlayersByTeam, selectedSeason, filterTeam, allPlayers]);

  const positionStats = useMemo(() => {
    // Position stats should also be based on the filtered players for the season
    const currentTeamPlayers = filteredPlayersByTeam;
    return {
      'Gardien': currentTeamPlayers.filter(p => p.position === 'Gardien').length,
      'Défenseur': currentTeamPlayers.filter(p => p.position === 'Défenseur').length,
      'Milieu': currentTeamPlayers.filter(p => p.position === 'Milieu').length,
      'Attaquant': currentTeamPlayers.filter(p => p.position === 'Attaquant').length,
    };
  }, [filteredPlayersByTeam]);


  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; subtitle?: string }> = 
    ({ title, value, icon, color, subtitle }) => (
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow duration-300" style={{ borderLeftColor: color }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
            <div style={{ color }}>{icon}</div>
          </div>
        </div>
      </div>
    );

  return (
    <div id="statistics-content" className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-black rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">US AIGNAN</h1>
            <h2 className="text-2xl font-semibold mb-2">Statistiques</h2>
            <p className="text-red-100">Analysez les performances de votre équipe</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => exportToPDF('statistics-content', 'statistiques_US_Aignan.pdf')}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Download size={20} />
              <span>PDF</span>
            </button>
            <button
              onClick={() => exportToExcel(filteredPlayers)}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Download size={20} />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtres :</span>
          </div>
          
          <div>
            <label htmlFor="season-select-stats" className="sr-only">Saison</label>
            <select
              id="season-select-stats"
              value={selectedSeason}
              onChange={(e) => onSeasonChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {availableSeasons.map(season => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="team-filter-stats" className="sr-only">Équipe</label>
            <select
              id="team-filter-stats"
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">Toutes les équipes</option>
              <option value="Seniors 1">Seniors 1</option>
              <option value="Seniors 2">Seniors 2</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sortby-stats" className="sr-only">Trier par</label>
            <select
              id="sortby-stats"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="goals">Trier par buts</option>
              <option value="assists">Trier par passes</option>
            <option value="matches">Trier par matchs</option>
            <option value="trainings">Trier par entraînements</option>
            <option value="minutes">Trier par minutes</option>
            <option value="matchAttendance">Trier par assiduité matchs</option>
            <option value="trainingAttendance">Trier par assiduité entraînements</option>
            <option value="cards">Trier par cartons</option>
          </select>
        </div>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Buts"
          value={teamStats.totalGoals}
          icon={<Target size={24} />}
          color="#DC2626"
        />
        <StatCard
          title="Total Passes"
          value={teamStats.totalAssists}
          icon={<Users size={24} />}
          color="#000000"
        />
        <StatCard
          title="Total Matchs"
          value={teamStats.totalMatches}
          icon={<Trophy size={24} />}
          color="#DC2626"
        />
        <StatCard
          title="Total Entraînements"
          value={teamStats.totalTrainings}
          icon={<Activity size={24} />}
          color="#000000"
        />
      </div>

      {/* Attendance Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Présence Matchs"
          value={`${teamStats.averageMatchAttendance.toFixed(1)}%`}
          icon={<Trophy size={24} />}
          color="#DC2626"
          subtitle="Moyenne d'équipe"
        />
        <StatCard
          title="Présence Entraînements"
          value={`${teamStats.averageTrainingAttendance.toFixed(1)}%`}
          icon={<Activity size={24} />}
          color="#000000"
          subtitle="Moyenne d'équipe"
        />
      </div>

      {/* Position Distribution and Team Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Position</h3>
          <div className="space-y-4">
            {Object.entries(positionStats).map(([position, count]) => (
              <div key={position} className="flex items-center justify-between">
                <span className="text-gray-600">{position}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${teamStats.totalPlayers > 0 ? (count / teamStats.totalPlayers) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques d'Équipe</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Minutes jouées</span>
              <span className="font-semibold">{teamStats.totalMinutes.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Cartons jaunes</span>
              <span className="font-semibold text-yellow-600">{teamStats.totalYellowCards}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Cartons rouges</span>
              <span className="font-semibold text-red-600">{teamStats.totalRedCards}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Ratio buts/passes</span>
              <span className="font-semibold">
                {teamStats.totalAssists > 0 ? (teamStats.totalGoals / teamStats.totalAssists).toFixed(2) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Player Rankings */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Classement des Joueurs</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rang</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Joueur</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Position</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Équipe(s)</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Matchs</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Entraînements</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Minutes</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Buts</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Passes</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">CJ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">CR</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Assiduité M</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Assiduité E</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedPlayers.map((player, index) => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index < 3 ? (index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400') : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{player.firstName} {player.lastName}</p>
                      <p className="text-sm text-gray-600">#{player.licenseNumber}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      player.position === 'Gardien' ? 'bg-yellow-100 text-yellow-800' :
                      player.position === 'Défenseur' ? 'bg-blue-100 text-blue-800' :
                      player.position === 'Milieu' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {player.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {player.teams.join(', ')}
                  </td>
                  {/* Display season-specific stats */}
                  <td className="px-4 py-3 font-medium">{player.seasonStats.totalMatches}</td>
                  <td className="px-4 py-3 font-medium">{player.seasonStats.presentTrainings}</td>
                  <td className="px-4 py-3 font-medium">{player.seasonStats.totalMinutes}</td>
                  <td className="px-4 py-3 font-medium text-red-600">{player.seasonStats.goals}</td>
                  <td className="px-4 py-3 font-medium text-black">{player.seasonStats.assists}</td>
                  <td className="px-4 py-3 font-medium text-yellow-600">{player.seasonStats.yellowCards}</td>
                  <td className="px-4 py-3 font-medium text-red-700">{player.seasonStats.redCards}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-red-600 h-1 rounded-full"
                          style={{ width: `${player.seasonStats.matchAttendanceRateSeason}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{player.seasonStats.matchAttendanceRateSeason.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-black h-1 rounded-full"
                          style={{ width: `${player.seasonStats.trainingAttendanceRateSeason}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{player.seasonStats.trainingAttendanceRateSeason.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedPlayers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Aucune donnée disponible pour les filtres sélectionnés</p>
          </div>
        )}
      </div>
    </div>
  );
};