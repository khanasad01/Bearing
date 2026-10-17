import { describe, expect, it } from 'vitest';
import {
  addTaskToPlan,
  removeTaskFromPlan,
  validateNewTaskInput,
} from '../../../src/lib/weekly-plan-storage';
import type { WeeklyPlan, WeeklyPlanTask } from '../../../src/lib/weekly-plan-storage';

const existingTask: WeeklyPlanTask = {
  id: 'task-1',
  title: 'Existing task',
  estimatedDurationMinutes: 30,
  priority: 'medium',
  plannedDay: 1,
};

const newTask: WeeklyPlanTask = {
  id: 'task-2',
  title: 'New task',
  estimatedDurationMinutes: 45,
  priority: 'high',
  plannedDay: 3,
};

function createPlan(tasks: WeeklyPlanTask[] = [existingTask]): WeeklyPlan {
  return {
    version: 1,
    planId: 'plan-1',
    weekStartDate: '2026-10-11',
    tasks,
    createdAt: '2026-10-11T00:00:00.000Z',
    updatedAt: '2026-10-11T00:00:00.000Z',
  };
}

const validInput = {
  title: '  New task  ',
  description: '  Useful details  ',
  estimatedDurationMinutes: 45,
  priority: 'high',
  plannedDay: 3,
};

describe('weekly plan task helpers', () => {
  describe('validateNewTaskInput', () => {
    it('rejects an empty title', () => {
      expect(validateNewTaskInput({ ...validInput, title: '   ' })).toEqual({
        valid: false,
        error: 'Enter a task title, a positive whole-minute duration, a priority, and a day.',
      });
    });

    it('rejects durations below one minute', () => {
      expect(validateNewTaskInput({ ...validInput, estimatedDurationMinutes: 0 })).toMatchObject({
        valid: false,
      });
    });

    it('rejects non-integer durations', () => {
      expect(validateNewTaskInput({ ...validInput, estimatedDurationMinutes: 1.5 })).toMatchObject({
        valid: false,
      });
    });

    it('normalizes a valid task input', () => {
      expect(validateNewTaskInput(validInput)).toEqual({
        valid: true,
        task: {
          title: 'New task',
          description: 'Useful details',
          estimatedDurationMinutes: 45,
          priority: 'high',
          plannedDay: 3,
        },
      });
    });
  });

  describe('addTaskToPlan', () => {
    it('appends a task to an existing plan without mutating the original', () => {
      const plan = createPlan();
      const updatedAt = '2026-10-12T00:00:00.000Z';

      const result = addTaskToPlan(plan, newTask, updatedAt);

      expect(result).toMatchObject({ tasks: [existingTask, newTask], updatedAt });
      expect(plan.tasks).toEqual([existingTask]);
    });

    it('returns null when there is no plan', () => {
      expect(addTaskToPlan(null, newTask, '2026-10-12T00:00:00.000Z')).toBeNull();
    });
  });

  describe('removeTaskFromPlan', () => {
    it('removes an existing task by id and updates the timestamp', () => {
      const plan = createPlan([existingTask, newTask]);
      const updatedAt = '2026-10-12T00:00:00.000Z';

      const result = removeTaskFromPlan(plan, existingTask.id, updatedAt);

      expect(result).toMatchObject({ tasks: [newTask], updatedAt });
      expect(plan.tasks).toEqual([existingTask, newTask]);
    });

    it('returns the unchanged plan when the id is unknown', () => {
      const plan = createPlan();

      expect(removeTaskFromPlan(plan, 'missing-task', '2026-10-12T00:00:00.000Z')).toBe(plan);
    });

    it('allows removing the final task', () => {
      const plan = createPlan();

      expect(removeTaskFromPlan(plan, existingTask.id, '2026-10-12T00:00:00.000Z')?.tasks).toEqual([]);
    });
  });
});