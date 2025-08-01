/**
 * Takes a date string or number and returns it in YYYY-MM-DD format.
 * Handles various formats like d/m/yy, m/d/yy, and Excel serial numbers.
 */
export function formatDateToYYYYMMDD(dateInput: any): string {
  if (!dateInput) return '';

  let date: Date;

  if (typeof dateInput === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    date = new Date(excelEpoch.getTime() + dateInput * 86400000);
  } else {
    const s = String(dateInput).trim();
    let d = new Date(s);
    if (!isNaN(d.getTime())) {
      date = d;
    } else {
      const parts = s.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
      if (parts) {
        let day = parseInt(parts[1], 10);
        let month = parseInt(parts[2], 10);
        let year = parseInt(parts[3], 10);

        if (year < 100) year += 2000;

        if (day > 12 && month <= 12) {
          [day, month] = [month, day];
        }
        date = new Date(Date.UTC(year, month - 1, day));
      } else {
        return '';
      }
    }
  }

  if (isNaN(date.getTime())) return '';

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Takes a date in YYYY-MM-DD format and returns it as DD/MM/YYYY for display.
 */
export function formatDateToDDMMYYYY(dateString: string | null | undefined): string {
  if (!dateString) return 'Non définie';
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return 'Date invalide';
    return `${day}/${month}/${year}`;
  } catch (e) {
    return 'Date invalide';
  }
}
