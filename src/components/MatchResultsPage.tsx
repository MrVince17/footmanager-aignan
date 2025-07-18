import React, { useMemo, useState } from 'react';
import { Player, Performance, MatchDisplayData, MatchDetails } from '../types';
import { MatchCard } from './MatchCard';
import { SeasonStatsSummary } from './SeasonStatsSummary';
import { MatchEditForm } from './MatchEditForm';
import { exportMatchSummaryToWord } from './MatchSummaryGenerator';
import { Info, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getPlayerById } from '../utils/playerUtils';
import { getAvailableSeasons } from '../utils/seasonUtils';


interface MatchResultsPageProps {
  allPlayers: Player[];
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
  onUpdatePlayerStorage: (type: string, refData: any, value?: any) => void;
}

export const MatchResultsPage: React.FC<MatchResultsPageProps> = ({
  allPlayers,
  selectedSeason,
  onSeasonChange,
  onUpdatePlayerStorage,
}) => {
  console.log('[MatchResultsPage] Props received - selectedSeason:', selectedSeason);
  // Utilisation de JSON.stringify pour éviter les problèmes de log avec des objets complexes ou circulaires
  // Attention: peut être coûteux pour de gros objets. Utiliser avec parcimonie pour le débogage.
  console.log('[MatchResultsPage] Props received - allPlayers count:', allPlayers?.length);


  const availableSeasons = useMemo(() => {
    console.log('[MatchResultsPage] Calculating availableSeasons...');
    const seasons = getAvailableSeasons(allPlayers || []);
    console.log('[MatchResultsPage] availableSeasons:', seasons);
    return seasons;
  }, [allPlayers]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchDisplayData | null>(null);
  const [filterMatchType, setFilterMatchType] = useState<'all' | 'D2' | 'R2' | 'CdF' | 'CO' | 'CG' | 'ChD' | 'CR' | 'CS'>('all');

  const handleGenerateSummary = (match: MatchDisplayData) => {
    const matchDetails = transformMatchData(match, allPlayers, selectedSeason);
    exportMatchSummaryToWord(matchDetails);
  };

  const handleEditMatch = (match: MatchDisplayData) => {
    console.log('[MatchResultsPage] Editing match:', match);
    setEditingMatch(match);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingMatch(null);
  };

  const handleSaveMatchUpdate = (
    updatedMatchData: Partial<Performance>,
    originalPerformanceRef: Performance
  ) => {
    console.log('[MatchResultsPage] Saving match update:', updatedMatchData, 'originalRef:', originalPerformanceRef);
    onUpdatePlayerStorage('matchUpdate', originalPerformanceRef, updatedMatchData);
    handleCloseEditModal();
  };

  const handleDeleteMatch = (match: MatchDisplayData) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le match contre ${match.opponent} du ${new Date(match.date).toLocaleDateString('fr-FR')}?`)) {
      onUpdatePlayerStorage('matchDelete', match.originalPerformanceRef);
    }
  };

  const displayedMatches = useMemo(() => {
    console.log(`[MatchResultsPage] Calculating displayedMatches for season: ${selectedSeason}`);
    if (!allPlayers || allPlayers.length === 0) {
      console.log('[MatchResultsPage] No players data to process for displayedMatches.');
      return [];
    }

    const allPerformances = allPlayers.flatMap(p => p.performances || []);
    console.log('[MatchResultsPage] All performances flattened count:', allPerformances.length);

    const seasonPerformances = allPerformances.filter(
      (p) => p.type === 'match' && p.season === selectedSeason && (filterMatchType === 'all' || p.matchType === filterMatchType)
    );
    console.log(`[MatchResultsPage] Performances for season ${selectedSeason} and type 'match' count:`, seasonPerformances.length);
    // console.log(`[MatchResultsPage] Filtered season performances:`, JSON.stringify(seasonPerformances.slice(0, 5), null, 2)); // Log first 5 for brevity


    const groupedByMatch: Record<string, Performance[]> = {};
    seasonPerformances.forEach((p) => {
      const opponent = p.opponent || 'UnknownOpponent';
      const location = p.location || 'unknownLocation';
      const scoreHome = p.scoreHome !== undefined ? String(p.scoreHome) : 'N/A';
      const scoreAway = p.scoreAway !== undefined ? String(p.scoreAway) : 'N/A';
      const matchId = `${p.date}-${opponent}-${location}-${scoreHome}-${scoreAway}`;

      if (!groupedByMatch[matchId]) {
        groupedByMatch[matchId] = [];
      }
      groupedByMatch[matchId].push(p);
    });
    // console.log('[MatchResultsPage] Performances grouped by matchId:', JSON.stringify(groupedByMatch, null, 2));

    const matches: MatchDisplayData[] = Object.entries(groupedByMatch)
      .map(([id, performances]) => {
        if (performances.length === 0) return null;
        const refPerf = performances[0];
        return {
          id,
          date: refPerf.date,
          opponent: refPerf.opponent,
          scoreHome: refPerf.scoreHome,
          scoreAway: refPerf.scoreAway,
          location: refPerf.location,
          scorers: refPerf.scorers || [],
          assisters: refPerf.assisters || [],
          yellowCardsDetails: refPerf.yellowCardsDetails || [],
          redCardsDetails: refPerf.redCardsDetails || [],
          goalsConcededDetails: refPerf.goalsConcededDetails || [],
          originalPerformanceRef: refPerf,
          matchType: refPerf.matchType,
        };
      })
      .filter(match => match !== null) as MatchDisplayData[];

    const sortedMatches = matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    console.log('[MatchResultsPage] Final displayedMatches (sorted) count:', sortedMatches.length);
    // console.log('[MatchResultsPage] Final displayedMatches (sorted):', JSON.stringify(sortedMatches.slice(0,2), null, 2));
    return sortedMatches;
  }, [allPlayers, selectedSeason]);

  const сезонСтатсSummaryData = (matches: MatchDisplayData[]) => {
    // ... (implementation from previous steps)
    let victories = 0;
    let draws = 0;
    let defeats = 0;
    let goalsScored = 0;
    let goalsConceded = 0;

    matches.forEach(match => {
        if (typeof match.scoreHome === 'number' && typeof match.scoreAway === 'number') {
            if (match.location === 'home') {
                goalsScored += match.scoreHome;
                goalsConceded += match.scoreAway;
                if (match.scoreHome > match.scoreAway) victories++;
                else if (match.scoreHome < match.scoreAway) defeats++;
                else draws++;
            } else if (match.location === 'away') {
                goalsScored += match.scoreAway;
                goalsConceded += match.scoreHome;
                if (match.scoreAway > match.scoreHome) victories++;
                else if (match.scoreAway < match.scoreHome) defeats++;
                else draws++;
            }
        }
    });
    return {
        totalMatches: matches.length,
        victories,
        draws,
        defeats,
        goalsScored,
        goalsConceded,
    };
  };


  const handleExportPDF = () => {
    console.log("[MatchResultsPage] Exporting PDF...");
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(18);
    doc.text(`Résultats Saison ${selectedSeason}`, 14, 22);

    const summaryData = сезонСтатсSummaryData(displayedMatches);
    const summaryText = [
        `Total Matchs: ${summaryData.totalMatches}`,
        `Victoires: ${summaryData.victories}`,
        `Nuls: ${summaryData.draws}`,
        `Défaites: ${summaryData.defeats}`,
        `Buts Marqués: ${summaryData.goalsScored}`,
        `Buts Encaissés: ${summaryData.goalsConceded}`
    ];
    doc.setFontSize(10);
    summaryText.forEach((line, index) => {
        doc.text(line, 14, 30 + (index * 5));
    });

    const tableColumn = ["Date", "Adversaire", "Score", "Lieu", "Buteurs", "Passeurs", "CJ", "CR", "Buts Contre"];
    const tableRows: string[][] = [];

    displayedMatches.forEach(match => {
        const row = [
            new Date(match.date).toLocaleDateString('fr-FR'),
            match.opponent || '-',
            `${match.scoreHome ?? '-'} : ${match.scoreAway ?? '-'}`,
            match.location === 'home' ? 'Domicile' : match.location === 'away' ? 'Extérieur' : '-',
            match.scorers?.map(s => `${getPlayerById(allPlayers, s.playerId)?.lastName || 'N/A'} (${s.minute}')`).join(', ') || '-',
            match.assisters?.map(a => `${getPlayerById(allPlayers, a.playerId)?.lastName || 'N/A'}`).join(', ') || '-',
            match.yellowCardsDetails?.map(yc => `${getPlayerById(allPlayers, yc.playerId)?.lastName || 'N/A'} (${yc.minute}')`).join(', ') || '-',
            match.redCardsDetails?.map(rc => `${getPlayerById(allPlayers, rc.playerId)?.lastName || 'N/A'} (${rc.minute}')`).join(', ') || '-',
            match.goalsConcededDetails?.map(gc => `(${gc.minute}')`).join(', ') || '-'
        ];
        tableRows.push(row);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30 + (summaryText.length * 5) + 5,
        theme: 'grid',
        headStyles: { fillColor: [220, 26, 38] }, // Rouge US Aignan
        styles: { fontSize: 7, cellPadding: 1.5 },
        columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 35 },
            4: { cellWidth: 'auto' },
            5: { cellWidth: 'auto' },
            6: { cellWidth: 'auto' },
            7: { cellWidth: 'auto' },
            8: { cellWidth: 'auto' },
        }
    });
    doc.save(`resultats_saison_${selectedSeason}.pdf`);
};

