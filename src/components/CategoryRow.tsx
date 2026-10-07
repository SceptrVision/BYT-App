import React, { useState } from 'react';
import { Category } from '../types';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { CategoryIcon } from './CategoryIcon';
import { formatHours, parseHourInput } from '../utils/dateUtils';
import { Play, Pause, Plus, ArrowRightLeft, Trash2, Clock } from 'lucide-react';

interface CategoryRowProps {
  category: Category;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({ category }) => {
  const {
    dayBudget,
    dayLogged,
    dayAvailable,
    openAssignBudgetModal,
    promptDeleteCategory,
    openLogModal,
    openReallocateModal,
    toggleCategoryTimer,
    openEnvelopeActivities,
    timer,
    settings,
  } = useTimeBudget();

  const budgeted = dayBudget[category.id] ?? category.dailyTarget;
  const logged = dayLogged[category.id] || 0;
  const available = dayAvailable[category.id] || 0;

  const isOverspent = available < -0.05;
  const isFullySpent = Math.abs(available) <= 0.05 && budgeted > 0;
  const isOver100 = budgeted > 0 && logged > budgeted;

  const isThisCategoryActiveTimer = timer.categoryId === category.id;
  const isTimerRunningOnThis = isThisCategoryActiveTimer && timer.isRunning;
  const isTimerPausedOnThis = isThisCategoryActiveTimer && !timer.isRunning && timer.elapsedSeconds > 0;

  return (
    <div
      className={`group relative flex flex-col md:flex-row md:items-center justify-between py-2.5 px-3 sm:px-4 border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${
        isOverspent ? 'bg-red-950/15 hover:bg-red-950/25' : ''
      }`}
    >
      {/* Category Identity & Envelope Progress (Clicking opens Activities!) */}
      <div className="flex-1 min-w-0 pr-3 mb-2 md:mb-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openEnvelopeActivities(category)}
            title={`View activities for ${category.name}`}
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-transform hover:scale-105 cursor-pointer"
            style={{ backgroundColor: `${category.color}20`, color: category.color }}
          >
            <CategoryIcon iconName={category.icon} className="w-3.5 h-3.5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => openEnvelopeActivities(category)}
                title={`Click to view recorded activities for ${category.name}`}
                className="text-sm font-semibold text-slate-100 hover:text-emerald-400 transition-colors truncate text-left cursor-pointer group/title"
              >
                <span>{category.name}</span>
                <span className="hidden group-hover/title:inline text-[11px] text-emerald-400/80 font-normal ml-1.5">
                  (view activities)
                </span>
              </button>

              {category.isCustom && (
                <span className="text-[10px] text-sky-400 bg-sky-950/70 border border-sky-800/60 rounded px-1.5 py-0.2 shrink-0 font-medium">
                  Custom
                </span>
              )}
              {category.isEssential && (
                <span className="text-[10px] text-emerald-400 border border-emerald-800/60 rounded px-1.5 py-0.2 shrink-0">
                  Essential
                </span>
              )}

              {/* Running/Paused live indicator badge */}
              {isTimerRunningOnThis && (
                <span className="text-[10px] text-emerald-300 bg-emerald-950 border border-emerald-600/50 rounded-full px-2 py-0.2 shrink-0 font-mono flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live Timer
                </span>
              )}
              {isTimerPausedOnThis && (
                <span className="text-[10px] text-amber-300 bg-amber-950 border border-amber-600/50 rounded-full px-2 py-0.2 shrink-0 font-mono">
                  Paused
                </span>
              )}
            </div>

            {/* Target indicator & quick stats */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              {category.dailyTarget > 0 && (
                <>
                  <span>Target: {formatHours(category.dailyTarget, settings.timeFormat)}/day</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>{Math.round((logged / (budgeted || 1)) * 100)}% consumed</span>
            </div>
          </div>
        </div>

        {/* Envelope Progress Bar */}
        <div
          onClick={() => openEnvelopeActivities(category)}
          title={`Click to view activities for ${category.name}`}
          className="mt-2 w-full max-w-md bg-slate-800/80 rounded-full h-1.5 overflow-hidden cursor-pointer"
        >
          <div
            className={`h-full transition-all duration-300 ${
              isOver100
                ? 'bg-red-500'
                : isFullySpent
                ? 'bg-slate-500'
                : 'bg-emerald-500'
            }`}
            style={{
              width: `${Math.min(100, Math.max(0, (logged / (budgeted || 0.1)) * 100))}%`,
              backgroundColor: isOver100 ? '#ef4444' : category.color,
            }}
          />
        </div>
      </div>

      {/* Numeric Budgeting Columns for the Day */}
      <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-6 shrink-0">
        
        {/* Budgeted Today Column */}
        <div className="flex flex-col items-end w-24">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider md:hidden font-mono">
            Budgeted
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => openAssignBudgetModal(category)}
              title="Click to budget time to this envelope (requires choosing a source: Ready to assign, Buffer, Another envelope, or Category)"
              className="text-xs sm:text-sm font-semibold font-mono tabular-nums text-slate-200 hover:text-emerald-400 transition-colors px-1 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
            >
              {formatHours(budgeted, settings.timeFormat)}
            </button>
            <button
              onClick={() => openAssignBudgetModal(category)}
              title={`Budget time to "${category.name}" from a specific source`}
              className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded text-[11px] cursor-pointer transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Activity / Actual Logged Today (Clicking opens activities!) */}
        <div className="flex flex-col items-end w-20">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider md:hidden font-mono">
            Logged
          </span>
          <button
            onClick={() => openEnvelopeActivities(category)}
            title="Click to view recorded activities for this envelope"
            className="text-xs sm:text-sm font-medium font-mono tabular-nums text-slate-300 hover:text-emerald-400 hover:underline underline-offset-2 transition-colors cursor-pointer"
          >
            {formatHours(logged, settings.timeFormat)}
          </button>
        </div>

        {/* Available Today Column */}
        <div className="flex flex-col items-end w-28 text-right">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider md:hidden font-mono">
            Available
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${
                isOverspent
                  ? 'text-red-400'
                  : isFullySpent
                  ? 'text-slate-400'
                  : 'text-emerald-400'
              }`}
            >
              {formatHours(available, settings.timeFormat)}
            </span>

            {/* Roll with the punches quick cover */}
            {isOverspent && (
              <button
                onClick={() => openReallocateModal(category.id)}
                title="Cover overspent hours from buffer or another envelope"
                className="text-[10px] font-semibold bg-red-600 hover:bg-red-500 text-white px-1.5 py-0.5 rounded cursor-pointer transition-colors shrink-0"
              >
                Cover
              </button>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {/* View Activities button */}
          <button
            onClick={() => openEnvelopeActivities(category)}
            title={`View activities for "${category.name}"`}
            aria-label={`View activities for ${category.name}`}
            className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>

          {/* Quick manual log button */}
          <button
            onClick={() => openLogModal(category.id)}
            title="Log time entry"
            aria-label={`Log time entry for ${category.name}`}
            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Live Session Button: changes to Pause when pressed, never resets timer on repeated clicks! */}
          {isTimerRunningOnThis ? (
            <button
              onClick={() => toggleCategoryTimer(category.id, `Focus on ${category.name}`)}
              title={`Pause live session (${Math.floor(timer.elapsedSeconds / 60)}m ${timer.elapsedSeconds % 60}s elapsed)`}
              aria-label={`Pause live session on ${category.name}`}
              className="p-1 rounded transition-colors cursor-pointer text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : isTimerPausedOnThis ? (
            <button
              onClick={() => toggleCategoryTimer(category.id, `Focus on ${category.name}`)}
              title={`Resume live session (paused: ${Math.floor(timer.elapsedSeconds / 60)}m ${timer.elapsedSeconds % 60}s)`}
              aria-label={`Resume live session on ${category.name}`}
              className="p-1 rounded transition-colors cursor-pointer text-amber-300 bg-amber-950/80 border border-amber-600/40 hover:bg-amber-900/80"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => toggleCategoryTimer(category.id, `Focus on ${category.name}`)}
              title={`Start live session on ${category.name}`}
              aria-label={`Start live session on ${category.name}`}
              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Move Hours */}
          <button
            onClick={() => openReallocateModal(category.id)}
            title="Move hours to/from this envelope"
            aria-label={`Move hours to/from ${category.name}`}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          {/* Delete Envelope */}
          <button
            onClick={() => promptDeleteCategory(category)}
            title={`Delete "${category.name}" envelope`}
            aria-label={`Delete ${category.name} envelope`}
            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
