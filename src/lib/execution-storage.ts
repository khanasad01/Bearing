// This file extends [common/storage-patterns.md](../common/storage-patterns.md) with Bearing specific execution tracking storage.

import { z } from 'zod';

// Execution status for a task
export type ExecutionStatus = 'not-started' | 'completed' | 'partial' | 'missed';

// Schema for validating execution record data
const ExecutionTaskRecordSchema = z.object({
  taskId: z.string().min(1), // References the task id from weekly plan
  status: z.enum(['not-started', 'completed', 'partial', 'missed']),
  actualDurationMinutes: z.number().int().nonnegative().optional(), // Actual time spent
  notes: z.string().optional(), // Optional notes about execution
});

const ExecutionDayRecordSchema = z.object({
  version: z.literal(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD of the week this day belongs to
  records: z.array(ExecutionTaskRecordSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ExecutionTaskRecord = z.infer<typeof ExecutionTaskRecordSchema>;
export type ExecutionDayRecordV1 = z.infer<typeof ExecutionDayRecordSchema>;
export type ExecutionDayRecord = ExecutionDayRecordV1;

const STORAGE_KEY = "bearing.execution.v1";

/**
 * Save execution day record to localStorage
 * @param record - The execution day record to save
 * @returns true if successful, false otherwise
 */
export function saveExecutionDayRecord(record: ExecutionDayRecord): boolean {
  // If we are not in the browser, do nothing and return false to avoid errors during SSR/build.
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    // Validate the record before saving
    const validationResult = ExecutionDayRecordSchema.safeParse(record);
    if (!validationResult.success) {
      console.error("Invalid execution day record:", validationResult.error);
      return false;
    }

    // Update the updatedAt timestamp
    const recordToSave = {
      ...record,
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recordToSave));
    return true;
  } catch (error) {
    console.error("Failed to save execution day record:", error);
    return false;
  }
}

/**
 * Load execution day record from localStorage for a specific date
 * @param date - The date to load record for (YYYY-MM-DD format)
 * @returns The execution day record if valid and exists, null otherwise
 */
export function loadExecutionDayRecord(date: string): ExecutionDayRecord | null {
  // If we are not in the browser, return null to avoid errors during SSR/build.
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    let record: ExecutionDayRecord;
    try {
      record = JSON.parse(stored);
    } catch {
      console.error("Failed to parse execution day record from storage:");
      return null;
    }

    // Validate the loaded record
    const validationResult = ExecutionDayRecordSchema.safeParse(record);
    if (!validationResult.success) {
      console.error("Invalid execution day record loaded from storage:", validationResult.error);
      // Clear invalid data
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Check if the record is for the requested date
    if (record.date !== date) {
      return null; // Record exists but not for this date
    }

    return record;
  } catch (error) {
    console.error("Failed to load execution day record:", error);
    return null;
  }
}

/**
 * Clear execution day record from localStorage for a specific date
 * @param date - The date to clear record for (YYYY-MM-DD format)
 */
export function clearExecutionDayRecord(date: string): void {
  // If we are not in the browser, do nothing to avoid errors during SSR/build.
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const record = JSON.parse(stored);
        // Only clear if it's for the requested date
        if (record.date === date) {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // If parsing fails, clear anyway to remove corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error("Failed to clear execution day record:", error);
  }
}

/**
 * Validate an execution day record object
 * @param record - The object to validate
 * @returns true if valid, false otherwise
 */
export function isValidExecutionDayRecord(record: unknown): record is ExecutionDayRecord {
  return ExecutionDayRecordSchema.safeParse(record).success;
}

/**
 * Create a new execution day record with default values
 * @param date - The date for the record (YYYY-MM-DD format)
 * @param weekStartDate - The start of the week this date belongs to (YYYY-MM-DD format)
 * @param taskIds - Array of task IDs to initialize records for
 * @returns A new execution day record object
 */
export function createEmptyExecutionDayRecord(
  date: string,
  weekStartDate: string,
  taskIds: string[] = []
): ExecutionDayRecord {
  const now = typeof window !== 'undefined' ? new Date().toISOString() : '2024-01-01T00:00:00.000Z';

  // Create initial records for all tasks (all start as not-started)
  const records: ExecutionTaskRecord[] = taskIds.map(taskId => ({
    taskId,
    status: 'not-started',
    actualDurationMinutes: undefined,
    notes: undefined,
  }));

  return {
    version: 1,
    date,
    weekStartDate,
    records,
    createdAt: now,
    updatedAt: now,
  };
}

