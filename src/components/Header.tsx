import React from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { Plus, Settings, Play, Pause, FolderPlus } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openLogModal,
    setIsSettingsModalOpen,
    openAddCustomEnvelope,
    timer,
    resumeTimer,
    pauseTimer,
    stopAndLogTimer,
    categories,
  } = useTimeBudget();

  const activeCategory = categories.find((c) => c.id === timer.categoryId);

  const formatTimerSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0c0f17]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Brand Wordmark (BYT - Buy Your Time) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('budget')}
            className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors flex items-center gap-2 group cursor-pointer"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-sky-500 text-slate-950 font-black text-xs shadow-[0_0_12px_rgba(16,185,129,0.4)]">
              BYT
            </div>
            <span className="font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              Buy Your Time
            </span>
          </button>
          <span className="hidden sm:inline-block text-[11px] text-sky-400/90 font-mono bg-sky-950/60 border border-sky-800/60 px-1.5 py-0.5 rounded">
            Daily 24h
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-5 text-sm font-medium">
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-2.5 py-1 transition-colors relative cursor-pointer ${
              activeTab === 'budget'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daily Budget
            {activeTab === 'budget' && (
              <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-2.5 py-1 transition-colors relative cursor-pointer ${
              activeTab === 'reports'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Trends
            {activeTab === 'reports' && (
              <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: Actions & Live Stopwatch */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Timer mini controller */}
          {(timer.isRunning || timer.elapsedSeconds > 0) && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-md text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 tabular-nums">
                {formatTimerSeconds(timer.elapsedSeconds)}
              </span>
              <span className="hidden lg:inline text-slate-400 truncate max-w-[80px]">
                {activeCategory?.name || 'Session'}
              </span>
              {timer.isRunning ? (
                <button
                  onClick={pauseTimer}
                  title="Pause timer"
                  className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  title="Resume timer"
                  className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={stopAndLogTimer}
                title="Finish & Log to envelope"
                className="text-emerald-400 hover:text-emerald-300 font-sans text-[11px] font-semibold ml-1 cursor-pointer"
              >
                Log
              </button>
            </div>
          )}

          <button
            onClick={() => openLogModal()}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors whitespace-nowrap shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log Time</span>
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            title="Preferences"
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded-md hover:bg-slate-800/60 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
