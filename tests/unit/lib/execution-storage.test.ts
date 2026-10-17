import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadExecutionDayRecord,
  saveExecutionDayRecord,
  updateExecutionTaskRecord,
} from '../../../src/lib/execution-storage';

const storedValues = new Map<string, string>();

beforeEach(() => {
  storedValues.clear();
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storedValues.get(key) ?? null,
    setItem: (key: string, value: string) => storedValues.set(key, value),
    removeItem: (key: string) => storedValues.delete(key),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('execution storage', () => {
  it('creates and persists a task update when no daily record exists', () => {
    const date = '2026-10-17';
    const weekStartDate = '2026-10-11';
    const nextRecord = updateExecutionTaskRecord(
      null,
      date,
      weekStartDate,
      ['task-1'],
      'task-1',
      record => ({ ...record, status: 'completed', actualDurationMinutes: 35 })
    );

    expect(saveExecutionDayRecord(nextRecord)).toBe(true);
    expect(loadExecutionDayRecord(date)).toMatchObject({
      date,
      weekStartDate,
      records: [{ taskId: 'task-1', status: 'completed', actualDurationMinutes: 35 }],
    });
  });
});
