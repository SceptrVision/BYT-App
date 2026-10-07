import React, { useState, useEffect } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import {
  X,
  Plus,
  Sparkles,
  Shield,
  ArrowRightLeft,
  Layers,
  Check,
  AlertCircle,
} from 'lucide-react';
import { formatHours, parseHourInput } from '../utils/dateUtils';
import { CategoryIcon } from './CategoryIcon';

export const AssignBudgetModal: React.FC = () => {
  const {
    assignBudgetCategory,
    closeAssignBudgetModal,
    assignBudgetWithSource,
    categories,
    groups,
    dayBudget,
    dayAvailable,
    readyToAssign,
    dayBuffer,
    dayCategoryDirectBudgets,
    settings,
  } = useTimeBudget();

  const [amountInput, setAmountInput] = useState('1.0');
  const [sourceType, setSourceType] = useState<'ready_to_assign' | 'buffer' | 'envelope' | 'category'>('ready_to_assign');
  const [sourceEnvelopeId, setSourceEnvelopeId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const targetCat = assignBudgetCategory;

  useEffect(() => {
    if (assignBudgetCategory) {
      setErrorMsg('');
      setAmountInput('1.0');
      // Default to ready_to_assign if positive, else buffer, else another envelope
      if (readyToAssign > 0) {
        setSourceType('ready_to_assign');
      } else if (dayBuffer > 0) {
        setSourceType('buffer');
      } else {
        setSourceType('ready_to_assign');
      }

      // Pick first alternative envelope with surplus available
      const altCats = categories.filter((c) => c.id !== assignBudgetCategory.id);
      const withSurplus = altCats.find((c) => (dayAvailable[c.id] || 0) > 0);
      setSourceEnvelopeId(withSurplus ? withSurplus.id : (altCats[0]?.id || ''));
    }
  }, [assignBudgetCategory, categories, dayAvailable, readyToAssign, dayBuffer]);

  if (!targetCat) return null;

  const currentBudget = dayBudget[targetCat.id] ?? targetCat.dailyTarget;
  const targetNeeded = Math.max(0, Math.round((targetCat.dailyTarget - currentBudget) * 10) / 10);

  const hostGroup = groups.find((g) => g.id === targetCat.groupId);
  const hostGroupDirectBudget = hostGroup ? dayCategoryDirectBudgets[hostGroup.id] || 0 : 0;

  const otherEnvelopes = categories.filter((c) => c.id !== targetCat.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseHourInput(amountInput);
    if (amount <= 0) {
      setErrorMsg('Please enter an amount greater than 0');
      return;
    }

    if (sourceType === 'envelope' && !sourceEnvelopeId) {
      setErrorMsg('Please select a source envelope from the dropdown');
      return;
    }

    assignBudgetWithSource(
      targetCat.id,
      amount,
      sourceType,
      sourceType === 'envelope' ? sourceEnvelopeId : undefined
    );

    closeAssignBudgetModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${targetCat.color}25`, color: targetCat.color }}
            >
              <CategoryIcon iconName={targetCat.icon} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Budget Time to "{targetCat.name}"
              </h3>
              <p className="text-[11px] text-slate-400">
                Zero-Sum Allocation: Request a specific source of time
              </p>
            </div>
          </div>

          <button
            onClick={closeAssignBudgetModal}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Target Current Status Box */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Current Budget Today:</span>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                {formatHours(currentBudget, settings.timeFormat)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-400">Daily Target:</span>
              <div className="text-xs font-mono text-slate-300 mt-0.5">
                {formatHours(targetCat.dailyTarget, settings.timeFormat)}/day
              </div>
            </div>
          </div>

          {/* Amount to Assign */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Hours to Add</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Supports "1.5", "1h 30m", "45m"
              </span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="1.0"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center gap-1 flex-wrap">
                {['0.5', '1.0', '2.0'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountInput(preset)}
                    className="px-2 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono transition-colors cursor-pointer"
                  >
                    +{preset}h
                  </button>
                ))}
                {targetNeeded > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmountInput(targetNeeded.toString())}
                    className="px-2 py-1.5 text-xs bg-emerald-950/80 border border-emerald-600/50 hover:bg-emerald-900 text-emerald-300 rounded font-mono transition-colors cursor-pointer"
                    title={`Fill target deficit (+${targetNeeded}h)`}
                  >
                    Fill Target (+{targetNeeded}h)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SPECIFIC SOURCE REQUESTED */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Source of Time (Required)
            </label>

            <div className="space-y-2">
              {/* Option 1: Ready to Assign */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  sourceType === 'ready_to_assign'
                    ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="budget_source"
                  checked={sourceType === 'ready_to_assign'}
                  onChange={() => setSourceType('ready_to_assign')}
                  className="mt-1 accent-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      Ready to Assign
                    </span>
                    <span className="font-mono text-xs text-slate-300 font-semibold">
                      {formatHours(readyToAssign, settings.timeFormat)} available
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Allocates directly from your unassigned daily time currency pool.
                  </p>
                </div>
              </label>

              {/* Option 2: Buffer */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  sourceType === 'buffer'
                    ? 'bg-indigo-950/30 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="budget_source"
                  checked={sourceType === 'buffer'}
                  onChange={() => setSourceType('buffer')}
                  className="mt-1 accent-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-indigo-300">
                      <Shield className="w-3.5 h-3.5" />
                      Daily Buffer Cushion
                    </span>
                    <span className="font-mono text-xs text-slate-300 font-semibold">
                      {formatHours(dayBuffer, settings.timeFormat)} reserve
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Drawn from your dedicated system margin to protect this envelope.
                  </p>
                </div>
              </label>

              {/* Option 3: Another Envelope */}
              <div
                className={`p-3 rounded-lg border transition-all ${
                  sourceType === 'envelope'
                    ? 'bg-sky-950/30 border-sky-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="budget_source"
                    checked={sourceType === 'envelope'}
                    onChange={() => setSourceType('envelope')}
                    className="mt-1 accent-sky-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs flex items-center gap-1.5 text-sky-300">
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Another Envelope
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Reallocate from surplus
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Roll with the punches by shifting time from another envelope.
                    </p>
                  </div>
                </label>

                {sourceType === 'envelope' && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 pl-6">
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Choose Source Envelope:
                    </label>
                    <select
                      value={sourceEnvelopeId}
                      onChange={(e) => setSourceEnvelopeId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      {otherEnvelopes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({formatHours(dayAvailable[c.id] || 0, settings.timeFormat)} available)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Option 4: Category (Host Category) */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  sourceType === 'category'
                    ? 'bg-amber-950/30 border-amber-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="budget_source"
                  checked={sourceType === 'category'}
                  onChange={() => setSourceType('category')}
                  className="mt-1 accent-amber-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-amber-300">
                      <Layers className="w-3.5 h-3.5" />
                      Host Category: "{hostGroup?.name || 'Category'}"
                    </span>
                    <span className="font-mono text-xs text-slate-300 font-semibold">
                      {formatHours(hostGroupDirectBudget, settings.timeFormat)} unassigned
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Assigns hours previously budgeted directly to the parent category group into this envelope.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/60 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={closeAssignBudgetModal}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Assign to Envelope</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
