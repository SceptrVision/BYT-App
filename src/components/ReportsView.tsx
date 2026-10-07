import React, { useState, useMemo } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { formatHours, formatDateLabel, getWeekDaysForDate } from '../utils/dateUtils';
import {
  BarChart3,
  TrendingUp,
  Moon,
  Shield,
  ShieldAlert,
  Zap,
  Calendar,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { BUFFER_ID } from '../types';

export const ReportsView: React.FC = () => {
  const {
    currentDate,
    setCurrentDate,
    groups,
    categories,
    budgets,
    entries,
    dayBudget,
    dayLogged,
    totalCapacity,
    totalBudgeted,
    readyToAssign,
    dayBuffer,
    dayBufferAllocated,
    dayBufferUsed,
    daySleep,
    openReallocateModal,
    settings,
  } = useTimeBudget();

  const [activeViewMode, setActiveViewMode] = useState<'daily' | 'weekly'>('daily');

  // Daily group stats for currentDate
  const groupStats = useMemo(() => {
    return groups.map((group) => {
      const groupCats = categories.filter((c) => c.groupId === group.id);
      const budgeted = groupCats.reduce((acc, c) => acc + (dayBudget[c.id] ?? c.dailyTarget), 0);
      const logged = groupCats.reduce((acc, c) => acc + (dayLogged[c.id] || 0), 0);
      const percentOfCapacity = totalCapacity > 0 ? Math.round((budgeted / totalCapacity) * 100) : 0;

      return {
        group,
        budgeted: Math.round(budgeted * 10) / 10,
        logged: Math.round(logged * 10) / 10,
        percentOfCapacity,
        categories: groupCats,
      };
    });
  }, [groups, categories, dayBudget, dayLogged, totalCapacity]);

  const sleepBudgeted = daySleep.enabled ? daySleep.targetHours : 0;
  const sleepLogged = daySleep.enabled ? (daySleep.loggedHours || 0) : 0;

  const deepWorkCat = categories.find((c) => c.id === 'cat-deep-work');
  const meetingsCat = categories.find((c) => c.id === 'cat-meetings');
  const deepWorkHours = deepWorkCat ? (dayLogged[deepWorkCat.id] || 0) : 0;
  const meetingsHours = meetingsCat ? (dayLogged[meetingsCat.id] || 0) : 0;
  const totalWorkHours = deepWorkHours + meetingsHours;
  const deepWorkRatio =
    totalWorkHours > 0 ? Math.round((deepWorkHours / totalWorkHours) * 100) : 0;

  // 7-day activity overview enclosing currentDate
  const weekDays = useMemo(() => getWeekDaysForDate(currentDate), [currentDate]);

  const weekDayTotals = useMemo(() => {
    return weekDays.map((d) => {
      const dayEntries = entries.filter((e) => e.date === d.dateStr);
      const total = dayEntries.reduce((acc, e) => acc + e.duration, 0);
      return {
        ...d,
        totalHours: Math.round(total * 10) / 10,
      };
    });
  }, [weekDays, entries]);

  // WEEKLY AGGREGATIONS (Totals & Daily Averages for all categories and buffer)
  const weeklyCategoryStats = useMemo(() => {
    const numDays = 7;
    return groups.map((group) => {
      const groupCats = categories.filter((c) => c.groupId === group.id);

      let totalWeeklyBudgeted = 0;
      let totalWeeklyLogged = 0;

      const envelopeDetails = groupCats.map((cat) => {
        let catWeeklyBudgeted = 0;
        let catWeeklyLogged = 0;

        weekDays.forEach((d) => {
          const dayB = budgets[d.dateStr]?.allocations?.[cat.id] ?? cat.dailyTarget;
          catWeeklyBudgeted += dayB;

          const dayLogs = entries
            .filter((e) => e.date === d.dateStr && e.categoryId === cat.id)
            .reduce((sum, e) => sum + e.duration, 0);
          catWeeklyLogged += dayLogs;
        });

        const catAvgBudgeted = Math.round((catWeeklyBudgeted / numDays) * 10) / 10;
        const catAvgLogged = Math.round((catWeeklyLogged / numDays) * 10) / 10;

        totalWeeklyBudgeted += catWeeklyBudgeted;
        totalWeeklyLogged += catWeeklyLogged;

        return {
          cat,
          weeklyBudgeted: Math.round(catWeeklyBudgeted * 10) / 10,
          weeklyLogged: Math.round(catWeeklyLogged * 10) / 10,
          avgBudgeted: catAvgBudgeted,
          avgLogged: catAvgLogged,
        };
      });

      const avgGroupBudgeted = Math.round((totalWeeklyBudgeted / numDays) * 10) / 10;
      const avgGroupLogged = Math.round((totalWeeklyLogged / numDays) * 10) / 10;

      return {
        group,
        totalBudgeted: Math.round(totalWeeklyBudgeted * 10) / 10,
        totalLogged: Math.round(totalWeeklyLogged * 10) / 10,
        avgBudgeted: avgGroupBudgeted,
        avgLogged: avgGroupLogged,
        envelopes: envelopeDetails,
      };
    });
  }, [groups, categories, weekDays, budgets, entries]);

  // Weekly Buffer Aggregation
  const weeklyBufferStats = useMemo(() => {
    const numDays = 7;
    let totalBufferAllocated = 0;
    let totalBufferUsed = 0;
    let totalBufferUnused = 0;

    weekDays.forEach((d) => {
      const dayData = budgets[d.dateStr];
      const remainingBuffer = typeof dayData?.buffer === 'number' ? dayData.buffer : 1.5;
      const usedBuffer = dayData?.bufferUsed || 0;
      const allocatedBuffer = dayData?.bufferAllocated ?? Math.round((remainingBuffer + usedBuffer) * 10) / 10;

      totalBufferAllocated += allocatedBuffer;
      totalBufferUsed += usedBuffer;
      totalBufferUnused += remainingBuffer;
    });

    const avgBufferAllocated = Math.round((totalBufferAllocated / numDays) * 10) / 10;
    const avgBufferUsed = Math.round((totalBufferUsed / numDays) * 10) / 10;
    const avgBufferUnused = Math.round((totalBufferUnused / numDays) * 10) / 10;

    return {
      totalAllocated: Math.round(totalBufferAllocated * 10) / 10,
      totalUsed: Math.round(totalBufferUsed * 10) / 10,
      totalUnused: Math.round(totalBufferUnused * 10) / 10,
      avgAllocated: avgBufferAllocated,
      avgUsed: avgBufferUsed,
      avgUnused: avgBufferUnused,
    };
  }, [weekDays, budgets]);

  // If average unused buffer time exceeds 45 minutes (0.75h), recommend reallocating it
  const isBufferUnusedHigh = weeklyBufferStats.avgUnused > 0.75;

  return (
    <div className="space-y-6">
      {/* Top Header with Daily / Weekly View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Trends & Optimization
          </h2>
          <p className="text-xs text-slate-400">
            {activeViewMode === 'daily'
              ? `Daily 24-hour balance analysis for ${formatDateLabel(currentDate)}`
              : `Weekly aggregated totals & daily averages (${weekDays[0]?.dayName} ${weekDays[0]?.dateStr} – ${weekDays[6]?.dayName} ${weekDays[6]?.dateStr})`}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveViewMode('daily')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeViewMode === 'daily'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Trends
          </button>
          <button
            type="button"
            onClick={() => setActiveViewMode('weekly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeViewMode === 'weekly'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly Trends
          </button>
        </div>
      </div>

      {activeViewMode === 'daily' ? (
        <>
          {/* 24-Hour Stacked Daily Time Allocation Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  Daily Capacity Allocation ({totalCapacity}h Total Pool)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {formatHours(totalBudgeted, settings.timeFormat)} / {formatHours(totalCapacity, settings.timeFormat)} Budgeted
              </span>
            </div>

            {/* Stacked bar */}
            <div className="h-6 w-full rounded-lg overflow-hidden flex bg-slate-950 border border-slate-800">
              {groupStats.map((item) => {
                const widthPct = (item.budgeted / totalCapacity) * 100;
                if (widthPct <= 0) return null;
                return (
                  <div
                    key={item.group.id}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: item.group.color,
                    }}
                    className="h-full transition-all relative hover:opacity-90 cursor-pointer"
                    title={`${item.group.name}: ${item.budgeted}h (${Math.round(widthPct)}%)`}
                  />
                );
              })}
              {dayBuffer > 0 && (
                <div
                  style={{ width: `${(dayBuffer / totalCapacity) * 100}%` }}
                  className="h-full bg-indigo-600 transition-all cursor-pointer"
                  title={`Daily Buffer Cushion: ${dayBuffer}h (${Math.round((dayBuffer / totalCapacity) * 100)}%)`}
                />
              )}
              {readyToAssign > 0 && (
                <div
                  style={{ width: `${(readyToAssign / totalCapacity) * 100}%` }}
                  className="h-full bg-slate-800 text-slate-400 border-l border-slate-700 transition-all"
                  title={`Unassigned: ${readyToAssign}h`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {groupStats.map((item) => (
                <div key={item.group.id} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: item.group.color }}
                  />
                  <span className="text-slate-300 font-medium">{item.group.name}</span>
                  <span className="text-slate-500 font-mono">
                    {formatHours(item.budgeted, settings.timeFormat)} ({item.percentOfCapacity}%)
                  </span>
                </div>
              ))}
              {dayBuffer > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                  <span className="text-indigo-300 font-medium">Daily Buffer</span>
                  <span className="text-slate-500 font-mono">
                    {formatHours(dayBuffer, settings.timeFormat)} ({Math.round((dayBuffer / totalCapacity) * 100)}%)
                  </span>
                </div>
              )}
              {readyToAssign > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-700" />
                  <span className="text-slate-400">Unassigned</span>
                  <span className="text-slate-500 font-mono">
                    {formatHours(readyToAssign, settings.timeFormat)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* DEDICATED SECTION: Buffer Time Used vs Buffer Time Allocated (Daily) */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/90 to-indigo-950/30 border border-indigo-800/40 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-900/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Buffer Time Used vs Buffer Time Allocated (Today)
                  </h3>
                  <p className="text-xs text-slate-400">
                    System margin efficiency: track how much protective buffer was deployed to absorb overruns
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openReallocateModal(BUFFER_ID)}
                  className="px-2.5 py-1 text-xs font-medium bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3 h-3 text-indigo-300" />
                  <span>Transfer Buffer</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Allocated */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                <div className="text-[11px] font-mono uppercase text-slate-400">
                  Buffer Allocated
                </div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {formatHours(dayBufferAllocated, settings.timeFormat)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Initial planned safety margin
                </div>
              </div>

              {/* Used */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                <div className="text-[11px] font-mono uppercase text-amber-400">
                  Buffer Time Used
                </div>
                <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
                  {formatHours(dayBufferUsed, settings.timeFormat)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Deployed to cover overruns
                </div>
              </div>

              {/* Unused Reserve */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                <div className="text-[11px] font-mono uppercase text-indigo-400">
                  Buffer Remaining (Reserve)
                </div>
                <div className="text-xl font-bold font-mono text-indigo-300 mt-0.5">
                  {formatHours(dayBuffer, settings.timeFormat)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {dayBufferAllocated > 0
                    ? `${Math.round((dayBuffer / dayBufferAllocated) * 100)}% reserve intact`
                    : 'Available reserve'}
                </div>
              </div>
            </div>

            {/* Visual Deployment Ratio Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Buffer Deployment Ratio:</span>
                <span className="text-slate-300">
                  {dayBufferAllocated > 0
                    ? `${Math.round((dayBufferUsed / dayBufferAllocated) * 100)}% used · ${Math.round((dayBuffer / dayBufferAllocated) * 100)}% remaining`
                    : '100% remaining'}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-indigo-900/60">
                <div
                  style={{
                    width: `${dayBufferAllocated > 0 ? (dayBufferUsed / dayBufferAllocated) * 100 : 0}%`,
                  }}
                  className="h-full bg-amber-500 transition-all"
                  title={`Used: ${dayBufferUsed}h`}
                />
                <div
                  style={{
                    width: `${dayBufferAllocated > 0 ? (dayBuffer / dayBufferAllocated) * 100 : 100}%`,
                  }}
                  className="h-full bg-indigo-600 transition-all"
                  title={`Remaining: ${dayBuffer}h`}
                />
              </div>
            </div>
          </div>

          {/* 7-Day Consistency Tracker */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">
              7-Day Logged Activity
            </h3>
            <div className="grid grid-cols-7 gap-2 pt-2">
              {weekDayTotals.map((d) => {
                const heightPercent = Math.min(100, Math.round((d.totalHours / 16) * 100));

                return (
                  <button
                    key={d.dateStr}
                    onClick={() => setCurrentDate(d.dateStr)}
                    className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-between min-h-[100px] cursor-pointer ${
                      d.isSelected
                        ? 'bg-slate-800/80 border-emerald-500 text-white'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="text-[11px] uppercase font-mono text-slate-400">
                      {d.dayName}
                    </div>
                    
                    {/* Mini bar visualizer */}
                    <div className="w-4 h-12 bg-slate-900 rounded-full overflow-hidden flex flex-col justify-end my-1">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-500 to-sky-500 rounded-full transition-all"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    <div className="font-mono text-xs font-semibold text-emerald-400">
                      {formatHours(d.totalHours, settings.timeFormat)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side-by-Side: Budgeted vs Actual Logged per Group & Invariant Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Category Groups Breakdown Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Budget vs Reality Today</span>
                </h3>
                <span className="text-xs text-slate-400">Logged / Planned</span>
              </div>

              <div className="space-y-4">
                {groupStats.map((stat) => {
                  const fillPct = stat.budgeted > 0 ? Math.min(100, Math.round((stat.logged / stat.budgeted) * 100)) : 0;
                  const isOver = stat.logged > stat.budgeted;

                  return (
                    <div key={stat.group.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: stat.group.color }}
                          />
                          <span className="font-medium text-slate-200">
                            {stat.group.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-slate-400">
                            {formatHours(stat.logged, settings.timeFormat)} / {formatHours(stat.budgeted, settings.timeFormat)}
                          </span>
                          <span
                            className={`font-semibold ${
                              isOver ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
                            {fillPct}%
                          </span>
                        </div>
                      </div>

                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, fillPct)}%`,
                            backgroundColor: isOver ? '#ef4444' : stat.group.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actionable Time Optimization Diagnostics */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-400" />
                  <span>Daily Optimization Invariants</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Zero-sum checkpoints for today's allotments
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Sleep Diagnostic: updated to "avoid borrowing" */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                  <Moon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-200 flex items-center justify-between">
                      <span>Sleep & Recovery (8h Baseline)</span>
                      <span className="font-mono text-emerald-400">
                        {formatHours(sleepLogged, settings.timeFormat)} logged ({formatHours(sleepBudgeted, settings.timeFormat)} planned)
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {sleepBudgeted >= 8 ? (
                        'Protected: You have allocated 8 hours for sleep today. Avoid borrowing from this envelope to feed overspending in other categories!'
                      ) : (
                        'Warning: You allocated under 8 hours of sleep today. In BYT, robbing sleep causes compounding productivity debt tomorrow.'
                      )}
                    </p>
                  </div>
                </div>

                {/* Deep Work Focus Ratio */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                  <Zap className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-200 flex items-center justify-between">
                      <span>Deep Work Leverage</span>
                      <span className="font-mono text-sky-400">{deepWorkRatio}% Deep Focus</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {deepWorkRatio >= 50 ? (
                        `Great ratio: Deep Work represents ${deepWorkRatio}% of your working hours today.`
                      ) : (
                        `Meetings & admin dominate today (${100 - deepWorkRatio}%). Guard your morning focus blocks against impromptu syncs.`
                      )}
                    </p>
                  </div>
                </div>

                {/* Buffer Cushion */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-200 flex items-center justify-between">
                      <span>Daily Buffer Cushion</span>
                      <span className="font-mono text-indigo-400">
                        {formatHours(dayBuffer, settings.timeFormat)} in reserve today
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Your dedicated daily unplanned cushion absorbs spontaneous interruptions and unexpected delays. Roll with the punches to or from the buffer anytime.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </>
      ) : (
        /* WEEKLY TRENDS VIEW */
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Buffer Optimization Recommendation Card (when average unused buffer > 45 minutes) */}
          {isBufferUnusedHigh ? (
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-600/60 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-amber-200">
                      Recommendation: Reallocate Excess Unused Buffer
                    </h3>
                    <span className="text-[10px] font-mono bg-amber-950 border border-amber-700 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                      Avg Unused: {formatHours(weeklyBufferStats.avgUnused, settings.timeFormat)}/day (&gt; 45m)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Your average unused buffer cushion is <strong>{formatHours(weeklyBufferStats.avgUnused, settings.timeFormat)} per day</strong>, which exceeds the 45-minute threshold. You consistently have surplus margin that is not being absorbed by overruns. We recommend reallocating a portion of your buffer into active envelopes (such as Deep Work, Career, or Personal Leisure) to make fuller use of your waking hours!
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1 border-t border-amber-900/40">
                <button
                  onClick={() => openReallocateModal(BUFFER_ID)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Reallocate Buffer Hours Now</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-emerald-800/40 rounded-xl p-4 flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Buffer Well-Calibrated:</strong> Your daily unused buffer averaged {formatHours(weeklyBufferStats.avgUnused, settings.timeFormat)} (&le; 45m). Your buffer is actively absorbing overruns without leaving excessive idle margin.
              </span>
            </div>
          )}

          {/* Weekly Buffer Statistics: Used vs Allocated */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">
                  Weekly Buffer: Time Used vs Time Allocated
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                7-Day Weekly Summary
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-1">
                <div className="text-[11px] font-mono uppercase text-slate-400">
                  Buffer Allocated
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {formatHours(weeklyBufferStats.totalAllocated, settings.timeFormat)}
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Avg: {formatHours(weeklyBufferStats.avgAllocated, settings.timeFormat)} / day
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-1">
                <div className="text-[11px] font-mono uppercase text-amber-400">
                  Buffer Time Used
                </div>
                <div className="text-2xl font-bold font-mono text-amber-300">
                  {formatHours(weeklyBufferStats.totalUsed, settings.timeFormat)}
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Avg: {formatHours(weeklyBufferStats.avgUsed, settings.timeFormat)} / day
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-1">
                <div className="text-[11px] font-mono uppercase text-indigo-400">
                  Buffer Unused (Margin)
                </div>
                <div className="text-2xl font-bold font-mono text-indigo-300">
                  {formatHours(weeklyBufferStats.totalUnused, settings.timeFormat)}
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Avg: {formatHours(weeklyBufferStats.avgUnused, settings.timeFormat)} / day
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Categories Breakdown Table with Totals and Averages */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="py-3 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>All Categories — Weekly Totals & Daily Averages</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                7 Days Period
              </span>
            </div>

            {/* Column Headers */}
            <div className="hidden md:grid grid-cols-12 gap-4 py-2.5 px-4 bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <div className="col-span-5">Category / Envelope</div>
              <div className="col-span-2 text-right">Weekly Total Planned</div>
              <div className="col-span-2 text-right">Daily Average Planned</div>
              <div className="col-span-2 text-right">Weekly Total Logged</div>
              <div className="col-span-1 text-right">Daily Avg Logged</div>
            </div>

            {/* Group & Envelope Rows */}
            <div className="divide-y divide-slate-800/80">
              {weeklyCategoryStats.map((item) => (
                <div key={item.group.id} className="bg-slate-950/40">
                  {/* Category Group Summary Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 py-2.5 px-4 bg-slate-900/80 items-center font-medium text-xs">
                    <div className="col-span-5 flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.group.color }}
                      />
                      <span className="font-semibold text-white">
                        {item.group.name}
                      </span>
                    </div>

                    <div className="col-span-2 text-left md:text-right font-mono text-slate-300">
                      <span className="md:hidden text-slate-500 mr-1">Total Planned:</span>
                      {formatHours(item.totalBudgeted, settings.timeFormat)}
                    </div>

                    <div className="col-span-2 text-left md:text-right font-mono text-slate-400">
                      <span className="md:hidden text-slate-500 mr-1">Daily Avg:</span>
                      {formatHours(item.avgBudgeted, settings.timeFormat)}/day
                    </div>

                    <div className="col-span-2 text-left md:text-right font-mono text-emerald-400 font-semibold">
                      <span className="md:hidden text-slate-500 mr-1">Total Logged:</span>
                      {formatHours(item.totalLogged, settings.timeFormat)}
                    </div>

                    <div className="col-span-1 text-left md:text-right font-mono text-emerald-300">
                      <span className="md:hidden text-slate-500 mr-1">Avg Logged:</span>
                      {formatHours(item.avgLogged, settings.timeFormat)}/day
                    </div>
                  </div>

                  {/* Envelope Breakdown Rows */}
                  <div className="divide-y divide-slate-800/40">
                    {item.envelopes.map(({ cat, weeklyBudgeted, weeklyLogged, avgBudgeted, avgLogged }) => (
                      <div
                        key={cat.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 py-2 px-4 hover:bg-slate-800/20 text-xs items-center"
                      >
                        <div className="col-span-5 pl-4 sm:pl-6 text-slate-300 truncate">
                          <span>{cat.name}</span>
                        </div>

                        <div className="col-span-2 text-left md:text-right font-mono text-slate-400">
                          <span className="md:hidden text-slate-500 mr-1">Planned:</span>
                          {formatHours(weeklyBudgeted, settings.timeFormat)}
                        </div>

                        <div className="col-span-2 text-left md:text-right font-mono text-slate-500">
                          <span className="md:hidden text-slate-500 mr-1">Daily Avg:</span>
                          {formatHours(avgBudgeted, settings.timeFormat)}/day
                        </div>

                        <div className="col-span-2 text-left md:text-right font-mono text-slate-300">
                          <span className="md:hidden text-slate-500 mr-1">Logged:</span>
                          {formatHours(weeklyLogged, settings.timeFormat)}
                        </div>

                        <div className="col-span-1 text-left md:text-right font-mono text-slate-400">
                          <span className="md:hidden text-slate-500 mr-1">Daily Avg:</span>
                          {formatHours(avgLogged, settings.timeFormat)}/day
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
