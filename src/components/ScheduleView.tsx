import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertTriangle,
  Layers,
  Shield,
  CalendarDays,
  CalendarRange,
  Moon,
  Sparkles,
} from 'lucide-react';
import {
  formatDateLabel,
  shiftDate,
  getTodayDateStr,
  getWeekDaysForDate,
  getMonthGrid,
  formatMonthYear,
  formatTime12Hour,
  timeToMinutes,
  minutesToTime,
  calculateDurationMinutes,
  eventsOverlap,
  formatHours,
  formatMinutesHMin,
} from '../utils/dateUtils';
import { ScheduleEvent, BUFFER_ID } from '../types';

// Midnight to Midnight: 00:00 to 24:00 (24 hours full day)
const GRID_START_HOUR = 0;   // 00:00 (Midnight)
const GRID_END_HOUR = 24;    // 24:00 (Midnight)
const TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR; // 24 hours
const HOUR_HEIGHT = 60;      // 60 pixels per hour => 1.0 px/minute exact!
const TOTAL_GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT; // 1440px
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60; // 1.0 px/min

interface PositionedEvent {
  event: ScheduleEvent;
  top: number;
  height: number;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  colIndex: number;
  totalCols: number;
  hasConflict: boolean;
}

interface SleepBlockSegment {
  id: string;
  title: string;
  subtitle: string;
  startTime: string;
  endTime: string;
  startMinutes: number;
  durationMinutes: number;
  top: number;
  height: number;
}

/**
 * Computes exact proportional top, height, and side-by-side columns for overlapping events.
 */
function computeEventLayout(
  events: ScheduleEvent[],
  gridStartHour: number,
  hourHeight: number
): PositionedEvent[] {
  if (events.length === 0) return [];
  const pixelsPerMinute = hourHeight / 60;
  const gridStartMinutes = gridStartHour * 60;

  const mapped = events.map((ev) => {
    const sMin = timeToMinutes(ev.startTime);
    const eMin = timeToMinutes(ev.endTime);
    const dur = ev.durationMinutes || Math.max(15, eMin - sMin);
    const top = Math.max(0, sMin - gridStartMinutes) * pixelsPerMinute;
    // Minimum 26px so compact blocks (15 mins) remain legible
    const height = Math.max(26, dur * pixelsPerMinute);
    return {
      event: ev,
      startMinutes: sMin,
      endMinutes: eMin,
      durationMinutes: dur,
      top,
      height,
    };
  });

  // Sort by start time ascending, then longer duration first
  mapped.sort((a, b) => a.startMinutes - b.startMinutes || b.durationMinutes - a.durationMinutes);

  // Group into overlapping clusters
  const clusters: Array<typeof mapped> = [];
  let currentCluster: typeof mapped = [];
  let currentClusterEnd = -1;

  for (const item of mapped) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      currentClusterEnd = item.endMinutes;
    } else if (item.startMinutes < currentClusterEnd) {
      currentCluster.push(item);
      currentClusterEnd = Math.max(currentClusterEnd, item.endMinutes);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      currentClusterEnd = item.endMinutes;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Assign column slots within each cluster
  const result: PositionedEvent[] = [];

  for (const cluster of clusters) {
    const columns: Array<{ endMinutes: number }> = [];
    const clusterEvents: Array<{ item: (typeof mapped)[0]; colIndex: number }> = [];

    for (const item of cluster) {
      let placedCol = -1;
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].endMinutes <= item.startMinutes) {
          placedCol = i;
          columns[i].endMinutes = item.endMinutes;
          break;
        }
      }
      if (placedCol === -1) {
        placedCol = columns.length;
        columns.push({ endMinutes: item.endMinutes });
      }
      clusterEvents.push({ item, colIndex: placedCol });
    }

    const totalCols = columns.length;
    for (const { item, colIndex } of clusterEvents) {
      result.push({
        ...item,
        colIndex,
        totalCols,
        hasConflict: totalCols > 1,
      });
    }
  }

  return result;
}

