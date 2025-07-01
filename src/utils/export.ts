import { Player } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToExcel = (players: Player[], filename: string = 'export_joueurs_US_Aignan.xlsx') => {
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

  const data = players.map(player => [
    player.lastName,
    player.firstName,
    player.dateOfBirth,
    player.licenseNumber,
    player.teams.join(' + '),
    player.position,
    player.totalMatches,
    player.totalMinutes,
    player.totalTrainings,
    player.goals,
    player.assists,
    player.cleanSheets,
    player.yellowCards,
    player.redCards,
    `${player.trainingAttendanceRate.toFixed(1)}%`,
    `${player.matchAttendanceRate.toFixed(1)}%`,
    player.licenseValid ? 'Oui' : 'Non',
    player.paymentValid ? 'Oui' : 'Non'
  ]);

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

export const exportPlayerStats = (player: Player) => {
  const data = {
    'Informations générales': {
      'Nom complet': `${player.firstName} ${player.lastName}`,
      'Date de naissance': player.dateOfBirth,
      'Numéro de licence': player.licenseNumber,
      'Équipe(s)': player.teams.join(', '),
      'Position': player.position
    },
    'Statistiques': {
      'Matchs joués': player.totalMatches,
      'Minutes jouées': player.totalMinutes,
      'Entraînements': player.totalTrainings,
      'Buts marqués': player.goals,
      'Passes décisives': player.assists,
      'Clean sheets': player.cleanSheets,
      'Cartons jaunes': player.yellowCards,
      'Cartons rouges': player.redCards
    },
    'Assiduité': {
      'Présence entraînements': `${player.trainingAttendanceRate.toFixed(1)}%`,
      'Présence matchs': `${player.matchAttendanceRate.toFixed(1)}%`
    },
    'Administratif': {
      'Licence valide': player.licenseValid ? 'Oui' : 'Non',
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

export const exportToPDF = async (elementId: string, filename: string = 'export_US_Aignan.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for PDF export');
    return;
  }

  try {
    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Calculate dimensions to fit the page
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    // Add US Aignan header
    pdf.setFontSize(20);
    pdf.setTextColor(220, 38, 38); // Rouge US Aignan
    pdf.text('US AIGNAN', pdfWidth / 2, 15, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Plateforme de Gestion d\'Équipe', pdfWidth / 2, 22, { align: 'center' });
    
    // Add the captured content
    pdf.addImage(imgData, 'PNG', imgX, imgY + 15, imgWidth * ratio, imgHeight * ratio);
    
    // Add footer
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 10, pdfHeight - 10);
    
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Erreur lors de la génération du PDF');
  }
};