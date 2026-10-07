import { Category, CategoryGroup, TimeEntry, DayBudgetData, AppSettings, SleepSchedule, ScheduleEvent } from '../types';
import { getTodayDateStr, shiftDate } from './dateUtils';

export const DEFAULT_GROUPS: CategoryGroup[] = [
  { id: 'group-career', name: 'Work & Career', color: '#0284c7', order: 1 },
  { id: 'group-academics', name: 'Academics & Study', color: '#8b5cf6', order: 2 },
  { id: 'group-health', name: 'Health & Vitality', color: '#10b981', order: 3 },
  { id: 'group-life', name: 'Life & Essentials', color: '#f59e0b', order: 4 },
  { id: 'group-joy', name: 'Joy & Connection', color: '#38bdf8', order: 5 },
];

export const DEFAULT_SLEEP: SleepSchedule = {
  enabled: true,
  bedtime: '23:00',
  wakeTime: '07:00',
  targetHours: 8.0,
  targetSleepHours: 8.0,
  loggedHours: 8.0,
};

export const DEFAULT_CATEGORIES: Category[] = [
  // Work & Career (4.5h)
  {
    id: 'cat-deep-work',
    groupId: 'group-career',
    name: 'Deep Work & Building',
    color: '#0284c7',
    icon: 'Briefcase',
    dailyTarget: 2.5,
    targetType: 'daily_target',
  },
  {
    id: 'cat-meetings',
    groupId: 'group-career',
    name: 'Meetings & Syncs',
    color: '#38bdf8',
    icon: 'Users',
    dailyTarget: 1.0,
    targetType: 'daily_target',
  },
  {
    id: 'cat-admin-email',
    groupId: 'group-career',
    name: 'Admin, Email & Comms',
    color: '#0ea5e9',
    icon: 'Mail',
    dailyTarget: 1.0,
    targetType: 'daily_target',
  },

  // Academics & Study (2.0h)
  {
    id: 'cat-physics',
    groupId: 'group-academics',
    name: 'Physics',
    color: '#8b5cf6',
    icon: 'Atom',
    dailyTarget: 1.0,
    targetType: 'daily_target',
  },
  {
    id: 'cat-calculus',
    groupId: 'group-academics',
    name: 'Calculus',
    color: '#a855f7',
    icon: 'Calculator',
    dailyTarget: 1.0,
    targetType: 'daily_target',
  },

  // Health & Vitality (2.5h) - Sleep is handled separately in dedicated section
  {
    id: 'cat-exercise',
    groupId: 'group-health',
    name: 'Workout, Gym & Movement',
    color: '#10b981',
    icon: 'Activity',
    dailyTarget: 1.0,
    targetType: 'daily_target',
  },
  {
    id: 'cat-nutrition',
    groupId: 'group-health',
    name: 'Meal Prep & Mindful Eating',
    color: '#34d399',
    icon: 'Utensils',
    dailyTarget: 1.5,
    targetType: 'daily_target',
  },

  // Life & Essentials (2.0h)
  {
    id: 'cat-chores',
    groupId: 'group-life',
    name: 'Household Chores & Cleaning',
    color: '#d97706',
    icon: 'Home',
    dailyTarget: 1.0,
    targetType: 'daily_target',
  },
  {
    id: 'cat-life-admin',
    groupId: 'group-life',
    name: 'Life Admin, Transit & Errands',
    color: '#f59e0b',
    icon: 'Navigation',
    dailyTarget: 1.0,
    targetType: 'daily_target',
  },

  // Joy & Connection (3.5h)
  {
    id: 'cat-family',
    groupId: 'group-joy',
    name: 'Family & Loved Ones',
    color: '#06b6d4',
    icon: 'Heart',
    dailyTarget: 1.5,
    targetType: 'daily_target',
  },
  {
    id: 'cat-leisure',
    groupId: 'group-joy',
    name: 'Guilt-Free Leisure & Hobbies',
    color: '#38bdf8',
    icon: 'Gamepad2',
    dailyTarget: 2.0,
    targetType: 'daily_target',
  },
  // Dedicated Separate Sleep (8.0h) + Daily Buffer Cushion (1.5h)
  // Total = 4.5 + 2.0 + 2.5 + 2.0 + 3.5 + 8.0 (sleep) + 1.5 (buffer) = 24.0 Hours exact zero-sum day!
];

