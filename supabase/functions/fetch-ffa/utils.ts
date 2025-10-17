export function sortDataByContractAndPeriod(data) {
    data.sort((a, b)=>{
      if (a.Contract < b.Contract) return -1;
      if (a.Contract > b.Contract) return 1;
      if (a.Period < b.Period) return -1;
      if (a.Period > b.Period) return 1;
      return 0;
    });
    return data;
  }
  export function calculateMonthsToTargetDate(targetDate) {
    const currentDate = new Date();
    const targetMoment = new Date(targetDate);
    const diffInMilliseconds = targetMoment - currentDate;
    const diffInMonths = diffInMilliseconds / (1000 * 60 * 60 * 24 * 30.44);
    return Math.floor(diffInMonths);
  }
  export function getMonthNameFromDate(date) {
    const monthNames = [
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
    const targetDate = new Date(date);
    const monthIndex = targetDate.getMonth();
    const previousMonthIndex = (monthIndex + 12) % 12;
    const monthName = monthNames[previousMonthIndex];
    return monthName;
  }
  export function getYesterday(days) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - days);
    const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    const day = String(yesterday.getDate()).padStart(2, "0");
    const year = yesterday.getFullYear();
    return `${day}/${month}/${year}`;
  }
  export function getPeriodFrom() {
    const date = new Date();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    const monthIndex = date.getMonth();
    const monthName = monthNames[monthIndex];
    const year = date.getFullYear().toString().slice(-2);
    const formattedDate = monthName + year;
    return formattedDate;
  }
  export function getPeriodTo() {
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 12, currentDate.getDate());
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    const monthIndex = futureDate.getMonth();
    const monthName = monthNames[monthIndex];
    const year = futureDate.getFullYear().toString().slice(-2);
    const formattedDate = monthName + year;
    return formattedDate;
  }
  