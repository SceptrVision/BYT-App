import React, { useState } from 'react';
import { useTimeBudget } from '../context/TimeBudgetContext';
import { Plus, Settings, Play, Pause, FolderPlus, ArrowLeftRight, Check, SlidersHorizontal } from 'lucide-react';

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

  const [isEditingTabs, setIsEditingTabs] = useState(false);
  const [navTabsOrder, setNavTabsOrder] = useState<Array<'budget' | 'schedule' | 'reports'>>(() => {
    try {
      const stored = localStorage.getItem('byt_nav_tabs_order_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          Array.isArray(parsed) &&
          parsed.length === 3 &&
          parsed.includes('budget') &&
          parsed.includes('schedule') &&
          parsed.includes('reports')
        ) {
          return parsed;
        }
      }
    } catch {}
    return ['budget', 'schedule', 'reports'];
  });

  const moveTab = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= navTabsOrder.length) return;
    const newOrder = [...navTabsOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setNavTabsOrder(newOrder);
    localStorage.setItem('byt_nav_tabs_order_v2', JSON.stringify(newOrder));
  };

  const getTabLabel = (tabKey: 'budget' | 'schedule' | 'reports') => {
    if (tabKey === 'budget') return 'Daily Budget';
    if (tabKey === 'schedule') return 'Schedule';
    return 'Trends';
  };

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

        {/* Zone 2: Navigation Links (Moveable / Customizable) */}
        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="flex items-center gap-1 sm:gap-3 text-sm font-medium">
            {navTabsOrder.map((tabKey, index) => {
              const label = getTabLabel(tabKey);
              const isActive = activeTab === tabKey;

              return (
                <div key={tabKey} className="flex items-center gap-1">
                  {isEditingTabs && (
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveTab(index, 'left')}
                      className="text-[10px] text-slate-400 hover:text-sky-400 disabled:opacity-20 disabled:hover:text-slate-400 px-1 py-0.5 rounded cursor-pointer transition-colors"
                      title="Move tab left"
                    >
                      ←
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab(tabKey)}
                    className={`px-2.5 py-1 transition-colors relative cursor-pointer ${
                      isActive
                        ? 'text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{label}</span>
                    {isActive && (
                      <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full" />
                    )}
                  </button>

                  {isEditingTabs && (
                    <button
                      type="button"
                      disabled={index === navTabsOrder.length - 1}
                      onClick={() => moveTab(index, 'right')}
                      className="text-[10px] text-slate-400 hover:text-sky-400 disabled:opacity-20 disabled:hover:text-slate-400 px-1 py-0.5 rounded cursor-pointer transition-colors"
                      title="Move tab right"
                    >
                      →
                    </button>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Edit Tabs Layout Button */}
          {isEditingTabs ? (
            <div className="flex items-center gap-1 ml-2 bg-slate-900 border border-slate-700/80 rounded-md px-2 py-0.5 animate-in fade-in duration-150">
              <span className="text-[10px] font-mono text-sky-400 mr-1">Reordering</span>
              <button
                type="button"
                onClick={() => setIsEditingTabs(false)}
                title="Done editing tab layout"
                className="p-1 text-emerald-400 hover:text-emerald-300 rounded cursor-pointer flex items-center gap-1 text-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">Done</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTabs(true)}
              title="Edit tabs order (make tabs moveable)"
              className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded cursor-pointer transition-colors ml-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

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
