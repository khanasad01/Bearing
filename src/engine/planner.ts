import { Task, DayOfWeek, DailyExecutionDay, PersonalModel } from '../types/coach';
import { CapacityOutput } from './capacity';
import { ENGINE_CONFIG } from './config';

export interface PlanGenerationInput {
  tasks: Task[];
  capacity: CapacityOutput;
  personalModel: PersonalModel;
  activeDays?: DayOfWeek[];
}

export interface WeeklyPlanResult {
  days: Record<DayOfWeek, DailyExecutionDay>;
  totalAllocatedMinutes: number;
  plannableCapacityMinutes: number;
  capacityUtilizationRatio: number; // allocated / plannable
  isOverCapacity: boolean;
  scheduledTasks: Task[];
  deferredTasks: Task[]; // Tasks pushed out because they exceeded realistic capacity
}

const DEFAULT_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * Builds a realistic weekly plan fitting within the computed plannable capacity
 * and enforcing strict daily caps (max 4 tasks/day, max 90m session sizes).
 */
export function generateWeeklyPlan(input: PlanGenerationInput): WeeklyPlanResult {
  const { tasks, capacity, personalModel } = input;
  const activeDays = input.activeDays && input.activeDays.length > 0 ? input.activeDays : DEFAULT_DAYS;
  const plannableMinutes = capacity.plannable;

  // Initialize day buckets
  const days: Record<DayOfWeek, DailyExecutionDay> = {
    mon: createEmptyDay('mon'),
    tue: createEmptyDay('tue'),
    wed: createEmptyDay('wed'),
    thu: createEmptyDay('thu'),
    fri: createEmptyDay('fri'),
    sat: createEmptyDay('sat'),
    sun: createEmptyDay('sun'),
  };

  const scheduledTasks: Task[] = [];
  const deferredTasks: Task[] = [];
  let totalAllocatedMinutes = 0;

  // Sort tasks by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    return a.scheduledOrder - b.scheduledOrder;
  });

  // Distribute tasks across active days respecting capacity and limits
  let dayIndex = 0;

  for (const rawTask of sortedTasks) {
    const multiplier = personalModel.categoryMultipliers[rawTask.category] || 1.0;
    const effectiveDuration = Math.round(rawTask.plannedMinutes * multiplier);

    // Check if adding this task exceeds weekly plannable budget
    if (totalAllocatedMinutes + effectiveDuration > plannableMinutes && scheduledTasks.length > 0) {
      // Defer task to protect plan realism
      deferredTasks.push({
        ...rawTask,
        status: 'deferred',
        notes: `Deferred by reality check: Exceeds weekly plannable capacity of ${Math.round(plannableMinutes)} mins.`,
      });
      continue;
    }

    // Find an active day that has room (< MAX_TASKS_PER_DAY)
    let placed = false;
    let attempts = 0;

    while (attempts < activeDays.length) {
      const targetDayName = activeDays[dayIndex % activeDays.length];
      const targetDay = days[targetDayName];

      if (targetDay.tasks.length < ENGINE_CONFIG.MAX_TASKS_PER_DAY_DEFAULT) {
        // Enforce session size warning/cap
        const finalPlannedMinutes = Math.min(
          effectiveDuration,
          ENGINE_CONFIG.MAX_SESSION_SIZE_DEFAULT
        );

        const scheduledTask: Task = {
          ...rawTask,
          dayOfWeek: targetDayName,
          plannedMinutes: finalPlannedMinutes,
          scheduledOrder: targetDay.tasks.length + 1,
          status: 'planned',
        };

        targetDay.tasks.push(scheduledTask);
        targetDay.totalPlannedMinutes += finalPlannedMinutes;

        scheduledTasks.push(scheduledTask);
        totalAllocatedMinutes += finalPlannedMinutes;
        placed = true;
        dayIndex++;
        break;
      }

      dayIndex++;
      attempts++;
    }

    if (!placed) {
      deferredTasks.push({
        ...rawTask,
        status: 'deferred',
        notes: `Deferred: All active days reached maximum task limit of ${ENGINE_CONFIG.MAX_TASKS_PER_DAY_DEFAULT} tasks.`,
      });
    }
  }

  const utilization = plannableMinutes > 0 ? totalAllocatedMinutes / plannableMinutes : 0;

  return {
    days,
    totalAllocatedMinutes,
    plannableCapacityMinutes: plannableMinutes,
    capacityUtilizationRatio: Math.min(1, utilization),
    isOverCapacity: totalAllocatedMinutes > plannableMinutes,
    scheduledTasks,
    deferredTasks,
  };
}

function createEmptyDay(dayOfWeek: DayOfWeek): DailyExecutionDay {
  return {
    dayOfWeek,
    dateStr: new Date().toISOString().split('T')[0],
    tasks: [],
    totalPlannedMinutes: 0,
    totalActualMinutes: 0,
    completionRatio: 0,
    isDisrupted: false,
  };
}
