import React from 'react';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = type === 'training' ? 'Présence Entraînements' : 'Présence Matchs';
    doc.text(title, 14, 22);

    const tableColumn = ["Date", "Équipe", "Nombre de présents", "Joueurs présents"];
    const tableRows: (string | number)[][] = [];

    data.forEach(item => {
      const row = [
        new Date(item.date).toLocaleDateString('fr-FR'),
        item.team,
        item.presentCount,
        item.presentPlayers.join(', '),
      ];
      tableRows.push(row);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [220, 26, 38] },
    });

    doc.save(`presence_${type}.pdf`);
  };

  const handleExportExcel = () => {
    if (type === 'training') {
      const allTrainings = storage.getTotalTeamEvents(allPlayers, 'training', undefined, selectedSeason)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const trainingDates = allTrainings.map(t => t.date);

      const playersWithPresence = allPlayers.filter(p =>
        p.performances.some(perf => perf.type === 'training' && perf.season === selectedSeason)
      );

      const header = ["Nom Prénom", "Équipe", ...trainingDates.map(d => new Date(d).toLocaleDateString('fr-FR')), "Total Présences", "% Présence"];

      const rows = playersWithPresence.map(player => {
        const row: (string | number)[] = [
          `${player.firstName} ${player.lastName}`,
          player.teams.join(', '),
        ];

        let presentCount = 0;
        trainingDates.forEach(date => {
          const isPresent = player.performances.some(p => p.date === date && p.type === 'training' && p.present);
          row.push(isPresent ? '✅' : '❌');
          if (isPresent) {
            presentCount++;
          }
        });

        const totalTrainings = trainingDates.length;
        const presencePercentage = totalTrainings > 0 ? (presentCount / totalTrainings) * 100 : 0;

        row.push(presentCount);
        row.push(`${presencePercentage.toFixed(2)} %`);

        return row;
      });

      const totalRow: (string | number)[] = ["Total", ""];
      trainingDates.forEach((date, index) => {
        const totalPresent = rows.reduce((acc, row) => {
          return acc + (row[index + 2] === '✅' ? 1 : 0);
        }, 0);
        totalRow.push(totalPresent);
      });
      totalRow.push(""); // for Total Présences column
      totalRow.push(""); // for % Présence column


      const ws = XLSX.utils.aoa_to_sheet([header, ...rows, totalRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Présences Entraînements");
      XLSX.writeFile(wb, `presences_entrainements_Saison_${selectedSeason}.xlsx`);

    } else {
      const ws = XLSX.utils.json_to_sheet(
        data.map(item => ({
          "Date": new Date(item.date).toLocaleDateString('fr-FR'),
          "Équipe": item.team,
          "Nombre de présents": item.presentCount,
          "Joueurs présents": item.presentPlayers.join(', '),
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Présences");
      XLSX.writeFile(wb, `presence_${type}.xlsx`);
    }
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
