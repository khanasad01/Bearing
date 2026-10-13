import { describe, it, expect } from 'vitest';
import { diagnoseTaskFailure } from '../../../src/engine/diagnosis';
import { Task } from '../../../src/types/coach';

describe('diagnosis engine', () => {
  const baseTask: Task = {
    id: 't-fail',
    goalId: 'g1',
    title: 'Complex Dynamic Programming',
    category: 'coding',
    plannedMinutes: 120, // Huge session size
    status: 'planned',
    dayOfWeek: 'thu',
    scheduledOrder: 1,
    rescheduledCount: 0,
    rescheduleHistory: [],
  };

  it('does not trigger diagnosis below the 3-reschedule evidence threshold', () => {
    const task: Task = { ...baseTask, rescheduledCount: 2 };
    const diag = diagnoseTaskFailure({ task });
    expect(diag).toBeNull();
  });

  it('triggers diagnosis on 3 reschedules with TASK_TOO_LARGE when session exceeds limit', () => {
    const task: Task = { ...baseTask, rescheduledCount: 3, plannedMinutes: 90 };
    const diag = diagnoseTaskFailure({ task, observedSessionMaxMinutes: 45 });
    expect(diag).not.toBeNull();
    expect(diag?.rootCause).toBe('TASK_TOO_LARGE');
    expect(diag?.suggestedAction).toContain('Deconstruct the task');
    expect(diag?.evidence.length).toBeGreaterThan(1);
    expect(diag?.recommendedExperiment?.title).toBe('Minimum Viable Session Experiment');
  });

  it('diagnoses UNCLEAR_ACTION when task lacks kickoff prompt', () => {
    const task: Task = {
      ...baseTask,
      rescheduledCount: 3,
      plannedMinutes: 30, // Small session, but no kickoffPrompt
      nextAction: undefined,
    };
    const diag = diagnoseTaskFailure({ task });
    expect(diag?.rootCause).toBe('UNCLEAR_ACTION');
    expect(diag?.suggestedAction).toContain('first 2-minute');
  });

  it('diagnoses WRONG_PRIORITY when task has been rescheduled 4 or more times', () => {
    const task: Task = {
      ...baseTask,
      rescheduledCount: 4,
      plannedMinutes: 30,
      nextAction: {
        id: 'a1',
        taskId: 't-fail',
        title: 'Step 1',
        estimatedMinutes: 20,
        kickoffPrompt: 'Open terminal',
      },
    };
    const diag = diagnoseTaskFailure({ task });
    expect(diag?.rootCause).toBe('WRONG_PRIORITY');
    expect(diag?.suggestedAction).toContain('archive this task');
  });
});
