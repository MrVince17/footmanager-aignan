/**
 * Takes a date string or number and returns it in YYYY-MM-DD format.
 * Handles various formats like m/d/yy, and Excel serial numbers.
 */
export function formatDateToYYYYMMDD(dateInput: any): string {
  if (!dateInput) return '';

  let date: Date;

  if (typeof dateInput === 'number') {
    // Handle Excel serial date number
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    date = new Date(excelEpoch.getTime() + dateInput * 86400000);
  } else {
    const s = String(dateInput).trim();
    // Match formats like 7/1/2025, 07-01-25 etc.
    const parts = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

    if (parts) {
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      let year = parseInt(parts[3], 10);

      if (year < 100) {
        const currentYear = new Date().getFullYear();
        year += 2000;
        if (year > currentYear) {
          year -= 100;
        }
      }

      // Create date in UTC to avoid timezone issues
      date = new Date(Date.UTC(year, month - 1, day));
    } else {
      // Fallback for other formats that new Date() can parse
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        // Adjust for timezone to get correct UTC date
        const timezoneOffset = d.getTimezoneOffset() * 60000;
        date = new Date(d.getTime() + timezoneOffset);
      } else {
        return ''; // Return empty if parsing fails
      }
    }
  }

  if (isNaN(date.getTime())) {
    return '';
  }

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
