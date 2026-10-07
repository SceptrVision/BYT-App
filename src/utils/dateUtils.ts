/**
 * Utility functions for date, day, and hour calculations in BYT (Buy Your Time)
 */

export function formatHours(
  hours: number,
  format: 'decimal' | 'hours_minutes' = 'decimal',
  showZero = true
): string {
  if (Math.abs(hours) < 0.001) {
    if (!showZero) return format === 'hours_minutes' ? '0h 00m' : '0.0h';
    return format === 'hours_minutes' ? '0h 00m' : '0.0h';
  }
  
  const isNegative = hours < -0.0001;
  const absHours = Math.abs(hours);

  if (format === 'hours_minutes') {
    const totalMinutes = Math.round(absHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const sign = isNegative ? '-' : '';
    return `${sign}${h}h ${String(m).padStart(2, '0')}m`;
  }

  // Decimal format with 1 decimal place
  const sign = isNegative ? '-' : '';
  const rounded = Math.round(absHours * 10) / 10;
  return `${sign}${rounded.toFixed(1)}h`;
}

export function parseHourInput(input: string): number {
  if (!input) return 0;
  const clean = input.trim().toLowerCase();
  
  // Format "1:30" or "08:15"
  const colonMatch = clean.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10);
    const m = parseInt(colonMatch[2], 10);
    return Math.round((h + m / 60) * 100) / 100;
  }

  const hMatch = clean.match(/(\d+(?:\.\d+)?)\s*h/);
  const mMatch = clean.match(/(\d+(?:\.\d+)?)\s*m/);

  if (hMatch || mMatch) {
    const h = hMatch ? parseFloat(hMatch[1]) : 0;
    const m = mMatch ? parseFloat(mMatch[1]) : 0;
    return Math.round((h + m / 60) * 100) / 100;
  }

  const direct = parseFloat(clean);
  return isNaN(direct) ? 0 : Math.max(0, direct);
}

/**
 * Calculates sleep hours between target bedtime and wake time (handling midnight rollover)
 */
export function calculateSleepHoursFromTimes(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) return 8.0;
  const [bH, bM] = bedtime.split(':').map((v) => parseInt(v, 10));
  const [wH, wM] = wakeTime.split(':').map((v) => parseInt(v, 10));
  if (isNaN(bH) || isNaN(bM) || isNaN(wH) || isNaN(wM)) return 8.0;

  const bedMinutes = bH * 60 + bM;
  const wakeMinutes = wH * 60 + wM;

  let diffMinutes = 0;
  if (wakeMinutes >= bedMinutes) {
    diffMinutes = wakeMinutes - bedMinutes;
  } else {
    // Crosses midnight, e.g. 23:00 to 07:00
    diffMinutes = (1440 - bedMinutes) + wakeMinutes;
  }
  return Math.round((diffMinutes / 60) * 10) / 10;
}

/**
 * Converts 24h time ("23:00") into friendly 12h time ("11:00 PM")
 */
export function formatTime12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return timeStr;

  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = String(m).padStart(2, '0');
  return `${displayH}:${displayM} ${period}`;
}

export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDate(dateStr: string, offsetDays: number): string {
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + offsetDays);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isTodayDate(dateStr: string): boolean {
  return dateStr === getTodayDateStr();
}

export function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  
  const isToday = isTodayDate(dateStr);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  const year = d.getFullYear();

  if (isToday) {
    return `Today (${weekday}, ${month} ${day}, ${year})`;
  }
  return `${weekday}, ${month} ${day}, ${year}`;
}

export function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Returns the Monday to Sunday week days enclosing the given date
export function getWeekDaysForDate(dateStr: string): Array<{
  dateStr: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
}> {
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const dayOfWeek = d.getDay();
  // Monday offset: if Sunday (0), Monday was 6 days ago; else (dayOfWeek - 1) days ago
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);

  const todayStr = getTodayDateStr();
  const result = [];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);

    const year = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(cur.getDate()).padStart(2, '0');
    const curDateStr = `${year}-${month}-${day}`;

    result.push({
      dateStr: curDateStr,
      dayName: cur.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: cur.getDate(),
      isToday: curDateStr === todayStr,
      isSelected: curDateStr === dateStr,
    });
  }

  return result;
}
