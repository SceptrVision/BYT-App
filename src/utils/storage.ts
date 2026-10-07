import { Category, CategoryGroup, TimeEntry, DayBudgetData, AppSettings, SleepSchedule } from '../types';
import { getTodayDateStr, shiftDate } from './dateUtils';

export const DEFAULT_GROUPS: CategoryGroup[] = [
  { id: 'group-career', name: 'Work & Career', color: '#0284c7', order: 1 },
  { id: 'group-health', name: 'Health & Vitality', color: '#10b981', order: 2 },
  { id: 'group-life', name: 'Life & Essentials', color: '#f59e0b', order: 3 },
  { id: 'group-joy', name: 'Joy & Connection', color: '#38bdf8', order: 4 },
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
  // Work & Career (6.5h)
  {
    id: 'cat-deep-work',
    groupId: 'group-career',
    name: 'Deep Work & Building',
    color: '#0284c7',
    icon: 'Briefcase',
    dailyTarget: 4.0,
    targetType: 'daily_target',
  },
  {
    id: 'cat-meetings',
    groupId: 'group-career',
    name: 'Meetings & Syncs',
    color: '#38bdf8',
    icon: 'Users',
    dailyTarget: 1.5,
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
  // Total = 6.5 + 2.5 + 2.0 + 3.5 + 8.0 (sleep) + 1.5 (buffer) = 24.0 Hours exact zero-sum day!
];

export const DEFAULT_SETTINGS: AppSettings = {
  dailyCapacityHours: 24.0,
  mode: 'full_24',
  timeFormat: 'hours_minutes',
};

export function generateSeedData(): {
  budgets: Record<string, DayBudgetData>;
  entries: TimeEntry[];
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
    { id: 'seed-t2', categoryId: 'cat-deep-work', date: today, duration: 3.5, note: 'Engine architecture & implementation', createdAt: Date.now() - 14400000 },
    { id: 'seed-t3', categoryId: 'cat-meetings', date: today, duration: 1.5, note: 'Standup and client roadmap sync', createdAt: Date.now() - 7200000 },
    { id: 'seed-t4', categoryId: 'cat-exercise', date: today, duration: 1.0, note: 'Cardio interval run', createdAt: Date.now() - 3600000 },

    // Yesterday entries
    { id: 'seed-y2', categoryId: 'cat-deep-work', date: yesterday, duration: 4.0, note: 'Feature build and tests', createdAt: Date.now() - 90000000 },
    { id: 'seed-y3', categoryId: 'cat-admin-email', date: yesterday, duration: 1.0, note: 'Inbox zero and messages', createdAt: Date.now() - 80000000 },
    { id: 'seed-y4', categoryId: 'cat-nutrition', date: yesterday, duration: 1.5, note: 'Healthy cooking & dinner', createdAt: Date.now() - 70000000 },
    { id: 'seed-y5', categoryId: 'cat-family', date: yesterday, duration: 1.5, note: 'Evening walk with family', createdAt: Date.now() - 60000000 },
    { id: 'seed-y6', categoryId: 'cat-leisure', date: yesterday, duration: 2.0, note: 'Reading and gaming', createdAt: Date.now() - 50000000 },
  ];

  return { budgets, entries };
}

const STORAGE_KEY_CATEGORIES = 'byt_categories_v2';
const STORAGE_KEY_GROUPS = 'byt_groups_v2';
const STORAGE_KEY_BUDGETS = 'byt_budgets_v2';
const STORAGE_KEY_ENTRIES = 'byt_entries_v2';
const STORAGE_KEY_SETTINGS = 'byt_settings_v2';

export function loadStoredData(): {
  categories: Category[];
  groups: CategoryGroup[];
  budgets: Record<string, DayBudgetData>;
  entries: TimeEntry[];
  settings: AppSettings;
} {
  try {
    const rawCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    const rawGroups = localStorage.getItem(STORAGE_KEY_GROUPS);
    const rawBudgets = localStorage.getItem(STORAGE_KEY_BUDGETS);
    const rawEntries = localStorage.getItem(STORAGE_KEY_ENTRIES);
    const rawSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);

    if (!rawCategories || !rawBudgets) {
      const seed = generateSeedData();
      saveData(DEFAULT_CATEGORIES, DEFAULT_GROUPS, seed.budgets, seed.entries, DEFAULT_SETTINGS);
      return {
        categories: DEFAULT_CATEGORIES,
        groups: DEFAULT_GROUPS,
        budgets: seed.budgets,
        entries: seed.entries,
        settings: DEFAULT_SETTINGS,
      };
    }

    let loadedCategories: Category[] = rawCategories ? JSON.parse(rawCategories) : DEFAULT_CATEGORIES;
    let loadedGroups: CategoryGroup[] = rawGroups ? JSON.parse(rawGroups) : DEFAULT_GROUPS;
    let loadedBudgets: Record<string, DayBudgetData> = rawBudgets ? JSON.parse(rawBudgets) : {};
    let loadedEntries: TimeEntry[] = rawEntries ? JSON.parse(rawEntries) : [];
    const loadedSettings: AppSettings = rawSettings ? JSON.parse(rawSettings) : DEFAULT_SETTINGS;

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
    };
  }
}

export function saveData(
  categories: Category[],
  groups: CategoryGroup[],
  budgets: Record<string, DayBudgetData>,
  entries: TimeEntry[],
  settings: AppSettings
) {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save data to localStorage:', err);
  }
}
