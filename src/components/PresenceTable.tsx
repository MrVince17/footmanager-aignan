import React from 'react';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface PresenceData {
  date: string;
  team: string;
  presentCount: number;
  presentPlayers: string[];
}

interface PresenceTableProps {
  data: PresenceData[];
  type: 'training' | 'match';
}

export const PresenceTable: React.FC<PresenceTableProps> = ({ data, type }) => {
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
