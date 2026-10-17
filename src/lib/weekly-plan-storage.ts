// This file extends [common/storage-patterns.md](../common/storage-patterns.md) with Bearing specific weekly plan storage.

import { z } from 'zod';

// Schema for validating weekly plan data
const WeeklyPlanTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  estimatedDurationMinutes: z.number().int().positive(),
  priority: z.enum(['high', 'medium', 'low']),
  plannedDay: z.number().int().min(0).max(6), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
});

const WeeklyPlanV1Schema = z.object({
  version: z.literal(1),
  planId: z.string().min(1),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  intakeId: z.string().min(1).optional(), // Optional reference to onboarding intake
  tasks: z.array(WeeklyPlanTaskSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WeeklyPlanTask = z.infer<typeof WeeklyPlanTaskSchema>;
export type WeeklyPlanV1 = z.infer<typeof WeeklyPlanV1Schema>;
export type WeeklyPlan = WeeklyPlanV1;

const STORAGE_KEY_BASE = "bearing.weekly-plan.v1";
function getStorageKey(weekStartDate: string): string {
  return `${STORAGE_KEY_BASE}.${weekStartDate}`;
}

/**
 * Save weekly plan to localStorage
 * @param plan - The plan object to save
 * @param weekStartDate - Optional week start date (YYYY-MM-DD). If not provided, uses plan.weekStartDate
 * @returns true if successful, false otherwise
 */
export function saveWeeklyPlan(plan: WeeklyPlan, weekStartDate?: string): boolean {
  // If we are not in the browser, do nothing and return false to avoid errors during SSR/build.
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    // Validate the plan before saving
    const validationResult = WeeklyPlanV1Schema.safeParse(plan);
    if (!validationResult.success) {
      console.error("Invalid weekly plan:", validationResult.error);
      return false;
    }

    // Use the provided weekStartDate or the plan's weekStartDate
    const effectiveWeekStartDate = weekStartDate ?? plan.weekStartDate;

    // Update the updatedAt timestamp
    const planToSave = {
      ...plan,
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    localStorage.setItem(getStorageKey(effectiveWeekStartDate), JSON.stringify(planToSave));
    return true;
  } catch (error) {
    console.error("Failed to save weekly plan:", error);
    return false;
  }
}

/**
 * Load weekly plan from localStorage for a specific week
 * @param weekStartDate - Optional week start date (YYYY-MM-DD). If not provided, uses the current week's start date
 * @returns The plan object if valid and exists, null otherwise
 */
export function loadWeeklyPlan(weekStartDate?: string): WeeklyPlan | null {
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

    let plan: WeeklyPlan;
    try {
      plan = JSON.parse(stored);
    } catch (error) {
      console.error("Failed to parse weekly plan from storage:", error);
      return null;
    }

    // Validate the loaded plan
    const validationResult = WeeklyPlanV1Schema.safeParse(plan);
    if (!validationResult.success) {
      console.error("Invalid weekly plan loaded from storage:", validationResult.error);
      // Clear invalid data
      localStorage.removeItem(getStorageKey(effectiveWeekStartDate));
      return null;
    }

    return plan;
  } catch (error) {
    console.error("Failed to load weekly plan:", error);
    return null;
  }
}

/**
 * Clear weekly plan from localStorage for a specific week
 * @param weekStartDate - Optional week start date (YYYY-MM-DD). If not provided, uses the current week's start date
 */
export function clearWeeklyPlan(weekStartDate?: string): void {
  // If we are not in the browser, do nothing to avoid errors during SSR/build.
  if (typeof window === 'undefined') {
    return;
  }
  try {
    // Use the provided weekStartDate or the current week's start date
    const effectiveWeekStartDate = weekStartDate ?? getWeekStartDate(new Date());
    localStorage.removeItem(getStorageKey(effectiveWeekStartDate));
  } catch (error) {
    console.error("Failed to clear weekly plan:", error);
  }
}

/**
 * Validate a weekly plan object
 * @param plan - The object to validate
 * @returns true if valid, false otherwise
 */
export function isValidWeeklyPlan(plan: unknown): plan is WeeklyPlan {
  return WeeklyPlanV1Schema.safeParse(plan).success;
}

/**
 * Create a new weekly plan with default values
 * @param intakeId - Optional reference to onboarding intake
 * @returns A new weekly plan object
 */
export function createEmptyWeeklyPlan(intakeId?: string): WeeklyPlan {
  const now = typeof window !== 'undefined' ? new Date().toISOString() : '2024-01-01T00:00:00.000Z';
  // Generate a simple planId: we can use a timestamp or random string.
  // For simplicity, we'll use a random string.
  const planId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  // Calculate week start date (we'll use Sunday as start of week for simplicity)
  const weekStartDate = getWeekStartDate(new Date());

  return {
    version: 1,
    planId,
    weekStartDate,
    intakeId,
    tasks: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get the start of the week (Sunday) for a given date.
 * Returns string in YYYY-MM-DD format.
 */
export function getWeekStartDate(date: Date): string {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = date.getDate() - day; // subtract day to get Sunday
  const sunday = new Date(date.setDate(diff));
  return sunday.toISOString().split('T')[0];
}