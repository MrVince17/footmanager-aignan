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
    // The epoch for Excel is 1899-12-30T00:00:00Z
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const excelDate = new Date(excelEpoch.getTime() + dateStr * 86400000);
    date = excelDate;
  } else {
    // Handle string dates
    const s = String(dateStr).trim();
    // Match formats like 25/12/2023, 25-12-2023, 2023-12-25 etc.
    const parts = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

    if (parts) {
      let day, month, year;
      const part1 = parseInt(parts[1], 10);
      const part2 = parseInt(parts[2], 10);
      let part3 = parseInt(parts[3], 10);

      if (part3 < 100) {
        part3 += 2000; // Assume 21st century for 2-digit years
      }
      year = part3;

      // Assuming DD/MM/YYYY for fr-FR locale
      day = part1;
      month = part2;

      // Basic check for MM/DD/YYYY if month > 12
      if (part1 > 12 && part2 <= 12) {
        day = part2;
        month = part1;
      }

      date = new Date(Date.UTC(year, month - 1, day));
    } else {
      // Fallback for other formats like "Jan 1, 2023" or ISO strings
      const d = new Date(s);
      // If it's a valid date, we need to adjust for timezone as `new Date(string)` uses local time
      if (!isNaN(d.getTime())) {
        const timezoneOffset = d.getTimezoneOffset() * 60000;
        date = new Date(d.getTime() + timezoneOffset); // Convert to UTC
      } else {
        return null;
      }
    }
  }

  if (isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
