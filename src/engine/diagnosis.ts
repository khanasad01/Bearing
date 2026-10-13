import { Task, Diagnosis, DiagnosisRootCause } from '../types/coach';
import { ENGINE_CONFIG } from './config';

export interface DiagnosisInputs {
  task: Task;
  userAvailableDailyMinutes?: number;
  observedSessionMaxMinutes?: number;
}

/**
 * Step 6: Diagnose Repeated Failure
 * If a task is rescheduled >= 3 times, stops naive rescheduling and evaluates root causes.
 */
export function diagnoseTaskFailure(input: DiagnosisInputs): Diagnosis | null {
  const { task, observedSessionMaxMinutes = 45 } = input;

  // Only trigger diagnosis if task reached or exceeded the threshold
  if (task.rescheduledCount < ENGINE_CONFIG.RESCHEDULE_EVIDENCE_THRESHOLD) {
    return null;
  }

  const evidence: string[] = [
    `Task has been moved ${task.rescheduledCount} times across days without completion.`,
  ];

  let rootCause: DiagnosisRootCause = 'TASK_TOO_LARGE';
  let explanation = '';
  let suggestedAction = '';
  let confidence = ENGINE_CONFIG.DIAGNOSIS_CONFIDENCE_MEDIUM;

  // Case 1: Task too large for sustainable session size
  if (task.plannedMinutes > observedSessionMaxMinutes || task.plannedMinutes >= 60) {
    rootCause = 'TASK_TOO_LARGE';
    confidence = ENGINE_CONFIG.DIAGNOSIS_CONFIDENCE_HIGH;
    evidence.push(
      `Planned session is ${task.plannedMinutes}m, which exceeds observed sustainable session limit of ${observedSessionMaxMinutes}m.`
    );
    explanation = `The task is structured as a heavy block. Moving it day-to-day creates mounting dread. Rescheduling does not solve friction.`;
    suggestedAction = `Deconstruct the task into a single 25-30 minute Next Action with a clearly stated finish line.`;
  }
  // Case 2: Unclear next action
  else if (!task.nextAction || !task.nextAction.kickoffPrompt) {
    rootCause = 'UNCLEAR_ACTION';
    confidence = ENGINE_CONFIG.DIAGNOSIS_CONFIDENCE_HIGH;
    evidence.push(`No immediate 2-minute kickoff prompt or physical starting step defined.`);
    explanation = `When you sit down to work, you have to spend willpower deciding what to do first.`;
    suggestedAction = `Define the exact first 2-minute physical step (e.g. "Open LeetCode tab #21 and write comments").`;
  }
  // Case 3: Rescheduled 4+ times without progress
  else if (task.rescheduledCount >= 4) {
    rootCause = 'WRONG_PRIORITY';
    confidence = ENGINE_CONFIG.DIAGNOSIS_CONFIDENCE_HIGH;
    evidence.push(`Deferred 4 or more times continuously.`);
    explanation = `This task may no longer align with immediate high-value weekly outcomes or has been superseded by other priorities.`;
    suggestedAction = `Explicitly archive this task or reduce its priority rather than letting it clutter daily focus.`;
  } else {
    rootCause = 'POOR_ESTIMATE';
    confidence = ENGINE_CONFIG.DIAGNOSIS_CONFIDENCE_MEDIUM;
    evidence.push(`Time slot friction detected.`);
    explanation = `The estimated cognitive effort does not match reality when execution begins.`;
    suggestedAction = `Reduce target duration to 50% and test execution tomorrow morning.`;
  }

  return {
    id: `diag-${task.id}-${Date.now()}`,
    taskId: task.id,
    taskTitle: task.title,
    rescheduleCount: task.rescheduledCount,
    rootCause,
    confidence,
    explanation,
    evidence,
    suggestedAction,
    recommendedExperiment: {
      id: 'exp-min-viable-session',
      title: 'Minimum Viable Session Experiment',
      experimentDetails: 'Cut planned time to 30 mins, start with the 2-minute physical prompt, stop immediately after timer rings.',
    },
    resolved: false,
  };
}
