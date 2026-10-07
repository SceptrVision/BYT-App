import React, { useState } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { X, Settings, Download, Upload, RotateCcw, Check } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    settings,
    updateSettings,
    resetToDemo,
    exportData,
    importData,
  } = useTimeBudget();

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `byt-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importData(content);
      if (success) {
        setImportStatus('Data successfully restored!');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handlePerformReset = () => {
    resetToDemo();
    setConfirmReset(false);
    setIsSettingsModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                BYT Preferences
              </h3>
              <p className="text-xs text-slate-400">
                Configure your daily time currency pool and export your data
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs">
          
          {/* Daily Capacity Mode */}
          <div className="space-y-2">
            <label className="font-semibold uppercase tracking-wider text-slate-400 block">
              Daily Time Inflow Pool
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  settings.mode === 'full_24'
                    ? 'bg-emerald-950/20 border-emerald-500/60 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="capacity_mode"
                  checked={settings.mode === 'full_24'}
                  onChange={() => updateSettings({ mode: 'full_24', dailyCapacityHours: 24 })}
                  className="mt-0.5 accent-emerald-500"
                />
                <div>
                  <div className="font-semibold text-slate-100 flex items-center gap-2">
                    <span>24.0 Hours (Full Day Zero-Sum)</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                      Recommended
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Budgets all 24 hours of the day. Sleep is its own explicit envelope (8h), protecting sleep from being sacrificed to other tasks.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  settings.mode === 'waking_16'
                    ? 'bg-sky-950/20 border-sky-500/60 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="capacity_mode"
                  checked={settings.mode === 'waking_16'}
                  onChange={() => updateSettings({ mode: 'waking_16', dailyCapacityHours: 16 })}
                  className="mt-0.5 accent-sky-500"
                />
                <div>
                  <div className="font-semibold text-slate-100">
                    16.0 Hours (Waking Hours Only)
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Treats 8 hours of sleep as fixed outside the pool; only 16 waking hours are budgeted each day.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Time Display Format */}
          <div className="space-y-2">
            <label className="font-semibold uppercase tracking-wider text-slate-400 block">
              Time Display Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateSettings({ timeFormat: 'decimal' })}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  settings.timeFormat === 'decimal'
                    ? 'bg-slate-800 border-emerald-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-xs">Decimal Hours</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">e.g. 1.5h, 4.0h</div>
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ timeFormat: 'hours_minutes' })}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  settings.timeFormat === 'hours_minutes'
                    ? 'bg-slate-800 border-sky-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-xs">Hours & Minutes</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">e.g. 1h 30m, 45m</div>
              </button>
            </div>
          </div>

          {/* Data Portability */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <label className="font-semibold uppercase tracking-wider text-slate-400 block">
              Data & Backup
            </label>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="text-emerald-400 flex items-center gap-1.5 mt-1 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>

          {/* Reset Demo State */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-300">Reset to Demo State</div>
              <p className="text-[11px] text-slate-500">
                Restore sample daily envelopes, targets, and logs
              </p>
            </div>

            {confirmReset ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePerformReset}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-medium cursor-pointer"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1 text-slate-400 hover:text-red-400 py-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
