import React, { useState } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { Trash2, AlertTriangle, X, Folder, ArrowRightLeft } from 'lucide-react';
import { formatHours } from '../utils/dateUtils';
import { CategoryIcon } from './CategoryIcon';

export const DeleteGroupModal: React.FC = () => {
  const {
    groupToDelete,
    cancelDeleteGroup,
    confirmDeleteGroup,
    groups,
    categories,
    entries,
    dayBudget,
    settings,
  } = useTimeBudget();

  const [envelopeAction, setEnvelopeAction] = useState<'move' | 'delete'>('move');
  const otherGroups = groups.filter((g) => g.id !== groupToDelete?.id);
  const [targetGroupId, setTargetGroupId] = useState<string>(otherGroups[0]?.id || '');
  const [deleteEntries, setDeleteEntries] = useState(false);

  if (!groupToDelete) return null;

  const groupEnvelopes = categories.filter((c) => c.groupId === groupToDelete.id);
  const totalBudgetedToday = groupEnvelopes.reduce(
    (acc, c) => acc + (dayBudget[c.id] ?? c.dailyTarget),
    0
  );

  const groupCatIds = new Set(groupEnvelopes.map((c) => c.id));
  const loggedEntriesCount = entries.filter((e) => groupCatIds.has(e.categoryId)).length;

  const handleConfirm = () => {
    if (groupEnvelopes.length > 0 && envelopeAction === 'move' && targetGroupId) {
      confirmDeleteGroup(targetGroupId, false);
    } else {
      confirmDeleteGroup('delete', deleteEntries);
    }
  };

  const willMoveEnvelopes = groupEnvelopes.length > 0 && otherGroups.length > 0 && envelopeAction === 'move';

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
                Delete Category
              </h3>
              <p className="text-xs text-slate-400">
                Confirm removal of category &ldquo;{groupToDelete.name}&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={cancelDeleteGroup}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Group Identity Card */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${groupToDelete.color}20`,
                color: groupToDelete.color,
              }}
            >
              <Folder className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {groupToDelete.name}
              </div>
              <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                Contains {groupEnvelopes.length} envelope{groupEnvelopes.length === 1 ? '' : 's'} · {formatHours(totalBudgetedToday, settings.timeFormat)} budgeted today
              </div>
            </div>
          </div>

          {/* Envelopes list */}
          {groupEnvelopes.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Envelopes in this category ({groupEnvelopes.length}):
              </span>
              <div className="max-h-28 overflow-y-auto rounded-lg border border-slate-800/80 bg-slate-950/40 divide-y divide-slate-800/40 p-1">
                {groupEnvelopes.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between py-1.5 px-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <CategoryIcon iconName={cat.icon} className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-200 truncate">{cat.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">
                      {formatHours(dayBudget[cat.id] ?? cat.dailyTarget, settings.timeFormat)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Choice if envelopes exist and other groups are available */}
          {groupEnvelopes.length > 0 && otherGroups.length > 0 && (
            <div className="space-y-2.5 p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 block">
                What should happen to envelopes inside?
              </span>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="envelopeAction"
                  checked={envelopeAction === 'move'}
                  onChange={() => setEnvelopeAction('move')}
                  className="mt-0.5 text-sky-500 focus:ring-sky-500"
                />
                <div className="flex-1">
                  <span className="text-slate-200 font-medium">
                    Keep envelopes and move them to another category:
                  </span>
                  {envelopeAction === 'move' && (
                    <select
                      value={targetGroupId}
                      onChange={(e) => setTargetGroupId(e.target.value)}
                      className="mt-1.5 w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      {otherGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="envelopeAction"
                  checked={envelopeAction === 'delete'}
                  onChange={() => setEnvelopeAction('delete')}
                  className="mt-0.5 text-red-500 focus:ring-red-500"
                />
                <div>
                  <span className="text-slate-200 font-medium">
                    Delete all {groupEnvelopes.length} envelopes as well
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Budgeted hours will be returned to your Ready to Assign pool.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Activity entries option if deleting envelopes */}
          {!willMoveEnvelopes && loggedEntriesCount > 0 && (
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

          {/* Warning notice */}
          <div className="flex items-start gap-2.5 text-slate-300 leading-relaxed bg-red-950/20 border border-red-900/40 p-3 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              {willMoveEnvelopes ? (
                <span>
                  The category <strong>{groupToDelete.name}</strong> will be removed. All {groupEnvelopes.length} envelopes will safely transfer to your selected category.
                </span>
              ) : (
                <span>
                  Deleting this category will remove it{groupEnvelopes.length > 0 ? ` along with its ${groupEnvelopes.length} envelope${groupEnvelopes.length === 1 ? '' : 's'}` : ''}.
                  {totalBudgetedToday > 0 && (
                    <span className="text-emerald-400 font-medium ml-1">
                      {formatHours(totalBudgetedToday, settings.timeFormat)} will return to Ready to Assign today.
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={cancelDeleteGroup}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {willMoveEnvelopes ? (
                <>
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Delete & Move Envelopes</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Category</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
