import { describe, it, expect } from 'vitest';
import { generateIcsCalendar } from '../../../src/engine/calendar';
import { WeeklyPlanResult } from '../../../src/engine/planner';

describe('calendar engine', () => {
  it('generates standard RFC 5545 iCalendar format', () => {
    const mockPlan: WeeklyPlanResult = {
      days: {
        mon: {
          dayOfWeek: 'mon',
          dateStr: '2026-10-12',
          tasks: [
            {
              id: 'task-cal-1',
              goalId: 'g1',
              title: 'Master Sliding Window',
              category: 'coding',
              plannedMinutes: 45,
              status: 'planned',
              dayOfWeek: 'mon',
              scheduledOrder: 1,
              rescheduledCount: 0,
              rescheduleHistory: [],
              nextAction: {
                id: 'na-1',
                taskId: 'task-cal-1',
                title: 'Problem 3',
                estimatedMinutes: 30,
                kickoffPrompt: 'Open LeetCode',
              },
            },
          ],
          totalPlannedMinutes: 45,
          totalActualMinutes: 0,
          completionRatio: 0,
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

    const ics = generateIcsCalendar(mockPlan, new Date('2026-10-12T00:00:00Z'));
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:[Bearing] Master Sliding Window');
    expect(ics).toContain('END:VCALENDAR');
  });
});
