import React, { useState, useEffect } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { X, Clock, Play, Check, Calendar, AlertTriangle, Layers } from 'lucide-react';
import {
  parseHourInput,
  formatHours,
  getWeekDaysForDate,
  calculateDurationMinutes,
  formatTime12Hour,
  eventsOverlap,
} from '../utils/dateUtils';

export const LogTimeModal: React.FC = () => {
  const {
    isLogModalOpen,
    closeLogModal,
    logModalPresetCategory,
    categories,
    groups,
    currentDate,
    addTimeEntry,
    addScheduleEvent,
    scheduleEvents,
    startTimer,
    dayAvailable,
    settings,
  } = useTimeBudget();

  const [categoryId, setCategoryId] = useState('');
  const [entryMode, setEntryMode] = useState<'time_block' | 'duration'>('time_block');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [durationInput, setDurationInput] = useState('1.0');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => currentDate);
  const [errorMsg, setErrorMsg] = useState('');

  const weekDays = getWeekDaysForDate(currentDate);

  useEffect(() => {
    if (isLogModalOpen) {
      setErrorMsg('');
      setNote('');
      setDurationInput('1.0');
      setDate(currentDate);

      // Default start/end time based on current hour
      const now = new Date();
      const curH = String(now.getHours()).padStart(2, '0');
      const nextH = String((now.getHours() + 1) % 24).padStart(2, '0');
      setStartTime(`${curH}:00`);
      setEndTime(`${nextH}:00`);

      if (logModalPresetCategory) {
        setCategoryId(logModalPresetCategory);
      } else if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    }
  }, [isLogModalOpen, logModalPresetCategory, categories, currentDate]);

  if (!isLogModalOpen) return null;

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const availableInCat = selectedCategory ? dayAvailable[selectedCategory.id] || 0 : 0;

  // Calculate duration if time block mode is active
  const blockDurationMinutes = calculateDurationMinutes(startTime, endTime);
  const blockDurationHours = Math.round((blockDurationMinutes / 60) * 10) / 10;

  // Overlap conflict detection against existing schedule events on that date
  const overlapConflict = entryMode === 'time_block'
    ? scheduleEvents.find(
        (ev) => ev.date === date && eventsOverlap(startTime, endTime, ev.startTime, ev.endTime)
      )
    : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setErrorMsg('Please select an envelope');
      return;
    }

    if (entryMode === 'time_block') {
      if (blockDurationMinutes <= 0) {
        setErrorMsg('Time block duration must be greater than 0 minutes');
        return;
      }

      // Add as schedule block (which automatically updates the daily budget envelope logged time)
      addScheduleEvent({
        title: note.trim() || `${selectedCategory?.name || 'Envelope'} Session`,
        date,
        startTime,
        endTime,
        durationMinutes: blockDurationMinutes,
        allocations: [{ envelopeId: categoryId, minutes: blockDurationMinutes }],
        notes: note.trim(),
      });
    } else {
      const duration = parseHourInput(durationInput);
      if (duration <= 0) {
        setErrorMsg('Please enter a duration greater than 0');
        return;
      }

      addTimeEntry({
        categoryId,
        date,
        duration: Math.round(duration * 10) / 10,
        note: note.trim() || 'Logged time session',
      });
    }

    closeLogModal();
  };

  const handleStartLiveTimer = () => {
    if (!categoryId) return;
    startTimer(categoryId, note.trim() || undefined);
    closeLogModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Log Time to Envelope
              </h3>
              <p className="text-xs text-slate-400">
                Log a time block to both the envelope and schedule tab.
              </p>
            </div>
          </div>
          <button
            onClick={closeLogModal}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Mode Switcher: Time Block vs Simple Duration */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setEntryMode('time_block')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                entryMode === 'time_block'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Time Block (Adds to Schedule)</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('duration')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                entryMode === 'duration'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Duration Only (Hours)</span>
            </button>
          </div>

          {/* Envelope selection grouped by Category */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block font-mono">
                Envelope (Individual Activity)
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Sorted by Category</span>
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              {groups.map((group) => {
                const groupEnvs = categories.filter((c) => c.groupId === group.id);
                if (groupEnvs.length === 0) return null;
                return (
                  <optgroup key={group.id} label={`Category: ${group.name}`}>
                    {groupEnvs.map((c) => (
                      <option key={c.id} value={c.id}>
                        ✉️ {c.name} ({formatHours(dayAvailable[c.id] || 0, settings.timeFormat)} avail today)
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            {selectedCategory && (
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Remaining in envelope:</span>
                <span
                  className={`font-mono font-medium ${
                    availableInCat < 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {formatHours(availableInCat, settings.timeFormat)}
                </span>
              </div>
            )}
          </div>

          {/* Quick Day Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block font-mono">
              Date
            </label>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d) => {
                const isSelected = d.dateStr === date;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setDate(d.dateStr)}
                    className={`py-2 px-1 text-center rounded-lg border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-white font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-mono">{d.dayName}</div>
                    <div className="text-xs font-mono">{d.dayNumber}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Block Inputs OR Duration Input */}
          {entryMode === 'time_block' ? (
            <div className="space-y-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between font-mono">
                    <span>Start Time</span>
                    <span className="text-sky-400 font-normal">{formatTime12Hour(startTime)}</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between font-mono">
                    <span>End Time</span>
                    <span className="text-sky-400 font-normal">{formatTime12Hour(endTime)}</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Calculated Duration Banner */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Duration:</span>
                <span className="font-mono font-bold text-white">
                  {blockDurationMinutes} mins ({formatHours(blockDurationHours, settings.timeFormat)})
                </span>
              </div>

              {/* Overlap Conflict Alert */}
              {overlapConflict && (
                <div className="bg-amber-950/50 border border-amber-800/70 rounded-lg p-2.5 text-xs text-amber-200 flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-300">Schedule Overlap Alert!</span>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      This block overlaps with existing event "{overlapConflict.title}" ({overlapConflict.startTime} – {overlapConflict.endTime}). Please adjust your times to avoid double-booking.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between font-mono">
                <span>Duration</span>
                <span className="text-[11px] text-slate-500 font-normal normal-case">
                  e.g. "1.5", "1h 30m", or "45m"
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  placeholder="1.0"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-1">
                  {['0.5', '1.0', '1.5', '2.0'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDurationInput(preset)}
                      className="px-2 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono transition-colors cursor-pointer"
                    >
                      {preset}h
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description / Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block font-mono">
              Activity Description (Note)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Completed homework assignment, client meeting..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 p-2 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleStartLiveTimer}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 py-1 transition-colors self-start cursor-pointer"
              title="Start real-time stopwatch session"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Or start live timer instead</span>
            </button>

            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={closeLogModal}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save to Envelope & Schedule</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
