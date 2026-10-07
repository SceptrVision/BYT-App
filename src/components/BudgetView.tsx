import React, { useState } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { ReadyToAssignBanner } from './ReadyToAssignBanner';
import { SleepScheduleCard } from './SleepScheduleCard';
import { DailyBufferCard } from './DailyBufferCard';
import { CategoryRow } from './CategoryRow';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  FolderPlus,
  Info,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Layers,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Sliders,
  MoveVertical,
  RotateCcw,
} from 'lucide-react';
import { formatHours, parseHourInput } from '../utils/dateUtils';
import { CategoryGroup } from '../types';

const COLOR_PALETTE = [
  '#0284c7', // Sky blue
  '#10b981', // Emerald green
  '#0ea5e9', // Light sky
  '#059669', // Deep emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Sapphire blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#d97706', // Warm amber
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const BudgetView: React.FC = () => {
  const {
    groups,
    categories,
    dayBudget,
    dayLogged,
    dayCategoryDirectBudgets,
    setCategoryDirectBudget,
    adjustCategoryDirectBudget,
    distributeDirectBudgetToEnvelopes,
    clearCategoryDirectBudget,
    promptDeleteGroup,
    addCategory,
    addGroup,
    editGroup,
    openLogModal,
    settings,
  } = useTimeBudget();

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Inline Category Group Creation
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#0284c7');

  // Inline Category Group Editing
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // Inline Envelope Creation per Group
  const [addingToGroupId, setAddingToGroupId] = useState<string | null>(null);
  const [newEnvelopeName, setNewEnvelopeName] = useState('');
  const [newEnvelopeTarget, setNewEnvelopeTarget] = useState('1.0');
  const [newEnvelopeColor, setNewEnvelopeColor] = useState('#10b981');
  const [newEnvelopeIcon, setNewEnvelopeIcon] = useState('Briefcase');

  // Inline Direct Category Budget Editing
  const [editingDirectBudgetId, setEditingDirectBudgetId] = useState<string | null>(null);
  const [directBudgetInput, setDirectBudgetInput] = useState('');

  // Customizable / Moveable Screen Layout State
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<Array<'sleep' | 'buffer' | 'categories'>>(() => {
    try {
      const stored = localStorage.getItem('byt_budget_section_order_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          Array.isArray(parsed) &&
          parsed.length === 3 &&
          parsed.includes('sleep') &&
          parsed.includes('buffer') &&
          parsed.includes('categories')
        ) {
          return parsed;
        }
      }
    } catch {}
    return ['sleep', 'buffer', 'categories'];
  });

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;
    const newOrder = [...sectionOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setSectionOrder(newOrder);
    localStorage.setItem('byt_budget_section_order_v1', JSON.stringify(newOrder));
  };

  const resetSectionOrder = () => {
    const defaultOrder: Array<'sleep' | 'buffer' | 'categories'> = ['sleep', 'buffer', 'categories'];
    setSectionOrder(defaultOrder);
    localStorage.setItem('byt_budget_section_order_v1', JSON.stringify(defaultOrder));
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    addGroup({
      name: newGroupName.trim(),
      color: newGroupColor,
    });
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  const handleStartEditGroup = (g: CategoryGroup) => {
    setEditingGroupId(g.id);
    setEditingGroupName(g.name);
  };

  const handleSaveEditGroup = (id: string) => {
    if (editingGroupName.trim()) {
      editGroup(id, { name: editingGroupName.trim() });
    }
    setEditingGroupId(null);
  };

  const handleStartAddEnvelope = (groupId: string, defaultColor?: string) => {
    setAddingToGroupId(groupId);
    setNewEnvelopeName('');
    setNewEnvelopeTarget(settings.timeFormat === 'hours_minutes' ? '1h 00m' : '1.0');
    setNewEnvelopeColor(defaultColor || '#10b981');
    setNewEnvelopeIcon('Briefcase');
  };

  const handleCreateEnvelope = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvelopeName.trim() || !addingToGroupId) return;

    const parsedTarget = parseHourInput(newEnvelopeTarget);

    addCategory({
      name: newEnvelopeName.trim(),
      groupId: addingToGroupId,
      dailyTarget: parsedTarget > 0 ? parsedTarget : 1.0,
      targetType: 'daily_target',
      color: newEnvelopeColor,
      icon: newEnvelopeIcon,
      isCustom: true,
    });

    setNewEnvelopeName('');
    setAddingToGroupId(null);
  };

  const handleStartEditDirectBudget = (groupId: string, currentHours: number) => {
    setEditingDirectBudgetId(groupId);
    setDirectBudgetInput(
      settings.timeFormat === 'hours_minutes'
        ? formatHours(currentHours, 'hours_minutes')
        : currentHours > 0
        ? currentHours.toString()
        : '1.0'
    );
  };

  const handleSaveDirectBudget = (groupId: string) => {
    setEditingDirectBudgetId(null);
    const parsed = parseHourInput(directBudgetInput);
    setCategoryDirectBudget(groupId, parsed);
  };

  const renderCategoriesTable = () => (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table Column Headers & Top Actions */}
      <div className="py-3 px-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Envelopes & Categories
          </span>
          <button
            onClick={() => setIsAddingGroup(true)}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium px-2 py-0.5 rounded bg-sky-950/50 border border-sky-800/60 hover:bg-sky-900/50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-6 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-400 pr-8">
          <div className="w-24 text-right">Budgeted Today</div>
          <div className="w-20 text-right">Logged Today</div>
          <div className="w-28 text-right">Available</div>
        </div>
      </div>

        {/* Inline Category Group Creation Panel */}
        {isAddingGroup && (
          <form
            onSubmit={handleCreateGroup}
            className="p-4 bg-slate-950 border-b border-sky-800/60 animate-in fade-in duration-150 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Create New Category</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAddingGroup(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Side Hustle, Creative Projects, Family & Home"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewGroupColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                        newGroupColor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  Create Category
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingGroup(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Category Groups List */}
        <div className="divide-y divide-slate-800/80">
          {groups.map((group) => {
            const groupCats = categories.filter((c) => c.groupId === group.id);
            const isCollapsed = collapsedGroups[group.id] || false;
            const directCategoryBudget = dayCategoryDirectBudgets[group.id] || 0;

            const envelopeBudgetSum = groupCats.reduce(
              (acc, c) => acc + (dayBudget[c.id] ?? c.dailyTarget),
              0
            );
            const totalGroupBudgeted = Math.round((envelopeBudgetSum + directCategoryBudget) * 10) / 10;

            const groupLogged = groupCats.reduce(
              (acc, c) => acc + (dayLogged[c.id] || 0),
              0
            );
            const groupAvailable = Math.round((totalGroupBudgeted - groupLogged) * 10) / 10;
            const isGroupOverspent = groupAvailable < -0.05;

            return (
              <div key={group.id} className="bg-slate-950/40">
                {/* Group Summary Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-2.5 px-4 bg-slate-900/70 hover:bg-slate-900 border-b border-slate-800/60 transition-colors gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                      title={isCollapsed ? 'Expand group' : 'Collapse group'}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />

                    {/* Inline Group Name Editing */}
                    {editingGroupId === group.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditGroup(group.id);
                            if (e.key === 'Escape') setEditingGroupId(null);
                          }}
                          className="bg-slate-950 border border-sky-500 rounded px-2 py-0.5 text-sm font-semibold text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEditGroup(group.id)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingGroupId(null)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          onClick={() => toggleGroup(group.id)}
                          className="text-sm font-semibold text-white truncate cursor-pointer hover:text-sky-300"
                        >
                          {group.name}
                        </span>
                        <span className="text-xs text-slate-500 font-mono shrink-0">
                          ({groupCats.length} envelope{groupCats.length === 1 ? '' : 's'})
                        </span>
                        <button
                          onClick={() => handleStartEditGroup(group)}
                          title="Rename category"
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-slate-500 hover:text-slate-300 transition-opacity cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Group totals & Quick Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-6 text-xs font-mono font-medium">
                    {/* Action buttons on group */}
                    <div className="flex items-center gap-1">
                      {/* Budget Directly to Category button */}
                      <button
                        onClick={() => handleStartEditDirectBudget(group.id, directCategoryBudget)}
                        className={`text-[11px] font-sans px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                          directCategoryBudget > 0
                            ? 'bg-amber-950/70 border border-amber-600/60 text-amber-300 font-medium'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title="Budget hours directly to this category (warning shown if not in an envelope yet)"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Budget Category</span>
                      </button>

                      {/* Add Envelope Button */}
                      <button
                        onClick={() => handleStartAddEnvelope(group.id, group.color)}
                        className="text-[11px] font-sans text-sky-400 hover:text-sky-300 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                        title="Add a custom envelope into this category"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Envelope</span>
                      </button>

                      {/* Delete Category Button */}
                      <button
                        onClick={() => promptDeleteGroup(group)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title={`Delete "${group.name}" category`}
                        aria-label={`Delete ${group.name} category`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Numeric Columns */}
                    <div className="text-slate-400 hidden md:block w-24 text-right">
                      {formatHours(totalGroupBudgeted, settings.timeFormat)}
                    </div>
                    <div className="text-slate-400 hidden md:block w-20 text-right">
                      {formatHours(groupLogged, settings.timeFormat)}
                    </div>
                    <div
                      className={`font-semibold w-28 text-right ${
                        isGroupOverspent ? 'text-red-400' : 'text-slate-200'
                      }`}
                    >
                      {formatHours(groupAvailable, settings.timeFormat)}
                    </div>
                  </div>
                </div>

                {/* Direct Category Budget Warning Banner (When user budgets directly to category instead of envelope) */}
                {directCategoryBudget > 0 && (
                  <div className="py-2 px-4 bg-amber-950/30 border-b border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        <strong>⚠️ {formatHours(directCategoryBudget, settings.timeFormat)} budgeted directly to "{group.name}"</strong> — not in an envelope yet!
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartAddEnvelope(group.id, group.color)}
                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Create Envelope to Assign</span>
                      </button>

                      {groupCats.length > 0 && (
                        <button
                          onClick={() => distributeDirectBudgetToEnvelopes(group.id)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-200 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                          title="Evenly distribute unassigned category hours to this group's envelopes"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>Distribute to Envelopes</span>
                        </button>
                      )}

                      <button
                        onClick={() => clearCategoryDirectBudget(group.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Direct Category Budget Input Form */}
                {editingDirectBudgetId === group.id && (
                  <div className="p-3 bg-slate-950 border-b border-amber-800/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">
                        Budget Time Directly to "{group.name}":
                      </span>
                      <input
                        type="text"
                        autoFocus
                        value={directBudgetInput}
                        onChange={(e) => setDirectBudgetInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveDirectBudget(group.id);
                          if (e.key === 'Escape') setEditingDirectBudgetId(null);
                        }}
                        placeholder="e.g. 2.0 or 2h 00m"
                        className="w-28 bg-slate-900 border border-amber-500 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none"
                      />
                      <div className="flex items-center gap-1">
                        {['1.0', '2.0', '3.0'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setDirectBudgetInput(preset)}
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[11px]"
                          >
                            +{preset}h
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveDirectBudget(group.id)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded text-xs transition-colors cursor-pointer"
                      >
                        Set Category Budget
                      </button>
                      <button
                        onClick={() => setEditingDirectBudgetId(null)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Envelope Creator Form inside the Group */}
                {addingToGroupId === group.id && (
                  <form
                    onSubmit={handleCreateEnvelope}
                    className="p-4 bg-slate-950/90 border-b border-sky-800/60 animate-in fade-in duration-150 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Plus className="w-4 h-4" />
                        <span>Add New Envelope to "{group.name}"</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAddingToGroupId(null)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Envelope Name
                        </label>
                        <input
                          type="text"
                          autoFocus
                          required
                          placeholder="e.g. Code Review, Client Calls, Gym"
                          value={newEnvelopeName}
                          onChange={(e) => setNewEnvelopeName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Daily Target (Hours)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 1.5, 1h 30m, 45m"
                          value={newEnvelopeTarget}
                          onChange={(e) => setNewEnvelopeTarget(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Icon
                        </label>
                        <select
                          value={newEnvelopeIcon}
                          onChange={(e) => setNewEnvelopeIcon(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          {AVAILABLE_ICONS.map((icon) => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Color
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {COLOR_PALETTE.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewEnvelopeColor(c)}
                              className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                                newEnvelopeColor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setAddingToGroupId(null)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Create Envelope
                      </button>
                    </div>
                  </form>
                )}

                {/* Envelopes in this Group */}
                {!isCollapsed && (
                  <div>
                    {groupCats.length === 0 ? (
                      <div className="py-4 px-6 text-xs text-slate-500 italic flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span>No envelopes in this category yet.</span>
                        <button
                          onClick={() => handleStartAddEnvelope(group.id, group.color)}
                          className="text-sky-400 hover:text-sky-300 cursor-pointer font-medium text-left"
                        >
                          + Create first envelope for {group.name}
                        </button>
                      </div>
                    ) : (
                      groupCats.map((cat) => (
                        <CategoryRow key={cat.id} category={cat} />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions Footer */}
        <div className="py-3 px-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Click any budgeted hours to edit. Use "+ Add Envelope" to budget within categories.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingGroup(true)}
              className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ New Category</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => openLogModal()}
              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Time Entry</span>
            </button>
          </div>
        </div>
      </div>
  );

  return (
    <div className="space-y-6">
      {/* Ready To Assign Daily Header Banner */}
      <ReadyToAssignBanner />

      {/* Screen Layout Customization Toolbar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Daily Budget Workspace
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isEditingLayout ? (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <button
                type="button"
                onClick={resetSectionOrder}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Order</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingLayout(false)}
                className="text-xs font-semibold text-slate-950 px-3 py-1 rounded bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Done Editing</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingLayout(true)}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Move and customize the layout of tabs & sections"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Edit Layout</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Moveable Sections */}
      {sectionOrder.map((sectionKey, index) => {
        let content: React.ReactNode = null;
        let title = '';

        if (sectionKey === 'sleep') {
          content = <SleepScheduleCard />;
          title = 'Sleep & Night Rest Schedule';
        } else if (sectionKey === 'buffer') {
          content = <DailyBufferCard />;
          title = 'Daily Buffer Cushion';
        } else if (sectionKey === 'categories') {
          content = renderCategoriesTable();
          title = 'Envelopes & Categories';
        }

        return (
          <div
            key={sectionKey}
            className={`transition-all ${
              isEditingLayout
                ? 'p-2.5 rounded-2xl border-2 border-dashed border-sky-500/60 bg-sky-950/20 space-y-2.5'
                : ''
            }`}
          >
            {isEditingLayout && (
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs shadow-md">
                <div className="flex items-center gap-2">
                  <MoveVertical className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold text-white">{title}</span>
                  <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-medium">
                    Section {index + 1} of 3
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveSection(index, 'up')}
                    className={`px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors ${
                      index === 0
                        ? 'text-slate-600 bg-slate-950/50 cursor-not-allowed border border-slate-800/40'
                        : 'text-slate-100 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700'
                    }`}
                    title="Move section up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Move Up</span>
                  </button>
                  <button
                    type="button"
                    disabled={index === sectionOrder.length - 1}
                    onClick={() => moveSection(index, 'down')}
                    className={`px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors ${
                      index === sectionOrder.length - 1
                        ? 'text-slate-600 bg-slate-950/50 cursor-not-allowed border border-slate-800/40'
                        : 'text-slate-100 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700'
                    }`}
                    title="Move section down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Move Down</span>
                  </button>
                </div>
              </div>
            )}
            {content}
          </div>
        );
      })}
    </div>
  );
};
