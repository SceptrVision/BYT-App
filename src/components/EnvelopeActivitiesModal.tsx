import React, { useState, useMemo } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { CategoryIcon } from './CategoryIcon';
import { formatHours, formatDateLabel } from '../utils/dateUtils';
import {
  X,
  Plus,
  Play,
  Pause,
  Clock,
  Trash2,
  Edit2,
  Check,
  Search,
  Calendar,
  ArrowRightLeft,
  CalendarDays,
} from 'lucide-react';

export const EnvelopeActivitiesModal: React.FC = () => {
  const {
    selectedEnvelopeForActivities,
    closeEnvelopeActivities,
    currentDate,
    entries,
    groups,
    dayBudget,
    dayLogged,
    dayAvailable,
    deleteTimeEntry,
    editTimeEntry,
    addTimeEntry,
    openReallocateModal,
    timer,
    toggleCategoryTimer,
    stopAndLogTimer,
    settings,
  } = useTimeBudget();

  const [activeScope, setActiveScope] = useState<'today' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDuration, setNewDuration] = useState('1.0');
  const [newNote, setNewNote] = useState('');
  const [newDate, setNewDate] = useState(currentDate);

  // Editing state for an existing entry
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState('');
  const [editNote, setEditNote] = useState('');

  const category = selectedEnvelopeForActivities;

  const envelopeEntries = useMemo(() => {
    if (!category) return [];
    const catEntries = entries.filter((e) => e.categoryId === category.id);
    if (activeScope === 'today') {
      return catEntries.filter((e) => e.date === currentDate);
    }
    return catEntries;
  }, [entries, category, activeScope, currentDate]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return envelopeEntries;
    const q = searchQuery.toLowerCase();
    return envelopeEntries.filter((e) => e.note?.toLowerCase().includes(q));
  }, [envelopeEntries, searchQuery]);

  const totalFilteredHours = useMemo(() => {
    const sum = filteredEntries.reduce((acc, e) => acc + e.duration, 0);
    return Math.round(sum * 10) / 10;
  }, [filteredEntries]);

  if (!category) return null;

  const group = groups.find((g) => g.id === category.groupId);
  const budgeted = dayBudget[category.id] ?? category.dailyTarget;
  const logged = dayLogged[category.id] || 0;
  const available = dayAvailable[category.id] || 0;
  const isOverspent = available < -0.05;

  const isCurrentTimer = timer.categoryId === category.id;
  const isTimerRunning = isCurrentTimer && timer.isRunning;
  const isTimerPaused = isCurrentTimer && !timer.isRunning && timer.elapsedSeconds > 0;

  const formatTimerSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartEdit = (entry: (typeof entries)[0]) => {
    setEditingEntryId(entry.id);
    setEditDuration(entry.duration.toString());
    setEditNote(entry.note);
  };

  const handleSaveEdit = (id: string) => {
    const parsed = parseFloat(editDuration);
    if (!isNaN(parsed) && parsed > 0) {
      editTimeEntry(id, {
        duration: Math.round(parsed * 10) / 10,
        note: editNote.trim(),
      });
    }
    setEditingEntryId(null);
  };

  const handleCreateNewEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const dur = parseFloat(newDuration);
    if (isNaN(dur) || dur <= 0) return;

    addTimeEntry({
      categoryId: category.id,
      date: newDate || currentDate,
      duration: Math.round(dur * 10) / 10,
      note: newNote.trim() || `Activity on ${category.name}`,
    });

    setNewNote('');
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
              style={{ backgroundColor: `${category.color}25`, color: category.color }}
            >
              <CategoryIcon iconName={category.icon} className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {category.name}
                </h3>
                {group && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                    style={{
                      borderColor: `${group.color}40`,
                      backgroundColor: `${group.color}15`,
                      color: group.color,
                    }}
                  >
                    {group.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Envelope Activity Log & Sessions
              </p>
            </div>
          </div>

          <button
            onClick={closeEnvelopeActivities}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Today's Envelope Status Strip */}
        <div className="px-5 sm:px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Budgeted Today</span>
              <span className="text-slate-200 font-semibold text-sm">
                {formatHours(budgeted, settings.timeFormat)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Logged Today</span>
              <span className="text-emerald-400 font-semibold text-sm">
                {formatHours(logged, settings.timeFormat)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Available</span>
              <span
                className={`font-semibold text-sm ${
                  isOverspent ? 'text-red-400' : 'text-slate-200'
                }`}
              >
                {formatHours(available, settings.timeFormat)}
              </span>
            </div>
          </div>

          {/* Quick Actions for this Envelope */}
          <div className="flex items-center gap-2">
            {/* Live Timer session button */}
            {isTimerRunning ? (
              <div className="flex items-center gap-1.5 bg-emerald-950 border border-emerald-500/50 px-2.5 py-1 rounded-md text-xs font-mono animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-300 font-bold tabular-nums">
                  {formatTimerSeconds(timer.elapsedSeconds)}
                </span>
                <button
                  onClick={() => toggleCategoryTimer(category.id)}
                  title="Pause live session"
                  className="text-slate-300 hover:text-white p-0.5 cursor-pointer ml-1"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={stopAndLogTimer}
                  title="Finish & Log to envelope"
                  className="text-emerald-300 hover:text-white font-sans text-[11px] font-semibold ml-1 cursor-pointer"
                >
                  Log
                </button>
              </div>
            ) : isTimerPaused ? (
              <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-600/50 px-2.5 py-1 rounded-md text-xs font-mono">
                <span className="text-amber-300 tabular-nums">
                  {formatTimerSeconds(timer.elapsedSeconds)} (paused)
                </span>
                <button
                  onClick={() => toggleCategoryTimer(category.id)}
                  title="Resume timer"
                  className="text-amber-300 hover:text-amber-200 p-0.5 cursor-pointer ml-1"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={stopAndLogTimer}
                  title="Finish & Log to envelope"
                  className="text-amber-300 hover:text-amber-200 font-sans text-[11px] font-semibold ml-1 cursor-pointer"
                >
                  Log
                </button>
              </div>
            ) : (
              <button
                onClick={() => toggleCategoryTimer(category.id, `Focus on ${category.name}`)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Start Timer</span>
              </button>
            )}

            <button
              onClick={() => openReallocateModal(category.id)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors cursor-pointer"
              title="Move hours to/from this envelope"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
              <span>Move Hours</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Scope Switcher */}
        <div className="px-5 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveScope('today')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeScope === 'today'
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Today ({formatDateLabel(currentDate)})
              </button>
              <button
                onClick={() => setActiveScope('all')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeScope === 'all'
                    ? 'bg-slate-800 text-sky-400 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All History
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            {/* Search notes */}
            <div className="relative w-44 sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Entry</span>
            </button>
          </div>
        </div>

        {/* In-Line New Entry Creator */}
        {isAddingNew && (
          <form
            onSubmit={handleCreateNewEntry}
            className="p-4 bg-slate-950/80 border-b border-emerald-900/40 space-y-3 shrink-0 animate-in fade-in"
          >
            <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
              <span>Log New Activity on {category.name}</span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Hours Spent</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.1"
                  required
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  placeholder="1.0"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="text-[11px] text-slate-400 block mb-1">Activity Note</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="What did you do?"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                Save Activity
              </button>
            </div>
          </form>
        )}

        {/* Activities List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 divide-y divide-slate-800/60">
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
              <Clock className="w-8 h-8 text-slate-600 mb-2" />
              <p className="font-medium text-slate-400">No recorded activities found.</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                {activeScope === 'today'
                  ? `No time logged for this envelope today (${formatDateLabel(currentDate)}).`
                  : 'No activities have been recorded yet for this envelope.'}
              </p>
              <button
                onClick={() => setIsAddingNew(true)}
                className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                + Log an activity entry now
              </button>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isEditing = editingEntryId === entry.id;

              return (
                <div
                  key={entry.id}
                  className="pt-3 first:pt-0 flex items-start justify-between gap-3 group"
                >
                  {isEditing ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <input
                        type="number"
                        step="0.25"
                        min="0.1"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        className="w-20 bg-slate-900 border border-emerald-500 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                        placeholder="Activity note..."
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSaveEdit(entry.id)}
                          className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingEntryId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-slate-800/80 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold font-mono text-white tabular-nums">
                              {formatHours(entry.duration, settings.timeFormat)}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {formatDateLabel(entry.date)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 break-words">
                            {entry.note || 'No note'}
                          </p>
                        </div>
                      </div>

                      {/* Row actions */}
                      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => handleStartEdit(entry)}
                          title="Edit activity"
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTimeEntry(entry.id)}
                          title="Delete activity"
                          className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info summary */}
        <div className="px-5 sm:px-6 py-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div>
            Showing <strong>{filteredEntries.length}</strong> activity {filteredEntries.length === 1 ? 'entry' : 'entries'} · Total:{' '}
            <strong className="font-mono text-emerald-400">{formatHours(totalFilteredHours, settings.timeFormat)}</strong>
          </div>
          <button
            onClick={closeEnvelopeActivities}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
