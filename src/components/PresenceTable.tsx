import { useState, useMemo } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface PresenceData {
  name: string;
  team: string;
  attendance: { [key: string]: boolean };
}

interface PresenceTableProps {
  data: PresenceData[];
  type: "training" | "match";
  selectedSeason: string;
}

const checkIcon = "/images/check.png";
const crossIcon = "/images/cross.png";

export default function PresenceTable({ data, type, selectedSeason }: PresenceTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: "name" | "team" | "total";
    direction: "ascending" | "descending";
  }>({ key: "name", direction: "ascending" });

  const sortedData = useMemo(() => {
    if (!data) return [];
    const sortableData = [...data];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        if (sortConfig.key === "total") {
          aValue = Object.values(a.attendance).filter((att) => att).length;
          bValue = Object.values(b.attendance).filter((att) => att).length;
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "ascending"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return sortConfig.direction === "ascending"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key: "name" | "team" | "total") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  const eventDates = useMemo(() => {
    if (!data || data.length === 0) return [];
    const dates = new Set<string>();
    data.forEach((item) => {
      Object.keys(item.attendance).forEach((date) => dates.add(date));
    });
    return Array.from(dates).sort();
  }, [data]);

  const generatePresenceData = () => {
    const header = ["Nom Prénom", "Équipe", ...eventDates, "Total", "Pourcentage"];
    const rows: (string | number)[][] = sortedData.map((item) => {
      const total = Object.values(item.attendance).filter((att) => att).length;
      const percentage = eventDates.length > 0 ? ((total / eventDates.length) * 100).toFixed(2) : "0.00";
      return [
        item.name,
        item.team,
        ...eventDates.map((date) => (item.attendance[date] ? "✓" : "✗")),
        total,
        `${percentage}%`,
      ];
    });

    // Typage explicite pour totalRow
    const totalRow: (string | number)[] = ["Total", "", ...eventDates.map(() => 0 as number), 0 as number, "0.00%"];
    eventDates.forEach((_, index) => {
      const dateIndex = index + 2;
      totalRow[dateIndex] = sortedData.filter((item) => item.attendance[eventDates[index]]).length;
    });
    const totalPresent = totalRow.slice(2, -2).reduce((sum, count) => sum + Number(count), 0);
    totalRow[totalRow.length - 2] = totalPresent;
    totalRow[totalRow.length - 1] = eventDates.length > 0 ? `${((totalPresent / (eventDates.length * sortedData.length)) * 100).toFixed(2)}%` : "0.00%";

    return { header, rows, totalRow };
  };

  const handleExportPDF = () => {
    if (!data || data.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    console.log("Starting PDF generation...");
    try {
      console.log("Generating presence data...");
      const { header, rows, totalRow } = generatePresenceData();
      console.log("Presence data generated:", { header, rows, totalRow });
      const doc = new jsPDF({ orientation: "landscape" });
      console.log("jsPDF initialized");

      // Log pour vérifier les chemins des images
      console.log("Testing image URLs:", checkIcon, crossIcon);

      // Précharger les images pour vérifier leur disponibilité
      const testImage = (url: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = url;
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Échec du chargement de l'image : ${url}`));
        });
      };

      Promise.all([testImage(checkIcon), testImage(crossIcon)])
        .then(() => {
          console.log("Images loaded successfully");
          const title = type === "training" ? "Présence Entraînements" : "Présence Matchs";
          doc.text(title, 14, 22);

          const columnStyles: { [key: number]: { cellWidth: number } } = {
            0: { cellWidth: 25 }, // Nom Prénom
            1: { cellWidth: 25 }, // Équipe
          };
          for (let i = 2; i < header.length - 2; i++) {
            columnStyles[i] = { cellWidth: 12 }; // Largeur pour correspondre aux dates
          }

          autoTable(doc, {
            head: [header],
            body: [...rows, totalRow],
            startY: 30,
            theme: "grid",
            headStyles: { fillColor: [220, 26, 38] },
            styles: {
              fontSize: 8,
              cellPadding: 1,
              font: "helvetica", // Utiliser une police par défaut
            },
            columnStyles,
            didParseCell: (data) => {
              if (
                data.section === "body" &&
                data.column.index >= 2 &&
                data.column.index < header.length - 2
              ) {
                const cellValue = data.cell.raw as string | number;
                if (cellValue === "✓" || cellValue === "✗") {
                  data.cell.text = []; // Vider le texte pour éviter le caractère ' ou autres
                  data.cell.styles.textColor = [255, 255, 255]; // Fond blanc pour éviter tout artefact
                  console.log("Cell text cleared for:", cellValue);
                }
              }
            },
            didDrawCell: (data) => {
              if (
                data.section === "body" &&
                data.column.index >= 2 &&
                data.column.index < header.length - 2
              ) {
                const cellValue = data.cell.raw as string | number;
                if (cellValue === "✓" || cellValue === "✗") {
                  const image = cellValue === "✓" ? checkIcon : crossIcon;
                  const width = 4;
                  const height = 4;
                  const xOffset = data.cell.x + (data.cell.width - width) / 2;
                  const yOffset = data.cell.y + (data.cell.height - height) / 2;
                  console.log("Drawing image:", image, "at", xOffset, yOffset);
                  doc.addImage(image, "PNG", xOffset, yOffset, width, height);
                }
              }
            },
          });

          console.log("Saving PDF...");
          doc.save(`presence_${type}_${selectedSeason}.pdf`);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement des images:", error);
          alert(
            "Erreur : Impossible de charger les images pour le PDF. Vérifiez que check.png et cross.png sont dans /public/images/ et accessibles."
          );
        });
    } catch (error) {
      console.error("Detailed error:", error);
      alert("Erreur détaillée : voir la console pour plus d'informations.");
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleExportPDF}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Exporter en PDF
      </button>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              {["Nom Prénom", "Équipe", ...eventDates, "Total", "Pourcentage"].map((header, index) => (
                <th
                  key={index}
                  onClick={() => requestSort(index === 0 ? "name" : index === 1 ? "team" : "total")}
                  className="px-4 py-2 border cursor-pointer"
                >
                  {header}
                  {sortConfig.key === (index === 0 ? "name" : index === 1 ? "team" : "total") &&
                    (sortConfig.direction === "ascending" ? " ↑" : " ↓")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => {
              const total = Object.values(item.attendance).filter((att) => att).length;
              const percentage = eventDates.length > 0 ? ((total / eventDates.length) * 100).toFixed(2) : "0.00";
              return (
                <tr key={index}>
                  <td className="px-4 py-2 border">{item.name}</td>
                  <td className="px-4 py-2 border">{item.team}</td>
                  {eventDates.map((date, i) => (
                    <td key={i} className="px-4 py-2 border text-center">
                      {item.attendance[date] ? "✓" : "✗"}
                    </td>
                  ))}
                  <td className="px-4 py-2 border text-center">{total}</td>
                  <td className="px-4 py-2 border text-center">{percentage}%</td>
                </tr>
              );
            })}
            <tr>
              <td className="px-4 py-2 border font-bold">Total</td>
              <td className="px-4 py-2 border"></td>
              {eventDates.map((date, index) => (
                <td key={index} className="px-4 py-2 border text-center">
                  {sortedData.filter((item) => item.attendance[date]).length}
                </td>
              ))}
              <td className="px-4 py-2 border text-center">
                {sortedData.reduce((sum, item) => sum + Object.values(item.attendance).filter((att) => att).length, 0)}
              </td>
              <td className="px-4 py-2 border text-center">
                {eventDates.length > 0
                  ? `${((sortedData.reduce(
                      (sum, item) => sum + Object.values(item.attendance).filter((att) => att).length,
                      0
                    ) /
                      (eventDates.length * sortedData.length)) *
                      100).toFixed(2)}%`
                  : "0.00%"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}