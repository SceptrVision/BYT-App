/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TimeBudgetProvider, useTimeBudget } from './context/TimeBudgetContext';
import { Header } from './components/Header';
import { BudgetView } from './components/BudgetView';
import { ReportsView } from './components/ReportsView';
import { LogTimeModal } from './components/LogTimeModal';
import { ReallocateModal } from './components/ReallocateModal';
import { SettingsModal } from './components/SettingsModal';
import { DeleteEnvelopeModal } from './components/DeleteEnvelopeModal';
import { DeleteGroupModal } from './components/DeleteGroupModal';
import { EnvelopeActivitiesModal } from './components/EnvelopeActivitiesModal';
import { AssignBudgetModal } from './components/AssignBudgetModal';
import { CalendarPickerModal } from './components/CalendarPickerModal';
import { SwitchTimerModal } from './components/SwitchTimerModal';

const MainAppContent: React.FC = () => {
  const { activeTab } = useTimeBudget();

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <Header />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'budget' && <BudgetView />}
        {activeTab === 'reports' && <ReportsView />}
      </main>

      {/* Modals & Portals */}
      <EnvelopeActivitiesModal />
      <LogTimeModal />
      <ReallocateModal />
      <SettingsModal />
      <DeleteEnvelopeModal />
      <DeleteGroupModal />
      <AssignBudgetModal />
      <CalendarPickerModal />
      <SwitchTimerModal />

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-[#080b11] py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">BYT</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">Buy Your Time</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Sum Daily Time Budgeting</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Give every hour of today a job · Roll with the punches
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <TimeBudgetProvider>
      <MainAppContent />
    </TimeBudgetProvider>
  );
}
