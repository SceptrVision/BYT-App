import React from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { X, Clock, Play, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatHours } from '../utils/dateUtils';

export const SwitchTimerModal: React.FC = () => {
  const {
    timer,
    categories,
    isSwitchTimerModalOpen,
    pendingSwitchCategory,
    confirmSwitchTimer,
    cancelSwitchTimer,
    settings,
  } = useTimeBudget();

  if (!isSwitchTimerModalOpen || !pendingSwitchCategory) return null;

  const currentCategory = categories.find((c) => c.id === timer.categoryId);

  const formatTimerSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const elapsedHours = Math.round((timer.elapsedSeconds / 3600) * 10) / 10 || 0.1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Live Session In Progress</h3>
              <p className="text-[11px] text-slate-400">Another envelope is currently being timed</p>
            </div>
          </div>

          <button
            onClick={cancelSwitchTimer}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Active Session Info Box */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                Current Active Timer:
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {formatTimerSeconds(timer.elapsedSeconds)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentCategory?.color || '#10b981' }}
              />
              <span className="text-sm font-bold text-white truncate">
                {currentCategory?.name || 'Current Session'}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                ({formatHours(elapsedHours, settings.timeFormat)})
              </span>
            </div>
          </div>

          {/* New Envelope to Switch to */}
          <div className="flex items-center gap-2 text-slate-300">
            <Play className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>
              You requested to switch to: <strong className="text-white">{pendingSwitchCategory.name}</strong>.
            </span>
          </div>

          <p className="text-slate-400 leading-relaxed text-[11px]">
            What would you like to do with the current session on <strong>{currentCategory?.name}</strong>?
          </p>

          {/* Action Options */}
          <div className="space-y-2 pt-1">
            {/* Option 1: End & Log */}
            <button
              type="button"
              onClick={() => confirmSwitchTimer('log')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-600/50 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-emerald-200 text-xs">
                    End & Log Current Session
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Record {formatTimerSeconds(timer.elapsedSeconds)} to {currentCategory?.name || 'current envelope'} and start {pendingSwitchCategory.name}
                  </div>
                </div>
              </div>
            </button>

            {/* Option 2: Discard / Delete log */}
            <button
              type="button"
              onClick={() => confirmSwitchTimer('discard')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <div className="font-semibold text-red-300 text-xs">
                    Delete Log / Discard Current Session
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Delete this running session without recording it and start {pendingSwitchCategory.name}
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Footer Cancel */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={cancelSwitchTimer}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Keep Running (Cancel Switch)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