export const DEFAULT_SETTINGS: AppSettings = {
  dailyCapacityHours: 24.0,
  mode: 'full_24',
  timeFormat: 'hours_minutes',
};

export function generateSeedData(): {
  budgets: Record<string, DayBudgetData>;
  entries: TimeEntry[];
  scheduleEvents: ScheduleEvent[];
} {
  const today = getTodayDateStr();
  const yesterday = shiftDate(today, -1);
  const twoDaysAgo = shiftDate(today, -2);

  const budgets: Record<string, DayBudgetData> = {};

  const defaultAllocations: Record<string, number> = {};
  DEFAULT_CATEGORIES.forEach((cat) => {
    defaultAllocations[cat.id] = cat.dailyTarget;
  });

  budgets[today] = { allocations: { ...defaultAllocations }, buffer: 1.5, sleep: { ...DEFAULT_SLEEP } };
  budgets[yesterday] = { allocations: { ...defaultAllocations }, buffer: 1.5, sleep: { ...DEFAULT_SLEEP } };
  budgets[twoDaysAgo] = { allocations: { ...defaultAllocations }, buffer: 1.5, sleep: { ...DEFAULT_SLEEP } };

  const entries: TimeEntry[] = [
    // Today entries
    { id: 'seed-t1', categoryId: 'cat-physics', date: today, duration: 0.75, note: 'Physics problem set assignment', startTime: '15:00', endTime: '15:45', scheduleEventId: 'evt-today-3', createdAt: Date.now() - 5400000 },
    { id: 'seed-t2', categoryId: 'cat-calculus', date: today, duration: 0.25, note: 'Calculus derivatives review', startTime: '15:45', endTime: '16:00', scheduleEventId: 'evt-today-3', createdAt: Date.now() - 5400000 },
    { id: 'seed-t3', categoryId: 'cat-deep-work', date: today, duration: 2.5, note: 'Core algorithm implementation', startTime: '09:00', endTime: '11:30', scheduleEventId: 'evt-today-1', createdAt: Date.now() - 14400000 },
    { id: 'seed-t4', categoryId: 'cat-admin-email', date: today, duration: 0.25, note: 'Morning inbox sprint', startTime: '11:30', endTime: '11:45', scheduleEventId: 'evt-today-quick', createdAt: Date.now() - 10800000 },
    { id: 'seed-t5', categoryId: 'cat-meetings', date: today, duration: 1.25, note: 'Standup and client roadmap sync', startTime: '13:00', endTime: '14:15', scheduleEventId: 'evt-today-2', createdAt: Date.now() - 7200000 },
    { id: 'seed-t6', categoryId: 'cat-exercise', date: today, duration: 0.75, note: 'Cardio interval run', startTime: '17:30', endTime: '18:15', scheduleEventId: 'evt-today-4', createdAt: Date.now() - 3600000 },

    // Yesterday entries
    { id: 'seed-y1', categoryId: 'cat-physics', date: yesterday, duration: 1.0, note: 'Physics lab writeup', createdAt: Date.now() - 85000000 },
    { id: 'seed-y2', categoryId: 'cat-deep-work', date: yesterday, duration: 2.5, note: 'Feature build and tests', createdAt: Date.now() - 90000000 },
    { id: 'seed-y3', categoryId: 'cat-admin-email', date: yesterday, duration: 1.0, note: 'Inbox zero and messages', createdAt: Date.now() - 80000000 },
    { id: 'seed-y4', categoryId: 'cat-nutrition', date: yesterday, duration: 1.5, note: 'Healthy cooking & dinner', createdAt: Date.now() - 70000000 },
    { id: 'seed-y5', categoryId: 'cat-family', date: yesterday, duration: 1.5, note: 'Evening walk with family', createdAt: Date.now() - 60000000 },
    { id: 'seed-y6', categoryId: 'cat-leisure', date: yesterday, duration: 2.0, note: 'Reading and gaming', createdAt: Date.now() - 50000000 },
  ];

  const scheduleEvents: ScheduleEvent[] = [
    {
      id: 'evt-today-1',
      title: 'Deep Work & Architecture',
      date: today,
      startTime: '09:00',
      endTime: '11:30',
      durationMinutes: 150, // 2.5 hours - visibly spans across multiple hour grid rows
      allocations: [{ envelopeId: 'cat-deep-work', minutes: 150 }],
      notes: 'Focus on core system build',
      createdAt: Date.now() - 14400000,
    },
    {
      id: 'evt-today-quick',
      title: 'Email Triage',
      date: today,
      startTime: '11:30',
      endTime: '11:45',
      durationMinutes: 15, // 15 minutes - compact block
      allocations: [{ envelopeId: 'cat-admin-email', minutes: 15 }],
      notes: 'Clear notifications and team inbox',
      createdAt: Date.now() - 10800000,
    },
    {
      id: 'evt-today-2',
      title: 'Team Sync & Project Roadmap',
      date: today,
      startTime: '13:00',
      endTime: '14:15',
      durationMinutes: 75, // 1 hour 15 min
      allocations: [{ envelopeId: 'cat-meetings', minutes: 75 }],
      notes: 'Weekly team sprint review',
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'evt-today-3',
      title: 'Homework',
      date: today,
      startTime: '15:00',
      endTime: '16:00',
      durationMinutes: 60,
      allocations: [
        { envelopeId: 'cat-physics', minutes: 45 },
        { envelopeId: 'cat-calculus', minutes: 15 },
      ],
      notes: '45m physics problem set + 15m calculus derivatives',
      createdAt: Date.now() - 5400000,
    },
    {
      id: 'evt-today-4',
      title: 'Workout & Fitness Run',
      date: today,
      startTime: '17:30',
      endTime: '18:15',
      durationMinutes: 45, // 45 minutes - shows true 45m height
      allocations: [{ envelopeId: 'cat-exercise', minutes: 45 }],
      notes: '5k trail run and stretching',
      createdAt: Date.now() - 3600000,
    },
  ];

  return { budgets, entries, scheduleEvents };
}

