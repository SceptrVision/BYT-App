import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Category,
  CategoryGroup,
  TimeEntry,
  DayBudgetData,
  AppSettings,
  AutoAssignMethod,
  TimerSession,
  SleepSchedule,
  BUFFER_ID,
} from '../types';
import {
  loadStoredData,
  saveData,
  DEFAULT_CATEGORIES,
  DEFAULT_GROUPS,
  DEFAULT_SETTINGS,
  DEFAULT_SLEEP,
  generateSeedData,
} from '../utils/storage';
import { getTodayDateStr, shiftDate } from '../utils/dateUtils';

interface TimeBudgetContextType {
  // Navigation & tabs
  currentDate: string; // YYYY-MM-DD
  setCurrentDate: (dateStr: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  activeTab: 'budget' | 'ledger' | 'reports';
  setActiveTab: (tab: 'budget' | 'ledger' | 'reports') => void;

  // State data
  categories: Category[];
  groups: CategoryGroup[];
  budgets: Record<string, DayBudgetData>;
  entries: TimeEntry[];
  settings: AppSettings;

  // Dedicated Daily Buffer (First-Class System Margin)
  dayBuffer: number;
  dayBufferAllocated: number;
  dayBufferUsed: number;
  setDayBuffer: (hours: number) => void;
  adjustDayBuffer: (deltaHours: number) => void;
  stashUnassignedInDayBuffer: () => void;
  releaseBufferToReadyToAssign: (hours?: number) => void;
  coverOverspendingWithBuffer: (overspentCatId: string) => void;

  // Dedicated Sleep Schedule (Toggleable & Calculated from Bedtime to Wake Time)
  daySleep: SleepSchedule;
  updateSleepSchedule: (updates: Partial<SleepSchedule>) => void;
  toggleSleepSchedule: () => void;

  // Direct Category Budget (with warning when not in an envelope yet)
  dayCategoryDirectBudgets: Record<string, number>;
  setCategoryDirectBudget: (groupId: string, hours: number) => void;
  adjustCategoryDirectBudget: (groupId: string, deltaHours: number) => void;
  clearCategoryDirectBudget: (groupId: string) => void;
  distributeDirectBudgetToEnvelopes: (groupId: string) => void;

  // Computed for currentDate
  dayBudget: Record<string, number>;
  dayLogged: Record<string, number>;
  dayAvailable: Record<string, number>;
  totalCapacity: number; // 24.0h or 16.0h
  totalBudgeted: number;
  totalLogged: number;
  readyToAssign: number;
  overspentCategories: Category[];

  // Actions
  setCategoryBudget: (categoryId: string, hours: number) => void;
  adjustCategoryBudget: (categoryId: string, deltaHours: number) => void;
  reallocateHours: (fromCategoryId: string, toCategoryId: string, hours: number) => void;
  coverOverspending: (overspentCatId: string, sourceCatId: string) => void;
  autoAssign: (method: AutoAssignMethod) => void;

  // Entries
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => void;
  editTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;

  // Custom Envelopes & Groups
  addCategory: (cat: Omit<Category, 'id'>) => void;
  editCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string, deleteEntries?: boolean) => void;
  addGroup: (group: Omit<CategoryGroup, 'id' | 'order'>) => void;
  editGroup: (id: string, updates: Partial<CategoryGroup>) => void;
  deleteGroup: (id: string, destinationGroupId?: string, deleteEntries?: boolean) => void;

  // Settings & Storage
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetToDemo: () => void;
  exportData: () => string;
  importData: (jsonStr: string) => boolean;

