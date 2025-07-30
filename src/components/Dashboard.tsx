import React, { useMemo } from "react";
import { Player, TeamStats } from "../types";
import {
  Users,
  Trophy,
  Target,
  Calendar,
  AlertCircle,
  CheckCircle,
  Activity,
  Download,
  Filter,
} from "lucide-react";
import { exportToPDF } from "../utils/export";
import { storage } from "../utils/storage"; // For getTotalTeamEvents

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
}

interface DashboardProps {
  players: Player[]; // All players, potentially for non-season specific data like admin issues
  allPlayers: Player[]; // Required for calculating total team events for attendance rates
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
}

// Helper function to get all unique seasons from player performances
const getAvailableSeasons = (players: Player[]): string[] => {
  const seasons = new Set<string>();
  players.forEach((p) => {
    (p.performances || []).forEach((perf) => seasons.add(perf.season));
  });
  if (seasons.size === 0)
    return [new Date().getFullYear() + "-" + (new Date().getFullYear() + 1)]; // Default if no seasons
  return Array.from(seasons).sort((a, b) => b.localeCompare(a)); // Sort descending
};

// Helper function to calculate individual player stats for a given season
const getPlayerStatsForSeason = (
  player: Player,
  season: string
): PlayerSeasonStats => {
  const seasonPerformances = (player.performances || []).filter(
    (p) => p.season === season
  );

  let stats: PlayerSeasonStats = {
    totalMatches: 0,
    totalMinutes: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    cleanSheets: 0,
    presentTrainings: 0,
    presentMatches: 0,
  };

  seasonPerformances.forEach((p) => {
    if (p.present) {
      if (p.type === "match") {
        stats.totalMatches++;
        stats.presentMatches++;
        stats.totalMinutes += p.minutesPlayed || 0;
        stats.goals += p.goals || 0;
        stats.assists += p.assists || 0;
        stats.yellowCards += p.yellowCards || 0;
        stats.redCards += p.redCards || 0;
        if (p.cleanSheet && player.position === "Gardien") {
          stats.cleanSheets++;
        }
      } else if (p.type === "training") {
        stats.presentTrainings++;
      }
    }
  });
  return stats;
};

