// This file extends [common/storage-patterns.md](../common/storage-patterns.md) with Bearing specific weekly review storage.

import { z } from 'zod';
import {
  WeeklyPlan,
  loadWeeklyPlan,
  getWeekStartDate,
} from '@/lib/weekly-plan-storage';
import {
  loadExecutionDayRecord,
  ExecutionStatus,
} from '@/lib/execution-storage';

// Schema for validating weekly review data
const WeeklyReviewTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  estimatedDurationMinutes: z.number().int().positive(),
  priority: z.enum(['high', 'medium', 'low']),
  plannedDay: z.number().int().min(0).max(6), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Execution data for this task across the week
  executionStatus: z.enum(['not-started', 'completed', 'partial', 'missed']).optional(), // aggregated status for the week
  actualDurationMinutes: z.number().int().nonnegative().optional(), // total actual time spent across the week
  notes: z.string().optional(), // combined notes from all days
  executionRecords: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    status: z.enum(['not-started', 'completed', 'partial', 'missed']),
    actualDurationMinutes: z.number().int().nonnegative().optional(),
    notes: z.string().optional(),
  })).optional(), // daily execution records for this task
});

const WeeklyReviewV1Schema = z.object({
  version: z.literal(1),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD of the week being reviewed (Sunday)
  plannedTasks: z.array(WeeklyReviewTaskSchema),
  userAnswers: z.object({
    whatWentWell: z.string(),
    whatPrevented: z.string(),
    whatShouldChange: z.string(),
  }).optional(),
  coachInferences: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WeeklyReviewTask = z.infer<typeof WeeklyReviewTaskSchema>;
export type WeeklyReviewV1 = z.infer<typeof WeeklyReviewV1Schema>;
export type WeeklyReview = WeeklyReviewV1;

const STORAGE_KEY_BASE = "bearing.weekly-review.v1";
function getStorageKey(weekStartDate: string): string {
  return `${STORAGE_KEY_BASE}.${weekStartDate}`;
}

/**
 * Save weekly review record to localStorage
 * @param review - The weekly review record to save
 * @param weekStartDate - Optional week start date (YYYY-MM-DD). If not provided, uses review.weekStartDate
 * @returns true if successful, false otherwise
 */
export function saveWeeklyReview(review: WeeklyReview, weekStartDate?: string): boolean {
  // If we are not in the browser, do nothing and return false to avoid errors during SSR/build.
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    // Validate the review before saving
    const validationResult = WeeklyReviewV1Schema.safeParse(review);
    if (!validationResult.success) {
      console.error("Invalid weekly review:", validationResult.error);
      return false;
    }

    // Use the provided weekStartDate or the review's weekStartDate
    const effectiveWeekStartDate = weekStartDate ?? review.weekStartDate;

    // Update the updatedAt timestamp
    const reviewToSave = {
      ...review,
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    localStorage.setItem(getStorageKey(effectiveWeekStartDate), JSON.stringify(reviewToSave));
    return true;
  } catch (error) {
    console.error("Failed to save weekly review:", error);
    return false;
  }
}

/**
 * Load weekly review record from localStorage
 * @param weekStartDate - Optional week start date (YYYY-MM-DD). If not provided, uses the current week's start date
 * @returns The weekly review record if valid and exists, null otherwise
 */
export function loadWeeklyReview(weekStartDate?: string): WeeklyReview | null {
  // If we are not in the browser, return null to avoid errors during SSR/build.
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    // Use the provided weekStartDate or the current week's start date
    const effectiveWeekStartDate = weekStartDate ?? getWeekStartDate(new Date());
    const stored = localStorage.getItem(getStorageKey(effectiveWeekStartDate));

    if (!stored) {
      return null;
    }

    let review: WeeklyReview;
    try {
      review = JSON.parse(stored);
    } catch (error) {
      console.error("Failed to parse weekly review from storage:", error);
      return null;
    }

    // Validate the loaded review
    const validationResult = WeeklyReviewV1Schema.safeParse(review);
    if (!validationResult.success) {
      console.error("Invalid weekly review loaded from storage:", validationResult.error);
      // Clear invalid data
      localStorage.removeItem(getStorageKey(effectiveWeekStartDate));
      return null;
    }

    return review;
  } catch (error) {
    console.error("Failed to load weekly review:", error);
    return null;
  }
}

/**
 * Clear weekly review record from localStorage
 * @param weekStartDate - Optional week start date (YYYY-MM-DD). If not provided, uses the current week's start date
 */
export function clearWeeklyReview(weekStartDate?: string): void {
  // If we are not in the browser, do nothing to avoid errors during SSR/build.
  if (typeof window === 'undefined') {
    return;
  }
  try {
    // Use the provided weekStartDate or the current week's start date
    const effectiveWeekStartDate = weekStartDate ?? getWeekStartDate(new Date());
    localStorage.removeItem(getStorageKey(effectiveWeekStartDate));
  } catch (error) {
    console.error("Failed to clear weekly review:", error);
  }
}

/**
 * Validate a weekly review record object
 * @param review - The object to validate
 * @returns true if valid, false otherwise
 */
export function isValidWeeklyReview(review: unknown): review is WeeklyReview {
  return WeeklyReviewV1Schema.safeParse(review).success;
}

/**
 * Create a new weekly review record with default values for the current week
 * @returns A new weekly review object
 */
export async function createEmptyWeeklyReview(): Promise<WeeklyReview> {
  // If we are not in the browser, return a minimal valid review to avoid errors during SSR/build.
  if (typeof window === 'undefined') {
    const now = '2024-01-01T00:00:00.000Z';
    const weekStartDate = getWeekStartDate(new Date());
    return {
      version: 1,
      weekStartDate,
      plannedTasks: [],
      userAnswers: undefined,
      coachInferences: undefined,
      createdAt: now,
      updatedAt: now,
    };
  }

  // Get the current week's start date
  const weekStartDate = getWeekStartDate(new Date());

  // Load the weekly plan for this week
  const plan: WeeklyPlan | null = loadWeeklyPlan(weekStartDate);

  // Get the planned tasks from the plan
  const plannedTasks: WeeklyReviewTask[] = (plan?.tasks ?? []).map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    estimatedDurationMinutes: task.estimatedDurationMinutes,
    priority: task.priority,
    plannedDay: task.plannedDay,
    // Execution data will be filled in later by aggregating execution records
    executionStatus: undefined,
    actualDurationMinutes: undefined,
    notes: undefined,
    executionRecords: undefined,
  }));

  // Load execution records for each day in the week and aggregate by task
  const executionRecordsByTaskId: Record<string, {
    status: ExecutionStatus | undefined;
    actualDurationMinutes: number | undefined;
    notes: string | undefined;
    dailyRecords: Array<{
      date: string;
      status: ExecutionStatus;
      actualDurationMinutes: number | undefined;
      notes: string | undefined;
    }>;
  }> = {};

  // Initialize with planned tasks
  plannedTasks.forEach(task => {
    executionRecordsByTaskId[task.id] = {
      status: undefined,
      actualDurationMinutes: 0,
      notes: '',
      dailyRecords: [],
    };
  });

  // Load each day in the week (from weekStartDate to weekStartDate + 6 days)
  const startDate = new Date(weekStartDate);
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateString = currentDate.toISOString().split('T')[0];

    const dayRecord = loadExecutionDayRecord(dateString);
    if (dayRecord) {
      dayRecord.records.forEach(execRecord => {
        if (executionRecordsByTaskId[execRecord.taskId]) {
          const taskExecution = executionRecordsByTaskId[execRecord.taskId];
          // Store the daily records and leave status undefined until we compute.
          taskExecution.dailyRecords.push({
            date: dateString,
            status: execRecord.status,
            actualDurationMinutes: execRecord.actualDurationMinutes,
            notes: execRecord.notes,
          });
          // For actual duration, we'll sum across days
          if (execRecord.actualDurationMinutes !== undefined) {
            taskExecution.actualDurationMinutes = (taskExecution.actualDurationMinutes ?? 0) + execRecord.actualDurationMinutes;
          }
          // For notes, we'll keep daily notes separate.
        }
      });
    }
  }

  // Now build the plannedTasks with aggregated data
  const reviewTasks: WeeklyReviewTask[] = plannedTasks.map(task => {
    const taskExecution = executionRecordsByTaskId[task.id] || {
      status: undefined,
      actualDurationMinutes: 0,
      notes: '',
      dailyRecords: [],
    };

    // Determine weekly status:
    // If any day is missed, we might consider the task missed?
    // But the requirement says: "Do not classify missing data as failure."
    // We have daily records, so we can see which days have data and which don't.
    // We'll compute a weekly status based on the days that have execution records.
    // If there are no execution records for the task, then status is undefined (missing data).
    // If there are execution records for all days, we can aggregate:
    //   - If any day is missed -> missed
    //   - Else if any day is partial -> partial
    //   - Else if all days are completed -> completed
    //   - Else (all days not-started) -> not-started
    // But note: the requirement says to distinguish missing data from confirmed missed.
    // We'll store the daily records and let the UI show them.
    // For the purpose of the review, we can show:
    //   - For each task, the status per day (or a summary)
    //   - We'll compute a weekly status for the task based on the days that have records.
    //   - If there are days without records, we note that data is missing for those days.

    // We'll compute:
    const dailyRecords = taskExecution.dailyRecords;
    let weeklyStatus: ExecutionStatus | undefined = undefined;
    if (dailyRecords.length > 0) {
      // We have data for at least one day.
      const statuses = dailyRecords.map(d => d.status);
      if (statuses.some(s => s === 'missed')) {
        weeklyStatus = 'missed';
      } else if (statuses.some(s => s === 'partial')) {
        weeklyStatus = 'partial';
      } else if (statuses.every(s => s === 'completed')) {
        weeklyStatus = 'completed';
      } else if (statuses.every(s => s === 'not-started')) {
        weeklyStatus = 'not-started';
      } else {
        // Mixed statuses that don't fit the above?
        // For example, some completed, some not-started -> we'll call it partial?
        // But partial means partially completed.
        // We'll define: if there is at least one completed and at least one not-started, and no partial or missed, then we'll call it partial?
        // Actually, the task might be partially done if some days are done and some not.
        // We'll go with: if there is any completed or partial and any not-started, then partial.
        // If all are not-started -> not-started (already covered).
        // If all are completed -> completed (covered).
        // If any missed -> missed (covered).
        // If any partial -> partial (covered).
        // So the only remaining case is: some completed and some not-started (and no partial, no missed).
        weeklyStatus = 'partial';
      }
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      priority: task.priority,
      plannedDay: task.plannedDay,
      executionStatus: weeklyStatus,
      actualDurationMinutes: taskExecution.actualDurationMinutes,
      notes: undefined, // we didn't aggregate notes, so this is undefined
      executionRecords: dailyRecords.map(d => ({
        date: d.date,
        status: d.status,
        actualDurationMinutes: d.actualDurationMinutes,
        notes: d.notes,
      })),
    };
  });

  const now = new Date().toISOString();

  return {
    version: 1,
    weekStartDate,
    plannedTasks: reviewTasks,
    userAnswers: undefined,
    coachInferences: undefined,
    createdAt: now,
    updatedAt: now,
  };
}