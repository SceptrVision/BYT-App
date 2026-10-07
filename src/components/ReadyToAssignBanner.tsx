import React, { useState } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRightLeft,
  Copy,
} from 'lucide-react';
import {
  formatDateLabel,
  isTodayDate,
  formatHours,
  getWeekDaysForDate,
} from '../utils/dateUtils';

export const ReadyToAssignBanner: React.FC = () => {
  const {
    currentDate,
    setCurrentDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    totalCapacity,
    totalBudgeted,
    totalLogged,
    readyToAssign,
    overspentCategories,
    openReallocateModal,
    autoAssign,
    setIsCalendarPickerOpen,
    settings,
  } = useTimeBudget();

  const [showAutoAssignMenu, setShowAutoAssignMenu] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const isZeroSum = Math.abs(readyToAssign) < 0.05;
  const isOverAllocated = readyToAssign < -0.05;
  const isUnderAllocated = readyToAssign > 0.05;
  const isToday = isTodayDate(currentDate);

  const weekDays = getWeekDaysForDate(currentDate);

  let bannerBg = 'bg-slate-900 border-slate-800';
  let numberColor = 'text-emerald-400';

  if (isOverAllocated) {
    bannerBg = 'bg-red-950/20 border-red-900/40';
    numberColor = 'text-red-400';
  } else if (isUnderAllocated) {
    bannerBg = 'bg-amber-950/20 border-amber-900/40';
    numberColor = 'text-amber-400';
  }

  return (
    <div className="space-y-3">
      {/* Top Day Navigator & Weekday Quick Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        
        {/* Day navigation controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={goToPreviousDay}
              title="Previous Day"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Clickable Day Label: Opens Calendar View for Any Month/Year */}
            <button
              onClick={() => setIsCalendarPickerOpen(true)}
              title="Click to open calendar view and pick specific days out of any month or year"
              className="px-3 py-1 text-sm font-semibold text-slate-100 flex items-center gap-2 hover:bg-slate-800 rounded transition-colors cursor-pointer group"
            >
              <Calendar className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="group-hover:text-emerald-300 transition-colors underline decoration-dotted underline-offset-4 decoration-emerald-500/50">
                {formatDateLabel(currentDate)}
              </span>
              <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-normal ml-0.5">
                (pick date)
              </span>
            </button>

            <button
              onClick={goToNextDay}
              title="Next Day"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={goToToday}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 px-2 py-1 cursor-pointer"
            >
              Back to Today
            </button>
          )}
        </div>

        {/* 7-Day Quick Switcher Strip */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {weekDays.map((d) => (
            <button
              key={d.dateStr}
              onClick={() => setCurrentDate(d.dateStr)}
              className={`px-2 py-1 rounded-md text-xs font-mono transition-all flex flex-col items-center min-w-[42px] cursor-pointer ${
                d.isSelected
                  ? 'bg-gradient-to-r from-emerald-500/20 to-sky-500/20 border border-emerald-500 text-emerald-300 font-bold'
                  : d.isToday
                  ? 'bg-slate-800/80 text-sky-300 border border-sky-800/60'
                  : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] uppercase">{d.dayName}</span>
              <span className="text-xs">{d.dayNumber}</span>
            </button>
          ))}
        </div>

        {/* Quick Tools: Roll with the Punches, Apply to Next 6 Days Button, & Auto-Assign Menu */}
        <div className="flex items-center gap-2 relative flex-wrap">
          <button
            onClick={() => openReallocateModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-md transition-colors cursor-pointer"
            title="Roll with the punches: Reallocate hours between today's envelopes"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
            <span>Roll With Punches</span>
          </button>

          {/* Explicit Button: Apply today's plan to next 6 days */}
          <button
            onClick={() => {
              autoAssign('copy_to_week');
              setCopiedNotification(true);
              setTimeout(() => setCopiedNotification(false), 2500);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-sky-300 hover:text-white border border-slate-800 hover:border-sky-600/50 rounded-md transition-colors cursor-pointer"
            title="Auto-Assign Button: Copy today's plan forward to the next 6 days"
          >
            <Copy className="w-3.5 h-3.5 text-sky-400" />
            <span>Apply to Next 6 Days</span>
          </button>

          {copiedNotification && (
            <span className="text-[11px] font-medium text-emerald-300 bg-emerald-950/90 border border-emerald-600/60 rounded px-2 py-1 flex items-center gap-1 animate-in fade-in duration-150">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Applied to next 6 days!
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => setShowAutoAssignMenu(!showAutoAssignMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-md transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Assign</span>
            </button>

            {showAutoAssignMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowAutoAssignMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-60 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-30 py-1 text-xs">
                  <button
                    onClick={() => {
                      autoAssign('targets');
                      setShowAutoAssignMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex flex-col cursor-pointer"
                  >
                    <span className="font-semibold text-white">Assign to Daily Targets</span>
                    <span className="text-[11px] text-slate-400">
                      Fill all envelopes to their daily planned hours
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      autoAssign('copy_yesterday');
                      setShowAutoAssignMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex flex-col border-t border-slate-800/60 cursor-pointer"
                  >
                    <span className="font-semibold text-white">Copy Yesterday's Plan</span>
                    <span className="text-[11px] text-slate-400">
                      Duplicate yesterday's allotment to today
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      autoAssign('copy_to_week');
                      setShowAutoAssignMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex flex-col border-t border-slate-800/60 cursor-pointer"
                  >
                    <span className="font-semibold text-sky-300 flex items-center gap-1">
                      <Copy className="w-3 h-3" />
                      Apply to Next 6 Days
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Copy today's schedule forward for the week
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      autoAssign('fill_buffer');
                      setShowAutoAssignMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex flex-col border-t border-slate-800/60 cursor-pointer"
                  >
                    <span className="font-semibold text-white">Stash Remaining in Buffer</span>
                    <span className="text-[11px] text-slate-400">
                      Put all unassigned hours into Buffer Cushion
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      autoAssign('reset_zero');
                      setShowAutoAssignMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-slate-800 flex flex-col border-t border-slate-800/60 cursor-pointer"
                  >
                    <span className="font-semibold">Reset Day to Zero</span>
                    <span className="text-[11px] text-slate-500">
                      Clear all assigned hours for this day
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Main Ready to Assign Banner */}
      <div className={`rounded-xl border p-4 sm:p-5 transition-all ${bannerBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Ready to Assign Counter */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Ready to Assign (Today)
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight tabular-nums ${numberColor}`}
                >
                  {formatHours(readyToAssign, settings.timeFormat)}
                </span>
                <span className="text-xs text-slate-400">
                  {isZeroSum
                    ? 'Every hour has a job'
                    : isOverAllocated
                    ? 'Over-allocated'
                    : 'Unassigned hours'}
                </span>
              </div>
            </div>

            {/* Informational Message */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-800 pl-4 py-1">
              {isZeroSum && (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>All 24 hours of today are budgeted!</span>
                </div>
              )}
              {isUnderAllocated && (
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    You have unallocated time. Assign it to an envelope or stash it in Buffer!
                  </span>
                </div>
              )}
              {isOverAllocated && (
                <div className="flex items-center gap-1.5 text-red-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    You allocated more hours than exist in today's {totalCapacity}h pool.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Daily Totals (Capacity, Budgeted, Logged, Remaining) */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 border-t lg:border-t-0 lg:border-l border-slate-800 pt-3 lg:pt-0 lg:pl-6 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Daily Pool</div>
              <div className="text-base font-semibold text-slate-100 font-mono tabular-nums">
                {formatHours(totalCapacity, settings.timeFormat)}
              </div>
              <div className="text-[11px] text-slate-500">24-hour day</div>
            </div>

            <div>
              <div className="text-slate-400 font-medium">Budgeted Today</div>
              <div className="text-base font-semibold text-slate-100 font-mono tabular-nums">
                {formatHours(totalBudgeted, settings.timeFormat)}
              </div>
              <div className="text-[11px] text-slate-500">
                {Math.round((totalBudgeted / totalCapacity) * 100)}% of day
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-medium">Actual Logged</div>
              <div className="text-base font-semibold text-slate-100 font-mono tabular-nums">
                {formatHours(totalLogged, settings.timeFormat)}
              </div>
              <div className="text-[11px] text-slate-500">
                {formatHours(totalBudgeted - totalLogged, settings.timeFormat)} remaining
              </div>
            </div>
          </div>

        </div>

        {/* Overspent Envelopes Alert */}
        {overspentCategories.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-red-950/40 -mx-4 -mb-4 p-3 rounded-b-xl">
            <div className="flex items-center gap-2 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>
                <strong>{overspentCategories.length} envelope{overspentCategories.length > 1 ? 's' : ''} overspent today:</strong>{' '}
                {overspentCategories.map((c) => c.name).join(', ')}.
              </span>
            </div>
            <button
              onClick={() => openReallocateModal(overspentCategories[0].id)}
              className="text-xs font-semibold px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              Cover Overspending
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
