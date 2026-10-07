import React, { useState } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { formatHours } from '../utils/dateUtils';

export const DeleteEnvelopeModal: React.FC = () => {
  const {
    envelopeToDelete,
    cancelDeleteCategory,
    confirmDeleteCategory,
    dayBudget,
    entries,
    settings,
  } = useTimeBudget();

  const [deleteEntries, setDeleteEntries] = useState(false);

  if (!envelopeToDelete) return null;

  const budgetedToday = dayBudget[envelopeToDelete.id] ?? envelopeToDelete.dailyTarget;
  const loggedEntriesCount = entries.filter((e) => e.categoryId === envelopeToDelete.id).length;

  const handleConfirm = () => {
    confirmDeleteCategory(deleteEntries);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Delete Envelope
              </h3>
              <p className="text-xs text-slate-400">
                Confirm removal of &ldquo;{envelopeToDelete.name}&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={cancelDeleteCategory}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Envelope Card Preview */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${envelopeToDelete.color}20`,
                color: envelopeToDelete.color,
              }}
            >
              <CategoryIcon iconName={envelopeToDelete.icon} className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {envelopeToDelete.name}
              </div>
              <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                Target: {formatHours(envelopeToDelete.dailyTarget, settings.timeFormat)}/day · Budgeted today: {formatHours(budgetedToday, settings.timeFormat)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-300 leading-relaxed bg-red-950/20 border border-red-900/40 p-3 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span>Are you sure you want to delete this envelope? </span>
              {budgetedToday > 0 && (
                <span className="text-emerald-400 font-medium">
                  The {formatHours(budgetedToday, settings.timeFormat)} budgeted today will be returned to your Ready to Assign pool.
                </span>
              )}
            </div>
          </div>

          {/* Activity entries option */}
          {loggedEntriesCount > 0 && (
            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/40 border border-slate-800 cursor-pointer hover:bg-slate-950/60 transition-colors">
              <input
                type="checkbox"
                checked={deleteEntries}
                onChange={(e) => setDeleteEntries(e.target.checked)}
                className="rounded border-slate-700 text-red-600 focus:ring-red-500 focus:ring-offset-slate-900"
              />
              <span className="text-slate-300 text-xs">
                Also permanently delete <strong className="text-white">{loggedEntriesCount}</strong> logged activity record{loggedEntriesCount === 1 ? '' : 's'} from the ledger
              </span>
            </label>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={cancelDeleteCategory}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Envelope</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