const STORAGE_KEY_CATEGORIES = 'byt_categories_v2';
const STORAGE_KEY_GROUPS = 'byt_groups_v2';
const STORAGE_KEY_BUDGETS = 'byt_budgets_v2';
const STORAGE_KEY_ENTRIES = 'byt_entries_v2';
const STORAGE_KEY_SETTINGS = 'byt_settings_v2';
const STORAGE_KEY_SCHEDULE_EVENTS = 'byt_schedule_events_v2';
const STORAGE_KEY_DELETED_CATEGORIES = 'byt_deleted_categories_v2';

export function loadStoredData(): {
  categories: Category[];
  groups: CategoryGroup[];
  budgets: Record<string, DayBudgetData>;
  entries: TimeEntry[];
  settings: AppSettings;
  scheduleEvents: ScheduleEvent[];
  deletedCategories: Category[];
} {
  try {
    const rawCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    const rawGroups = localStorage.getItem(STORAGE_KEY_GROUPS);
    const rawBudgets = localStorage.getItem(STORAGE_KEY_BUDGETS);
    const rawEntries = localStorage.getItem(STORAGE_KEY_ENTRIES);
    const rawSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    const rawScheduleEvents = localStorage.getItem(STORAGE_KEY_SCHEDULE_EVENTS);
    const rawDeletedCategories = localStorage.getItem(STORAGE_KEY_DELETED_CATEGORIES);

    const loadedDeletedCategories: Category[] = rawDeletedCategories ? JSON.parse(rawDeletedCategories) : [];

    if (!rawCategories || !rawBudgets) {
      const seed = generateSeedData();
      saveData(DEFAULT_CATEGORIES, DEFAULT_GROUPS, seed.budgets, seed.entries, DEFAULT_SETTINGS, seed.scheduleEvents, []);
      return {
        categories: DEFAULT_CATEGORIES,
        groups: DEFAULT_GROUPS,
        budgets: seed.budgets,
        entries: seed.entries,
        settings: DEFAULT_SETTINGS,
        scheduleEvents: seed.scheduleEvents,
        deletedCategories: [],
      };
    }

    let loadedCategories: Category[] = rawCategories ? JSON.parse(rawCategories) : DEFAULT_CATEGORIES;
    let loadedGroups: CategoryGroup[] = rawGroups ? JSON.parse(rawGroups) : DEFAULT_GROUPS;
    let loadedBudgets: Record<string, DayBudgetData> = rawBudgets ? JSON.parse(rawBudgets) : {};
    let loadedEntries: TimeEntry[] = rawEntries ? JSON.parse(rawEntries) : [];
    const loadedSettings: AppSettings = rawSettings ? JSON.parse(rawSettings) : DEFAULT_SETTINGS;
    let loadedScheduleEvents: ScheduleEvent[] = rawScheduleEvents ? JSON.parse(rawScheduleEvents) : [];

    if (!rawScheduleEvents || loadedScheduleEvents.length === 0) {
      loadedScheduleEvents = generateSeedData().scheduleEvents;
    }

    // Ensure Academics group & Physics/Calculus envelopes exist
    if (!loadedGroups.some((g) => g.id === 'group-academics')) {
      loadedGroups.splice(1, 0, { id: 'group-academics', name: 'Academics & Study', color: '#8b5cf6', order: 2 });
    }
    if (!loadedCategories.some((c) => c.id === 'cat-physics')) {
      loadedCategories.push(
        {
          id: 'cat-physics',
          groupId: 'group-academics',
          name: 'Physics',
          color: '#8b5cf6',
          icon: 'Atom',
          dailyTarget: 1.0,
          targetType: 'daily_target',
        },
        {
          id: 'cat-calculus',
          groupId: 'group-academics',
          name: 'Calculus',
          color: '#a855f7',
          icon: 'Calculator',
          dailyTarget: 1.0,
          targetType: 'daily_target',
        }
      );
    }

    // Strip legacy buffer envelope and group if present, and remove sleep from envelopes
    loadedCategories = loadedCategories.filter(
      (c) => c.id !== 'cat-buffer' && c.groupId !== 'group-buffer' && c.id !== 'cat-sleep'
    );
    loadedGroups = loadedGroups.filter((g) => g.id !== 'group-buffer');

    // Strip entries attached to deleted cat-sleep
    loadedEntries = loadedEntries.filter((e) => e.categoryId !== 'cat-sleep');

    // Migrate budget data to dedicated buffer field and sleep schedule
    Object.keys(loadedBudgets).forEach((dateKey) => {
      const dayData = loadedBudgets[dateKey];
      if (dayData) {
        if (dayData.allocations) {
          if ('cat-buffer' in dayData.allocations) {
            const oldBuff = dayData.allocations['cat-buffer'];
            delete dayData.allocations['cat-buffer'];
            if (dayData.buffer === undefined) {
              dayData.buffer = oldBuff;
            }
          }
          if ('cat-sleep' in dayData.allocations) {
            delete dayData.allocations['cat-sleep'];
          }
        }
        if (dayData.buffer === undefined) {
          dayData.buffer = 1.5;
        }
        if (!dayData.sleep) {
          dayData.sleep = { ...DEFAULT_SLEEP };
        } else if (typeof dayData.sleep.targetSleepHours !== 'number') {
          dayData.sleep.targetSleepHours = dayData.sleep.targetHours || 8.0;
        }
        if (!dayData.categoryDirectBudgets) {
          dayData.categoryDirectBudgets = {};
        }
      }
    });

    return {
      categories: loadedCategories,
      groups: loadedGroups,
      budgets: loadedBudgets,
      entries: loadedEntries,
      settings: loadedSettings,
      scheduleEvents: loadedScheduleEvents,
      deletedCategories: loadedDeletedCategories,
    };
  } catch (err) {
    console.error('Error loading stored BYT data:', err);
    const seed = generateSeedData();
    return {
      categories: DEFAULT_CATEGORIES,
      groups: DEFAULT_GROUPS,
      budgets: seed.budgets,
      entries: seed.entries,
      settings: DEFAULT_SETTINGS,
      scheduleEvents: seed.scheduleEvents,
      deletedCategories: [],
    };
  }
}

export function saveData(
  categories: Category[],
  groups: CategoryGroup[],
  budgets: Record<string, DayBudgetData>,
  entries: TimeEntry[],
  settings: AppSettings,
  scheduleEvents?: ScheduleEvent[],
  deletedCategories?: Category[]
) {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    if (scheduleEvents) {
      localStorage.setItem(STORAGE_KEY_SCHEDULE_EVENTS, JSON.stringify(scheduleEvents));
    }
    if (deletedCategories) {
      localStorage.setItem(STORAGE_KEY_DELETED_CATEGORIES, JSON.stringify(deletedCategories));
    }
  } catch (err) {
    console.error('Failed to save data to localStorage:', err);
  }
}