  // Live Stopwatch Timer
  timer: TimerSession;
  startTimer: (categoryId: string, note?: string) => void;
  toggleCategoryTimer: (categoryId: string, note?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndLogTimer: () => void;
  cancelTimer: () => void;

  // Modal triggers
  isLogModalOpen: boolean;
  openLogModal: (categoryId?: string) => void;
  closeLogModal: () => void;
  logModalPresetCategory?: string;

  isReallocateModalOpen: boolean;
  openReallocateModal: (targetCatId?: string) => void;
  closeReallocateModal: () => void;
  reallocateTargetCategory?: string;

  isCategoryManagerOpen: boolean;
  setIsCategoryManagerOpen: (open: boolean) => void;
  openAddCustomEnvelope: (presetGroupId?: string) => void;
  customEnvelopePresetGroup?: string;

  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;

  // Envelope Activities Modal (triggered by clicking envelope)
  selectedEnvelopeForActivities: Category | null;
  openEnvelopeActivities: (category: Category) => void;
  openEnvelopeActivitiesById: (categoryId: string) => void;
  closeEnvelopeActivities: () => void;

  // Delete envelope confirmation modal
  envelopeToDelete: Category | null;
  promptDeleteCategory: (category: Category) => void;
  confirmDeleteCategory: (deleteEntries?: boolean) => void;
  cancelDeleteCategory: () => void;

  // Delete category group confirmation modal
  groupToDelete: CategoryGroup | null;
  promptDeleteGroup: (group: CategoryGroup) => void;
  confirmDeleteGroup: (destinationGroupId?: string, deleteEntries?: boolean) => void;
  cancelDeleteGroup: () => void;

  // Assign Budget with Requested Source Modal
  assignBudgetCategory: Category | null;
  openAssignBudgetModal: (category: Category) => void;
  closeAssignBudgetModal: () => void;
  assignBudgetWithSource: (
    targetCategoryId: string,
    amountHours: number,
    source: 'ready_to_assign' | 'buffer' | 'envelope' | 'category',
    sourceEnvelopeId?: string
  ) => void;

  // Calendar Day Picker Modal
  isCalendarPickerOpen: boolean;
  setIsCalendarPickerOpen: (open: boolean) => void;

  // Switch Active Timer Prompt Modal
  isSwitchTimerModalOpen: boolean;
  pendingSwitchCategory: Category | null;
  confirmSwitchTimer: (action: 'log' | 'discard') => void;
  cancelSwitchTimer: () => void;

  // Copy Week Confirmation Modal (Explicit Button)
  isCopyWeekModalOpen: boolean;
  setIsCopyWeekModalOpen: (open: boolean) => void;
  confirmCopyWeek: () => void;
}

const TimeBudgetContext = createContext<TimeBudgetContextType | undefined>(undefined);

export const TimeBudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialData] = useState(() => loadStoredData());
  const [categories, setCategories] = useState<Category[]>(initialData.categories);
  const [groups, setGroups] = useState<CategoryGroup[]>(initialData.groups);
  const [budgets, setBudgets] = useState<Record<string, DayBudgetData>>(initialData.budgets);
  const [entries, setEntries] = useState<TimeEntry[]>(initialData.entries);
  const [settings, setSettings] = useState<AppSettings>(initialData.settings);

  // Active day & view
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayDateStr());
  const [activeTab, setActiveTab] = useState<'budget' | 'ledger' | 'reports'>('budget');

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalPresetCategory, setLogModalPresetCategory] = useState<string | undefined>(undefined);
  const [isReallocateModalOpen, setIsReallocateModalOpen] = useState(false);
  const [reallocateTargetCategory, setReallocateTargetCategory] = useState<string | undefined>(undefined);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [customEnvelopePresetGroup, setCustomEnvelopePresetGroup] = useState<string | undefined>(undefined);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [envelopeToDelete, setEnvelopeToDelete] = useState<Category | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<CategoryGroup | null>(null);

  // Envelope Activities Detail Modal
  const [selectedEnvelopeForActivities, setSelectedEnvelopeForActivities] = useState<Category | null>(null);

  // Assign Budget with Specific Source Modal
  const [assignBudgetCategory, setAssignBudgetCategory] = useState<Category | null>(null);

  // Calendar Day Picker Modal
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false);

  // Switch Active Timer Prompt Modal
  const [isSwitchTimerModalOpen, setIsSwitchTimerModalOpen] = useState(false);
  const [pendingSwitchCategory, setPendingSwitchCategory] = useState<Category | null>(null);

  // Copy Week Confirmation Modal
  const [isCopyWeekModalOpen, setIsCopyWeekModalOpen] = useState(false);

  // Timer
  const [timer, setTimer] = useState<TimerSession>({
    isRunning: false,
    categoryId: '',
    note: '',
    startTime: null,
    elapsedSeconds: 0,
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timer.isRunning && timer.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diffSecs = Math.max(0, Math.floor((now - timer.startTime!) / 1000));
        setTimer((prev) => {
          if (!prev.isRunning) return prev;
          return {
            ...prev,
            elapsedSeconds: diffSecs,
          };
        });
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, timer.startTime]);

  useEffect(() => {
    saveData(categories, groups, budgets, entries, settings);
  }, [categories, groups, budgets, entries, settings]);

  // Current day budget allocations
  const dayBudget = useMemo(() => {
    const existing = budgets[currentDate]?.allocations;
    if (existing) return existing;

    // Do not automatically assign unbudgeted days to daily targets;
    // Keep them at 0 so hours remain in "Ready to Assign".
    // Auto-assigning to the next 6 days is done on-demand via the explicit button.
    const defaults: Record<string, number> = {};
    categories.forEach((cat) => {
      defaults[cat.id] = 0;
    });
    return defaults;
  }, [budgets, currentDate, categories]);

  // Dedicated Daily Buffer for current day (defaults to 1.5h if unset)
  const dayBuffer = useMemo(() => {
    const current = budgets[currentDate]?.buffer;
    return typeof current === 'number' ? current : 1.5;
  }, [budgets, currentDate]);

  const dayBufferUsed = useMemo(() => {
    return budgets[currentDate]?.bufferUsed || 0;
  }, [budgets, currentDate]);

  const dayBufferAllocated = useMemo(() => {
    const raw = budgets[currentDate]?.bufferAllocated;
    if (typeof raw === 'number') return raw;
    return Math.round((dayBuffer + dayBufferUsed) * 10) / 10;
  }, [budgets, currentDate, dayBuffer, dayBufferUsed]);

  // Dedicated Sleep Schedule for current day
  const daySleep = useMemo(() => {
    return budgets[currentDate]?.sleep || DEFAULT_SLEEP;
  }, [budgets, currentDate]);

  // Direct Category Budgets (budgeted directly to category group, not yet in envelope)
  const dayCategoryDirectBudgets = useMemo(() => {
    return budgets[currentDate]?.categoryDirectBudgets || {};
  }, [budgets, currentDate]);

  // Current day logged hours
  const dayLogged = useMemo(() => {
    const map: Record<string, number> = {};
    entries
      .filter((e) => e.date === currentDate)
      .forEach((e) => {
        map[e.categoryId] = (map[e.categoryId] || 0) + e.duration;
      });
    return map;
  }, [entries, currentDate]);

  // Current day available per category (budgeted - logged)
  const dayAvailable = useMemo(() => {
    const map: Record<string, number> = {};
    categories.forEach((cat) => {
      const b = dayBudget[cat.id] ?? cat.dailyTarget;
      const l = dayLogged[cat.id] || 0;
      map[cat.id] = Math.round((b - l) * 10) / 10;
    });
    return map;
  }, [categories, dayBudget, dayLogged]);

  // Daily capacity (24h or 16h)
  const totalCapacity = useMemo(() => {
    if (settings.mode === 'full_24') return 24.0;
    if (settings.mode === 'waking_16') return 16.0;
    return settings.dailyCapacityHours || 24.0;
  }, [settings]);

  const totalBudgeted = useMemo(() => {
    let sum = 0;
    categories.forEach((cat) => {
      sum += dayBudget[cat.id] ?? cat.dailyTarget;
    });
    // Include direct category budgets
    Object.values(dayCategoryDirectBudgets).forEach((hours) => {
      sum += hours || 0;
    });
    // Include first-class daily buffer cushion in zero-sum calculation
    sum += dayBuffer;
    // Include sleep schedule if enabled
    if (daySleep.enabled) {
      sum += daySleep.targetHours;
    }
    return Math.round(sum * 10) / 10;
  }, [categories, dayBudget, dayCategoryDirectBudgets, dayBuffer, daySleep]);

  const totalLogged = useMemo(() => {
    let sum = 0;
    categories.forEach((cat) => {
      sum += dayLogged[cat.id] || 0;
    });
    if (daySleep.enabled && typeof daySleep.loggedHours === 'number') {
      sum += daySleep.loggedHours;
    }
    return Math.round(sum * 10) / 10;
  }, [categories, dayLogged, daySleep]);

  const readyToAssign = useMemo(() => {
    return Math.round((totalCapacity - totalBudgeted) * 10) / 10;
  }, [totalCapacity, totalBudgeted]);

  const overspentCategories = useMemo(() => {
    return categories.filter((cat) => (dayAvailable[cat.id] || 0) < -0.05);
  }, [categories, dayAvailable]);

  // Day navigation
  const goToPreviousDay = useCallback(() => {
    setCurrentDate((prev) => shiftDate(prev, -1));
  }, []);

  const goToNextDay = useCallback(() => {
    setCurrentDate((prev) => shiftDate(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(getTodayDateStr());
  }, []);

  // Dedicated Buffer mutations
  const setDayBuffer = useCallback((hours: number) => {
    const clamped = Math.max(0, Math.round(hours * 10) / 10);
    setBudgets((prev) => {
      const currentData = prev[currentDate] || { allocations: {}, buffer: 1.5 };
      return {
        ...prev,
        [currentDate]: {
          ...currentData,
          buffer: clamped,
        },
      };
    });
  }, [currentDate]);

  // Dedicated Sleep Schedule mutations
  const updateSleepSchedule = useCallback((updates: Partial<SleepSchedule>) => {
    setBudgets((prev) => {
      const currentData = prev[currentDate] || { allocations: {}, buffer: 1.5, sleep: { ...DEFAULT_SLEEP } };
      const prevSleep = currentData.sleep || { ...DEFAULT_SLEEP };
      const newSleep: SleepSchedule = { ...prevSleep, ...updates };
      return {
        ...prev,
        [currentDate]: {
          ...currentData,
          sleep: newSleep,
        },
      };
    });
  }, [currentDate]);

  const toggleSleepSchedule = useCallback(() => {
    updateSleepSchedule({ enabled: !daySleep.enabled });
  }, [daySleep.enabled, updateSleepSchedule]);

  // Direct Category Budget mutations
  const setCategoryDirectBudget = useCallback((groupId: string, hours: number) => {
    const clamped = Math.max(0, Math.round(hours * 10) / 10);
    setBudgets((prev) => {
      const currentData = prev[currentDate] || { allocations: {}, buffer: 1.5 };
      const currentDirect = { ...(currentData.categoryDirectBudgets || {}) };
      if (clamped <= 0) {
        delete currentDirect[groupId];
      } else {
        currentDirect[groupId] = clamped;
      }
      return {
        ...prev,
        [currentDate]: {
          ...currentData,
          categoryDirectBudgets: currentDirect,
        },
      };
    });
  }, [currentDate]);

  const adjustCategoryDirectBudget = useCallback((groupId: string, deltaHours: number) => {
    const current = dayCategoryDirectBudgets[groupId] || 0;
    setCategoryDirectBudget(groupId, current + deltaHours);
  }, [dayCategoryDirectBudgets, setCategoryDirectBudget]);

  const clearCategoryDirectBudget = useCallback((groupId: string) => {
    setCategoryDirectBudget(groupId, 0);
  }, [setCategoryDirectBudget]);

  const distributeDirectBudgetToEnvelopes = useCallback((groupId: string) => {
    const directHours = dayCategoryDirectBudgets[groupId] || 0;
    if (directHours <= 0) return;
    const groupCats = categories.filter((c) => c.groupId === groupId);
    if (groupCats.length === 0) return;

    setBudgets((prev) => {
      const currentData = prev[currentDate] || { allocations: {}, buffer: 1.5 };
      const newAllocations = { ...(currentData.allocations || dayBudget) };
      // Distribute evenly among envelopes in group
      const perCat = Math.round((directHours / groupCats.length) * 10) / 10;
      let remaining = directHours;
      groupCats.forEach((cat, idx) => {
        const toAdd = idx === groupCats.length - 1 ? remaining : perCat;
        newAllocations[cat.id] = Math.round(((newAllocations[cat.id] ?? cat.dailyTarget) + toAdd) * 10) / 10;
        remaining = Math.max(0, Math.round((remaining - toAdd) * 10) / 10);
      });
      const newDirect = { ...(currentData.categoryDirectBudgets || {}) };
      delete newDirect[groupId];
      return {
        ...prev,
        [currentDate]: {
          ...currentData,
          allocations: newAllocations,
          categoryDirectBudgets: newDirect,
        },
      };
    });
  }, [dayCategoryDirectBudgets, categories, currentDate, dayBudget]);

  const adjustDayBuffer = useCallback((deltaHours: number) => {
    setDayBuffer(dayBuffer + deltaHours);
  }, [dayBuffer, setDayBuffer]);

  const stashUnassignedInDayBuffer = useCallback(() => {
    if (readyToAssign > 0) {
      setDayBuffer(dayBuffer + readyToAssign);
    }
  }, [readyToAssign, dayBuffer, setDayBuffer]);

  const releaseBufferToReadyToAssign = useCallback((hours?: number) => {
    const amount = hours !== undefined ? hours : dayBuffer;
    setDayBuffer(Math.max(0, dayBuffer - amount));
  }, [dayBuffer, setDayBuffer]);

  const coverOverspendingWithBuffer = useCallback((overspentCatId: string) => {
    const needed = Math.abs(dayAvailable[overspentCatId] || 0);
    if (needed <= 0 || dayBuffer <= 0) return;
    const amountToTake = Math.min(dayBuffer, needed);

    setBudgets((prev) => {
      const currentData = prev[currentDate] || { allocations: {}, buffer: 1.5 };
      const currentAlloc = currentData.allocations[overspentCatId] ?? (categories.find(c => c.id === overspentCatId)?.dailyTarget || 0);
      const prevUsed = currentData.bufferUsed || 0;
      return {
        ...prev,
        [currentDate]: {
          ...currentData,
          buffer: Math.round(Math.max(0, (currentData.buffer ?? 1.5) - amountToTake) * 10) / 10,
          bufferUsed: Math.round((prevUsed + amountToTake) * 10) / 10,
          allocations: {
            ...currentData.allocations,
            [overspentCatId]: Math.round((currentAlloc + amountToTake) * 10) / 10,
          },
        },
      };
    });
  }, [dayAvailable, dayBuffer, currentDate, categories]);

  // Budget mutations
  const setCategoryBudget = useCallback(
    (categoryId: string, hours: number) => {
      const clamped = Math.max(0, Math.round(hours * 10) / 10);
      setBudgets((prev) => {
        const currentData = prev[currentDate] || { allocations: { ...dayBudget } };
        return {
          ...prev,
          [currentDate]: {
            ...currentData,
            allocations: {
              ...currentData.allocations,
              [categoryId]: clamped,
            },
          },
        };
      });
    },
    [currentDate, dayBudget]
  );

  const adjustCategoryBudget = useCallback(
    (categoryId: string, deltaHours: number) => {
      const current = dayBudget[categoryId] ?? 0;
      setCategoryBudget(categoryId, current + deltaHours);
    },
    [dayBudget, setCategoryBudget]
  );

  const reallocateHours = useCallback(
    (fromCategoryId: string, toCategoryId: string, hours: number) => {
      if (fromCategoryId === toCategoryId || hours <= 0) return;
      const transfer = Math.round(hours * 10) / 10;

      setBudgets((prev) => {
        const currentData = prev[currentDate] || { allocations: { ...dayBudget }, buffer: 1.5 };
        const newAllocations = { ...currentData.allocations };
        let newBuffer = currentData.buffer ?? 1.5;
        let newBufferUsed = currentData.bufferUsed || 0;

        // Source deduction
        if (fromCategoryId === BUFFER_ID || fromCategoryId === 'BUFFER') {
          newBuffer = Math.max(0, Math.round((newBuffer - transfer) * 10) / 10);
          newBufferUsed = Math.round((newBufferUsed + transfer) * 10) / 10;
        } else {
          const currentFrom = newAllocations[fromCategoryId] ?? (categories.find(c => c.id === fromCategoryId)?.dailyTarget || 0);
          newAllocations[fromCategoryId] = Math.max(0, Math.round((currentFrom - transfer) * 10) / 10);
        }

        // Destination addition
        if (toCategoryId === BUFFER_ID || toCategoryId === 'BUFFER') {
          newBuffer = Math.round((newBuffer + transfer) * 10) / 10;
          newBufferUsed = Math.max(0, Math.round((newBufferUsed - transfer) * 10) / 10);
        } else {
          const currentTo = newAllocations[toCategoryId] ?? (categories.find(c => c.id === toCategoryId)?.dailyTarget || 0);
          newAllocations[toCategoryId] = Math.round((currentTo + transfer) * 10) / 10;
        }

        return {
          ...prev,
          [currentDate]: {
            ...currentData,
            buffer: newBuffer,
            bufferUsed: newBufferUsed,
            allocations: newAllocations,
          },
        };
      });
    },
    [currentDate, dayBudget, categories]
  );

  const coverOverspending = useCallback(
    (overspentCatId: string, sourceCatId: string) => {
      const needed = Math.abs(dayAvailable[overspentCatId] || 0);
      if (needed <= 0) return;
      reallocateHours(sourceCatId, overspentCatId, needed);
    },
    [dayAvailable, reallocateHours]
  );

  const autoAssign = useCallback(
    (method: AutoAssignMethod) => {
      setBudgets((prev) => {
        const currentData = prev[currentDate] || { allocations: {}, buffer: 1.5 };
        let newAllocations: Record<string, number> = { ...dayBudget };
        let newBuffer = currentData.buffer ?? 1.5;

        if (method === 'targets') {
          categories.forEach((cat) => {
            newAllocations[cat.id] = cat.dailyTarget;
          });
          newBuffer = 1.5;
        } else if (method === 'copy_yesterday') {
          const yesterday = shiftDate(currentDate, -1);
          const yData = prev[yesterday];
          if (yData?.allocations) {
            newAllocations = { ...yData.allocations };
          }
          if (typeof yData?.buffer === 'number') {
            newBuffer = yData.buffer;
          }
        } else if (method === 'copy_to_week') {
          // Copy current day's allocation, buffer, sleep, and direct budgets to the next 6 days
          const updatedBudgets = { ...prev };
          const currentSleep = currentData.sleep || DEFAULT_SLEEP;
          const currentDirectBudgets = currentData.categoryDirectBudgets ? { ...currentData.categoryDirectBudgets } : {};
          for (let i = 1; i <= 6; i++) {
            const nextDay = shiftDate(currentDate, i);
            updatedBudgets[nextDay] = {
              allocations: { ...newAllocations },
              buffer: newBuffer,
              sleep: { ...currentSleep },
              categoryDirectBudgets: { ...currentDirectBudgets },
            };
          }
          return updatedBudgets;
        } else if (method === 'fill_buffer') {
          // Dedicated buffer receives all ready-to-assign time!
          if (readyToAssign > 0) {
            newBuffer = Math.round((newBuffer + readyToAssign) * 10) / 10;
          }
        } else if (method === 'reset_zero') {
          newAllocations = {};
          categories.forEach((cat) => {
            newAllocations[cat.id] = 0;
          });
          newBuffer = 0;
        }

        return {
          ...prev,
          [currentDate]: {
            ...currentData,
            buffer: newBuffer,
            allocations: newAllocations,
          },
        };
      });
    },
    [currentDate, dayBudget, categories, readyToAssign]
  );

  // Time entries
  const addTimeEntry = useCallback(
    (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
      const newEntry: TimeEntry = {
        ...entry,
        id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
      };
      setEntries((prev) => [newEntry, ...prev]);
    },
    []
  );

  const editTimeEntry = useCallback((id: string, updates: Partial<TimeEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  const deleteTimeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Custom Category & Group Management
  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const id = `cat-custom-${Date.now()}`;
    const newCat: Category = { ...cat, id, isCustom: true };
    setCategories((prev) => [...prev, newCat]);
    // Also initialize in today's budget with its target
    setBudgets((prev) => {
      const currentData = prev[currentDate] || { allocations: {} };
      return {
        ...prev,
        [currentDate]: {
          ...currentData,
          allocations: {
            ...currentData.allocations,
            [id]: cat.dailyTarget,
          },
        },
      };
    });
  }, [currentDate]);

  const editCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const deleteCategory = useCallback((id: string, deleteEntries: boolean = false) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    // Clean up allocations across all days so hours return to Ready to Assign
    setBudgets((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((dateKey) => {
        if (updated[dateKey]?.allocations?.[id] !== undefined) {
          const newAllocations = { ...updated[dateKey].allocations };
          delete newAllocations[id];
          updated[dateKey] = {
            ...updated[dateKey],
            allocations: newAllocations,
          };
        }
      });
      return updated;
    });

    if (deleteEntries) {
      setEntries((prev) => prev.filter((e) => e.categoryId !== id));
    }

    // Stop active timer if it was running on this deleted category
    setTimer((prev) => {
      if (prev.categoryId === id) {
        return {
          isRunning: false,
          categoryId: '',
          note: '',
          startTime: null,
          elapsedSeconds: 0,
        };
      }
      return prev;
    });
  }, []);

  const promptDeleteCategory = useCallback((category: Category) => {
    setEnvelopeToDelete(category);
  }, []);

  const cancelDeleteCategory = useCallback(() => {
    setEnvelopeToDelete(null);
  }, []);

  const confirmDeleteCategory = useCallback((deleteEntries: boolean = false) => {
    if (envelopeToDelete) {
      deleteCategory(envelopeToDelete.id, deleteEntries);
      setEnvelopeToDelete(null);
    }
  }, [envelopeToDelete, deleteCategory]);

  const addGroup = useCallback((group: Omit<CategoryGroup, 'id' | 'order'>) => {
    setGroups((prev) => [
      ...prev,
      {
        ...group,
        id: `group-${Date.now()}`,
        order: prev.length + 1,
        isCustom: true,
      },
    ]);
  }, []);

  const editGroup = useCallback((id: string, updates: Partial<CategoryGroup>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  }, []);

  const deleteGroup = useCallback(
    (id: string, destinationGroupId?: string, deleteEntries: boolean = false) => {
      const groupCats = categories.filter((c) => c.groupId === id);
      const catIdsToDelete = new Set(groupCats.map((c) => c.id));

      if (destinationGroupId && destinationGroupId !== 'delete') {
        // Reassign envelopes to another category group
        setCategories((prev) =>
          prev.map((c) => (c.groupId === id ? { ...c, groupId: destinationGroupId } : c))
        );
      } else {
        // Remove envelopes from categories
        setCategories((prev) => prev.filter((c) => c.groupId !== id));

        // Clean up allocations from budgets so hours return to Ready to Assign
        setBudgets((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((dateKey) => {
            if (updated[dateKey]?.allocations) {
              const nextAllocations = { ...updated[dateKey].allocations };
              catIdsToDelete.forEach((catId) => {
                delete nextAllocations[catId];
              });
              updated[dateKey] = {
                ...updated[dateKey],
                allocations: nextAllocations,
              };
            }
          });
          return updated;
        });

        if (deleteEntries) {
          setEntries((prev) => prev.filter((e) => !catIdsToDelete.has(e.categoryId)));
        }

        // Reset timer if running on one of those envelopes
        setTimer((prev) => {
          if (catIdsToDelete.has(prev.categoryId)) {
            return {
              isRunning: false,
              categoryId: '',
              note: '',
              startTime: null,
              elapsedSeconds: 0,
            };
          }
          return prev;
        });
      }

      // Remove the group from groups
      setGroups((prev) => prev.filter((g) => g.id !== id));
    },
    [categories]
  );

  const promptDeleteGroup = useCallback((group: CategoryGroup) => {
    setGroupToDelete(group);
  }, []);

  const cancelDeleteGroup = useCallback(() => {
    setGroupToDelete(null);
  }, []);

  const confirmDeleteGroup = useCallback(
    (destinationGroupId?: string, deleteEntries: boolean = false) => {
      if (groupToDelete) {
        deleteGroup(groupToDelete.id, destinationGroupId, deleteEntries);
        setGroupToDelete(null);
      }
    },
    [groupToDelete, deleteGroup]
  );

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetToDemo = useCallback(() => {
    const seed = generateSeedData();
    setCategories(DEFAULT_CATEGORIES);
    setGroups(DEFAULT_GROUPS);
    setBudgets(seed.budgets);
    setEntries(seed.entries);
    setSettings(DEFAULT_SETTINGS);
    setCurrentDate(getTodayDateStr());
  }, []);

  const exportData = useCallback(() => {
    const dump = {
      app: 'BYT - Buy Your Time',
      version: 2,
      exportedAt: new Date().toISOString(),
      categories,
      groups,
      budgets,
      entries,
      settings,
    };
    return JSON.stringify(dump, null, 2);
  }, [categories, groups, budgets, entries, settings]);

  const importData = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.categories && parsed.budgets) {
        setCategories(parsed.categories);
        if (parsed.groups) setGroups(parsed.groups);
        setBudgets(parsed.budgets);
        if (parsed.entries) setEntries(parsed.entries);
        if (parsed.settings) setSettings(parsed.settings);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import parse error:', e);
      return false;
    }
  }, []);

  // Timer controls
  const startTimer = useCallback((categoryId: string, note: string = '') => {
    if (timer.categoryId && timer.categoryId !== categoryId && (timer.isRunning || timer.elapsedSeconds > 0)) {
      const nextCat = categories.find((c) => c.id === categoryId);
      if (nextCat) {
        setPendingSwitchCategory(nextCat);
        setIsSwitchTimerModalOpen(true);
        return;
      }
    }

    setTimer((prev) => {
      // If clicking start on the ALREADY active category:
      if (prev.categoryId === categoryId) {
        if (prev.isRunning) {
          // Already running! Don't reset!
          return prev;
        } else {
          // Resume!
          return {
            ...prev,
            isRunning: true,
            startTime: Date.now() - prev.elapsedSeconds * 1000,
          };
        }
      }
      // New category: start fresh timer
      return {
        isRunning: true,
        categoryId: categoryId || categories[0]?.id || '',
        note: note || (categories.find(c => c.id === categoryId)?.name ? `Focus on ${categories.find(c => c.id === categoryId)?.name}` : ''),
        startTime: Date.now(),
        elapsedSeconds: 0,
      };
    });
  }, [categories, timer]);

  const pauseTimer = useCallback(() => {
    setTimer((prev) => {
      if (!prev.isRunning) return prev;
      return { ...prev, isRunning: false };
    });
  }, []);

  const resumeTimer = useCallback(() => {
    setTimer((prev) => {
      if (prev.isRunning) return prev;
      return {
        ...prev,
        isRunning: true,
        startTime: Date.now() - prev.elapsedSeconds * 1000,
      };
    });
  }, []);

  const toggleCategoryTimer = useCallback((categoryId: string, note?: string) => {
    // If another timer is running or has recorded seconds, prompt user to log or discard before switching!
    if (timer.categoryId && timer.categoryId !== categoryId && (timer.isRunning || timer.elapsedSeconds > 0)) {
      const nextCat = categories.find((c) => c.id === categoryId);
      if (nextCat) {
        setPendingSwitchCategory(nextCat);
        setIsSwitchTimerModalOpen(true);
        return;
      }
    }

    setTimer((prev) => {
      if (prev.categoryId === categoryId) {
        if (prev.isRunning) {
          // It was running -> PAUSE it! Keeps elapsed time intact!
          return {
            ...prev,
            isRunning: false,
          };
        } else {
          // It was paused -> RESUME it without resetting!
          return {
            ...prev,
            isRunning: true,
            startTime: Date.now() - prev.elapsedSeconds * 1000,
          };
        }
      }
      // Switching to a different category -> start new live session
      return {
        isRunning: true,
        categoryId,
        note: note || `Focus on ${categories.find(c => c.id === categoryId)?.name || 'Envelope'}`,
        startTime: Date.now(),
        elapsedSeconds: 0,
      };
    });
  }, [categories, timer]);

  const confirmSwitchTimer = useCallback(
    (action: 'log' | 'discard') => {
      const nextCategory = pendingSwitchCategory;
      if (!nextCategory) {
        setIsSwitchTimerModalOpen(false);
        return;
      }

      if (action === 'log') {
        if (timer.categoryId && timer.elapsedSeconds >= 10) {
          const durationHours = Math.round((timer.elapsedSeconds / 3600) * 10) / 10 || 0.1;
          addTimeEntry({
            categoryId: timer.categoryId,
            date: currentDate,
            duration: durationHours,
            note: timer.note || 'Timed session',
          });
        }
      }

      // Start new timer on nextCategory
      setTimer({
        isRunning: true,
        categoryId: nextCategory.id,
        note: `Focus on ${nextCategory.name}`,
        startTime: Date.now(),
        elapsedSeconds: 0,
      });

      setPendingSwitchCategory(null);
      setIsSwitchTimerModalOpen(false);
    },
    [pendingSwitchCategory, timer, currentDate, addTimeEntry]
  );

  const cancelSwitchTimer = useCallback(() => {
    setPendingSwitchCategory(null);
    setIsSwitchTimerModalOpen(false);
  }, []);

  const openAssignBudgetModal = useCallback((category: Category) => {
    setAssignBudgetCategory(category);
  }, []);

  const closeAssignBudgetModal = useCallback(() => {
    setAssignBudgetCategory(null);
  }, []);

  const assignBudgetWithSource = useCallback(
    (
      targetCategoryId: string,
      amountHours: number,
      source: 'ready_to_assign' | 'buffer' | 'envelope' | 'category',
      sourceEnvelopeId?: string
    ) => {
      if (amountHours <= 0) return;
      const targetCat = categories.find((c) => c.id === targetCategoryId);
      if (!targetCat) return;

      const currentBudget = dayBudget[targetCategoryId] ?? targetCat.dailyTarget;
      const newBudget = Math.round((currentBudget + amountHours) * 10) / 10;

      if (source === 'ready_to_assign') {
        setCategoryBudget(targetCategoryId, newBudget);
      } else if (source === 'buffer') {
        reallocateHours(BUFFER_ID, targetCategoryId, amountHours);
      } else if (source === 'envelope' && sourceEnvelopeId) {
        reallocateHours(sourceEnvelopeId, targetCategoryId, amountHours);
      } else if (source === 'category') {
        const hostGroupId = targetCat.groupId;
        setBudgets((prev) => {
          const currentData = prev[currentDate] || { allocations: { ...dayBudget }, buffer: 1.5 };
          const directMap = { ...(currentData.categoryDirectBudgets || {}) };
          const currentHostDirect = directMap[hostGroupId] || 0;
          directMap[hostGroupId] = Math.max(0, Math.round((currentHostDirect - amountHours) * 10) / 10);
          return {
            ...prev,
            [currentDate]: {
              ...currentData,
              categoryDirectBudgets: directMap,
              allocations: {
                ...currentData.allocations,
                [targetCategoryId]: newBudget,
              },
            },
          };
        });
      }
    },
    [categories, dayBudget, currentDate, setCategoryBudget, reallocateHours]
  );

  const confirmCopyWeek = useCallback(() => {
    autoAssign('copy_to_week');
    setIsCopyWeekModalOpen(false);
  }, [autoAssign]);

  const stopAndLogTimer = useCallback(() => {
    if (!timer.categoryId || timer.elapsedSeconds < 30) {
      setTimer({
        isRunning: false,
        categoryId: '',
        note: '',
        startTime: null,
        elapsedSeconds: 0,
      });
      return;
    }

    const durationHours = Math.round((timer.elapsedSeconds / 3600) * 10) / 10 || 0.1;

    addTimeEntry({
      categoryId: timer.categoryId,
      date: currentDate,
      duration: durationHours,
      note: timer.note || 'Timed session',
    });

    setTimer({
      isRunning: false,
      categoryId: '',
      note: '',
      startTime: null,
      elapsedSeconds: 0,
    });
  }, [timer, currentDate, addTimeEntry]);

  const cancelTimer = useCallback(() => {
    setTimer({
      isRunning: false,
      categoryId: '',
      note: '',
      startTime: null,
      elapsedSeconds: 0,
    });
  }, []);

  const openLogModal = useCallback((categoryId?: string) => {
    setLogModalPresetCategory(categoryId);
    setIsLogModalOpen(true);
  }, []);

  const closeLogModal = useCallback(() => {
    setIsLogModalOpen(false);
    setLogModalPresetCategory(undefined);
  }, []);

  const openReallocateModal = useCallback((targetCatId?: string) => {
    setReallocateTargetCategory(targetCatId);
    setIsReallocateModalOpen(true);
  }, []);

  const closeReallocateModal = useCallback(() => {
    setIsReallocateModalOpen(false);
    setReallocateTargetCategory(undefined);
  }, []);

  const openAddCustomEnvelope = useCallback((presetGroupId?: string) => {
    setCustomEnvelopePresetGroup(presetGroupId);
    setIsCategoryManagerOpen(true);
  }, []);

  // Envelope Activities Modal Handlers
  const openEnvelopeActivities = useCallback((category: Category) => {
    setSelectedEnvelopeForActivities(category);
  }, []);

  const openEnvelopeActivitiesById = useCallback((categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (cat) {
      setSelectedEnvelopeForActivities(cat);
    }
  }, [categories]);

  const closeEnvelopeActivities = useCallback(() => {
    setSelectedEnvelopeForActivities(null);
  }, []);

  return (
    <TimeBudgetContext.Provider
      value={{
        currentDate,
        setCurrentDate,
        goToPreviousDay,
        goToNextDay,
        goToToday,
        activeTab,
        setActiveTab,
        categories,
        groups,
        budgets,
        entries,
        settings,
        dayBuffer,
        dayBufferAllocated,
        dayBufferUsed,
        setDayBuffer,
        adjustDayBuffer,
        stashUnassignedInDayBuffer,
        releaseBufferToReadyToAssign,
        coverOverspendingWithBuffer,
        daySleep,
        updateSleepSchedule,
        toggleSleepSchedule,
        dayCategoryDirectBudgets,
        setCategoryDirectBudget,
        adjustCategoryDirectBudget,
        clearCategoryDirectBudget,
        distributeDirectBudgetToEnvelopes,
        dayBudget,
        dayLogged,
        dayAvailable,
        totalCapacity,
        totalBudgeted,
        totalLogged,
        readyToAssign,
        overspentCategories,
        setCategoryBudget,
        adjustCategoryBudget,
        reallocateHours,
        coverOverspending,
        autoAssign,
        addTimeEntry,
        editTimeEntry,
        deleteTimeEntry,
        addCategory,
        editCategory,
        deleteCategory,
        addGroup,
        editGroup,
        deleteGroup,
        updateSettings,
        resetToDemo,
        exportData,
        importData,
        timer,
        startTimer,
        toggleCategoryTimer,
        pauseTimer,
        resumeTimer,
        stopAndLogTimer,
        cancelTimer,
        isLogModalOpen,
        openLogModal,
        closeLogModal,
        logModalPresetCategory,
        isReallocateModalOpen,
        openReallocateModal,
        closeReallocateModal,
        reallocateTargetCategory,
        isCategoryManagerOpen,
        setIsCategoryManagerOpen,
        openAddCustomEnvelope,
        customEnvelopePresetGroup,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        selectedEnvelopeForActivities,
        openEnvelopeActivities,
        openEnvelopeActivitiesById,
        closeEnvelopeActivities,
        envelopeToDelete,
        promptDeleteCategory,
        confirmDeleteCategory,
        cancelDeleteCategory,
        groupToDelete,
        promptDeleteGroup,
        confirmDeleteGroup,
        cancelDeleteGroup,
        assignBudgetCategory,
        openAssignBudgetModal,
        closeAssignBudgetModal,
        assignBudgetWithSource,
        isCalendarPickerOpen,
        setIsCalendarPickerOpen,
        isSwitchTimerModalOpen,
        pendingSwitchCategory,
        confirmSwitchTimer,
        cancelSwitchTimer,
        isCopyWeekModalOpen,
        setIsCopyWeekModalOpen,
        confirmCopyWeek,
      }}
    >
      {children}
    </TimeBudgetContext.Provider>
  );
};

export const useTimeBudget = () => {
  const context = useContext(TimeBudgetContext);
  if (!context) {
    throw new Error('useTimeBudget must be used within a TimeBudgetProvider');
  }
  return context;
};
