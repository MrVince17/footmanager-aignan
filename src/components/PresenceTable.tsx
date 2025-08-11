import React from "react";
import { Download, Trash2, Pencil } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Player } from "../types";
import { getTotalTeamEvents } from '../utils/playerUtils';

interface PresenceData {
  date: string;
  team: string;
  presentCount: number;
  presentPlayers: string[];
  opponent?: string;
  originalPerformanceRef?: any;
}

interface PresenceTableProps {
  data: PresenceData[];
  type: "training" | "match";
  allPlayers: Player[];
  selectedSeason: string;
  onDelete?: (date: string, opponent?: string) => void;
  onEdit?: (item: PresenceData) => void;
}

const PresenceTable: React.FC<PresenceTableProps> = ({
  data,
  type,
  allPlayers,
  selectedSeason,
  onDelete,
  onEdit,
}) => {
  const generatePresenceData = () => {
    const events = getTotalTeamEvents(allPlayers, type, undefined, selectedSeason)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const eventDates = events.map((e) => e.date);

    const playersWithPresence = allPlayers
      .filter((p) =>
        p.performances.some(
          (perf) => perf.type === type && perf.season === selectedSeason
        )
      )
      .sort((a, b) => {
        const lastNameDiff = a.lastName.localeCompare(b.lastName);
        if (lastNameDiff !== 0) {
          return lastNameDiff;
        }
        return a.firstName.localeCompare(b.firstName);
      });

    const header = [
      "Nom Prénom",
      "Équipe",
      ...eventDates.map((d) => {
        const date = new Date(d);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${day}/${month}`;
      }),
      "Total Présences",
      "% Présence",
    ];

    const rows = playersWithPresence.map((player) => {
      const row: (string | number)[] = [
        `${player.firstName} ${player.lastName}`,
        player.teams.join(", "),
      ];

      let presentCount = 0;
      eventDates.forEach((date) => {
        const isPresent = player.performances.some(
          (p) =>
            p.date === date &&
            p.type === type &&
            p.present &&
            (p.type === "training" ||
              (p.type === "match" && (p.minutesPlayed ?? 0) > 0))
        );
        row.push(isPresent ? "\u2714" : "\u2716");
        if (isPresent) {
          presentCount++;
        }
      });

      const totalEvents = eventDates.length;
      const presencePercentage =
        totalEvents > 0 ? (presentCount / totalEvents) * 100 : 0;

      row.push(presentCount);
      row.push(`${presencePercentage.toFixed(2)} %`);

      return row;
    });

    const totalRow: (string | number)[] = ["Total", ""];
    eventDates.forEach((_, index) => {
      const totalPresent = rows.reduce((acc, row) => {
        return acc + (row[index + 2] === "\u2714" ? 1 : 0);
      }, 0);
      totalRow.push(totalPresent);
    });
    totalRow.push(""); // for Total Présences column
    totalRow.push(""); // for % Présence column

    return { header, rows, totalRow };
  };

  const handleExportPDF = async () => {
    if (!data || data.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    try {
      const { header, rows, totalRow } = generatePresenceData();
      const doc = new jsPDF({ orientation: "landscape" });
      const title =
        type === "training" ? "Présence Entraînements" : "Présence Matchs";

      // Load custom font
      const fontUrl = "/fonts/DejaVuSans.ttf";
      const fontResponse = await fetch(fontUrl);
      const font = await fontResponse.arrayBuffer();
      const fontName = "DejaVuSans";
      doc.addFileToVFS(`${fontName}.ttf`, new Uint8Array(font).reduce((data, byte) => data + String.fromCharCode(byte), ''));
      doc.addFont(`${fontName}.ttf`, fontName, "normal");

      doc.text(title, 14, 22);

      autoTable(doc, {
        head: [header],
        body: [...rows, totalRow],
        startY: 30,
        theme: "grid",
        headStyles: { fillColor: [220, 26, 38], fontStyle: "bold" },
        styles: {
          fontSize: 8,
          cellPadding: 1,
          font: "DejaVuSans",
        },
        columnStyles: {
          ...header.reduce((acc, _, index) => {
            const maxWidth = Math.max(
              doc.getTextWidth(header[index]),
              ...rows.map(row => doc.getTextWidth((row[index] || '').toString()))
            );
            return { ...acc, [index]: { cellWidth: maxWidth + 10 } };
          }, {}),
          // Center align for date columns
          ...Array.from({ length: header.length - 4 }, (_, i) => i + 2).reduce((acc, i) => ({ ...acc, [i]: { halign: 'center' } }), {}),
          [header.length - 2]: { halign: 'center' }, // Center align Total Présences column
          [header.length - 1]: { halign: 'center' },
        },
      });

      doc.save(`presence_${type}_${selectedSeason}.pdf`);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF :", error);
      alert(
        "Une erreur est survenue lors de la génération du PDF. Vérifiez la console pour plus de détails."
      );
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
    const sheetName =
      type === "training" ? "Présences Entraînements" : "Présences Matchs";
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Auto-fit columns
    if (!ws) return;
    const cols = Object.keys(ws).filter(key => key.endsWith('1')).map(key => key.replace('1', ''));
    const colWidths = cols.map(col => {
      const addresses = Object.keys(ws).filter(key => key.startsWith(col) && key !== `${col}1`);
      const maxWidth = Math.max(
        ...addresses.map(addr => {
            const cell = ws[addr];
            if (cell && cell.v) {
                return cell.v.toString().length;
            }
            return 0;
        }),
        (ws[`${col}1`] && ws[`${col}1`].v) ? ws[`${col}1`].v.toString().length : 0
      );
      return { wch: maxWidth + 2 };
    });
    ws['!cols'] = colWidths;

    // Center align columns
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (ws[cell_ref]) {
          if ((C >= 2 && C < header.length - 2) || C === header.length - 2) {
            ws[cell_ref].s = { alignment: { horizontal: 'center' } };
          }
        }
      }
    }

    XLSX.writeFile(wb, `presences_${type}_Saison_${selectedSeason}.xlsx`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {type === "training" ? "Entraînements" : "Matchs"}
          </h3>
          <p className="text-sm text-gray-600">
            {data.length} {type === "training" ? "séances" : "matchs"}{" "}
            affiché(e)s
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
            <th scope="col" className="px-6 py-3">{type === 'training' ? 'Équipe' : 'Adversaire'}</th>
            <th scope="col" className="px-6 py-3">Présents</th>
            <th scope="col" className="px-6 py-3">Joueurs présents</th>
            <th scope="col" className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4">{new Date(item.date).toLocaleDateString("fr-FR")}</td>
              <td className="px-6 py-4">{type === 'training' ? item.team : item.opponent}</td>
              <td className="px-6 py-4">{item.presentCount}</td>
              <td className="px-6 py-4">{item.presentPlayers.join(", ")}</td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-4">
                  {type === 'match' && onEdit && (
                    <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800">
                      <Pencil size={18} />
                    </button>
                  )}
                  {type === 'training' && onEdit && (
                    <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800">
                      <Pencil size={18} />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(item.date, item.opponent || '')} className="text-red-600 hover:text-red-800">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PresenceTable;
