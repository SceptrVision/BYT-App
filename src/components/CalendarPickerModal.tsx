import React, { useState } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { getTodayDateStr } from '../utils/dateUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CalendarPickerModal: React.FC = () => {
  const {
    currentDate,
    setCurrentDate,
    isCalendarPickerOpen,
    setIsCalendarPickerOpen,
    entries,
  } = useTimeBudget();

  // Parse currently selected date into initial view year and month
  const [viewYear, setViewYear] = useState(() => {
    const parts = (currentDate || getTodayDateStr()).split('-');
    return parseInt(parts[0], 10) || new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState(() => {
    const parts = (currentDate || getTodayDateStr()).split('-');
    return (parseInt(parts[1], 10) - 1) || new Date().getMonth();
  });

  if (!isCalendarPickerOpen) return null;

  const todayStr = getTodayDateStr();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (dateStr: string) => {
    setCurrentDate(dateStr);
    setIsCalendarPickerOpen(false);
  };

  const handleGoToday = () => {
    const t = getTodayDateStr();
    setCurrentDate(t);
    const parts = t.split('-');
    setViewYear(parseInt(parts[0], 10));
    setViewMonth(parseInt(parts[1], 10) - 1);
    setIsCalendarPickerOpen(false);
  };

  // Generate days in month
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Dates with logged entries
  const datesWithEntries = new Set(entries.map((e) => e.date));

  // Available years: 2020 through 2035
  const yearOptions: number[] = [];
  for (let y = 2020; y <= 2035; y++) {
    yearOptions.push(y);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Select Date</h3>
              <p className="text-[11px] text-slate-400">Jump to any day, month, or year</p>
            </div>
          </div>

          <button
            onClick={() => setIsCalendarPickerOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month & Year Navigation Toolbar */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-lg p-1.5">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs font-semibold text-white focus:outline-none cursor-pointer font-mono"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Day Grid */}
          <div>
            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono font-semibold text-slate-500 mb-1">
              {WEEKDAY_NAMES.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty padding slots before day 1 */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-8" />
              ))}

              {/* Days in Month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const formattedMonth = String(viewMonth + 1).padStart(2, '0');
                const formattedDay = String(dayNum).padStart(2, '0');
                const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;

                const isSelected = dateStr === currentDate;
                const isToday = dateStr === todayStr;
                const hasEntries = datesWithEntries.has(dateStr);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleSelectDate(dateStr)}
                    className={`h-8 rounded-md text-xs font-mono font-medium transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                        : isToday
                        ? 'bg-sky-950/80 border border-sky-600/70 text-sky-300 font-semibold hover:bg-sky-900/60'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {hasEntries && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-emerald-400 absolute bottom-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts & Native Date Jump */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleGoToday}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Jump to Today</span>
            </button>

            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px]">Exact:</span>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => {
                  if (e.target.value) {
                    handleSelectDate(e.target.value);
                  }
                }}
                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-300 focus:outline-none font-mono cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
