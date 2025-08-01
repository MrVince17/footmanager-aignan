/**
 * Takes a date string or number and returns it in YYYY-MM-DD format.
 * Handles various formats like m/d/yy, and Excel serial numbers.
 */
export function formatDateToYYYYMMDD(dateInput: any): string {
  if (!dateInput) return '';

  const s = String(dateInput).trim();
  const parts = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

  if (!parts) {
    return ''; // Return empty if format is not DD/MM/YYYY
  }

  const day = parseInt(parts[1], 10);
  const month = parseInt(parts[2], 10);
  let year = parseInt(parts[3], 10);

  if (year < 100) {
    const currentYear = new Date().getFullYear();
    year += 2000;
    if (year > currentYear) {
      year -= 100;
    }
  }

  // Create date in UTC to avoid timezone issues
  const date = new Date(Date.UTC(year, month - 1, day));

  if (isNaN(date.getTime())) {
    return '';
  }

  const finalYear = date.getUTCFullYear();
  const finalMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const finalDay = String(date.getUTCDate()).padStart(2, '0');

  return `${finalYear}-${finalMonth}-${finalDay}`;
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
