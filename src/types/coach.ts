export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type TaskStatus = 'planned' | 'in_progress' | 'completed' | 'deferred' | 'abandoned';

export type TaskCategory = 'coding' | 'career' | 'academic' | 'writing' | 'general';

export interface NextAction {
  id: string;
  taskId: string;
  title: string;
  estimatedMinutes: number; // Max 45 mins
  kickoffPrompt: string; // The immediate first step to lower cognitive friction
}

export interface Task {
  id: string;
  goalId: string;
  milestoneId?: string;
  title: string;
  category: TaskCategory;
  plannedMinutes: number;
  actualMinutes?: number;
  status: TaskStatus;
  dayOfWeek: DayOfWeek;
  scheduledOrder: number;
  rescheduledCount: number;
  rescheduleHistory: Array<{
    fromDate: string;
    toDate: string;
    reason?: string;
  }>;
  nextAction?: NextAction;
  notes?: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  order: number;
  isCompleted: boolean;
  tasks: Task[];
}

export interface Goal {
  id: string;
  title: string;
  initialProblemStatement?: string; // e.g. "Main daily DSA plan karta hu but 3 din ke baad chhod deta hu"
  category: TaskCategory;
  priority: number; // 1 (Highest) to 5
  targetWeeks: number;
  milestones: Milestone[];
  createdAt: string;
}

export interface DailyExecutionDay {
  dayOfWeek: DayOfWeek;
  dateStr: string;
  tasks: Task[];
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  completionRatio: number; // 0 to 1
  isDisrupted: boolean;
  disruptionNote?: string;
}

export type DiagnosisRootCause =
  | 'TASK_TOO_LARGE'
  | 'POOR_ESTIMATE'
  | 'UNCLEAR_ACTION'
  | 'WRONG_PRIORITY'
  | 'INSUFFICIENT_CAPACITY'
  | 'OBSOLETE_GOAL';

export interface Diagnosis {
  id: string;
  taskId: string;
  taskTitle: string;
  rescheduleCount: number;
  rootCause: DiagnosisRootCause;
  confidence: number; // 0 to 1
  explanation: string;
  evidence: string[];
  suggestedAction: string;
  recommendedExperiment?: {
    id: string;
    title: string;
    experimentDetails: string;
  };
  resolved: boolean;
  resolvedAt?: string;
}

export interface RecoveryModeState {
  isActive: boolean;
  triggeredReason?: string;
  consecutiveLowDays: number;
  activatedAt?: string;
  protectedBlockMinutes: number; // default 45 mins
  activeTaskId?: string; // The single simplified task being focused on
}

export interface LearnedHypothesis {
  id: string;
  statement: string;
  confidence: number; // 0 to 1
  status: 'supported' | 'hypothesis' | 'retired';
  evidenceCount: number;
  discoveredAt: string;
}

export interface PersonalModel {
  categoryMultipliers: Record<string, number>;
  categorySampleCounts: Record<string, number>;
  timeOfDaySuccessRates: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  observedSustainableSessionMinutes: number;
  learnedHypotheses: LearnedHypothesis[];
  closedWeeksHistory: number[]; // actual weekly total minutes
}

export interface MethodologyFramework {
  id: string;
  name: string;
  concept: string;
  mechanism: string;
  situation: string;
  action: string;
  limitation: string;
  experiment: {
    title: string;
    hypothesis: string;
    testPeriod: string;
    targetMetric: string;
  };
}

export interface WeeklyComparison {
  weekNumber: number;
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  totalPlannedTasks: number;
  totalCompletedTasks: number;
  completionRate: number;
  differencesByCategory: Record<
    string,
    {
      planned: number;
      actual: number;
      multiplier: number;
    }
  >;
  keyLearnings: string[];
  nextWeekAdjustments: string[];
}
