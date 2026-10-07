import React, { useState } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { Moon, Clock, Check, Sun, BedDouble, ChevronDown } from 'lucide-react';
import { formatHours, calculateSleepHoursFromTimes, formatTime12Hour } from '../utils/dateUtils';

const SLEEP_PRESETS = [
  { label: '11:00 PM – 7:00 AM (8.0h)', bedtime: '23:00', wakeTime: '07:00' },
  { label: '10:30 PM – 6:30 AM (8.0h)', bedtime: '22:30', wakeTime: '06:30' },
  { label: '11:30 PM – 7:30 AM (8.0h)', bedtime: '23:30', wakeTime: '07:30' },
  { label: '12:00 AM – 8:00 AM (8.0h)', bedtime: '00:00', wakeTime: '08:00' },
  { label: '10:00 PM – 6:00 AM (8.0h)', bedtime: '22:00', wakeTime: '06:00' },
  { label: '11:00 PM – 6:30 AM (7.5h)', bedtime: '23:00', wakeTime: '06:30' },
];

export const SleepScheduleCard: React.FC = () => {
  const {
    daySleep,
    updateSleepSchedule,
    toggleSleepSchedule,
    settings,
  } = useTimeBudget();

  const [showPresets, setShowPresets] = useState(false);

  const targetSleepHours = typeof daySleep.targetSleepHours === 'number' ? daySleep.targetSleepHours : 8.0;

  const handleTargetSleepHoursChange = (hours: number) => {
    const clamped = Math.max(4, Math.min(14, Math.round(hours * 10) / 10));
    updateSleepSchedule({
      targetSleepHours: clamped,
    });
  };

  const handleBedtimeChange = (newBedtime: string) => {
    const targetHours = calculateSleepHoursFromTimes(newBedtime, daySleep.wakeTime);
    updateSleepSchedule({
      bedtime: newBedtime,
      targetHours,
    });
  };

  const handleWakeTimeChange = (newWakeTime: string) => {
    const targetHours = calculateSleepHoursFromTimes(daySleep.bedtime, newWakeTime);
    updateSleepSchedule({
      wakeTime: newWakeTime,
      targetHours,
    });
  };

  const applyPreset = (bedtime: string, wakeTime: string) => {
    const targetHours = calculateSleepHoursFromTimes(bedtime, wakeTime);
    updateSleepSchedule({
      bedtime,
      wakeTime,
      targetHours,
      targetSleepHours: targetHours,
    });
    setShowPresets(false);
  };

  const toggleSleepLogged = () => {
    const currentLogged = daySleep.loggedHours || 0;
    if (currentLogged > 0) {
      updateSleepSchedule({ loggedHours: 0 });
    } else {
      updateSleepSchedule({ loggedHours: daySleep.targetHours });
    }
  };

  const sleepDiff = Math.round((daySleep.targetHours - targetSleepHours) * 10) / 10;
  const isLogged = (daySleep.loggedHours || 0) > 0;

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-[#111728] to-slate-900/90 border border-slate-800/90 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden transition-all">
      {/* Decorative night glow */}
      <div className="absolute top-0 right-0 w-80 h-36 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header: Identity & Toggle Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-white tracking-tight">
                Sleep & Night Rest Schedule
              </h3>
              {daySleep.enabled ? (
                <span className="text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active in 24h Budget
                </span>
              ) : (
                <span className="text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                  Excluded from Budget
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Protects your baseline night recovery from being crowded out by day spillover.
            </p>
          </div>
        </div>

        {/* Header Right Actions: Presets & Switch */}
        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          {daySleep.enabled && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/70 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                title="Choose sleep schedule preset"
              >
                <span>Presets</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showPresets && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowPresets(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-40 py-1.5 text-xs">
                    <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono">
                      Sleep Schedule Presets
                    </div>
                    {SLEEP_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => applyPreset(p.bedtime, p.wakeTime)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800/90 text-slate-200 transition-colors cursor-pointer text-xs flex items-center justify-between"
                      >
                        <span className="font-mono text-[11px]">{p.label}</span>
                        {daySleep.bedtime === p.bedtime && daySleep.wakeTime === p.wakeTime && (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Enable / Disable toggle */}
          <button
            type="button"
            onClick={toggleSleepSchedule}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              daySleep.enabled ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={daySleep.enabled}
            title={daySleep.enabled ? 'Disable sleep accounting' : 'Enable sleep accounting'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                daySleep.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Grid of Clean Control Cards (When Enabled) */}
      {daySleep.enabled ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 relative z-10">
          
          {/* Card 1: Bedtime */}
          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BedDouble className="w-3.5 h-3.5 text-sky-400" />
                Target Bedtime
              </span>
              <span className="text-[11px] text-sky-400/90 font-mono font-medium bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/40">
                {formatTime12Hour(daySleep.bedtime)}
              </span>
            </div>
            <input
              type="time"
              value={daySleep.bedtime}
              onChange={(e) => handleBedtimeChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Card 2: Wake Time */}
          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Target Wake
              </span>
              <span className="text-[11px] text-amber-400/90 font-mono font-medium bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                {formatTime12Hour(daySleep.wakeTime)}
              </span>
            </div>
            <input
              type="time"
              value={daySleep.wakeTime}
              onChange={(e) => handleWakeTimeChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Card 3: Target Hours Slept Goal */}
          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Sleep Goal
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Target / day
              </span>
            </div>
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => handleTargetSleepHoursChange(targetSleepHours - 0.5)}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm flex items-center justify-center font-mono cursor-pointer transition-colors"
                title="Decrease target hours by 30m"
              >
                -
              </button>
              <span className="font-mono text-sm font-bold text-white px-2">
                {formatHours(targetSleepHours, settings.timeFormat)}
              </span>
              <button
                type="button"
                onClick={() => handleTargetSleepHoursChange(targetSleepHours + 0.5)}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm flex items-center justify-center font-mono cursor-pointer transition-colors"
                title="Increase target hours by 30m"
              >
                +
              </button>
            </div>
          </div>

          {/* Card 4: Planned Sleep & Log Button */}
          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
                Planned Sleep
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {sleepDiff === 0 ? (
                  <span className="text-emerald-400 font-medium">Meets goal</span>
                ) : sleepDiff > 0 ? (
                  <span className="text-sky-300">+{formatHours(sleepDiff, settings.timeFormat)}</span>
                ) : (
                  <span className="text-amber-400">-{formatHours(Math.abs(sleepDiff), settings.timeFormat)}</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-white tabular-nums">
                {formatHours(daySleep.targetHours, settings.timeFormat)}
              </span>

              <button
                type="button"
                onClick={toggleSleepLogged}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isLogged
                    ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 shadow-sm'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                }`}
                title="Toggle sleep logged status for today"
              >
                <Check className={`w-3.5 h-3.5 stroke-[2.5] ${isLogged ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{isLogged ? 'Slept' : 'Log Sleep'}</span>
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <span>Sleep hours are excluded from the zero-sum budget (daily capacity is waking hours).</span>
          <button
            type="button"
            onClick={toggleSleepSchedule}
            className="px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            Enable 24h Sleep Accounting
          </button>
        </div>
      )}

    </div>
  );
};
