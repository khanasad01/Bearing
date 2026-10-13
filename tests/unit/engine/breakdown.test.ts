import { describe, it, expect } from 'vitest';
import { breakdownGoal } from '../../../src/engine/breakdown';

describe('breakdown engine', () => {
  it('breaks down a DSA goal into structured milestones and tasks', () => {
    const goal = breakdownGoal({
      title: 'Master DSA & LeetCode',
      category: 'coding',
      problemStatement: 'Main daily DSA plan karta hu but 3 din ke baad chhod deta hu',
    });

    expect(goal.id).toBeDefined();
    expect(goal.milestones.length).toBeGreaterThan(0);
    const allTasks = goal.milestones.flatMap((m) => m.tasks);
    expect(allTasks.length).toBeGreaterThanOrEqual(3);

    // Each task should have a concrete NextAction
    for (const task of allTasks) {
      expect(task.nextAction).toBeDefined();
      expect(task.nextAction?.estimatedMinutes).toBeLessThanOrEqual(45);
      expect(task.nextAction?.kickoffPrompt).toBeDefined();
    }
  });

  it('breaks down a project goal', () => {
    const goal = breakdownGoal({
      title: 'Build Fullstack SaaS App',
      category: 'coding',
    });

    expect(goal.milestones.length).toBeGreaterThan(0);
    const firstTask = goal.milestones[0].tasks[0];
    expect(firstTask.title).toContain('Architecture');
    expect(firstTask.nextAction?.kickoffPrompt).toContain('schema');
  });

  it('breaks down a generic goal with sensible defaults', () => {
    const goal = breakdownGoal({
      title: 'Write Technical Book',
      category: 'writing',
    });

    expect(goal.milestones.length).toBe(1);
    expect(goal.milestones[0].tasks.length).toBe(1);
    expect(goal.milestones[0].tasks[0].nextAction?.estimatedMinutes).toBeLessThanOrEqual(45);
  });
});
