/**
 * Parses a date string from various formats and returns it in YYYY-MM-DD format.
 * @param dateStr The date string to parse.
 * @returns The formatted date string or null if parsing fails.
 */
export const parseDateString = (dateStr: string | number): string | null => {
  if (!dateStr) {
    return null;
  }

  let date: Date;

  if (typeof dateStr === 'number') {
    // Handle Excel serial date number
    const d = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
    // Adjust for timezone offset
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    date = d;
  } else {
    // Handle string dates
    const parts = String(dateStr).match(/(\d+)/g);
    if (!parts || parts.length < 3) {
      // Try parsing with new Date() as a fallback
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        date = d;
      } else {
        return null;
      }
    } else {
      let day, month, year;
      // d/m/yy or dd/mm/yy
      if (parts[2].length === 2) {
        year = parseInt(parts[2], 10) + 2000;
      } else {
        year = parseInt(parts[2], 10);
      }

      // Assume dd/mm/yyyy or d/m/yyyy
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;

      // Check for mm/dd/yyyy format by checking if month > 12
      if (month >= 12) {
        day = parseInt(parts[1], 10);
        month = parseInt(parts[0], 10) - 1;
      }

      date = new Date(year, month, day);
    }
  }

  if (isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
