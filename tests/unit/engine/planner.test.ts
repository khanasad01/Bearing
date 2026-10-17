import { describe, it, expect } from 'vitest';
import { generateWeeklyPlan } from '../../../src/engine/planner';
import { computeCapacity } from '../../../src/engine/capacity';
import { Task, PersonalModel } from '../../../src/types/coach';

describe('planner engine', () => {
  const dummyPersonalModel: PersonalModel = {
    categoryMultipliers: { coding: 1.0, career: 1.0 },
    categorySampleCounts: { coding: 5 },
    timeOfDaySuccessRates: { morning: 0.8, afternoon: 0.5, evening: 0.3 },
    observedSustainableSessionMinutes: 45,
    learnedHypotheses: [],
    closedWeeksHistory: [],
  };

  const sampleTasks: Task[] = [
    {
      id: 't1',
      goalId: 'g1',
      title: 'LeetCode Problem 1',
      category: 'coding',
      plannedMinutes: 45,
      status: 'planned',
      dayOfWeek: 'mon',
      scheduledOrder: 1,
      rescheduledCount: 0,
      rescheduleHistory: [],
    },
    {
      id: 't2',
      goalId: 'g1',
      title: 'LeetCode Problem 2',
      category: 'coding',
      plannedMinutes: 45,
      status: 'planned',
      dayOfWeek: 'mon',
      scheduledOrder: 2,
      rescheduledCount: 0,
      rescheduleHistory: [],
    },
    {
      id: 't3',
      goalId: 'g1',
      title: 'Resume Polishing',
      category: 'career',
      plannedMinutes: 60,
      status: 'planned',
      dayOfWeek: 'mon',
      scheduledOrder: 3,
      rescheduledCount: 0,
      rescheduleHistory: [],
    },
  ];

  it('allocates tasks within plannable capacity and limits tasks per day', () => {
    // 1800 stated mins, 0 commitments -> plannable = 1800 * 0.6 * 0.8 = 864 mins
    const capacity = computeCapacity({ statedWeeklyMinutes: 1800, commitmentMinutes: 0, closedWeeks: [] });
    const plan = generateWeeklyPlan({
      tasks: sampleTasks,
      capacity,
      personalModel: dummyPersonalModel,
      activeDays: ['mon', 'tue', 'wed'],
    });

    expect(plan.scheduledTasks.length).toBe(3);
    expect(plan.deferredTasks.length).toBe(0);
    expect(plan.totalAllocatedMinutes).toBe(150); // 45 + 45 + 60
    expect(plan.isOverCapacity).toBe(false);
  });

  it('applies category multipliers to task duration during planning', () => {
    const customModel: PersonalModel = {
      ...dummyPersonalModel,
      categoryMultipliers: { coding: 1.5 },
    };

    const capacity = computeCapacity({ statedWeeklyMinutes: 1800, commitmentMinutes: 0, closedWeeks: [] });
    const plan = generateWeeklyPlan({
      tasks: [sampleTasks[0]], // 45 planned mins
      capacity,
      personalModel: customModel,
    });

    expect(plan.scheduledTasks[0].plannedMinutes).toBe(68); // 45 * 1.5 = 67.5 -> 68
    expect(plan.totalAllocatedMinutes).toBe(68);
  });

  it('defers tasks when capacity is strictly exceeded', () => {
    // Tiny plannable capacity: 50 mins
    const capacity = computeCapacity({ statedWeeklyMinutes: 100, commitmentMinutes: 0, closedWeeks: [] });
    // capacity.plannable = 100 * 0.6 * 0.8 = 48 mins

    const plan = generateWeeklyPlan({
      tasks: sampleTasks, // total needs 150 mins
      capacity,
      personalModel: dummyPersonalModel,
    });

    // 1st task is 45 mins (fits within 48 mins)
    // 2nd task is 45 mins (exceeds 48 mins -> deferred)
    expect(plan.scheduledTasks.length).toBe(1);
    expect(plan.deferredTasks.length).toBe(2);
    expect(plan.deferredTasks[0].notes).toContain('Exceeds weekly plannable capacity');
  });
});
