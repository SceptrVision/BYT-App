import React, { useState, useEffect } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { X, ArrowRightLeft, AlertTriangle, Shield } from 'lucide-react';
import { formatHours, formatDateLabel, parseHourInput } from '../utils/dateUtils';
import { BUFFER_ID } from '../types';

export const ReallocateModal: React.FC = () => {
  const {
    isReallocateModalOpen,
    closeReallocateModal,
    reallocateTargetCategory,
    categories,
    currentDate,
    dayAvailable,
    dayBuffer,
    reallocateHours,
    coverOverspending,
    settings,
  } = useTimeBudget();

  const [fromCatId, setFromCatId] = useState('');
  const [toCatId, setToCatId] = useState('');
  const [hoursAmount, setHoursAmount] = useState('0.5');
  const [errorMsg, setErrorMsg] = useState('');

  const targetCategory = categories.find((c) => c.id === reallocateTargetCategory);
  const targetAvailable = targetCategory ? dayAvailable[targetCategory.id] || 0 : 0;
  const isTargetOverspent = targetAvailable < -0.01;
  const neededHours = isTargetOverspent ? Math.abs(targetAvailable) : 0;

  useEffect(() => {
    if (isReallocateModalOpen) {
      setErrorMsg('');
      if (reallocateTargetCategory === BUFFER_ID) {
        // Reallocate excess hours FROM Buffer INTO an active envelope
        setFromCatId(BUFFER_ID);
        const targetEnvelope = categories.find((c) => c.id === 'cat-deep-work') || categories[0];
        if (targetEnvelope) setToCatId(targetEnvelope.id);
        const defaultAmt = dayBuffer >= 0.75 ? '0.75' : dayBuffer > 0 ? (Math.round(dayBuffer * 10) / 10).toString() : '0.5';
        setHoursAmount(defaultAmt);
      } else if (reallocateTargetCategory) {
        setToCatId(reallocateTargetCategory);
        if (isTargetOverspent) {
          setHoursAmount(neededHours.toString());
        }
        // If buffer has hours, prioritize buffer as source!
        if (dayBuffer > 0.2) {
          setFromCatId(BUFFER_ID);
        } else {
          const positiveCat = categories.find(
            (c) => c.id !== reallocateTargetCategory && (dayAvailable[c.id] || 0) > 0.2
          );
          if (positiveCat) setFromCatId(positiveCat.id);
        }
      } else {
        if (dayBuffer > 0.2 && categories.length > 0) {
          setFromCatId(BUFFER_ID);
          setToCatId(categories[0].id);
        } else if (categories.length >= 2) {
          setToCatId(categories[0].id);
          setFromCatId(categories[1].id);
        }
      }
    }
  }, [isReallocateModalOpen, reallocateTargetCategory, isTargetOverspent, neededHours, dayBuffer, categories, dayAvailable]);

  if (!isReallocateModalOpen) return null;

  const isFromBuffer = fromCatId === BUFFER_ID;
  const isToBuffer = toCatId === BUFFER_ID;

  const fromCat = isFromBuffer
    ? { id: BUFFER_ID, name: 'Daily Buffer', color: '#6366f1' }
    : categories.find((c) => c.id === fromCatId);

  const toCat = isToBuffer
    ? { id: BUFFER_ID, name: 'Daily Buffer', color: '#6366f1' }
    : categories.find((c) => c.id === toCatId);

  const fromAvailable = isFromBuffer ? dayBuffer : fromCat ? dayAvailable[fromCat.id] || 0 : 0;

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseHourInput(hoursAmount);
    if (amount <= 0) {
      setErrorMsg('Please enter a valid amount of hours (e.g. 0.5 or 30m)');
      return;
    }
    if (!fromCatId || !toCatId) {
      setErrorMsg('Please select both source and destination');
      return;
    }
    if (fromCatId === toCatId) {
      setErrorMsg('Source and destination cannot be the same');
      return;
    }

    reallocateHours(fromCatId, toCatId, amount);
    closeReallocateModal();
  };

  const handleQuickCover = (sourceId: string) => {
    if (!targetCategory) return;
    coverOverspending(targetCategory.id, sourceId);
    closeReallocateModal();
  };

  const surplusCategories = categories.filter(
    (c) => c.id !== toCatId && (dayAvailable[c.id] || 0) > 0.1
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Roll With The Punches
              </h3>
              <p className="text-xs text-slate-400">
                Rule 3: Reallocate hours between today's envelopes and buffer ({formatDateLabel(currentDate)})
              </p>
            </div>
          </div>
          <button
            onClick={closeReallocateModal}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 1-Click Cover Overspending if target is overdrawn */}
          {targetCategory && isTargetOverspent && (
            <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>
                  <strong>{targetCategory.name}</strong> is overspent by{' '}
                  <strong className="font-mono">{formatHours(neededHours, settings.timeFormat)}</strong> today.
                </span>
              </div>

              <div className="text-xs text-slate-300 font-medium">
                1-Click Cover with Today's Buffer or Surplus Envelopes:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Priority Option: Cover with dedicated buffer */}
                {dayBuffer > 0.05 && (
                  <button
                    onClick={() => handleQuickCover(BUFFER_ID)}
                    className="flex items-center justify-between p-2 rounded bg-indigo-950/50 border border-indigo-700/60 hover:bg-indigo-900/60 text-left transition-colors text-xs cursor-pointer col-span-1 sm:col-span-2"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <div>
                        <span className="text-indigo-200 font-semibold truncate block">
                          Daily Buffer Cushion
                        </span>
                        <span className="text-[10px] text-indigo-300 font-mono">
                          +{formatHours(dayBuffer, settings.timeFormat)} available in reserve
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-semibold shrink-0">
                      Take {formatHours(Math.min(neededHours, dayBuffer), settings.timeFormat)}
                    </span>
                  </button>
                )}

                {surplusCategories.length === 0 && dayBuffer <= 0.05 ? (
                  <div className="col-span-2 text-xs text-slate-500 italic">
                    No envelope or buffer currently has surplus available hours today.
                  </div>
                ) : (
                  surplusCategories.slice(0, 4).map((source) => (
                    <button
                      key={source.id}
                      onClick={() => handleQuickCover(source.id)}
                      className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 text-left transition-colors text-xs cursor-pointer"
                    >
                      <div className="truncate mr-2">
                        <span className="text-slate-200 font-medium truncate block">
                          {source.name}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          +{formatHours(dayAvailable[source.id] || 0, settings.timeFormat)} avail
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-medium shrink-0">
                        Take {formatHours(neededHours, settings.timeFormat)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Manual Transfer Form */}
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Manual Transfer
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Move From */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium block">
                  Take Hours From
                </label>
                <select
                  value={fromCatId}
                  onChange={(e) => setFromCatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select source...</option>
                  <option value={BUFFER_ID}>
                    🛡️ Daily Buffer & Margin ({formatHours(dayBuffer, settings.timeFormat)} reserve)
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatHours(dayAvailable[c.id] || 0, settings.timeFormat)} avail)
                    </option>
                  ))}
                </select>
                {fromCat && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Available today: {formatHours(fromAvailable, settings.timeFormat)}
                  </div>
                )}
              </div>

              {/* Move To */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium block">
                  Give Hours To
                </label>
                <select
                  value={toCatId}
                  onChange={(e) => setToCatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select destination...</option>
                  <option value={BUFFER_ID}>
                    🛡️ Daily Buffer & Margin ({formatHours(dayBuffer, settings.timeFormat)} reserve)
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatHours(dayAvailable[c.id] || 0, settings.timeFormat)} avail)
                    </option>
                  ))}
                </select>
                {toCat && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    {isToBuffer
                      ? `Buffer reserve: ${formatHours(dayBuffer, settings.timeFormat)}`
                      : `Available today: ${formatHours(dayAvailable[toCat.id] || 0, settings.timeFormat)}`}
                  </div>
                )}
              </div>
            </div>

            {/* Hours Amount */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>Hours to Move</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  e.g. 0.5, 30m, 1h, 1:30
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={hoursAmount}
                  onChange={(e) => setHoursAmount(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                  placeholder="0.5"
                />
                <div className="flex items-center gap-1">
                  {[0.25, 0.5, 1.0, 2.0].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setHoursAmount(preset.toString())}
                      className="px-2 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono transition-colors cursor-pointer"
                    >
                      +{preset}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 p-2 rounded">
                {errorMsg}
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeReallocateModal}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Move Hours Today</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
