import { Goal, Milestone, Task, NextAction, TaskCategory } from '../types/coach';
import { ENGINE_CONFIG } from './config';

export interface BreakdownInput {
  title: string;
  category: TaskCategory;
  problemStatement?: string;
  targetWeeks?: number;
}

/**
 * Breakdown Engine: Converts Goal -> Milestone -> Task -> Next Action
 */
export function breakdownGoal(input: BreakdownInput): Goal {
  const goalId = 'goal-' + Date.now();
  const category = input.category || 'general';
  const targetWeeks = input.targetWeeks || 4;
  const problem = input.problemStatement || '';

  // Intelligent domain templates based on title or problem keywords
  const titleLower = (input.title + ' ' + problem).toLowerCase();

  let milestones: Milestone[] = [];

  if (titleLower.includes('dsa') || titleLower.includes('algorithm') || titleLower.includes('leetcode')) {
    milestones = createDsaBreakdown(goalId);
  } else if (titleLower.includes('project') || titleLower.includes('app') || titleLower.includes('build')) {
    milestones = createProjectBreakdown(goalId);
  } else if (titleLower.includes('internship') || titleLower.includes('job') || titleLower.includes('career')) {
    milestones = createCareerBreakdown(goalId);
  } else {
    milestones = createGenericBreakdown(goalId, input.title, category);
  }

  return {
    id: goalId,
    title: input.title,
    initialProblemStatement: input.problemStatement,
    category,
    priority: 1,
    targetWeeks,
    milestones,
    createdAt: new Date().toISOString(),
  };
}

function createNextAction(taskId: string, title: string, estimatedMinutes: number, prompt: string): NextAction {
  const cappedMinutes = Math.min(estimatedMinutes, ENGINE_CONFIG.RECOVERY_MODE_PROTECTED_BLOCK_MAX_MINUTES);
  return {
    id: `action-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    taskId,
    title,
    estimatedMinutes: cappedMinutes,
    kickoffPrompt: prompt,
  };
}

function createDsaBreakdown(goalId: string): Milestone[] {
  const m1Id = `m-${goalId}-1`;
  const m2Id = `m-${goalId}-2`;

  const task1: Task = {
    id: `task-dsa-1`,
    goalId,
    milestoneId: m1Id,
    title: 'Two Pointers & Sliding Window Foundation',
    category: 'coding',
    plannedMinutes: 45,
    status: 'planned',
    dayOfWeek: 'mon',
    scheduledOrder: 1,
    rescheduledCount: 0,
    rescheduleHistory: [],
    nextAction: createNextAction(
      'task-dsa-1',
      'Solve Problem #1: Valid Palindrome on LeetCode',
      30,
      'Open browser, log in to LeetCode, write the two-pointer condition in comments first.'
    ),
  };

  const task2: Task = {
    id: `task-dsa-2`,
    goalId,
    milestoneId: m1Id,
    title: 'Fast & Slow Pointers Practice',
    category: 'coding',
    plannedMinutes: 45,
    status: 'planned',
    dayOfWeek: 'tue',
    scheduledOrder: 1,
    rescheduledCount: 0,
    rescheduleHistory: [],
    nextAction: createNextAction(
      'task-dsa-2',
      'Read Linked List Cycle prompt and sketch pointer movement on paper',
      25,
      'Grab a blank sheet of paper and draw nodes 1 -> 2 -> 3 -> loop.'
    ),
  };

  const task3: Task = {
    id: `task-dsa-3`,
    goalId,
    milestoneId: m2Id,
    title: 'Binary Search Essentials',
    category: 'coding',
    plannedMinutes: 45,
    status: 'planned',
    dayOfWeek: 'wed',
    scheduledOrder: 1,
    rescheduledCount: 0,
    rescheduleHistory: [],
    nextAction: createNextAction(
      'task-dsa-3',
      'Write the standard binary search loop template',
      20,
      'Open VS Code, write the while(low <= high) loop template from memory.'
    ),
  };

  return [
    {
      id: m1Id,
      goalId,
      title: 'Phase 1: Linear Data Structures Mastery',
      order: 1,
      isCompleted: false,
      tasks: [task1, task2],
    },
    {
      id: m2Id,
      goalId,
      title: 'Phase 2: Binary Search & Trees',
      order: 2,
      isCompleted: false,
      tasks: [task3],
    },
  ];
}

function createProjectBreakdown(goalId: string): Milestone[] {
  const m1Id = `m-${goalId}-1`;
  const task1: Task = {
    id: `task-proj-1`,
    goalId,
    milestoneId: m1Id,
    title: 'Core Architecture & Schema Definition',
    category: 'coding',
    plannedMinutes: 60,
    status: 'planned',
    dayOfWeek: 'mon',
    scheduledOrder: 1,
    rescheduledCount: 0,
    rescheduleHistory: [],
    nextAction: createNextAction(
      'task-proj-1',
      'Draft database schema types in schema.ts',
      30,
      'Create src/types/schema.ts and list the main 3 entities.'
    ),
  };

  return [
    {
      id: m1Id,
      goalId,
      title: 'Milestone 1: Scaffold & Database Schema',
      order: 1,
      isCompleted: false,
      tasks: [task1],
    },
  ];
}

function createCareerBreakdown(goalId: string): Milestone[] {
  const m1Id = `m-${goalId}-1`;
  const task1: Task = {
    id: `task-career-1`,
    goalId,
    milestoneId: m1Id,
    title: 'Resume Bullet Points Rewrite (Action + Metric)',
    category: 'career',
    plannedMinutes: 45,
    status: 'planned',
    dayOfWeek: 'mon',
    scheduledOrder: 1,
    rescheduledCount: 0,
    rescheduleHistory: [],
    nextAction: createNextAction(
      'task-career-1',
      'Rewrite top project description using XYZ format',
      25,
      'Open resume document, highlight bullet #1, rephrase as Accomplished [X] by doing [Y].'
    ),
  };

  return [
    {
      id: m1Id,
      goalId,
      title: 'Milestone 1: Portfolio & Application Material',
      order: 1,
      isCompleted: false,
      tasks: [task1],
    },
  ];
}

function createGenericBreakdown(goalId: string, title: string, category: TaskCategory): Milestone[] {
  const m1Id = `m-${goalId}-1`;
  const task1: Task = {
    id: `task-gen-1`,
    goalId,
    milestoneId: m1Id,
    title: `Establish Foundation for ${title}`,
    category,
    plannedMinutes: 45,
    status: 'planned',
    dayOfWeek: 'mon',
    scheduledOrder: 1,
    rescheduledCount: 0,
    rescheduleHistory: [],
    nextAction: createNextAction(
      'task-gen-1',
      `Define scope & first deliverable for ${title}`,
      30,
      'Open a note and write the single condition that proves this phase is complete.'
    ),
  };

  return [
    {
      id: m1Id,
      goalId,
      title: 'Milestone 1: Foundation & Initial Scope',
      order: 1,
      isCompleted: false,
      tasks: [task1],
    },
  ];
}
