// ---- Helpers ----
export function formatDateToYYMMDD(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }
  export function getYesterday(days) {
    const today = new Date();
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - days);
    return d;
  }
  export function getMonthName(idx0to11) {
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec"
    ];
    return months[idx0to11 % 12];
  }
  export function monthFromPeriod(period_name) {
    const i = period_name.indexOf("M");
    if (i === -1) return null;
    const mm = period_name.substring(i + 1, i + 3);
    const n = Number.parseInt(mm, 10);
    return Number.isFinite(n) ? n : null;
  }
  