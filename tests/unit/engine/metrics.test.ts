import { describe, it, expect } from 'vitest';
import { calculateV1Metrics } from '../../../src/engine/metrics';
import { WeeklyPlanResult } from '../../../src/engine/planner';

describe('metrics engine', () => {
  it('calculates 100% baseline when all tasks executed accurately', () => {
    const mockPlan: WeeklyPlanResult = {
      days: {
        mon: {
          dayOfWeek: 'mon',
          dateStr: '2026-10-12',
          tasks: [
            {
              id: 't1',
              goalId: 'g1',
              title: 'Task 1',
              category: 'coding',
              plannedMinutes: 45,
              actualMinutes: 45,
              status: 'completed',
              dayOfWeek: 'mon',
              scheduledOrder: 1,
              rescheduledCount: 0,
              rescheduleHistory: [],
            },
          ],
          totalPlannedMinutes: 45,
          totalActualMinutes: 45,
          completionRatio: 1,
          isDisrupted: false,
        },
        tue: { dayOfWeek: 'tue', dateStr: '2026-10-13', tasks: [], totalPlannedMinutes: 0, totalActualMinutes: 0, completionRatio: 0, isDisrupted: false },
        wed: { dayOfWeek: 'wed', dateStr: '2026-10-14', tasks: [], totalPlannedMinutes: 0, totalActualMinutes: 0, completionRatio: 0, isDisrupted: false },
        thu: { dayOfWeek: 'thu', dateStr: '2026-10-15', tasks: [], totalPlannedMinutes: 0, totalActualMinutes: 0, completionRatio: 0, isDisrupted: false },
        fri: { dayOfWeek: 'fri', dateStr: '2026-10-16', tasks: [], totalPlannedMinutes: 0, totalActualMinutes: 0, completionRatio: 0, isDisrupted: false },
        sat: { dayOfWeek: 'sat', dateStr: '2026-10-17', tasks: [], totalPlannedMinutes: 0, totalActualMinutes: 0, completionRatio: 0, isDisrupted: false },
        sun: { dayOfWeek: 'sun', dateStr: '2026-10-18', tasks: [], totalPlannedMinutes: 0, totalActualMinutes: 0, completionRatio: 0, isDisrupted: false },
      },
      totalAllocatedMinutes: 45,
      plannableCapacityMinutes: 500,
      capacityUtilizationRatio: 0.1,
      isOverCapacity: false,
      scheduledTasks: [],
      deferredTasks: [],
    };

    const metrics = calculateV1Metrics(mockPlan, []);
    expect(metrics.planningAccuracy).toBe(100);
    expect(metrics.importantWorkCompletionRate).toBe(100);
    expect(metrics.rescheduleRate).toBe(0);
  });
});
