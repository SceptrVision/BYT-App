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

/**
 * Converts "HH:MM" (24h) to total minutes from start of day (0 - 1440)
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
}

/**
 * Converts total minutes from start of day to "HH:MM" (24h)
 */
export function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculates duration in minutes between start and end time (handling midnight if end < start)
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  if (endMin >= startMin) {
    return endMin - startMin;
  }
  // Crosses midnight
  return (1440 - startMin) + endMin;
}

/**
 * Checks whether two time intervals overlap (same day)
 */
export function eventsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);

  // If start is same as end, consider it 0-length
  if (sA >= eA || sB >= eB) return false;

  return sA < eB && sB < eA;
}

/**
 * Returns formatted month and year (e.g. "October 2026")
 */
export function formatMonthYear(year: number, monthIndex: number): string {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export interface MonthGridDay {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Generates calendar grid for a given year and month (0-indexed month)
 */
export function getMonthGrid(year: number, monthIndex: number): MonthGridDay[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  const todayStr = getTodayDateStr();
  const grid: MonthGridDay[] = [];

  // Padding days from previous month
  const prevMonthLastDate = new Date(year, monthIndex, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDate - i;
    const prevDate = new Date(year, monthIndex - 1, d);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    const day = String(prevDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    grid.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(monthIndex + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    const dateStr = `${year}-${m}-${day}`;
    grid.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Padding days to fill out final week to 35 or 42 cells
  const remainingCells = (7 - (grid.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, monthIndex + 1, i);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    grid.push({
      dateStr,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  return grid;
}

/**
 * Formats minutes into "-h -min" format (e.g. 210 -> "3h 30min", 60 -> "1h", 45 -> "45min")
 */
export function formatMinutesHMin(minutes: number): string {
  if (!minutes || minutes <= 0) return '0min';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) {
    return `${h}h ${m}min`;
  }
  if (h > 0) {
    return `${h}h`;
  }
  return `${m}min`;
}
