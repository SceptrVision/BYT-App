import React, { useState } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { Shield, Sparkles, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { formatHours, parseHourInput } from '../utils/dateUtils';
import { BUFFER_ID } from '../types';

export const DailyBufferCard: React.FC = () => {
  const {
    dayBuffer,
    setDayBuffer,
    adjustDayBuffer,
    readyToAssign,
    stashUnassignedInDayBuffer,
    releaseBufferToReadyToAssign,
    overspentCategories,
    coverOverspendingWithBuffer,
    openReallocateModal,
    settings,
    totalCapacity,
  } = useTimeBudget();

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleStartEdit = () => {
    setInputValue(
      settings.timeFormat === 'hours_minutes'
        ? formatHours(dayBuffer, 'hours_minutes')
        : dayBuffer.toString()
    );
    setIsEditing(true);
  };

  const handleFinishEdit = () => {
    setIsEditing(false);
    const parsed = parseHourInput(inputValue);
    if (parsed >= 0) {
      setDayBuffer(Math.round(parsed * 10) / 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const bufferPercent = Math.round((dayBuffer / (totalCapacity || 24)) * 100);

  return (
    <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/90 to-sky-950/30 border border-indigo-800/40 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        
        {/* Left: Identity & Description */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <Shield className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-white tracking-tight">
                Daily Buffer Cushion
              </h3>
              <span className="text-[10px] font-mono font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded-full">
                Protected System Margin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Dedicated cushion for overrun spillover, transition delays, and unexpected interruptions. Non-deletable reserve that shields your 24.0h daily envelope plan.
            </p>
          </div>
        </div>

        {/* Right: Numerical Buffer Controls & Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shrink-0">
          
          {/* Buffer Value Display & Direct +/- */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/90 rounded-lg px-3 py-1.5">
            <div className="text-right">
              <div className="text-[10px] uppercase font-mono text-indigo-400 font-semibold tracking-wider">
                Buffer Reserve
              </div>

              {isEditing ? (
                <input
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleFinishEdit}
                  onKeyDown={handleKeyDown}
                  className="w-24 px-1 py-0.5 bg-slate-900 border border-indigo-500 rounded text-right text-sm font-mono text-white focus:outline-none"
                />
              ) : (
                <button
                  onClick={handleStartEdit}
                  title="Click to edit daily buffer hours"
                  className="text-lg font-bold font-mono text-white hover:text-indigo-300 transition-colors cursor-pointer tabular-nums"
                >
                  {formatHours(dayBuffer, settings.timeFormat)}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-0.5 border-l border-slate-800 pl-1.5 ml-1">
              <button
                onClick={() => adjustDayBuffer(0.5)}
                title="+0.5 hour buffer"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-xs font-mono font-bold leading-none cursor-pointer"
              >
                +
              </button>
              <button
                onClick={() => adjustDayBuffer(-0.5)}
                disabled={dayBuffer <= 0}
                title="-0.5 hour buffer"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-xs font-mono font-bold leading-none cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
              >
                -
              </button>
            </div>
            
            <span className="text-[11px] text-slate-500 font-mono pl-1">
              ({bufferPercent}%)
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {readyToAssign > 0 && (
              <button
                onClick={stashUnassignedInDayBuffer}
                title={`Stash remaining ${formatHours(readyToAssign, settings.timeFormat)} unassigned time directly into buffer`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Stash Unassigned (+{formatHours(readyToAssign, settings.timeFormat)})</span>
              </button>
            )}

            <button
              onClick={() => openReallocateModal(BUFFER_ID)}
              title="Move hours between buffer and your envelopes"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span>Move Hours</span>
            </button>

            {dayBuffer > 0 && (
              <button
                onClick={() => releaseBufferToReadyToAssign()}
                title="Release buffer hours back to Ready to Assign"
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
              >
                Release
              </button>
            )}
          </div>

        </div>

      </div>

      {/* 1-Click Cover Overspent Envelopes from Buffer */}
      {overspentCategories.length > 0 && dayBuffer > 0 && (
        <div className="mt-3 pt-3 border-t border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-indigo-950/30 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 p-3 rounded-b-xl">
          <div className="flex items-center gap-2 text-xs text-indigo-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Buffer Available:</strong> You have {formatHours(dayBuffer, settings.timeFormat)} in buffer to cover today's overspent envelope ({overspentCategories[0].name}).
            </span>
          </div>
          <button
            onClick={() => coverOverspendingWithBuffer(overspentCategories[0].id)}
            className="text-xs font-semibold px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            Cover with Buffer
          </button>
        </div>
      )}
    </div>
  );
};
