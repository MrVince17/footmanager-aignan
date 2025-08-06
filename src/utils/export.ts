import { Player } from '../types';
import * as XLSX from 'xlsx';
import { getPlayerStatsForSeason } from './playerUtils';
import { getAvailableSeasons } from './seasonUtils';
import html2pdf from 'html2pdf.js';



export const exportToExcel = (players: Player[], allPlayers: Player[], filename: string = 'export_joueurs_US_Aignan.xlsx') => {
  const availableSeasons = getAvailableSeasons(allPlayers);
  const latestSeason = availableSeasons[0] || '';

  const headers = [
    'Nom',
    'Prénom',
    'Date de naissance',
    'Numéro de licence',
    'Équipe(s)',
    'Position', 
    'Matchs joués',
    'Minutes jouées',
    'Entraînements',
    'Buts',
    'Passes décisives',
    'Clean sheets',
    'Cartons jaunes',
    'Cartons rouges',
    '% Présence entraînements',
    '% Présence matchs',
    'Licence valide',
    'Paiement OK'
  ];

  const data = players.map(player => {
    const stats = getPlayerStatsForSeason(player, latestSeason, allPlayers);
    return [
      player.lastName,
      player.firstName,
      player.dateOfBirth,
      player.licenseNumber,
      player.teams.join(' + '),
      player.position,
      stats.totalMatches,
      stats.totalMinutes,
      stats.presentTrainings,
      stats.goals,
      stats.assists,
      stats.cleanSheets,
      stats.yellowCards,
      stats.redCards,
      `${(stats.trainingAttendanceRateSeason || 0).toFixed(1)}%`,
      `${(stats.matchAttendanceRateSeason || 0).toFixed(1)}%`,
      player.licenseValid ? 'Oui' : 'Non',
      player.paymentValid ? 'Oui' : 'Non'
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Style the header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "DC2626" } }, // Rouge US Aignan
      alignment: { horizontal: "center" }
    };
  }

  // Auto-size columns
  const colWidths = headers.map((header, i) => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => String(row[i] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 30) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Joueurs US Aignan');
  
  // Add metadata
  workbook.Props = {
    Title: 'Export Joueurs US Aignan',
    Subject: 'Statistiques des joueurs',
    Author: 'US Aignan - Plateforme de gestion',
    CreatedDate: new Date()
  };

  XLSX.writeFile(workbook, filename);
};

export const exportStatsToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistiques');

  // Style the header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "DC2626" } },
      alignment: { horizontal: "center" }
    };
  }

  // Auto-size columns
  const colWidths = Object.keys(data[0]).map(key => ({ wch: Math.max(key.length, 20) }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, filename);
}

export const exportPlayerStats = (player: Player, allPlayers: Player[]) => {
  const availableSeasons = getAvailableSeasons(allPlayers);
  const latestSeason = availableSeasons[0] || '';
  const stats = getPlayerStatsForSeason(player, latestSeason, allPlayers);

  const data = {
    'Informations générales': {
      'Nom complet': `${player.firstName} ${player.lastName}`,
      'Date de naissance': player.dateOfBirth,
      'Numéro de licence': player.licenseNumber,
      'Équipe(s)': player.teams.join(', '),
      'Position': player.position
    },
    'Statistiques': {
      'Matchs joués': stats.totalMatches,
      'Minutes jouées': stats.totalMinutes,
      'Entraînements': stats.presentTrainings,
      'Buts marqués': stats.goals,
      'Passes décisives': stats.assists,
      'Clean sheets': stats.cleanSheets,
      'Cartons jaunes': stats.yellowCards,
      'Cartons rouges': stats.redCards
    },
    'Assiduité': {
      'Présence entraînements': `${(stats.trainingAttendanceRateSeason || 0).toFixed(1)}%`,
      'Présence matchs': `${(stats.matchAttendanceRateSeason || 0).toFixed(1)}%`
    },
    'Administratif': {
      'Licence valide': player.licenseValid ? 'Oui' : 'Non',
      'Date Validation Licence': player.licenseValidationDate ? new Date(player.licenseValidationDate).toLocaleDateString('fr-FR') : 'Non définie',
      'Paiement à jour': player.paymentValid ? 'Oui' : 'Non'
    }
  };

  // Create Excel export for individual player
  const headers = ['Catégorie', 'Information', 'Valeur'];
  const excelData: string[][] = [];
  
  Object.entries(data).forEach(([category, items]) => {
    Object.entries(items).forEach(([key, value]) => {
      excelData.push([category, key, String(value)]);
    });
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...excelData]);
  
  // Style the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let row = 0; row <= range.e.r; row++) {
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) continue;
      
      if (row === 0) {
        // Header styling
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "DC2626" } },
          alignment: { horizontal: "center" }
        };
      } else if (col === 0) {
        // Category column styling
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "FEF2F2" } }
        };
      }
    }
  }

  worksheet['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistiques');
  
  XLSX.writeFile(workbook, `stats_${player.firstName}_${player.lastName}_US_Aignan.xlsx`);
};

export const exportToPDF = (
  elementId: string,
  filename: string,
  orientation: 'portrait' | 'landscape' = 'portrait',
  exportOptions?: { margin?: number; tempClass?: string }
) => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Error: Element with ID '${elementId}' not found.`);
    return Promise.reject(`Element with ID '${elementId}' not found.`);
  }

  if (exportOptions?.tempClass) {
    element.classList.add(exportOptions.tempClass);
  }

  const options = {
    margin: exportOptions?.margin ?? 10,
    filename: filename,
    image: {
      type: 'jpeg',
      quality: 0.98
    },
    html2canvas: {
      scale: 2,
      useCORS: true
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: orientation
    }
  };

  return html2pdf()
    .from(element)
    .set(options)
    .save()
    .then(() => {
      if (exportOptions?.tempClass) {
        element.classList.remove(exportOptions.tempClass);
      }
    })
    .catch((err: any) => {
      console.error("Error during PDF generation: ", err);
      if (exportOptions?.tempClass) {
        element.classList.remove(exportOptions.tempClass);
      }
      throw err;
    });
};