export const Dashboard: React.FC<DashboardProps> = ({
  players,
  selectedSeason,
  onSeasonChange,
  allPlayers,
}) => {
  const [filterTeam, setFilterTeam] = React.useState<string>('all');
  const validatePlayerData = (players: any[]) => {
    return players.map(player => ({
      ...player,
      teams: player.teams && Array.isArray(player.teams) ? player.teams : []
    }));
  };

  console.log("Dashboard props - players:", players);
  console.log("Dashboard props - selectedSeason:", selectedSeason);
  console.log("Dashboard props - allPlayers:", allPlayers);

  const availableSeasons = useMemo(
    () => getAvailableSeasons(allPlayers),
    [allPlayers]
  );
  console.log("Dashboard availableSeasons:", availableSeasons);

  const playersWithSeasonStats = useMemo(() => {
    return players
      .filter(p => filterTeam === 'all' || p.teams.includes(filterTeam))
      .map((p) => {
        const seasonStats = getPlayerStatsForSeason(p, selectedSeason);
        // Calculate season-specific attendance rates
        const allTeamTrainingsForSeason = storage.getTotalTeamEvents(
          allPlayers,
          "training",
          undefined,
          selectedSeason
        ).length;

        let allTeamMatchesForPlayerForSeason = 0;
        const uniqueMatchEventsForPlayerSeason = new Set<string>();
        p.teams.forEach((team) => {
          const teamMatchEvents = storage.getTotalTeamEvents(
            allPlayers,
            "match",
          team as any,
            selectedSeason
          );
          teamMatchEvents.forEach((event) =>
            uniqueMatchEventsForPlayerSeason.add(
              `${event.date}-${event.opponent || "unknown"}`
            )
          );
        });
        allTeamMatchesForPlayerForSeason = uniqueMatchEventsForPlayerSeason.size;

        // Calculate season-specific attendance rates
        const trainingAttendanceRate =
          allTeamTrainingsForSeason > 0
            ? (seasonStats.presentTrainings / allTeamTrainingsForSeason) * 100
            : p.trainingAttendanceRate; // Fallback or 0
        const matchAttendanceRate =
          allTeamMatchesForPlayerForSeason > 0
            ? (seasonStats.presentMatches / allTeamMatchesForPlayerForSeason) *
              100
            : p.matchAttendanceRate; // Fallback or 0

        return {
          ...p,
          seasonStats,
          trainingAttendanceRateSeason: trainingAttendanceRate,
          matchAttendanceRateSeason: matchAttendanceRate,
        };
      });
  }, [players, selectedSeason, allPlayers, filterTeam]);

  const calculateTeamStats = (): TeamStats => {
    const totalPlayers = playersWithSeasonStats.length; // Should this be filtered by players active in the season?
    const seniors1Count = playersWithSeasonStats.filter((p) =>
      p.teams.includes("Seniors 1" as any)
    ).length;
    const seniors2Count = playersWithSeasonStats.filter((p) =>
      p.teams.includes("Seniors 2" as any)
    ).length;

    const totalAge = playersWithSeasonStats.reduce((sum, player) => {
      const age =
        new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear();
      return sum + age;
    }, 0);
    const averageAge = totalPlayers > 0 ? totalAge / totalPlayers : 0;

    const totalGoals = playersWithSeasonStats.reduce(
      (sum, player) => sum + player.seasonStats.goals,
      0
    );
    // For totalMatches and totalTrainings, we should count unique team events for the season.
    const teamToFilter = filterTeam === 'all' ? undefined : filterTeam as any;
    const uniqueTeamMatchesForSeason = storage.getTotalTeamEvents(
      allPlayers,
      "match",
      teamToFilter,
      selectedSeason
    ).length;
    const uniqueTeamTrainingsForSeason = storage.getTotalTeamEvents(
      allPlayers,
      "training",
      teamToFilter,
      selectedSeason
    ).length;

    const averageMatchAttendance =
      totalPlayers > 0
        ? playersWithSeasonStats.reduce(
            (sum, player) => sum + player.matchAttendanceRateSeason,
            0
          ) / totalPlayers
        : 0;

    const averageTrainingAttendance =
      totalPlayers > 0
        ? playersWithSeasonStats.reduce(
            (sum, player) => sum + player.trainingAttendanceRateSeason,
            0
          ) / totalPlayers
        : 0;

    return {
      totalPlayers,
      seniors1Count,
      seniors2Count,
      averageAge,
      totalGoals,
      totalMatches: uniqueTeamMatchesForSeason,
      totalTrainings: uniqueTeamTrainingsForSeason,
      averageMatchAttendance,
      averageTrainingAttendance,
    };
  };

  const stats = useMemo(
    () => calculateTeamStats(),
    [playersWithSeasonStats, selectedSeason, allPlayers, filterTeam]
  );

  // Admin issues are global, not season-specific
  const adminIssues = allPlayers.filter((p) => (!p.licenseValid || !p.paymentValid) && (filterTeam === 'all' || p.teams.includes(filterTeam as any)));

  const teamDistribution = useMemo(() => {
    const distribution: { [key: string]: number } = {};
    const filteredPlayers = playersWithSeasonStats.filter(p => filterTeam === 'all' || p.teams.includes(filterTeam as any));
    filteredPlayers.forEach(player => {
      player.teams.forEach(team => {
        let teamName = team;
        if (team === 'Dirigeant' || team === 'Dirigeant/Dirigeante' || team === 'Dirigeant / Dirigeante') {
          teamName = 'Dirigeant/Dirigeante';
        }
        distribution[teamName] = (distribution[teamName] || 0) + 1;
      });
    });
    return distribution;
  }, [playersWithSeasonStats, filterTeam]);

  const topScorers = [...playersWithSeasonStats]
    .sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)
    .slice(0, 3);
  const bestMatchAttendance = [...playersWithSeasonStats]
    .sort((a, b) => b.matchAttendanceRateSeason - a.matchAttendanceRateSeason)
    .slice(0, 3);
  const bestTrainingAttendance = [...playersWithSeasonStats]
    .sort(
      (a, b) => b.trainingAttendanceRateSeason - a.trainingAttendanceRateSeason
    )
    .slice(0, 3);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div
      className="bg-white rounded-xl shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow duration-300"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div
          className="p-3 rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  );

  // TEST: Return simple JSX to check rendering
  // return (
  //   <div>
  //     <h1>Dashboard Test</h1>
  //     <p>Saison sélectionnée : {selectedSeason}</p>
  //     <p>Nombre de joueurs (players prop): {players.length}</p>
  //     <p>Nombre de joueurs (allPlayers prop): {allPlayers.length}</p>
  //   </div>
  // );

  if (!players || !allPlayers) {
    return <div>Chargement des données du dashboard...</div>;
  }

  console.log("Dashboard stats object:", stats);
  console.log("Dashboard adminIssues:", adminIssues);
  console.log("Dashboard topScorers:", topScorers);

  return (
    <div id="dashboard-content" className="space-y-8">
      <div className="bg-gradient-to-r from-red-600 to-black rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <button
            onClick={() =>
              exportToPDF("dashboard-content", "tableau_bord_US_Aignan.pdf")
            }
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Download size={20} />
            <span>Export PDF</span>
          </button>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">US AIGNAN</h1>
          <h2 className="text-2xl font-semibold mb-2">Tableau de Bord</h2>
          <p className="text-red-100">
            Vue d'ensemble de votre équipe de football
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-10">
          <Users size={120} />
        </div>
      </div>

      {/* Season and Team Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow flex items-center space-x-3">
        <Filter size={20} className="text-gray-600" />
        <div>
          <label
            htmlFor="season-select"
            className="text-sm font-medium text-gray-700"
          >
            Saison :
          </label>
          <select
            id="season-select"
            value={selectedSeason}
            onChange={(e) => onSeasonChange(e.target.value)}
            className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md shadow-sm"
          >
            {availableSeasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="team-filter-dashboard"
            className="text-sm font-medium text-gray-700"
          >
            Équipe :
          </label>
          <select
            id="team-filter-dashboard"
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md shadow-sm"
          >
            <option value="all">Toutes les équipes</option>
            {Object.keys(teamDistribution).map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Joueurs"
          value={stats.totalPlayers}
          icon={<Users size={24} />}
          color="#DC2626"
        />
        <StatCard
          title="Âge Moyen"
          value={`${stats.averageAge.toFixed(1)} ans`}
          icon={<Calendar size={24} />}
          color="#000000"
        />
        <StatCard
          title="Total Buts"
          value={stats.totalGoals}
          icon={<Target size={24} />}
          color="#DC2626"
        />
        <StatCard
          title="Présence Matchs"
          value={`${stats.averageMatchAttendance.toFixed(1)}%`}
          icon={<Trophy size={24} />}
          color="#000000"
        />
        <StatCard
          title="Présence Entraînements"
          value={`${stats.averageTrainingAttendance.toFixed(1)}%`}
          icon={<Activity size={24} />}
          color="#DC2626"
        />
      </div>

      {/* Team Distribution and Training Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition par Catégorie
          </h3>
          <div className="space-y-4">
            {Object.entries(teamDistribution)
              .sort(([teamA], [teamB]) => {
                const order = ['Seniors', 'U20', 'U19', 'U18', 'U17', 'U13-U17', 'U6-U11', 'Arbitre', 'Dirigeant/Dirigeante'];
                const indexA = order.indexOf(teamA);
                const indexB = order.indexOf(teamB);

                if (indexA === -1 && indexB === -1) return teamA.localeCompare(teamB);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;

                return indexA - indexB;
              })
              .map(([team, count]) => (
              <div key={team} className="flex items-center justify-between">
                <span className="text-gray-600">{team}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(count / stats.totalPlayers) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Statistiques d'Activité
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Trophy className="text-red-600" size={20} />
                <span className="text-gray-700">Total Matchs</span>
              </div>
              <span className="font-semibold text-gray-900">
                {stats.totalMatches}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Activity className="text-black" size={20} />
                <span className="text-gray-700">Total Entraînements</span>
              </div>
              <span className="font-semibold text-gray-900">
                {stats.totalTrainings}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Administrative Status */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Statut Administratif
        </h3>
        {adminIssues.length === 0 ? (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle size={20} />
            <span>Tous les dossiers sont à jour</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-red-600 mb-3">
              <AlertCircle size={20} />
              <span>
                {adminIssues.length} dossier(s) nécessite(nt) une attention
              </span>
            </div>
            {adminIssues.map((player) => (
              <div key={player.id} className="text-sm text-gray-600 pl-6">
                {player.firstName} {player.lastName} -
                {!player.licenseValid && " Licence"}
                {!player.licenseValid && !player.paymentValid && " et"}
                {!player.paymentValid && " Paiement"}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Meilleurs Buteurs
          </h3>
          <div className="space-y-3">
            {topScorers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                        ? "bg-gray-400"
                        : "bg-orange-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="font-medium">
                    {player.firstName} {player.lastName}
                  </span>
                </div>
                <span className="font-bold text-lg">{player.goals}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Meilleure Assiduité Matchs
          </h3>
          <div className="space-y-3">
            {bestMatchAttendance.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0
                        ? "bg-red-600"
                        : index === 1
                        ? "bg-black"
                        : "bg-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="font-medium">
                    {player.firstName} {player.lastName}
                  </span>
                </div>
                <span className="font-bold text-lg">
                  {player.matchAttendanceRate.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Meilleure Assiduité Entraînements
          </h3>
          <div className="space-y-3">
            {bestTrainingAttendance.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0
                        ? "bg-red-600"
                        : index === 1
                        ? "bg-black"
                        : "bg-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="font-medium">
                    {player.firstName} {player.lastName}
                  </span>
                </div>
                <span className="font-bold text-lg">
                  {player.trainingAttendanceRate.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
