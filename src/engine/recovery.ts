import { DailyExecutionDay, RecoveryModeState, Task } from '../types/coach';
import { ENGINE_CONFIG } from './config';

export interface RecoveryCheckInput {
  recentDays: DailyExecutionDay[];
  currentRecoveryState: RecoveryModeState;
}

export interface RecoveryPlanOutput {
  shouldActivate: boolean;
  recoveryState: RecoveryModeState;
  reason: string;
  actionableSteps: {
    diagnose: string;
    simplify: string;
    protect: string;
    restart: string;
  };
  singleProtectedTask?: Task;
}

/**
 * Step 7: Recovery Mode
 * Evaluates whether consecutive failures require switching to Recovery Mode
 * and applies the "Diagnose -> Simplify -> Protect -> Restart" protocol.
 */
export function evaluateRecoveryMode(input: RecoveryCheckInput): RecoveryPlanOutput {
  const { recentDays, currentRecoveryState } = input;

  // Need at least RECOVERY_MODE_CONSECUTIVE_DAYS
  const daysToCheck = recentDays.slice(-ENGINE_CONFIG.RECOVERY_MODE_CONSECUTIVE_DAYS);

  let consecutiveLowDays = 0;
  for (const day of daysToCheck) {
    if (day.tasks.length > 0 && day.completionRatio < ENGINE_CONFIG.RECOVERY_MODE_MIN_COMPLETION_RATIO) {
      consecutiveLowDays++;
    }
  }

  const shouldTrigger =
    consecutiveLowDays >= ENGINE_CONFIG.RECOVERY_MODE_CONSECUTIVE_DAYS ||
    currentRecoveryState.isActive;

  if (!shouldTrigger) {
    return {
      shouldActivate: false,
      recoveryState: {
        ...currentRecoveryState,
        isActive: false,
        consecutiveLowDays,
      },
      reason: 'Execution completion is within acceptable planning tolerances.',
      actionableSteps: {
        diagnose: 'Normal plan operating parameters.',
        simplify: 'No simplification required.',
        protect: 'Standard time windows.',
        restart: 'Continue normal schedule.',
      },
    };
  }

  return {
    shouldActivate: true,
    recoveryState: {
      isActive: true,
      triggeredReason: `${consecutiveLowDays} consecutive days with completion below ${Math.round(
        ENGINE_CONFIG.RECOVERY_MODE_MIN_COMPLETION_RATIO * 100
      )}%.`,
      consecutiveLowDays,
      activatedAt: currentRecoveryState.activatedAt || new Date().toISOString(),
      protectedBlockMinutes: ENGINE_CONFIG.RECOVERY_MODE_PROTECTED_BLOCK_MAX_MINUTES,
    },
    reason: `Plan failure detected over ${consecutiveLowDays} days. Halting catch-up pressure.`,
    actionableSteps: {
      diagnose:
        'Cognitive load and task backlog broke execution momentum. Forcing a catch-up schedule guarantees further failure.',
      simplify:
        'Prune today down to exactly 1 single high-leverage task. Push all other backlog items off the active board.',
      protect: `Protect a single ${ENGINE_CONFIG.RECOVERY_MODE_PROTECTED_BLOCK_MAX_MINUTES}-minute block. Any work beyond this is strictly optional bonus.`,
      restart:
        'Secure 1 clean win today. Reset mental state without carrying forward artificial guilt or backlog debt.',
    },
  };
}

/**
 * Creates a simplified, protected recovery task from existing planned tasks
 */
export function createRecoveryTask(tasks: Task[]): Task | undefined {
  if (tasks.length === 0) return undefined;

  // Pick the highest priority uncompleted task
  const primaryTask = tasks.find((t) => t.status !== 'completed') || tasks[0];

  return {
    ...primaryTask,
    title: `[Recovery Focus] ${primaryTask.title}`,
    plannedMinutes: Math.min(
      primaryTask.plannedMinutes,
      ENGINE_CONFIG.RECOVERY_MODE_PROTECTED_BLOCK_MAX_MINUTES
    ),
    notes: 'Protected block: Stop immediately when the timer finishes. No catch-up pressure.',
    nextAction: primaryTask.nextAction
      ? {
          ...primaryTask.nextAction,
          estimatedMinutes: Math.min(primaryTask.nextAction.estimatedMinutes, 30),
        }
      : {
          id: `rec-action-${Date.now()}`,
          taskId: primaryTask.id,
          title: `Start first 15 mins of ${primaryTask.title}`,
          estimatedMinutes: 20,
          kickoffPrompt: 'Sit down, set 20 min timer, and write the first sentence or run problem 1.',
        },
  };
}