const handleExportExcel = () => {
    console.log("[MatchResultsPage] Exporting Excel...");
    const wb = XLSX.utils.book_new();
    const ws_name = "Résultats Saison";

    const dataToExport: any[][] = [];

    const summary = сезонСтатсSummaryData(displayedMatches);
    dataToExport.push([`Résultats Saison ${selectedSeason}`]);
    dataToExport.push([]); // Ligne vide
    dataToExport.push(["Résumé de la Saison"]);
    dataToExport.push(["Total Matchs", summary.totalMatches]);
    dataToExport.push(["Victoires", summary.victories]);
    dataToExport.push(["Nuls", summary.draws]);
    dataToExport.push(["Défaites", summary.defeats]);
    dataToExport.push(["Buts Marqués", summary.goalsScored]);
    dataToExport.push(["Buts Encaissés", summary.goalsConceded]);
    dataToExport.push([]); // Ligne vide

    dataToExport.push([
        "Date", "Adversaire", "Score Domicile", "Score Extérieur", "Lieu",
        "Buteurs", "Passeurs", "Cartons Jaunes", "Cartons Rouges", "Buts Encaissés (minutes)"
    ]);

    displayedMatches.forEach(match => {
        dataToExport.push([
            new Date(match.date).toLocaleDateString('fr-FR'),
            match.opponent || '-',
            match.scoreHome ?? '-',
            match.scoreAway ?? '-',
            match.location === 'home' ? 'Domicile' : match.location === 'away' ? 'Extérieur' : '-',
            match.scorers?.map(s => `${getPlayerById(allPlayers, s.playerId)?.firstName || ''} ${getPlayerById(allPlayers, s.playerId)?.lastName || ''} (${s.minute}')`).join('; ') || '-',
            match.assisters?.map(a => `${getPlayerById(allPlayers, a.playerId)?.firstName || ''} ${getPlayerById(allPlayers, a.playerId)?.lastName || ''}`).join('; ') || '-',
            match.yellowCardsDetails?.map(yc => `${getPlayerById(allPlayers, yc.playerId)?.firstName || ''} ${getPlayerById(allPlayers, yc.playerId)?.lastName || ''} (${yc.minute}')`).join('; ') || '-',
            match.redCardsDetails?.map(rc => `${getPlayerById(allPlayers, rc.playerId)?.firstName || ''} ${getPlayerById(allPlayers, rc.playerId)?.lastName || ''} (${rc.minute}')`).join('; ') || '-',
            match.goalsConcededDetails?.map(gc => gc.minute).join('; ') || '-'
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, `resultats_saison_${selectedSeason}.xlsx`);
};


  return (
    <div className="space-y-6" id="match-results-content">
      <div className="bg-gradient-to-r from-red-600 to-black rounded-xl p-8 text-white relative">
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            title="Exporter en PDF"
          >
            <Download size={20} />
            <span>PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            title="Exporter en Excel"
          >
            <Download size={20} />
            <span>Excel</span>
          </button>
        </div>
        <h1 className="text-4xl font-bold mb-2">US AIGNAN</h1>
        <h2 className="text-2xl font-semibold mb-2">Résultats de la Saison</h2>
        <p className="text-red-100">Consultez les résultats des matchs pour la saison sélectionnée.</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-start items-center gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="season-select-results" className="text-sm font-medium text-gray-700">Saison :</label>
            <select
              id="season-select-results"
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
          <div className="flex items-center gap-3">
            <label htmlFor="match-type-filter-results" className="text-sm font-medium text-gray-700">Type de Match :</label>
            <select
              id="match-type-filter-results"
              value={filterMatchType}
              onChange={(e) => setFilterMatchType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">Tous les matchs</option>
              <option value="D2">Championnat D2</option>
              <option value="R2">Championnat R2</option>
              <option value="CdF">Coupe de France</option>
              <option value="CO">Coupe Occitannie</option>
              <option value="CG">Coupe du Gers</option>
              <option value="ChD">Challenge District</option>
              <option value="CR">Coupe des Réserves</option>
              <option value="CS">Coupe Savoldelli</option>
            </select>
          </div>
        </div>
      </div>

      {displayedMatches.length > 0 && <SeasonStatsSummary matches={displayedMatches} />}

      {displayedMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          {displayedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              allPlayers={allPlayers}
              onEdit={handleEditMatch}
              onGenerateSummary={handleGenerateSummary}
              onDelete={handleDeleteMatch}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <Info size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun match trouvé</h3>
          <p className="text-gray-600">
            Aucun résultat de match disponible pour la saison {selectedSeason}
          </p>
        </div>
      )}

      {showEditModal && editingMatch && (
        <MatchEditForm
          matchToEdit={editingMatch}
          allPlayers={allPlayers}
          onSave={handleSaveMatchUpdate}
          onClose={handleCloseEditModal}
          isVisible={showEditModal}
        />
      )}
    </div>
  );
};

const transformMatchData = (matchData: MatchDisplayData, allPlayers: Player[], season: string): MatchDetails => {
  const getPlayerName = (playerId: string) => {
    const player = getPlayerById(allPlayers, playerId);
    return player ? `${player.firstName} ${player.lastName}` : 'Inconnu';
  };

  const domicile = matchData.location === 'home';
  const scoreEquipe = domicile ? matchData.scoreHome ?? 0 : matchData.scoreAway ?? 0;
  const scoreAdverse = domicile ? matchData.scoreAway ?? 0 : matchData.scoreHome ?? 0;

  // Find the goalkeeper for the match and check for clean sheet
  const goalkeepers = allPlayers.filter(p => p.position === 'Gardien');
  let gardienData = { nom: 'N/A', cleanSheet: false };
  for (const gk of goalkeepers) {
      const perf = gk.performances.find(p => p.date === matchData.date && p.opponent === matchData.opponent);
      if (perf && perf.present) {
          gardienData = { nom: getPlayerName(gk.id), cleanSheet: perf.cleanSheet || false };
          break;
      }
  }

  return {
    id: matchData.id,
    date: new Date(matchData.date).toLocaleDateString('fr-FR'),
    jourSemaine: new Date(matchData.date).toLocaleDateString('fr-FR', { weekday: 'long' }),
    domicile,
    adversaire: matchData.opponent ?? 'Adversaire inconnu',
    scoreEquipe,
    scoreAdverse,
    saison: season,
    buteurs: matchData.scorers?.map(s => ({ nom: getPlayerName(s.playerId), minute: s.minute })) ?? [],
    passeurs: matchData.assisters?.map(a => ({ nom: getPlayerName(a.playerId) })) ?? [],
    gardien: gardienData,
    cartonsJaunes: matchData.yellowCardsDetails?.map(c => ({ nom: getPlayerName(c.playerId), minute: c.minute })) ?? [],
    cartonsRouges: matchData.redCardsDetails?.map(c => ({ nom: getPlayerName(c.playerId), minute: c.minute })) ?? [],
    prochainMatch: "Prochain match à définir" // Placeholder
  };
};
