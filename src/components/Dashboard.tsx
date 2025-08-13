import React, { useMemo } from "react";
import { Player, Team, TeamStats } from "../types";
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToPDF } from "../utils/export";
import { getTotalTeamEvents, getAge } from "../utils/playerUtils";
import { Header } from './Header';

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
      if (p.type === "match" && (p.minutesPlayed ?? 0) > 0) {
        stats.totalMatches++;
        stats.presentMatches++;
        stats.totalMinutes += p.minutesPlayed || 0;
        if (p.scorers) {
          stats.goals += p.scorers.filter(s => s.playerId === player.id).length;
        }
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
  const [filterTeam, setFilterTeam] = React.useState<Team | 'all'>('all');
  const [isPrinting, setIsPrinting] = React.useState(false);

  const handleExportClick = () => {
    setIsPrinting(true);
  };

  const handleExportAdminIssues = async () => {
    if (adminIssues.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    try {
      const doc = new jsPDF();
      const title = "Validation licence et paiement";

      // Load custom font
      const fontUrl = "/fonts/DejaVuSans.ttf";
      const fontResponse = await fetch(fontUrl);
      const font = await fontResponse.arrayBuffer();
      const fontName = "DejaVuSans";
      doc.addFileToVFS(`${fontName}.ttf`, new Uint8Array(font).reduce((data, byte) => data + String.fromCharCode(byte), ''));
      doc.addFont(`${fontName}.ttf`, fontName, "normal");

      doc.text(title, 14, 22);
      doc.text(`Saison : ${selectedSeason}`, 14, 29);

      const tableColumn = ["Nom", "Prénom", "Validation Licence", "Paiement"];
      const tableRows: string[][] = [];

      adminIssues.forEach(player => {
        const playerData = [
          player.lastName || '',
          player.firstName || '',
          player.licenseValid ? "Valide" : "Non valide",
          player.paymentValid ? "OK" : "En retard",
        ];
        tableRows.push(playerData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: "grid",
        headStyles: { fillColor: [220, 26, 38] },
        styles: {
          fontSize: 8,
          cellPadding: 1,
          font: "DejaVuSans",
        },
      });

      doc.save(`statut_administratif_${selectedSeason}.pdf`);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF :", error);
      alert(
        "Une erreur est survenue lors de la génération du PDF. Vérifiez la console pour plus de détails."
      );
    }
  };

  React.useEffect(() => {
    if (isPrinting) {
      exportToPDF(
        "dashboard-export-area",
        "tableau_bord_US_Aignan.pdf",
        'portrait',
        { margin: 5, tempClass: 'pdf-export-font-small' }
      ).then(() => {
          setIsPrinting(false);
        });
    }
  }, [isPrinting]);

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
      .filter(p => (p.performances || []).some(perf => perf.season === selectedSeason))
      .map((p) => {
        const seasonStats = getPlayerStatsForSeason(p, selectedSeason);
        // Calculate season-specific attendance rates
        // Calculate season-specific attendance rates
        const allTeamTrainingsForSeason = getTotalTeamEvents(
          allPlayers,
          "training",
          undefined,
          selectedSeason
        ).length;

        let allTeamMatchesForPlayerForSeason = 0;
        const uniqueMatchEventsForPlayerSeason = new Set<string>();
        p.teams.forEach((team) => {
          const teamMatchEvents = getTotalTeamEvents(
            allPlayers,
            "match",
          team,
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
            : 0; // Fallback to 0 if no trainings
        const matchAttendanceRate =
          allTeamMatchesForPlayerForSeason > 0
            ? (seasonStats.presentMatches / allTeamMatchesForPlayerForSeason) *
              100
            : 0; // Fallback to 0 if no matches

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
    const seniorsCount = playersWithSeasonStats.filter((p) =>
      p.teams.includes("Senior")
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
    const teamToFilter = filterTeam === 'all' ? undefined : filterTeam;
    const uniqueTeamMatchesForSeason = getTotalTeamEvents(
      allPlayers,
      "match",
      teamToFilter,
      selectedSeason
    ).length;
    const uniqueTeamTrainingsForSeason = getTotalTeamEvents(
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
      seniorsCount,
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
  const adminIssues = allPlayers
    .filter((p) => (!p.licenseValid || !p.paymentValid) && (filterTeam === 'all' || p.teams.includes(filterTeam)))
    .sort((a, b) => {
      const lastNameComparison = a.lastName.localeCompare(b.lastName);
      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }
      return a.firstName.localeCompare(b.firstName);
    });

  const availableTeams = useMemo(() => {
    const distribution: { [key: string]: number } = {};
    players.forEach(player => {
      player.teams.forEach(team => {
        distribution[team] = (distribution[team] || 0) + 1;
      });
    });
    return distribution;
  }, [players]);

  const teamDistribution = useMemo(() => {
    const distribution: { [key: string]: number } = {};
    const filteredPlayers = players.filter(p => filterTeam === 'all' || p.teams.includes(filterTeam));
    filteredPlayers.forEach(player => {
      let mainTeam = player.teams[0] || 'Non assigné';
      if (player.teams.includes('Senior')) mainTeam = 'Senior';
      else if (player.teams.includes('U17')) mainTeam = 'U17';
      else if (player.teams.includes('Dirigeant/Dirigeante')) mainTeam = 'Dirigeant/Dirigeante';
      else if (player.teams.includes('Arbitre')) mainTeam = 'Arbitre';

      distribution[mainTeam] = (distribution[mainTeam] || 0) + 1;
    });
    return distribution;
  }, [players, filterTeam]);

  const averageAge = useMemo(() => {
    const playersForAge = players.filter(p => filterTeam === 'all' || p.teams.includes(filterTeam));
    if (playersForAge.length === 0) {
      return 0;
    }
    const totalAge = playersForAge.reduce((sum, player) => {
      return sum + getAge(player.dateOfBirth);
    }, 0);
    return totalAge / playersForAge.length;
  }, [players, filterTeam]);

  const topScorers = [...playersWithSeasonStats]
    .sort((a, b) => {
      const goalsDiff = b.seasonStats.goals - a.seasonStats.goals;
      if (goalsDiff !== 0) {
        return goalsDiff;
      }
      const lastNameDiff = a.lastName.localeCompare(b.lastName);
      if (lastNameDiff !== 0) {
        return lastNameDiff;
      }
      return a.firstName.localeCompare(b.firstName);
    })
    .slice(0, 3);

  const topAssisters = [...playersWithSeasonStats]
    .sort((a, b) => {
      const assistsDiff = b.seasonStats.assists - a.seasonStats.assists;
      if (assistsDiff !== 0) {
        return assistsDiff;
      }
      const lastNameDiff = a.lastName.localeCompare(b.lastName);
      if (lastNameDiff !== 0) {
        return lastNameDiff;
      }
      return a.firstName.localeCompare(b.firstName);
    })
    .slice(0, 3);

  const topYellowCards = [...playersWithSeasonStats]
    .sort((a, b) => {
      const ycDiff = b.seasonStats.yellowCards - a.seasonStats.yellowCards;
      if (ycDiff !== 0) {
        return ycDiff;
      }
      const lastNameDiff = a.lastName.localeCompare(b.lastName);
      if (lastNameDiff !== 0) {
        return lastNameDiff;
      }
      return a.firstName.localeCompare(b.firstName);
    })
    .slice(0, 3);

  const topRedCards = [...playersWithSeasonStats]
    .sort((a, b) => {
      const rcDiff = b.seasonStats.redCards - a.seasonStats.redCards;
      if (rcDiff !== 0) {
        return rcDiff;
      }
      const lastNameDiff = a.lastName.localeCompare(b.lastName);
      if (lastNameDiff !== 0) {
        return lastNameDiff;
      }
      return a.firstName.localeCompare(b.firstName);
    })
    .slice(0, 3);

  const topCleanSheets = [...playersWithSeasonStats]
    .filter((p) => p.position === "Gardien")
    .sort((a, b) => {
      const csDiff = b.seasonStats.cleanSheets - a.seasonStats.cleanSheets;
      if (csDiff !== 0) {
        return csDiff;
      }
      const lastNameDiff = a.lastName.localeCompare(b.lastName);
      if (lastNameDiff !== 0) {
        return lastNameDiff;
      }
      return a.firstName.localeCompare(b.firstName);
    })
    .slice(0, 3);

  const bestMatchAttendance = [...playersWithSeasonStats]
    .sort((a, b) => {
      const attendanceDiff = b.matchAttendanceRateSeason - a.matchAttendanceRateSeason;
      if (attendanceDiff !== 0) {
        return attendanceDiff;
      }
      const lastNameDiff = a.lastName.localeCompare(b.lastName);
      if (lastNameDiff !== 0) {
        return lastNameDiff;
      }
      return a.firstName.localeCompare(b.firstName);
    })
    .slice(0, 3);

  const bestTrainingAttendance = [...playersWithSeasonStats]
    .sort((a, b) => {
      const attendanceDiff = b.trainingAttendanceRateSeason - a.trainingAttendanceRateSeason;
      if (attendanceDiff !== 0) {
        return attendanceDiff;
      }
      const lastNameDiff = a.lastName.localeCompare(b.lastName);
      if (lastNameDiff !== 0) {
        return lastNameDiff;
      }
      return a.firstName.localeCompare(b.firstName);
    })
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
    <div className="space-y-8">
      <Header
        title="Tableau de Bord"
        subtitle="Vue d'ensemble de votre équipe de football"
      >
        <button
          onClick={handleExportClick}
          className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <Download size={20} />
          <span>Export PDF</span>
        </button>
      </Header>
      <div id="dashboard-export-area">
        <div className="space-y-6">
          {isPrinting && (
            <Header
              title="Tableau de Bord"
              subtitle="Vue d'ensemble de votre équipe de football"
            />
          )}
          {/* Season and Team Filter */}
          {isPrinting ? (
            <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
              <Filter size={20} className="text-gray-600" />
              <div>
                <span className="text-sm font-medium text-gray-700">Saison : </span>
                <span className="text-base font-semibold">{selectedSeason}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Équipe : </span>
                <span className="text-base font-semibold">{filterTeam === 'all' ? 'Toutes les équipes' : filterTeam}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
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
                  onChange={(e) => setFilterTeam(e.target.value as Team | 'all')}
                  className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md shadow-sm"
                >
                  <option value="all">Toutes les équipes</option>
                  {Object.keys(availableTeams).map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              title="Total Joueurs"
              value={Object.values(teamDistribution).reduce((a, b) => a + b, 0)}
              icon={<Users size={24} />}
              color="#DC2626"
            />
            <StatCard
              title="Âge Moyen"
              value={`${(averageAge || 0).toFixed(1)} ans`}
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
              value={`${(stats.averageMatchAttendance || 0).toFixed(1)}%`}
              icon={<Trophy size={24} />}
              color="#000000"
            />
            <StatCard
              title="Présence Entraînements"
              value={`${(stats.averageTrainingAttendance || 0).toFixed(1)}%`}
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
                    const order = ['Senior', 'U20', 'U19', 'U18', 'U17', 'Arbitre', 'Dirigeant/Dirigeante'];
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
                              width: `${(count / (Object.values(teamDistribution).reduce((a, b) => a + b, 0) || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="w-8 text-right font-semibold text-gray-900">{count}</span>
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Statut Administratif
              </h3>
              <button
                onClick={handleExportAdminIssues}
                className="flex items-center space-x-2 text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg transition-colors duration-200"
              >
                <Download size={16} />
                <span>Export PDF</span>
              </button>
            </div>
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
                            ? "bg-black"
                            : index === 1
                            ? "bg-yellow-500"
                            : "bg-red-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium">
                        {player.firstName} {player.lastName}
                      </span>
                    </div>
                    <span className="font-bold text-lg">{player.seasonStats.goals}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Meilleurs Passeurs
              </h3>
              <div className="space-y-3">
                {topAssisters.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0
                            ? "bg-black"
                            : index === 1
                            ? "bg-yellow-500"
                            : "bg-red-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium">
                        {player.firstName} {player.lastName}
                      </span>
                    </div>
                    <span className="font-bold text-lg">{player.seasonStats.assists}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Clean Sheets (Gardiens)
              </h3>
              <div className="space-y-3">
                {topCleanSheets.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">Aucun clean sheet enregistré pour cette saison</div>
                ) : (
                  topCleanSheets.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0
                              ? "bg-black"
                              : index === 1
                              ? "bg-yellow-500"
                              : "bg-red-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="font-medium">
                          {player.firstName} {player.lastName}
                        </span>
                      </div>
                      <span className="font-bold text-lg">{player.seasonStats.cleanSheets}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Plus de Cartons Jaunes
              </h3>
              <div className="space-y-3">
                {topYellowCards.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0
                            ? "bg-black"
                            : index === 1
                            ? "bg-yellow-500"
                            : "bg-red-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium">
                        {player.firstName} {player.lastName}
                      </span>
                    </div>
                    <span className="font-bold text-lg">{player.seasonStats.yellowCards}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Plus de Cartons Rouges
              </h3>
              <div className="space-y-3">
                {topRedCards.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0
                            ? "bg-black"
                            : index === 1
                            ? "bg-yellow-500"
                            : "bg-red-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium">
                        {player.firstName} {player.lastName}
                      </span>
                    </div>
                    <span className="font-bold text-lg">{player.seasonStats.redCards}</span>
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
                            ? "bg-black"
                            : index === 1
                            ? "bg-yellow-500"
                            : "bg-red-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium">
                        {player.firstName} {player.lastName}
                      </span>
                    </div>
                    <span className="font-bold text-lg">
                      {(player.matchAttendanceRateSeason || 0).toFixed(0)}%
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
                            ? "bg-black"
                            : index === 1
                            ? "bg-yellow-500"
                            : "bg-red-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium">
                        {player.firstName} {player.lastName}
                      </span>
                    </div>
                    <span className="font-bold text-lg">
                      {(player.trainingAttendanceRateSeason || 0).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
