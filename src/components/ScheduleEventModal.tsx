import React, { useState, useEffect } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import {
  X,
  Clock,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Check,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  formatHours,
  calculateDurationMinutes,
  timeToMinutes,
  minutesToTime,
  eventsOverlap,
  formatTime12Hour,
  formatMinutesHMin,
} from '../utils/dateUtils';
import { BUFFER_ID, EventEnvelopeSplit, ScheduleEvent } from '../types';

export const ScheduleEventModal: React.FC = () => {
  const {
    isScheduleEventModalOpen,
    closeScheduleEventModal,
    scheduleEventToEdit,
    scheduleEventPresetDate,
    scheduleEventPresetStartTime,
    categories,
    deletedCategories,
    groups,
    dayBudget,
    dayBuffer,
    addScheduleEvent,
    editScheduleEvent,
    deleteScheduleEvent,
    scheduleEvents,
    settings,
  } = useTimeBudget();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allocations, setAllocations] = useState<EventEnvelopeSplit[]>([]);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Quick duration setter
  const setQuickDuration = (minutes: number) => {
    const startMin = timeToMinutes(startTime);
    const endMin = (startMin + minutes) % 1440;
    setEndTime(minutesToTime(endMin));
  };

  // Initialize modal state on open or target change
  useEffect(() => {
    if (isScheduleEventModalOpen) {
      setErrorMsg('');
      if (scheduleEventToEdit) {
        setTitle(scheduleEventToEdit.title);
        setDate(scheduleEventToEdit.date);
        setStartTime(scheduleEventToEdit.startTime);
        setEndTime(scheduleEventToEdit.endTime);
        setAllocations(
          scheduleEventToEdit.allocations && scheduleEventToEdit.allocations.length > 0
            ? [...scheduleEventToEdit.allocations]
            : [{ envelopeId: categories[0]?.id || '', minutes: scheduleEventToEdit.durationMinutes || 60 }]
        );
        setNotes(scheduleEventToEdit.notes || '');
      } else {
        const defaultStart = scheduleEventPresetStartTime || '09:00';
        const startMin = timeToMinutes(defaultStart);
        const endMin = (startMin + 60) % 1440;
        const defaultEnd = minutesToTime(endMin);

        setTitle('');
        setDate(scheduleEventPresetDate || '');
        setStartTime(defaultStart);
        setEndTime(defaultEnd);
        // Default to first category covering the 60m block
        const defaultCatId = categories[0]?.id || '';
        setAllocations(defaultCatId ? [{ envelopeId: defaultCatId, minutes: 60 }] : []);
        setNotes('');
      }
    }
  }, [
    isScheduleEventModalOpen,
    scheduleEventToEdit,
    scheduleEventPresetDate,
    scheduleEventPresetStartTime,
    categories,
  ]);

  if (!isScheduleEventModalOpen) return null;

  const durationMinutes = calculateDurationMinutes(startTime, endTime);
  const totalAllocatedMinutes = allocations.reduce((sum, a) => sum + (Number(a.minutes) || 0), 0);
  const diffMinutes = durationMinutes - totalAllocatedMinutes;
  const isUnderfunded = diffMinutes > 0;
  const isOverfunded = diffMinutes < 0;

  // Real-time schedule overlap detection against existing events on same date
  const overlapConflicts = scheduleEvents.filter((ev) => {
    if (scheduleEventToEdit && ev.id === scheduleEventToEdit.id) return false;
    if (ev.date !== date) return false;
    return eventsOverlap(startTime, endTime, ev.startTime, ev.endTime);
  });

  const handleAddSplit = () => {
    // Pick an unused category or default
    const usedIds = new Set(allocations.map((a) => a.envelopeId));
    const nextCat = categories.find((c) => !usedIds.has(c.id)) || categories[0];
    if (!nextCat) return;

    // Remaining minutes to fill
    const minsToAssign = Math.max(15, Math.min(60, diffMinutes > 0 ? diffMinutes : 30));
    setAllocations([...allocations, { envelopeId: nextCat.id, minutes: minsToAssign }]);
  };

  const handleUpdateSplit = (index: number, updates: Partial<EventEnvelopeSplit>) => {
    setAllocations((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveSplit = (index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFillRemainderWithBuffer = () => {
    if (diffMinutes <= 0) return;
    setAllocations((prev) => [...prev, { envelopeId: BUFFER_ID, minutes: diffMinutes }]);
  };

  const handleFillRemainderWithEnvelope = (catId: string) => {
    if (diffMinutes <= 0) return;
    // Check if envelope already exists in allocations
    const exists = allocations.find((a) => a.envelopeId === catId);
    if (exists) {
      setAllocations((prev) =>
        prev.map((a) =>
          a.envelopeId === catId ? { ...a, minutes: a.minutes + diffMinutes } : a
        )
      );
    } else {
      setAllocations((prev) => [...prev, { envelopeId: catId, minutes: diffMinutes }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter an event title (e.g. Homework, Team Standup, Gym)');
      return;
    }
    if (durationMinutes <= 0) {
      setErrorMsg('Event duration must be greater than 0 minutes');
      return;
    }
    if (allocations.length === 0) {
      setErrorMsg('Please assign at least one envelope or buffer to connect the hours used');
      return;
    }

    if (scheduleEventToEdit) {
      editScheduleEvent(scheduleEventToEdit.id, {
        title: title.trim(),
        date,
        startTime,
        endTime,
        durationMinutes,
        allocations,
        notes: notes.trim(),
      });
    } else {
      addScheduleEvent({
        title: title.trim(),
        date,
        startTime,
        endTime,
        durationMinutes,
        allocations,
        notes: notes.trim(),
      });
    }

    closeScheduleEventModal();
  };

  const handleDelete = () => {
    if (scheduleEventToEdit) {
      deleteScheduleEvent(scheduleEventToEdit.id);
      closeScheduleEventModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {scheduleEventToEdit ? 'Edit Schedule Event' : 'Add Event to Schedule'}
              </h3>
              <p className="text-xs text-slate-400">
                Connect event time to daily budget envelopes & buffer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeScheduleEventModal}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block font-mono">
              Event Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Homework, Physics & Calculus Study, Deep Work..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Date & Time Block (Start / End) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block font-mono">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between font-mono">
                <span>Start Time</span>
                <span className="text-[10px] text-sky-400">{formatTime12Hour(startTime)}</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between font-mono">
                <span>End Time</span>
                <span className="text-[10px] text-sky-400">{formatTime12Hour(endTime)}</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Quick Duration Presets & Total Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
                Set Duration Preset:
              </span>
              <div className="font-mono text-xs font-semibold text-sky-300">
                {formatMinutesHMin(durationMinutes)} ({formatHours(durationMinutes / 60, settings.timeFormat)})
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[15, 30, 45, 60, 75, 90, 120, 150, 180, 210, 240].map((mins) => {
                const isSelected = durationMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setQuickDuration(mins)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {formatMinutesHMin(mins)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Overlap Conflict Warning */}
          {overlapConflicts.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">
                  Schedule Conflict Detected!
                </p>
                <p className="text-[11px] text-amber-200/90 mt-0.5">
                  This block overlaps with{' '}
                  <span className="font-medium text-white">
                    "{overlapConflicts[0].title}"
                  </span>{' '}
                  ({overlapConflicts[0].startTime} – {overlapConflicts[0].endTime}). Please adjust your start or end time to fix the overlap.
                </p>
              </div>
            </div>
          )}

          {/* Split Allocations: Connected Envelopes & Buffer */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Connected Envelopes (Activities)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Envelopes are your individual activities (e.g. Physics, Calculus), grouped into categories.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSplit}
                className="px-2 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 border border-emerald-800/60 rounded-md transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Split</span>
              </button>
            </div>

            {/* List of Envelope Allocation Splits */}
            <div className="space-y-2">
              {allocations.map((alloc, idx) => {
                const isBuff = alloc.envelopeId === BUFFER_ID;
                const env = categories.find((c) => c.id === alloc.envelopeId);
                const envGroup = groups.find((g) => g.id === env?.groupId);

                return (
                  <div
                    key={idx}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    {/* Envelope / Buffer Selector grouped by Category */}
                    <div className="flex-1 min-w-0">
                      <select
                        value={alloc.envelopeId}
                        onChange={(e) => handleUpdateSplit(idx, { envelopeId: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                      >
                        <optgroup label="System Buffer">
                          <option value={BUFFER_ID}>
                            🛡️ Daily Buffer Reserve ({formatHours(dayBuffer, settings.timeFormat)} avail)
                          </option>
                        </optgroup>
                        {groups.map((group) => {
                          const envs = categories.filter((c) => c.groupId === group.id);
                          if (envs.length === 0) return null;
                          return (
                            <optgroup key={group.id} label={`Category: ${group.name}`}>
                              {envs.map((c) => (
                                <option key={c.id} value={c.id}>
                                  ✉️ {c.name} ({formatHours(dayBudget[c.id] || 0, settings.timeFormat)} budgeted)
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                        {deletedCategories && deletedCategories.length > 0 && (
                          <optgroup label="Deleted Envelopes (Historical)">
                            {deletedCategories.map((del) => (
                              <option key={del.id} value={del.id}>
                                ✉️ {del.name} (Deleted)
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      {env && envGroup && (
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: env.color || envGroup.color }}
                          />
                          <span>Envelope: <strong className="text-slate-200">{env.name}</strong></span>
                          <span>·</span>
                          <span>Category: <span className="text-slate-300">{envGroup.name}</span></span>
                        </div>
                      )}
                      {!env && !isBuff && (
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono italic">
                          <span className="w-2 h-2 rounded-full inline-block bg-slate-500" />
                          <span>
                            Envelope: <strong className="text-slate-300">
                              {(deletedCategories || []).find((c) => c.id === alloc.envelopeId)?.name || 'Envelope'} (Deleted)
                            </strong>
                          </span>
                        </div>
                      )}
                      {isBuff && (
                        <div className="text-[10px] text-amber-400 mt-1 font-mono">
                          🛡️ Funded directly from your unassigned Daily Buffer
                        </div>
                      )}
                    </div>

                    {/* Minutes Input & Stepper */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSplit(idx, {
                              minutes: Math.max(5, alloc.minutes - 15),
                            })
                          }
                          className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center justify-center font-mono cursor-pointer"
                          title="Subtract 15 minutes"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={alloc.minutes}
                          onChange={(e) =>
                            handleUpdateSplit(idx, {
                              minutes: Math.max(0, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          step={5}
                          min={0}
                          className="w-14 bg-transparent text-center text-xs font-mono font-bold text-white focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-mono pr-1">m</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSplit(idx, {
                              minutes: alloc.minutes + 15,
                            })
                          }
                          className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center justify-center font-mono cursor-pointer"
                          title="Add 15 minutes"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-[11px] font-mono text-slate-400 min-w-[50px] text-right">
                        ({formatMinutesHMin(alloc.minutes)})
                      </span>

                      {allocations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSplit(idx)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                          title="Remove envelope split"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Funding Status & Underfunded Warning */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Funding Progress:</span>
                <span className="font-mono font-semibold">
                  <span
                    className={
                      isUnderfunded
                        ? 'text-amber-400'
                        : isOverfunded
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }
                  >
                    {formatMinutesHMin(totalAllocatedMinutes)}
                  </span>
                  <span className="text-slate-500"> / {formatMinutesHMin(durationMinutes)}</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${Math.min(100, (totalAllocatedMinutes / durationMinutes) * 100)}%`,
                  }}
                  className={`h-full transition-all duration-300 ${
                    isUnderfunded
                      ? 'bg-amber-500'
                      : isOverfunded
                      ? 'bg-red-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>

              {/* Underfunded Notification & Quick Actions */}
              {isUnderfunded && (
                <div className="pt-2 text-xs text-amber-300 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      Underfunded by {formatMinutesHMin(diffMinutes)}! Assign remaining time from an envelope or buffer.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleFillRemainderWithBuffer}
                      className="px-2.5 py-1 text-[11px] font-medium bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 text-amber-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3 text-amber-300" />
                      <span>Assign {formatMinutesHMin(diffMinutes)} from Buffer</span>
                    </button>
                    {categories.slice(0, 3).map((c) => {
                      const grp = groups.find((g) => g.id === c.groupId);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleFillRemainderWithEnvelope(c.id)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>Fill to {c.name}</span>
                          {grp && <span className="text-[9px] text-slate-400">({grp.name})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isOverfunded && (
                <div className="pt-1 text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Allocations exceed event duration by {formatMinutesHMin(Math.abs(diffMinutes))}.
                  </span>
                </div>
              )}

              {!isUnderfunded && !isOverfunded && (
                <div className="pt-1 text-xs text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Fully funded · Connected to envelopes</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes / Description */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block font-mono">
              Notes & Breakdown (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 45m physics problem set, 15m calculus homework..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-red-400 bg-red-950/50 border border-red-900/60 p-2.5 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
            {scheduleEventToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-950/40 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Event</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeScheduleEventModal}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{scheduleEventToEdit ? 'Save Changes' : 'Add to Schedule'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
