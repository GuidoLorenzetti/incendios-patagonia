export function parseNASADateTime(dateStr: string, timeStr: string): Date {
  const timePadded = timeStr.padStart(4, "0");
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(5, 7)) - 1;
  const day = parseInt(dateStr.substring(8, 10));
  const hour = parseInt(timePadded.substring(0, 2));
  const minute = parseInt(timePadded.substring(2, 4));

  const utcDate = new Date(Date.UTC(year, month, day, hour, minute));
  
  const utcMinus3 = new Date(utcDate.getTime() - 3 * 60 * 60 * 1000);
  
  return utcMinus3;
}

export function formatDateTimeUTC3(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return "N/A";
  
  const date = parseNASADateTime(dateStr, timeStr || "0000");
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function getTimestampUTC3(dateStr: string, timeStr: string): number {
  const date = parseNASADateTime(dateStr, timeStr);
  return date.getTime();
}
