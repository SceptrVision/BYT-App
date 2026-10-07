import React, { useState } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { Moon, Clock, Check, Sparkles, Sun, BedDouble, AlertCircle } from 'lucide-react';
import { formatHours, calculateSleepHoursFromTimes, formatTime12Hour } from '../utils/dateUtils';

const SLEEP_PRESETS = [
  { label: '11:00 PM – 7:00 AM (8h)', bedtime: '23:00', wakeTime: '07:00' },
  { label: '10:30 PM – 6:30 AM (8h)', bedtime: '22:30', wakeTime: '06:30' },
  { label: '11:30 PM – 7:30 AM (8h)', bedtime: '23:30', wakeTime: '07:30' },
  { label: '12:00 AM – 8:00 AM (8h)', bedtime: '00:00', wakeTime: '08:00' },
  { label: '10:00 PM – 6:00 AM (8h)', bedtime: '22:00', wakeTime: '06:00' },
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

  return (
    <div className="bg-gradient-to-r from-slate-900 via-[#111625] to-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden transition-all">
      {/* Decorative subtle night glow */}
      <div className="absolute top-0 right-0 w-72 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        
        {/* Left: Identity, Description & Toggle */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
            <Moon className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <span>Sleep & Night Rest Schedule</span>
              </h3>

              {/* Status Badge */}
              {daySleep.enabled ? (
                <span className="text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active in 24h Budget
                </span>
              ) : (
                <span className="text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                  Excluded from Budget
                </span>
              )}

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={toggleSleepSchedule}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  daySleep.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                role="switch"
                aria-checked={daySleep.enabled}
                title={daySleep.enabled ? 'Disable sleep accounting' : 'Enable sleep accounting'}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    daySleep.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Dedicated sleep section calculated from your target bedtime to wake time. Protects your baseline rest from being stolen by workday overflow.
            </p>
          </div>
        </div>

        {/* Right: Bedtime / Wake Time Inputs & Calculated Duration */}
        {daySleep.enabled ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            
            {/* Target Bedtime Input */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <BedDouble className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[10px] uppercase font-mono tracking-wider">Bedtime</span>
              </div>
              <input
                type="time"
                value={daySleep.bedtime}
                onChange={(e) => handleBedtimeChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                ({formatTime12Hour(daySleep.bedtime)})
              </span>
            </div>

            {/* Target Wake Time Input */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] uppercase font-mono tracking-wider">Wake</span>
              </div>
              <input
                type="time"
                value={daySleep.wakeTime}
                onChange={(e) => handleWakeTimeChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                ({formatTime12Hour(daySleep.wakeTime)})
              </span>
            </div>

            {/* Target for Hours Slept Input */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] uppercase font-mono tracking-wider">Sleep Target</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleTargetSleepHoursChange(targetSleepHours - 0.5)}
                  className="w-5 h-5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs flex items-center justify-center font-mono cursor-pointer"
                  title="Decrease target hours slept by 30m"
                >
                  -
                </button>
                <span className="font-mono text-xs font-semibold text-white px-1">
                  {formatHours(targetSleepHours, settings.timeFormat)}
                </span>
                <button
                  type="button"
                  onClick={() => handleTargetSleepHoursChange(targetSleepHours + 0.5)}
                  className="w-5 h-5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs flex items-center justify-center font-mono cursor-pointer"
                  title="Increase target hours slept by 30m"
                >
                  +
                </button>
              </div>
            </div>

            {/* Calculated Sleep Target & Logged State */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-right flex flex-col justify-center min-w-[110px]">
              <span className="text-[10px] uppercase font-mono text-sky-400 font-semibold tracking-wider">
                Planned Sleep
              </span>
              <span className="text-base font-bold font-mono text-white tabular-nums">
                {formatHours(daySleep.targetHours, settings.timeFormat)}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {sleepDiff === 0
                  ? 'Meets target'
                  : sleepDiff > 0
                  ? `+${formatHours(sleepDiff, settings.timeFormat)} vs target`
                  : `-${formatHours(Math.abs(sleepDiff), settings.timeFormat)} vs target`}
              </span>
            </div>

            {/* Actions: Presets & Logged toggle */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPresets(!showPresets)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                  title="Choose sleep schedule preset"
                >
                  Presets
                </button>

                {showPresets && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowPresets(false)}
                    />
                    <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-30 py-1 text-xs">
                      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        Schedule Presets
                      </div>
                      {SLEEP_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => applyPreset(p.bedtime, p.wakeTime)}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer text-xs flex items-center justify-between"
                        >
                          <span>{p.label}</span>
                          {daySleep.bedtime === p.bedtime && daySleep.wakeTime === p.wakeTime && (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Logged Sleep Checkmark */}
              <button
                type="button"
                onClick={toggleSleepLogged}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  (daySleep.loggedHours || 0) > 0
                    ? 'bg-emerald-950/70 border border-emerald-600/60 text-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Mark today's sleep logged"
              >
                <Check className={`w-3.5 h-3.5 ${((daySleep.loggedHours || 0) > 0) ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">
                  {(daySleep.loggedHours || 0) > 0 ? 'Slept' : 'Log Sleep'}
                </span>
              </button>
            </div>

          </div>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-slate-400 italic">
              Sleep is currently excluded from zero-sum daily allocations.
            </span>
            <button
              onClick={toggleSleepSchedule}
              className="px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              Enable Sleep Schedule
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
