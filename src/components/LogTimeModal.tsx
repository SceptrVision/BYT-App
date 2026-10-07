import React, { useState, useEffect } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { X, Clock, Play, Check } from 'lucide-react';
import { parseHourInput, formatHours, getWeekDaysForDate } from '../utils/dateUtils';

export const LogTimeModal: React.FC = () => {
  const {
    isLogModalOpen,
    closeLogModal,
    logModalPresetCategory,
    categories,
    currentDate,
    addTimeEntry,
    startTimer,
    dayAvailable,
    settings,
  } = useTimeBudget();

  const [categoryId, setCategoryId] = useState('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseHourInput(durationInput);
    if (duration <= 0) {
      setErrorMsg('Please enter a duration greater than 0');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Please select an envelope');
      return;
    }

    addTimeEntry({
      categoryId,
      date,
      duration: Math.round(duration * 10) / 10,
      note: note.trim() || 'Logged time session',
    });

    closeLogModal();
  };

  const handleStartLiveTimer = () => {
    if (!categoryId) return;
    startTimer(categoryId, note.trim() || undefined);
    closeLogModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        
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
                Record actual activity against today's budgeted hours.
              </p>
            </div>
          </div>
          <button
            onClick={closeLogModal}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Envelope / Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatHours(dayAvailable[c.id] || 0, settings.timeFormat)} avail today)
                </option>
              ))}
            </select>
            {selectedCategory && (
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Remaining today:</span>
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
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
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

          {/* Duration Input & Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Duration</span>
              <span className="text-[11px] text-slate-500 font-normal normal-case">
                Supports "1.5", "1h 30m", or "45m"
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

          {/* Description / Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              What did you accomplish? (Note)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Completed API endpoints, 5k morning run..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 p-2 rounded">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
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
                <span>Save to Envelope</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
