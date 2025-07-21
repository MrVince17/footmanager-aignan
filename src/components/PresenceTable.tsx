import React from 'react';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { Player } from '../types';
import { storage } from '../utils/storage';

interface PresenceData {
  date: string;
  team: string;
  presentCount: number;
  presentPlayers: string[];
}

interface PresenceTableProps {
  data: PresenceData[];
  type: 'training' | 'match';
  allPlayers: Player[];
  selectedSeason: string;
}

export const PresenceTable: React.FC<PresenceTableProps> = ({ data, type, allPlayers, selectedSeason }) => {
  const generatePresenceData = () => {
    const events = storage.getTotalTeamEvents(allPlayers, type, undefined, selectedSeason)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const eventDates = events.map(e => e.date);

    const playersWithPresence = allPlayers.filter(p =>
      p.performances.some(perf => perf.type === type && perf.season === selectedSeason)
    );

    const header = ["Nom Prénom", "Équipe", ...eventDates.map(d => new Date(d).toLocaleDateString('fr-FR')), "Total Présences", "% Présence"];

    const rows = playersWithPresence.map(player => {
      const row: (string | number)[] = [
        `${player.firstName} ${player.lastName}`,
        player.teams.join(', '),
      ];

      let presentCount = 0;
      eventDates.forEach(date => {
        const isPresent = player.performances.some(p => 
          p.date === date && 
          p.type === type && 
          p.present &&
          (p.type === 'training' || (p.type === 'match' && (p.minutesPlayed ?? 0) > 0))
        );
        row.push(isPresent ? '✅' : '❌');
        if (isPresent) {
          presentCount++;
        }
      });

      const totalEvents = eventDates.length;
      const presencePercentage = totalEvents > 0 ? (presentCount / totalEvents) * 100 : 0;

      row.push(presentCount);
      row.push(`${presencePercentage.toFixed(2)} %`);

      return row;
    });

    const totalRow: (string | number)[] = ["Total", ""];
    eventDates.forEach((date, index) => {
      const totalPresent = rows.reduce((acc, row) => {
        return acc + (row[index + 2] === '✅' ? 1 : 0);
      }, 0);
      totalRow.push(totalPresent);
    });
    totalRow.push(""); // for Total Présences column
    totalRow.push(""); // for % Présence column

    return { header, rows, totalRow };
  };

  const handleExportPDF = () => {
    if (!data || data.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    try {
      const { header, rows, totalRow } = generatePresenceData();
      const doc = new jsPDF({ orientation: 'landscape' });
      const title = type === 'training' ? 'Présence Entraînements' : 'Présence Matchs';
      doc.text(title, 14, 22);

      autoTable(doc, {
        head: [header],
        body: [...rows, totalRow],
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [220, 26, 38] },
        styles: {
          fontSize: 8,
          cellPadding: 1,
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
        },
      });

      doc.save(`presence_${type}_${selectedSeason}.pdf`);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF :", error);
      alert("Une erreur est survenue lors de la génération du PDF. Veuillez consulter la console pour plus de détails.");
    }
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const { header, rows, totalRow } = generatePresenceData();
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows, totalRow]);
    const wb = XLSX.utils.book_new();
    const sheetName = type === 'training' ? 'Présences Entraînements' : 'Présences Matchs';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `presences_${type}_Saison_${selectedSeason}.xlsx`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {type === 'training' ? 'Entraînements' : 'Matchs'}
          </h3>
          <p className="text-sm text-gray-600">
            {data.length} {type === 'training' ? 'séances' : 'matchs'} affiché(e)s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            title="Exporter en PDF"
          >
            <Download size={20} />
            <span>PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            title="Exporter en Excel"
          >
            <Download size={20} />
            <span>Excel</span>
          </button>
        </div>
      </div>
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Date</th>
            <th scope="col" className="px-6 py-3">Équipe</th>
            <th scope="col" className="px-6 py-3">Nombre de présents</th>
            <th scope="col" className="px-6 py-3">Joueurs présents</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4">{new Date(item.date).toLocaleDateString('fr-FR')}</td>
              <td className="px-6 py-4">{item.team}</td>
              <td className="px-6 py-4">{item.presentCount}</td>
              <td className="px-6 py-4">{item.presentPlayers.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};