import { describe, it, expect } from 'vitest';
import { evaluateRecoveryMode, createRecoveryTask } from '../../../src/engine/recovery';
import { DailyExecutionDay, RecoveryModeState, Task } from '../../../src/types/coach';

describe('recovery mode engine', () => {
  const initialRecoveryState: RecoveryModeState = {
    isActive: false,
    consecutiveLowDays: 0,
    protectedBlockMinutes: 45,
  };

  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      goalId: 'g1',
      title: 'Backlog Task 1',
      category: 'coding',
      plannedMinutes: 60,
      status: 'planned',
      dayOfWeek: 'mon',
      scheduledOrder: 1,
      rescheduledCount: 0,
      rescheduleHistory: [],
    },
    {
      id: 'task-2',
      goalId: 'g1',
      title: 'Backlog Task 2',
      category: 'coding',
      plannedMinutes: 90,
      status: 'planned',
      dayOfWeek: 'mon',
      scheduledOrder: 2,
      rescheduledCount: 0,
      rescheduleHistory: [],
    },
  ];

  it('does not trigger recovery mode when execution is healthy', () => {
    const day1: DailyExecutionDay = {
      dayOfWeek: 'mon',
      dateStr: '2026-10-12',
      tasks: sampleTasks,
      totalPlannedMinutes: 150,
      totalActualMinutes: 150,
      completionRatio: 0.9,
      isDisrupted: false,
    };
    const day2: DailyExecutionDay = {
      dayOfWeek: 'tue',
      dateStr: '2026-10-13',
      tasks: sampleTasks,
      totalPlannedMinutes: 150,
      totalActualMinutes: 120,
      completionRatio: 0.7,
      isDisrupted: false,
    };

    const res = evaluateRecoveryMode({
      recentDays: [day1, day2],
      currentRecoveryState: initialRecoveryState,
    });

    expect(res.shouldActivate).toBe(false);
  });

  it('triggers recovery mode when 2 consecutive days have completion < 40%', () => {
    const failedDay1: DailyExecutionDay = {
      dayOfWeek: 'mon',
      dateStr: '2026-10-12',
      tasks: sampleTasks,
      totalPlannedMinutes: 150,
      totalActualMinutes: 20,
      completionRatio: 0.15, // Below 0.4
      isDisrupted: false,
    };
    const failedDay2: DailyExecutionDay = {
      dayOfWeek: 'tue',
      dateStr: '2026-10-13',
      tasks: sampleTasks,
      totalPlannedMinutes: 150,
      totalActualMinutes: 0,
      completionRatio: 0.0, // Below 0.4
      isDisrupted: true,
    };

    const res = evaluateRecoveryMode({
      recentDays: [failedDay1, failedDay2],
      currentRecoveryState: initialRecoveryState,
    });

    expect(res.shouldActivate).toBe(true);
    expect(res.recoveryState.isActive).toBe(true);
    expect(res.actionableSteps.simplify).toContain('Prune today down to exactly 1 single');
    expect(res.actionableSteps.protect).toContain('45-minute');
  });

  it('creates a single protected recovery task capped at 45 minutes', () => {
    const recoveryTask = createRecoveryTask(sampleTasks);
    expect(recoveryTask).toBeDefined();
    expect(recoveryTask?.title).toContain('[Recovery Focus]');
    expect(recoveryTask?.plannedMinutes).toBeLessThanOrEqual(45);
    expect(recoveryTask?.nextAction?.estimatedMinutes).toBeLessThanOrEqual(30);
  });
});
