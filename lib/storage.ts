/**
 * StudentAI — Local Storage Architecture (v1)
 *
 * Provides typed, version-isolated client-side persistence for browser tools.
 * Never transmits data to any external server.
 */

export const STORAGE_PREFIX = 'studentai:v1:';

export const STORAGE_KEYS = {
  THEME: `${STORAGE_PREFIX}theme`,
  TASKS: `${STORAGE_PREFIX}tasks`,
  NOTES: `${STORAGE_PREFIX}notes`,
  STUDY_PLANS: `${STORAGE_PREFIX}study-plans`,
  INTERVIEW_PROGRESS: `${STORAGE_PREFIX}interview-progress`,
  POMODORO_STATS: `${STORAGE_PREFIX}pomodoro-stats`,
  CGPA_RECORDS: `${STORAGE_PREFIX}cgpa-records`,
  ATTENDANCE_RECORDS: `${STORAGE_PREFIX}attendance-records`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`[StudentAI Storage] Failed to read ${key}:`, error);
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[StudentAI Storage] Failed to write ${key}:`, error);
    return false;
  }
}

export function removeStorageItem(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[StudentAI Storage] Failed to remove ${key}:`, error);
    return false;
  }
}

export interface StudentAIDataBackup {
  version: 1;
  exportedAt: string;
  data: {
    tasks?: unknown[];
    notes?: unknown[];
    studyPlans?: unknown[];
    interviewProgress?: Record<string, unknown>;
    pomodoroStats?: Record<string, unknown>;
    cgpaRecords?: unknown[];
    attendanceRecords?: unknown[];
  };
}

/**
 * Exports all StudentAI local browser data to a downloadable JSON file.
 */
export function exportAllStudentData(): void {
  if (typeof window === 'undefined') return;

  const backup: StudentAIDataBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      tasks: getStorageItem<unknown[]>(STORAGE_KEYS.TASKS, []),
      notes: getStorageItem<unknown[]>(STORAGE_KEYS.NOTES, []),
      studyPlans: getStorageItem<unknown[]>(STORAGE_KEYS.STUDY_PLANS, []),
      interviewProgress: getStorageItem<Record<string, unknown>>(
        STORAGE_KEYS.INTERVIEW_PROGRESS,
        {}
      ),
      pomodoroStats: getStorageItem<Record<string, unknown>>(
        STORAGE_KEYS.POMODORO_STATS,
        {}
      ),
      cgpaRecords: getStorageItem<unknown[]>(STORAGE_KEYS.CGPA_RECORDS, []),
      attendanceRecords: getStorageItem<unknown[]>(STORAGE_KEYS.ATTENDANCE_RECORDS, []),
    },
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `studentai-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates and imports user backup JSON safely into LocalStorage.
 */
export function importStudentData(jsonString: string): {
  success: boolean;
  message: string;
  restoredCounts?: {
    tasks: number;
    notes: number;
    studyPlans: number;
  };
} {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Browser environment not available' };
  }

  try {
    const parsed = JSON.parse(jsonString);

    // Basic structure validation
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'Invalid JSON file: Root must be an object.' };
    }

    if (parsed.version !== 1 || !parsed.data || typeof parsed.data !== 'object') {
      return {
        success: false,
        message: 'Unsupported or corrupted backup format. Expected StudentAI v1 backup.',
      };
    }

    const { data } = parsed;
    let taskCount = 0;
    let noteCount = 0;
    let planCount = 0;

    if (Array.isArray(data.tasks)) {
      setStorageItem(STORAGE_KEYS.TASKS, data.tasks);
      taskCount = data.tasks.length;
    }
    if (Array.isArray(data.notes)) {
      setStorageItem(STORAGE_KEYS.NOTES, data.notes);
      noteCount = data.notes.length;
    }
    if (Array.isArray(data.studyPlans)) {
      setStorageItem(STORAGE_KEYS.STUDY_PLANS, data.studyPlans);
      planCount = data.studyPlans.length;
    }
    if (data.interviewProgress && typeof data.interviewProgress === 'object') {
      setStorageItem(STORAGE_KEYS.INTERVIEW_PROGRESS, data.interviewProgress);
    }
    if (data.pomodoroStats && typeof data.pomodoroStats === 'object') {
      setStorageItem(STORAGE_KEYS.POMODORO_STATS, data.pomodoroStats);
    }
    if (Array.isArray(data.cgpaRecords)) {
      setStorageItem(STORAGE_KEYS.CGPA_RECORDS, data.cgpaRecords);
    }
    if (Array.isArray(data.attendanceRecords)) {
      setStorageItem(STORAGE_KEYS.ATTENDANCE_RECORDS, data.attendanceRecords);
    }

    return {
      success: true,
      message: 'Data successfully restored to this browser.',
      restoredCounts: {
        tasks: taskCount,
        notes: noteCount,
        studyPlans: planCount,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to parse backup file: ${err instanceof Error ? err.message : 'Syntax error'}`,
    };
  }
}
