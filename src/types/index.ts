export type TargetType = 'daily_target' | 'no_target';

export interface Category {
  id: string;
  groupId: string;
  name: string;
  color: string; // Hex color code
  icon: string;  // Lucide icon identifier
  dailyTarget: number; // in hours, e.g. 8.0, 4.0, 1.5
  targetType: TargetType;
  isEssential?: boolean; // e.g. Sleep
  isCustom?: boolean;    // user-created envelope
}

export interface CategoryGroup {
  id: string;
  name: string;
  color: string;
  order: number;
  isCustom?: boolean;
}

export interface TimeEntry {
  id: string;
  categoryId: string;
  date: string;   // "YYYY-MM-DD"
  duration: number; // in hours (e.g. 1.5 = 1 hour 30 mins)
  note: string;
  createdAt: number;
}

export interface SleepSchedule {
  enabled: boolean;          // Toggleable sleep accounting
  bedtime: string;          // "HH:MM" e.g. "23:00"
  wakeTime: string;         // "HH:MM" e.g. "07:00"
  targetHours: number;      // Calculated hours from bedtime to wakeTime (e.g. 8.0)
  targetSleepHours: number; // Configured target for hours slept (e.g. 8.0h)
  loggedHours?: number;     // Logged sleep today
}

export interface DayBudgetData {
  // Map of categoryId -> budgeted hours for that day
  allocations: Record<string, number>;
  buffer?: number; // Dedicated first-class daily cushion / buffer reserve
  bufferAllocated?: number; // Initial/total buffer allocated for the day
  bufferUsed?: number; // Hours drawn from buffer to cover overruns or reallocate
  sleep?: SleepSchedule; // Dedicated separate sleep schedule
  categoryDirectBudgets?: Record<string, number>; // Direct budget to category group
  notes?: Record<string, string>;
}

export const BUFFER_ID = '__byt_daily_buffer__';

export type AutoAssignMethod = 
  | 'targets' 
  | 'copy_yesterday' 
  | 'copy_to_week' 
  | 'fill_buffer' 
  | 'reset_zero';

export interface TimerSession {
  isRunning: boolean;
  categoryId: string;
  note: string;
  startTime: number | null; // Date.now()
  elapsedSeconds: number;
}

export interface AppSettings {
  dailyCapacityHours: number; // Default 24.0
  mode: 'full_24' | 'waking_16' | 'custom';
  timeFormat: 'decimal' | 'hours_minutes'; // e.g. 2.5h vs 2h 30m
}