export const ScheduleView: React.FC = () => {
  const {
    currentDate,
    setCurrentDate,
    scheduleEvents,
    categories,
    deletedCategories,
    groups,
    dayBuffer,
    daySleep,
    moveScheduleEvent,
    openScheduleEventModal,
    setIsCalendarPickerOpen,
    getScheduleOverlaps,
    getUnderfundedEvents,
    settings,
  } = useTimeBudget();

  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedMonthYear, setSelectedMonthYear] = useState<{ year: number; month: number }>(() => {
    const parts = currentDate.split('-');
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1,
    };
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to morning or current hour on view mode switch or first render
  useEffect(() => {
    if (scrollContainerRef.current) {
      const nowH = new Date().getHours();
      // Scroll to current hour minus 1 or morning 07:00
      const targetHour = Math.max(0, Math.min(18, nowH >= 7 && nowH <= 22 ? nowH - 1 : 6));
      scrollContainerRef.current.scrollTop = targetHour * HOUR_HEIGHT;
    }
  }, [viewMode]);

  // Hours array for timeline grids (from 00:00 midnight to 23:00, all 24 hours)
  const timelineHours = useMemo(() => {
    const hours: number[] = [];
    for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
      hours.push(h);
    }
    return hours;
  }, []);

  const weekDays = useMemo(() => getWeekDaysForDate(currentDate), [currentDate]);

  // Current month grid
  const monthGrid = useMemo(() => {
    return getMonthGrid(selectedMonthYear.year, selectedMonthYear.month);
  }, [selectedMonthYear]);

  // Overlap and underfunded checks for current day
  const conflictsOnCurrentDate = useMemo(() => getScheduleOverlaps(currentDate), [getScheduleOverlaps, currentDate]);
  const underfundedOnCurrentDate = useMemo(() => getUnderfundedEvents(currentDate), [getUnderfundedEvents, currentDate]);

  // Week-wide conflicts and underfunded events
  const weekDates = useMemo(() => new Set(weekDays.map((d) => d.dateStr)), [weekDays]);
  const weekEvents = useMemo(() => scheduleEvents.filter((e) => weekDates.has(e.date)), [scheduleEvents, weekDates]);

  const weekConflicts = useMemo(() => {
    const list: Array<{ eventA: ScheduleEvent; eventB: ScheduleEvent }> = [];
    const grouped: Record<string, ScheduleEvent[]> = {};
    weekEvents.forEach((ev) => {
      if (!grouped[ev.date]) grouped[ev.date] = [];
      grouped[ev.date].push(ev);
    });
    Object.values(grouped).forEach((dayEvts) => {
      for (let i = 0; i < dayEvts.length; i++) {
        for (let j = i + 1; j < dayEvts.length; j++) {
          if (eventsOverlap(dayEvts[i].startTime, dayEvts[i].endTime, dayEvts[j].startTime, dayEvts[j].endTime)) {
            list.push({ eventA: dayEvts[i], eventB: dayEvts[j] });
          }
        }
      }
    });
    return list;
  }, [weekEvents]);

  const weekUnderfunded = useMemo(() => {
    return weekEvents.filter((ev) => {
      const total = (ev.allocations || []).reduce((sum, a) => sum + (a.minutes || 0), 0);
      return total < ev.durationMinutes;
    });
  }, [weekEvents]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'daily') {
      setCurrentDate(shiftDate(currentDate, -1));
    } else if (viewMode === 'weekly') {
      setCurrentDate(shiftDate(currentDate, -7));
    } else {
      setSelectedMonthYear((prev) => {
        let newMonth = prev.month - 1;
        let newYear = prev.year;
        if (newMonth < 0) {
          newMonth = 11;
          newYear -= 1;
        }
        return { year: newYear, month: newMonth };
      });
    }
  };

  const handleNext = () => {
    if (viewMode === 'daily') {
      setCurrentDate(shiftDate(currentDate, 1));
    } else if (viewMode === 'weekly') {
      setCurrentDate(shiftDate(currentDate, 7));
    } else {
      setSelectedMonthYear((prev) => {
        let newMonth = prev.month + 1;
        let newYear = prev.year;
        if (newMonth > 11) {
          newMonth = 0;
          newYear += 1;
        }
        return { year: newYear, month: newMonth };
      });
    }
  };

  const handleToday = () => {
    const today = getTodayDateStr();
    setCurrentDate(today);
    const now = new Date();
    setSelectedMonthYear({ year: now.getFullYear(), month: now.getMonth() });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drop on time grid with continuous minute snapping (15-min increments)
  const handleDropOnGrid = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');
    if (!eventId) return;

    const ev = scheduleEvents.find((item) => item.id === eventId);
    if (!ev) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const minutesFromStart = Math.round((offsetY / PIXELS_PER_MINUTE) / 15) * 15;
    const clampedMinutesFromStart = Math.max(0, Math.min(TOTAL_HOURS * 60 - 15, minutesFromStart));
    const newStartMinutes = GRID_START_HOUR * 60 + clampedMinutesFromStart;
    const duration = ev.durationMinutes || 60;
    const newEndMinutes = (newStartMinutes + duration) % 1440;

    moveScheduleEvent(
      eventId,
      targetDate,
      minutesToTime(newStartMinutes),
      minutesToTime(newEndMinutes)
    );
  };

  const handleDropOnDayCell = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');
    if (!eventId) return;

    const ev = scheduleEvents.find((item) => item.id === eventId);
    if (!ev) return;

    moveScheduleEvent(eventId, targetDate);
  };

  // Click on empty grid area to add event at that exact clicked time
  const handleGridClick = (e: React.MouseEvent, targetDate: string) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const minutesFromStart = Math.floor((offsetY / PIXELS_PER_MINUTE) / 15) * 15;
    const clampedMinutes = Math.max(0, Math.min(TOTAL_HOURS * 60 - 15, minutesFromStart));
    const targetStartMinutes = GRID_START_HOUR * 60 + clampedMinutes;
    openScheduleEventModal(undefined, targetDate, minutesToTime(targetStartMinutes));
  };

  // Helper to get envelope details and parent category (including deleted envelopes for past history)
  const getEnvelopeDetails = (envelopeId: string) => {
    if (envelopeId === BUFFER_ID) {
      return {
        name: 'Daily Buffer',
        categoryName: 'Buffer Reserve',
        color: '#f59e0b',
        isDeleted: false,
      };
    }
    // Check active envelopes
    const env = categories.find((c) => c.id === envelopeId);
    if (env) {
      const group = groups.find((g) => g.id === env.groupId);
      return {
        name: env.name,
        categoryName: group?.name || 'Category',
        color: env.color || group?.color || '#38bdf8',
        isDeleted: false,
      };
    }
    // Check deleted envelopes
    const deletedEnv = (deletedCategories || []).find((c) => c.id === envelopeId);
    if (deletedEnv) {
      const group = groups.find((g) => g.id === deletedEnv.groupId);
      return {
        name: `${deletedEnv.name} (Deleted)`,
        categoryName: group?.name ? `${group.name} (Deleted)` : 'Deleted Category',
        color: '#64748b', // Slate muted
        isDeleted: true,
      };
    }
    return {
      name: 'Envelope (Deleted)',
      categoryName: 'Deleted',
      color: '#64748b',
      isDeleted: true,
    };
  };

  // Calculate planned sleep block segments on a 00:00 to 24:00 day
  const sleepSegments = useMemo<SleepBlockSegment[]>(() => {
    if (!daySleep || !daySleep.enabled) return [];
    const segments: SleepBlockSegment[] = [];

    const bedMin = timeToMinutes(daySleep.bedtime || '23:00');
    const wakeMin = timeToMinutes(daySleep.wakeTime || '07:00');
    const targetHours = daySleep.targetSleepHours || daySleep.targetHours || 8.0;

    if (bedMin > wakeMin) {
      // Crosses midnight (e.g. 23:00 to 07:00)
      // 1. Morning Rest: 00:00 to wakeTime
      if (wakeMin > 0) {
        segments.push({
          id: 'sleep-morning',
          title: 'Night Sleep & Recovery',
          subtitle: `${targetHours}h Target Rest (Wake at ${daySleep.wakeTime})`,
          startTime: '00:00',
          endTime: daySleep.wakeTime,
          startMinutes: 0,
          durationMinutes: wakeMin,
          top: 0,
          height: wakeMin * PIXELS_PER_MINUTE,
        });
      }

      // 2. Evening Rest: bedtime to 24:00
      if (bedMin < 1440) {
        const eveningDur = 1440 - bedMin;
        segments.push({
          id: 'sleep-night',
          title: 'Night Sleep & Recovery',
          subtitle: `Bedtime at ${daySleep.bedtime} (${targetHours}h Target)`,
          startTime: daySleep.bedtime,
          endTime: '24:00',
          startMinutes: bedMin,
          durationMinutes: eveningDur,
          top: bedMin * PIXELS_PER_MINUTE,
          height: eveningDur * PIXELS_PER_MINUTE,
        });
      }
    } else if (wakeMin > bedMin) {
      // Daytime sleep or same-day (e.g. 01:00 to 09:00)
      const dur = wakeMin - bedMin;
      segments.push({
        id: 'sleep-same-day',
        title: 'Sleep & Rest Schedule',
        subtitle: `${targetHours}h Target Rest`,
        startTime: daySleep.bedtime,
        endTime: daySleep.wakeTime,
        startMinutes: bedMin,
        durationMinutes: dur,
        top: bedMin * PIXELS_PER_MINUTE,
        height: dur * PIXELS_PER_MINUTE,
      });
    }

    return segments;
  }, [daySleep]);

  // Layout calculation for current date in Daily View
  const dailyLayoutEvents = useMemo(() => {
    const dayEvts = scheduleEvents.filter((e) => e.date === currentDate);
    return computeEventLayout(dayEvts, GRID_START_HOUR, HOUR_HEIGHT);
  }, [scheduleEvents, currentDate]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Schedule Header: View Controls & Navigation */}
      <div className="bg-[#111726]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Date Navigation & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
              <button
                onClick={handlePrev}
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Current Date Label */}
            <button
              onClick={() => setIsCalendarPickerOpen(true)}
              className="text-left group cursor-pointer hover:bg-slate-800/60 p-1.5 rounded-xl transition-all"
              title="Click to jump to any date"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                  {viewMode === 'daily' && formatDateLabel(currentDate)}
                  {viewMode === 'weekly' && `Week of ${weekDays[0].dayName} ${weekDays[0].dayNumber} – ${weekDays[6].dayName} ${weekDays[6].dayNumber}`}
                  {viewMode === 'monthly' && formatMonthYear(selectedMonthYear.year, selectedMonthYear.month)}
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono block">
                {viewMode === 'daily'
                  ? 'Midnight to Midnight (24h) · Sleep blocks included · Proportional scaling'
                  : viewMode === 'weekly'
                  ? '7-Day Week Schedule (24h) · Sleep blocks anchored · Drag blocks across days'
                  : 'Monthly Overview · Drag blocks between dates'}
              </span>
            </button>
          </div>

          {/* Right: View Mode Toggle & New Event Button */}
          <div className="flex items-center gap-2.5 self-start md:self-center">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'daily'
                    ? 'bg-sky-500 text-slate-950 shadow font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Daily</span>
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'weekly'
                    ? 'bg-sky-500 text-slate-950 shadow font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Weekly</span>
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'monthly'
                    ? 'bg-sky-500 text-slate-950 shadow font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Monthly</span>
              </button>
            </div>

            <button
              onClick={() => openScheduleEventModal(undefined, currentDate, '09:00')}
              className="px-3.5 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">New Event</span>
            </button>
          </div>

        </div>
      </div>

      {/* Warning Banner: Schedule Overlap Conflicts */}
      {(viewMode === 'weekly' ? weekConflicts.length > 0 : conflictsOnCurrentDate.length > 0) && (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border border-amber-600/70 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-200 flex items-center gap-1.5">
                <span>Schedule Conflict Detected!</span>
                <span className="text-[10px] font-mono bg-amber-950 px-2 py-0.5 rounded-full border border-amber-700 text-amber-300">
                  {viewMode === 'weekly' ? `${weekConflicts.length} Overlap(s)` : `${conflictsOnCurrentDate.length} Overlap(s)`}
                </span>
              </h4>
              <p className="text-xs text-amber-200/90 mt-0.5">
                {viewMode === 'weekly' ? (
                  <>"{weekConflicts[0].eventA.title}" overlaps with "{weekConflicts[0].eventB.title}" ({weekConflicts[0].eventA.startTime} – {weekConflicts[0].eventA.endTime}). Drag blocks or adjust times.</>
                ) : (
                  <>"{conflictsOnCurrentDate[0].eventA.title}" overlaps with "{conflictsOnCurrentDate[0].eventB.title}" ({conflictsOnCurrentDate[0].eventA.startTime} – {conflictsOnCurrentDate[0].eventA.endTime}). Please adjust times.</>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const target = viewMode === 'weekly' ? weekConflicts[0].eventB : conflictsOnCurrentDate[0].eventB;
              openScheduleEventModal(target);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-sm"
          >
            Fix Conflict Now
          </button>
        </div>
      )}

      {/* Warning Banner: Underfunded Events Notification */}
      {(viewMode === 'weekly' ? weekUnderfunded.length > 0 : underfundedOnCurrentDate.length > 0) && (
        <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-sky-950/80 border border-sky-600/60 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-sky-200 flex items-center gap-1.5">
                <span>Underfunded Schedule Block</span>
                <span className="text-[10px] font-mono bg-sky-950 px-2 py-0.5 rounded-full border border-sky-700 text-sky-300">
                  {viewMode === 'weekly' ? `${weekUnderfunded.length} Event(s)` : `${underfundedOnCurrentDate.length} Event(s)`}
                </span>
              </h4>
              <p className="text-xs text-sky-200/90 mt-0.5">
                {viewMode === 'weekly' ? (
                  <>"{weekUnderfunded[0].title}" has unassigned minutes. Connect it to an envelope (individual activity) or buffer.</>
                ) : (
                  <>"{underfundedOnCurrentDate[0].event.title}" has {formatMinutesHMin(underfundedOnCurrentDate[0].unassignedMinutes)} unassigned. Assign from an envelope or buffer.</>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const target = viewMode === 'weekly' ? weekUnderfunded[0] : underfundedOnCurrentDate[0].event;
              openScheduleEventModal(target);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-xl transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-sm"
          >
            Assign Envelopes
          </button>
        </div>
      )}

      {/* VIEW 1: DAILY VIEW (Midnight to Midnight, 00:00 to 24:00 with Sleep Blocks) */}
      {viewMode === 'daily' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          {/* Daily Header Info */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                24-Hour Daily Timeline (Midnight – Midnight)
              </span>
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                · Proportional duration scaling · Sleep schedule included
              </span>
            </div>
            <div className="flex items-center gap-3">
              {daySleep.enabled && (
                <span className="text-[11px] font-mono text-indigo-400 flex items-center gap-1 bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-800/40">
                  <Moon className="w-3 h-3" />
                  <span>Sleep: {daySleep.bedtime} – {daySleep.wakeTime}</span>
                </span>
              )}
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {dailyLayoutEvents.length} scheduled event(s)
              </span>
            </div>
          </div>

          {/* Continuous Proportional Daily Timeline (Scrollable) */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto overflow-y-auto max-h-[750px] relative divide-x divide-slate-800/80"
          >
            
            {/* Time Gutter Column (Left: 00:00 to 23:00) */}
            <div
              className="w-20 sm:w-24 shrink-0 bg-slate-950/60 select-none relative"
              style={{ height: `${TOTAL_GRID_HEIGHT}px` }}
            >
              {timelineHours.map((hour, idx) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 pr-3 text-right font-mono text-xs text-slate-400"
                  style={{ top: `${idx * HOUR_HEIGHT}px`, transform: 'translateY(-50%)' }}
                >
                  {formatTime12Hour(`${String(hour).padStart(2, '0')}:00`)}
                </div>
              ))}
              {/* Midnight Bottom Marker */}
              <div
                className="absolute left-0 right-0 pr-3 text-right font-mono text-xs text-slate-400"
                style={{ top: `${TOTAL_GRID_HEIGHT}px`, transform: 'translateY(-50%)' }}
              >
                12:00 AM
              </div>
            </div>

            {/* Main Day Grid Canvas (Right) */}
            <div
              onClick={(e) => handleGridClick(e, currentDate)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnGrid(e, currentDate)}
              className="flex-1 relative cursor-pointer hover:bg-slate-800/10 transition-colors min-w-[500px]"
              style={{ height: `${TOTAL_GRID_HEIGHT}px` }}
            >
              {/* Background Grid Lines (Every Hour & Half Hour) */}
              {timelineHours.map((hour, idx) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-slate-800/60 pointer-events-none"
                  style={{ top: `${idx * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                >
                  {/* Half-hour dashed line */}
                  <div className="border-t border-dashed border-slate-800/25 mt-[30px]" />
                </div>
              ))}

              {/* Dedicated Sleep Schedule Blocks (Anchored Bedtime – Wake Time) */}
              {sleepSegments.map((segment) => (
                <div
                  key={segment.id}
                  style={{
                    top: `${segment.top}px`,
                    height: `${segment.height}px`,
                  }}
                  className="absolute left-2 right-2 rounded-xl border border-indigo-700/50 border-l-4 border-l-indigo-400 bg-gradient-to-r from-indigo-950/70 via-slate-950/85 to-indigo-950/70 p-3 shadow-md z-10 pointer-events-auto select-none overflow-hidden flex flex-col justify-between backdrop-blur-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                        <Moon className="w-3 h-3" />
                      </div>
                      <span className="font-semibold text-xs text-indigo-200">
                        {segment.title}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-300/80 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/60">
                        {segment.startTime} – {segment.endTime} ({formatMinutesHMin(segment.durationMinutes)})
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-700/60 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                      SLEEP RESERVE
                    </span>
                  </div>

                  {segment.height >= 50 && (
                    <div className="text-[11px] text-indigo-300/70 font-mono mt-1 flex items-center justify-between">
                      <span>{segment.subtitle}</span>
                      <span className="text-[10px] text-indigo-400 font-sans italic">
                        BYT Dedicated Sleep Accounting · Unbudgetable for activities
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Positioned Event Blocks (Formatted proportionally by actual duration in -h -min) */}
              {dailyLayoutEvents.map((pos) => {
                const { event: ev, top, height, colIndex, totalCols, hasConflict } = pos;
                const totalAllocated = (ev.allocations || []).reduce((sum, a) => sum + (a.minutes || 0), 0);
                const isUnder = totalAllocated < ev.durationMinutes;
                const mainEnvelope = ev.allocations?.[0];
                const envelopeDetails = mainEnvelope ? getEnvelopeDetails(mainEnvelope.envelopeId) : { name: 'Envelope', categoryName: 'General', color: '#38bdf8', isDeleted: false };
                const primaryColor = envelopeDetails.color;

                // Column positioning for side-by-side overlaps
                const widthPercent = 100 / totalCols;
                const leftPercent = colIndex * widthPercent;
                const isCompact = height < 38; // Short duration block (e.g. 15-20 mins)

                return (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ev.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      openScheduleEventModal(ev);
                    }}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `calc(${leftPercent}% + 8px)`,
                      width: `calc(${widthPercent}% - 16px)`,
                      borderLeftColor: primaryColor,
                    }}
                    className={`absolute rounded-xl px-3 py-1.5 border-l-4 shadow-md bg-slate-950/95 border border-slate-800 hover:border-slate-700 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01] hover:z-30 overflow-hidden flex flex-col justify-between ${
                      hasConflict ? 'ring-2 ring-amber-500/80 bg-amber-950/20' : ''
                    }`}
                  >
                    {isCompact ? (
                      // Compact 1-line layout for short 15-minute events
                      <div className="flex items-center justify-between gap-2 h-full text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-white truncate">{ev.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({formatMinutesHMin(ev.durationMinutes)})
                          </span>
                          {mainEnvelope && (
                            <span
                              style={{ color: primaryColor }}
                              className="text-[10px] font-mono truncate"
                            >
                              ✉️ {envelopeDetails.name}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 shrink-0">
                          {ev.startTime} – {ev.endTime}
                        </div>
                      </div>
                    ) : (
                      // Standard / Multi-line layout for 30m, 45m, 1h, 2h+ events
                      <>
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-white truncate">
                              {ev.title}
                            </span>
                            {ev.isLiveSession && (
                              <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/60 px-1.5 py-0.2 rounded-full flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                LIVE
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                            <Clock className="w-3 h-3 text-sky-400" />
                            <span>
                              {ev.startTime} – {ev.endTime} ({formatMinutesHMin(ev.durationMinutes)})
                            </span>
                          </div>
                        </div>

                        {/* Connected Envelopes (Activities) & Categories */}
                        {height >= 52 && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {(ev.allocations || []).map((alloc, i) => {
                              const allocDet = getEnvelopeDetails(alloc.envelopeId);
                              return (
                                <span
                                  key={i}
                                  title={`Category: ${allocDet.categoryName}`}
                                  style={{
                                    backgroundColor: `${allocDet.color}20`,
                                    borderColor: `${allocDet.color}50`,
                                    color: allocDet.color,
                                  }}
                                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 truncate max-w-[200px] ${
                                    allocDet.isDeleted ? 'opacity-80 italic' : ''
                                  }`}
                                >
                                  ✉️ {allocDet.name}: {formatMinutesHMin(alloc.minutes)}
                                </span>
                              );
                            })}

                            {isUnder && (
                              <span className="text-[10px] font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {formatMinutesHMin(ev.durationMinutes - totalAllocated)} unassigned
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* VIEW 2: WEEKLY VIEW (Midnight to Midnight across 7 days with sleep blocks) */}
      {viewMode === 'weekly' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          {/* Weekday Column Headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[70px_repeat(7,1fr)] border-b border-slate-800 bg-slate-950/70 divide-x divide-slate-800 shrink-0">
            {/* Corner Cell */}
            <div className="p-3 text-center text-[10px] uppercase font-mono text-slate-500 font-semibold flex items-center justify-center">
              Time
            </div>
            {weekDays.map((d) => {
              const dayEvts = scheduleEvents.filter((e) => e.date === d.dateStr);
              const totalMins = dayEvts.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

              return (
                <div
                  key={d.dateStr}
                  onClick={() => setCurrentDate(d.dateStr)}
                  className={`p-2.5 text-center cursor-pointer transition-colors ${
                    d.isSelected
                      ? 'bg-sky-500/10 border-b-2 border-b-sky-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
                    {d.dayName}
                  </div>
                  <div
                    className={`text-base font-bold font-mono my-0.5 ${
                      d.isToday ? 'text-sky-400' : 'text-white'
                    }`}
                  >
                    {d.dayNumber}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {formatHours(totalMins / 60, settings.timeFormat)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 7 Columns Proportional Time Grid (Midnight to Midnight) */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto overflow-y-auto max-h-[750px] relative divide-x divide-slate-800/80"
          >
            
            {/* Shared Time Axis Gutter (00:00 to 23:00) */}
            <div
              className="w-[60px] sm:w-[70px] shrink-0 bg-slate-950/60 select-none relative"
              style={{ height: `${TOTAL_GRID_HEIGHT}px` }}
            >
              {timelineHours.map((hour, idx) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 pr-2 text-right font-mono text-[10px] text-slate-400"
                  style={{ top: `${idx * HOUR_HEIGHT}px`, transform: 'translateY(-50%)' }}
                >
                  {formatTime12Hour(`${String(hour).padStart(2, '0')}:00`)}
                </div>
              ))}
              <div
                className="absolute left-0 right-0 pr-2 text-right font-mono text-[10px] text-slate-400"
                style={{ top: `${TOTAL_GRID_HEIGHT}px`, transform: 'translateY(-50%)' }}
              >
                12:00 AM
              </div>
            </div>

            {/* 7 Day Canvas Columns */}
            <div className="grid grid-cols-7 flex-1 divide-x divide-slate-800 min-w-[700px]">
              {weekDays.map((d) => {
                const dayEvts = scheduleEvents.filter((e) => e.date === d.dateStr);
                const dayPositioned = computeEventLayout(dayEvts, GRID_START_HOUR, HOUR_HEIGHT);

                return (
                  <div
                    key={d.dateStr}
                    onClick={(e) => handleGridClick(e, d.dateStr)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnGrid(e, d.dateStr)}
                    className="relative hover:bg-slate-800/10 transition-colors cursor-pointer"
                    style={{ height: `${TOTAL_GRID_HEIGHT}px` }}
                  >
                    {/* Background hour grid lines */}
                    {timelineHours.map((hour, idx) => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-slate-800/40 pointer-events-none"
                        style={{ top: `${idx * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                      >
                        {/* Half hour dash */}
                        <div className="border-t border-dashed border-slate-800/20 mt-[30px]" />
                      </div>
                    ))}

                    {/* Sleep Blocks for this day */}
                    {sleepSegments.map((segment) => (
                      <div
                        key={`${d.dateStr}-${segment.id}`}
                        style={{
                          top: `${segment.top}px`,
                          height: `${segment.height}px`,
                        }}
                        className="absolute left-1 right-1 rounded-md border border-indigo-700/40 border-l-2 border-l-indigo-400 bg-indigo-950/60 p-1 shadow-xs z-10 pointer-events-auto select-none overflow-hidden text-[9px] font-mono text-indigo-300"
                      >
                        <div className="flex items-center gap-1 font-semibold truncate text-[9px]">
                          <Moon className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                          <span className="truncate">Sleep ({formatMinutesHMin(segment.durationMinutes)})</span>
                        </div>
                        {segment.height >= 40 && (
                          <div className="text-[8px] text-indigo-400/80 truncate mt-0.5">
                            {segment.startTime}–{segment.endTime}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Proportional Event Blocks */}
                    {dayPositioned.map((pos) => {
                      const { event: ev, top, height, colIndex, totalCols, hasConflict } = pos;
                      const totalAllocated = (ev.allocations || []).reduce((sum, a) => sum + (a.minutes || 0), 0);
                      const isUnder = totalAllocated < ev.durationMinutes;
                      const mainEnvelope = ev.allocations?.[0];
                      const envelopeDetails = mainEnvelope ? getEnvelopeDetails(mainEnvelope.envelopeId) : { name: 'Envelope', categoryName: 'General', color: '#38bdf8', isDeleted: false };
                      const mainColor = envelopeDetails.color;

                      const widthPercent = 100 / totalCols;
                      const leftPercent = colIndex * widthPercent;

                      return (
                        <div
                          key={ev.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ev.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            openScheduleEventModal(ev);
                          }}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                            borderLeftColor: mainColor,
                          }}
                          className={`absolute bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-1.5 shadow cursor-grab active:cursor-grabbing border-l-4 transition-all hover:scale-[1.02] hover:z-30 overflow-hidden flex flex-col justify-between ${
                            hasConflict ? 'ring-2 ring-amber-500/80 bg-amber-950/20' : ''
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-xs text-white truncate">
                                {ev.title}
                              </span>
                              {ev.isLiveSession && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Live session" />
                              )}
                            </div>

                            <div className="text-[9px] font-mono text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                              <Clock className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                              <span>{ev.startTime} – {ev.endTime} ({formatMinutesHMin(ev.durationMinutes)})</span>
                            </div>
                          </div>

                          {/* Allocation pills for taller blocks */}
                          {height >= 46 && (
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                              {(ev.allocations || []).map((alloc, i) => {
                                const allocDet = getEnvelopeDetails(alloc.envelopeId);
                                return (
                                  <span
                                    key={i}
                                    title={`Category: ${allocDet.categoryName}`}
                                    style={{
                                      color: allocDet.color,
                                      backgroundColor: `${allocDet.color}20`,
                                    }}
                                    className={`text-[8px] font-mono px-1 py-0.2 rounded font-semibold truncate max-w-[80px] ${
                                      allocDet.isDeleted ? 'opacity-80 italic' : ''
                                    }`}
                                  >
                                    ✉️ {allocDet.name}: {formatMinutesHMin(alloc.minutes)}
                                  </span>
                                );
                              })}
                              {isUnder && (
                                <span className="text-[8px] font-mono text-amber-400 font-bold">
                                  ⚠️ -{formatMinutesHMin(ev.durationMinutes - totalAllocated)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* VIEW 3: MONTHLY VIEW */}
      {viewMode === 'monthly' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/70 text-center py-2.5 divide-x divide-slate-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name) => (
              <div key={name} className="text-xs font-bold uppercase font-mono text-slate-400">
                {name}
              </div>
            ))}
          </div>

          {/* Month Calendar Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-800">
            {monthGrid.map((cell) => {
              const dayEvents = scheduleEvents.filter((e) => e.date === cell.dateStr);

              return (
                <div
                  key={cell.dateStr}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnDayCell(e, cell.dateStr)}
                  onClick={() => {
                    setCurrentDate(cell.dateStr);
                    openScheduleEventModal(undefined, cell.dateStr, '09:00');
                  }}
                  className={`min-h-[110px] p-2 transition-colors cursor-pointer flex flex-col justify-between ${
                    cell.isCurrentMonth
                      ? 'bg-slate-900/60 hover:bg-slate-800/40'
                      : 'bg-slate-950/40 text-slate-600 hover:bg-slate-900/40'
                  } ${cell.isToday ? 'ring-1 ring-inset ring-sky-500/80 bg-sky-950/10' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-bold ${
                        cell.isToday
                          ? 'w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center'
                          : cell.isCurrentMonth
                          ? 'text-slate-200'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {dayEvents.length} ev
                      </span>
                    )}
                  </div>

                  {/* Event Chips */}
                  <div className="space-y-1 overflow-hidden flex-1">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const totalAlloc = (ev.allocations || []).reduce((sum, a) => sum + (a.minutes || 0), 0);
                      const isUnder = totalAlloc < ev.durationMinutes;
                      const mainEnvelope = ev.allocations?.[0];
                      const envelopeDetails = mainEnvelope ? getEnvelopeDetails(mainEnvelope.envelopeId) : { name: 'Envelope', categoryName: 'General', color: '#38bdf8', isDeleted: false };
                      const mainColor = envelopeDetails.color;

                      return (
                        <div
                          key={ev.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ev.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            openScheduleEventModal(ev);
                          }}
                          style={{
                            borderLeftColor: mainColor,
                            backgroundColor: `${mainColor}15`,
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border-l-2 text-white truncate cursor-grab active:cursor-grabbing hover:brightness-125 transition-all flex items-center justify-between ${
                            envelopeDetails.isDeleted ? 'opacity-80 italic' : ''
                          }`}
                        >
                          <span className="truncate">{ev.title} ({formatMinutesHMin(ev.durationMinutes)})</span>
                          {isUnder && (
                            <span className="text-amber-400 font-bold ml-1">!</span>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-slate-500 font-mono block">
                        +{dayEvents.length - 3} more...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
