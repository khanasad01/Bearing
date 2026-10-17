import { describe, it, expect } from 'vitest';
import { analyzeWeeklyOutcomes } from '../../../src/engine/learning';
import { DailyExecutionDay, PersonalModel } from '../../../src/types/coach';

describe('learning engine', () => {
  const initialModel: PersonalModel = {
    categoryMultipliers: { coding: 1.0 },
    categorySampleCounts: { coding: 0 },
    timeOfDaySuccessRates: { morning: 0.8, afternoon: 0.6, evening: 0.4 },
    observedSustainableSessionMinutes: 60,
    learnedHypotheses: [],
    closedWeeksHistory: [],
  };

  it('computes category multipliers when execution requires more time than planned', () => {
    // 3 coding sessions planned for 45 mins, but actually taking 75 mins (1.67x)
    const mockDay: DailyExecutionDay = {
      dayOfWeek: 'mon',
      dateStr: '2026-10-12',
      tasks: [
        {
          id: 't1',
          goalId: 'g1',
          title: 'DSA Session 1',
          category: 'coding',
          plannedMinutes: 45,
          actualMinutes: 75,
          status: 'completed',
          dayOfWeek: 'mon',
          scheduledOrder: 1,
          rescheduledCount: 0,
          rescheduleHistory: [],
        },
        {
          id: 't2',
          goalId: 'g1',
          title: 'DSA Session 2',
          category: 'coding',
          plannedMinutes: 45,
          actualMinutes: 75,
          status: 'completed',
          dayOfWeek: 'mon',
          scheduledOrder: 2,
          rescheduledCount: 0,
          rescheduleHistory: [],
        },
        {
          id: 't3',
          goalId: 'g1',
          title: 'DSA Session 3',
          category: 'coding',
          plannedMinutes: 45,
          actualMinutes: 75,
          status: 'completed',
          dayOfWeek: 'mon',
          scheduledOrder: 3,
          rescheduledCount: 0,
          rescheduleHistory: [],
        },
      ],
      totalPlannedMinutes: 135,
      totalActualMinutes: 225,
      completionRatio: 1.0,
      isDisrupted: false,
    };

    const out = analyzeWeeklyOutcomes({
      days: [mockDay],
      currentModel: initialModel,
      weekNumber: 1,
    });

    // Sample count = 3 (meets MIN_SAMPLES_FOR_MULTIPLIER)
    // Observed multiplier = 75 / 45 = 1.67
    // Smoothed = 0.6 * 1.67 + 0.4 * 1.0 = 1.4
    expect(out.updatedPersonalModel.categoryMultipliers.coding).toBeGreaterThan(1.2);
    expect(out.comparison.keyLearnings.length).toBeGreaterThan(0);
    expect(out.comparison.nextWeekAdjustments.length).toBeGreaterThan(0);
    expect(out.newHypotheses.length).toBeGreaterThan(0);
    expect(out.updatedPersonalModel.closedWeeksHistory).toEqual([225]);
  });

  it('detects session size dropoff when >60m sessions fail while <=45m succeed', () => {
    const mixedDay: DailyExecutionDay = {
      dayOfWeek: 'tue',
      dateStr: '2026-10-13',
      tasks: [
        {
          id: 't1',
          goalId: 'g1',
          title: 'Monster 120m Session',
          category: 'coding',
          plannedMinutes: 120,
          actualMinutes: 15,
          status: 'abandoned',
          dayOfWeek: 'tue',
          scheduledOrder: 1,
          rescheduledCount: 1,
          rescheduleHistory: [],
        },
        {
          id: 't2',
          goalId: 'g1',
          title: 'Heavy 90m Session',
          category: 'coding',
          plannedMinutes: 90,
          actualMinutes: 20,
          status: 'abandoned',
          dayOfWeek: 'tue',
          scheduledOrder: 2,
          rescheduledCount: 1,
          rescheduleHistory: [],
        },
        {
          id: 't3',
          goalId: 'g1',
          title: 'Bite 30m Session',
          category: 'coding',
          plannedMinutes: 30,
          actualMinutes: 30,
          status: 'completed',
          dayOfWeek: 'tue',
          scheduledOrder: 3,
          rescheduledCount: 0,
          rescheduleHistory: [],
        },
      ],
      totalPlannedMinutes: 240,
      totalActualMinutes: 65,
      completionRatio: 0.33,
      isDisrupted: false,
    };

    const out = analyzeWeeklyOutcomes({
      days: [mixedDay],
      currentModel: initialModel,
      weekNumber: 1,
    });

    expect(out.updatedPersonalModel.observedSustainableSessionMinutes).toBe(45);
    const sessionHyp = out.newHypotheses.find((h) => h.id.includes('session-size'));
    expect(sessionHyp).toBeDefined();
    expect(sessionHyp?.confidence).toBeGreaterThan(0.7);
  });
});
