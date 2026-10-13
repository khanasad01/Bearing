'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Goal,
  Task,
  DayOfWeek,
  PersonalModel,
  Diagnosis,
  RecoveryModeState,
  WeeklyComparison,
  TaskStatus,
  TaskCategory,
} from '../types/coach';
import { computeCapacity, CapacityOutput } from '../engine/capacity';
import { breakdownGoal } from '../engine/breakdown';
import { generateWeeklyPlan, WeeklyPlanResult } from '../engine/planner';
import { diagnoseTaskFailure } from '../engine/diagnosis';
import { evaluateRecoveryMode, createRecoveryTask } from '../engine/recovery';
import { analyzeWeeklyOutcomes } from '../engine/learning';
import { ENGINE_CONFIG } from '../engine/config';

export interface CoachContextType {
  goal: Goal | null;
  statedWeeklyMinutes: number;
  commitmentMinutes: number;
  capacity: CapacityOutput;
  personalModel: PersonalModel;
  weeklyPlan: WeeklyPlanResult | null;
  activeDay: DayOfWeek;
  currentWeekNumber: number;
  diagnoses: Diagnosis[];
  recoveryState: RecoveryModeState;
  weeklyComparisons: WeeklyComparison[];
  activeTab:
    | 'overview'
    | 'planner'
    | 'execution'
    | 'diagnosis'
    | 'learning'
    | 'methodologies'
    | 'playbook'
    | 'metrics';

  // Actions
  setActiveTab: (
    tab:
      | 'overview'
      | 'planner'
      | 'execution'
      | 'diagnosis'
      | 'learning'
      | 'methodologies'
      | 'playbook'
      | 'metrics'
  ) => void;
  setActiveDay: (day: DayOfWeek) => void;
  setGoalAndBreakdown: (title: string, problemStatement?: string, category?: string) => void;
  updateCapacityInputs: (statedWeeklyMinutes: number, commitmentMinutes: number) => void;
  updateTaskStatus: (taskId: string, dayOfWeek: DayOfWeek, status: TaskStatus, actualMinutes?: number) => void;
  rescheduleTask: (taskId: string, fromDay: DayOfWeek, toDay: DayOfWeek, reason?: string) => void;
  resolveDiagnosis: (diagnosisId: string, applyExperiment?: boolean) => void;
  triggerRecoveryMode: () => void;
  exitRecoveryMode: () => void;
  runWeeklyReflection: () => void;
  advanceToNextWeek: () => void;
  addDisruption: (dayOfWeek: DayOfWeek, lostMinutes: number, note: string) => void;
  addTask: (dayOfWeek: DayOfWeek, title: string, minutes: number, category?: TaskCategory) => void;
  loadPresetScenario: (scenario: 'dsa_dropoff' | 'fresh_start') => void;
  resetAll: () => void;
}

const DEFAULT_PERSONAL_MODEL: PersonalModel = {
  categoryMultipliers: { coding: 1.0, career: 1.0, academic: 1.0, writing: 1.0, general: 1.0 },
  categorySampleCounts: { coding: 0, career: 0, academic: 0, writing: 0, general: 0 },
  timeOfDaySuccessRates: { morning: 0.8, afternoon: 0.6, evening: 0.4 },
  observedSustainableSessionMinutes: 45,
  learnedHypotheses: [
    {
      id: 'init-hyp-1',
      statement: 'Initial planning optimism bias: Stated capacity is discounted by 40% (60% haircut) until observed.',
      confidence: 0.9,
      status: 'supported',
      evidenceCount: 1,
      discoveredAt: new Date().toISOString(),
    },
  ],
  closedWeeksHistory: [],
};

const STORAGE_KEY = 'bearing_coach_state_v1';

const CoachContext = createContext<CoachContextType | undefined>(undefined);

function getSavedData() {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export const CoachProvider = ({ children }: { children: ReactNode }) => {
  const [goal, setGoal] = useState<Goal | null>(() => getSavedData()?.goal || null);
  const [statedWeeklyMinutes, setStatedWeeklyMinutes] = useState<number>(
    () => getSavedData()?.statedWeeklyMinutes || 1800
  );
  const [commitmentMinutes, setCommitmentMinutes] = useState<number>(
    () => getSavedData()?.commitmentMinutes || 360
  );
  const [personalModel, setPersonalModel] = useState<PersonalModel>(
    () => getSavedData()?.personalModel || DEFAULT_PERSONAL_MODEL
  );
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanResult | null>(
    () => getSavedData()?.weeklyPlan || null
  );
  const [activeDay, setActiveDay] = useState<DayOfWeek>(
    () => getSavedData()?.activeDay || 'mon'
  );
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number>(
    () => getSavedData()?.currentWeekNumber || 1
  );
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(
    () => getSavedData()?.diagnoses || []
  );
  const [recoveryState, setRecoveryState] = useState<RecoveryModeState>(
    () =>
      getSavedData()?.recoveryState || {
        isActive: false,
        consecutiveLowDays: 0,
        protectedBlockMinutes: ENGINE_CONFIG.RECOVERY_MODE_PROTECTED_BLOCK_MAX_MINUTES,
      }
  );
  const [weeklyComparisons, setWeeklyComparisons] = useState<WeeklyComparison[]>(
    () => getSavedData()?.weeklyComparisons || []
  );
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'planner'
    | 'execution'
    | 'diagnosis'
    | 'learning'
    | 'methodologies'
    | 'playbook'
    | 'metrics'
  >('overview');

  // Save to LocalStorage on changes
  useEffect(() => {
    try {
      const payload = {
        goal,
        statedWeeklyMinutes,
        commitmentMinutes,
        personalModel,
        weeklyPlan,
        activeDay,
        currentWeekNumber,
        diagnoses,
        recoveryState,
        weeklyComparisons,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save Coach state to localStorage', e);
    }
  }, [
    goal,
    statedWeeklyMinutes,
    commitmentMinutes,
    personalModel,
    weeklyPlan,
    activeDay,
    currentWeekNumber,
    diagnoses,
    recoveryState,
    weeklyComparisons,
  ]);

  // Compute capacity dynamically
  const capacity = computeCapacity({
    statedWeeklyMinutes,
    commitmentMinutes,
    closedWeeks: personalModel.closedWeeksHistory,
  });

  // Load preset scenarios
  const loadPresetScenario = (scenario: 'dsa_dropoff' | 'fresh_start') => {
    if (scenario === 'fresh_start') {
      resetAll();
      return;
    }

    if (scenario === 'dsa_dropoff') {
      // Scenario from Section 9: "Main daily DSA plan karta hu but 3 din ke baad chhod deta hu"
      const dsaGoal = breakdownGoal({
        title: 'Daily Data Structures & Algorithms (DSA)',
        problemStatement: 'Main daily DSA plan karta hu but 3 din ke baad chhod deta hu.',
        category: 'coding',
      });

      // Planned 2 hour sessions on Mon, Tue, Wed, Thu
      const sampleTasks: Task[] = [
        {
          id: 'task-dsa-1',
          goalId: dsaGoal.id,
          title: 'DSA: Two Pointers Deep Dive',
          category: 'coding',
          plannedMinutes: 120, // 2 hours
          actualMinutes: 50,
          status: 'completed',
          dayOfWeek: 'mon',
          scheduledOrder: 1,
          rescheduledCount: 0,
          rescheduleHistory: [],
          nextAction: {
            id: 'na-1',
            taskId: 'task-dsa-1',
            title: 'Solve LeetCode #125',
            estimatedMinutes: 30,
            kickoffPrompt: 'Open LeetCode tab #125 and write two pointers in comments.',
          },
        },
        {
          id: 'task-dsa-2',
          goalId: dsaGoal.id,
          title: 'DSA: Sliding Window Patterns',
          category: 'coding',
          plannedMinutes: 120, // 2 hours
          actualMinutes: 45,
          status: 'completed',
          dayOfWeek: 'tue',
          scheduledOrder: 1,
          rescheduledCount: 0,
          rescheduleHistory: [],
          nextAction: {
            id: 'na-2',
            taskId: 'task-dsa-2',
            title: 'Solve LeetCode #3',
            estimatedMinutes: 30,
            kickoffPrompt: 'Draw sliding window bounds on scratch paper.',
          },
        },
        {
          id: 'task-dsa-3',
          goalId: dsaGoal.id,
          title: 'DSA: Binary Search & Trees',
          category: 'coding',
          plannedMinutes: 120, // 2 hours
          status: 'planned',
          dayOfWeek: 'thu',
          scheduledOrder: 1,
          rescheduledCount: 3, // Rescheduled 3 times (Mon -> Tue -> Wed -> Thu)
          rescheduleHistory: [
            { fromDate: 'mon', toDate: 'tue', reason: 'Felt tired after 50m of problem 1' },
            { fromDate: 'tue', toDate: 'wed', reason: 'College project deadline appeared' },
            { fromDate: 'wed', toDate: 'thu', reason: 'Session felt too overwhelming to start' },
          ],
          nextAction: {
            id: 'na-3',
            taskId: 'task-dsa-3',
            title: 'Binary search template',
            estimatedMinutes: 30,
            kickoffPrompt: 'Open IDE and type while (low <= high).',
          },
        },
      ];

      const cap = computeCapacity({
        statedWeeklyMinutes: 1800,
        commitmentMinutes: 360,
        closedWeeks: [600],
      });

      const plan = generateWeeklyPlan({
        tasks: sampleTasks,
        capacity: cap,
        personalModel: {
          ...DEFAULT_PERSONAL_MODEL,
          categoryMultipliers: { coding: 1.4 },
        },
      });

      // Also generate diagnosis for task 3
      const diag = diagnoseTaskFailure({
        task: sampleTasks[2],
        observedSessionMaxMinutes: 45,
      });

      setGoal(dsaGoal);
      setStatedWeeklyMinutes(1800);
      setCommitmentMinutes(360);
      setWeeklyPlan(plan);
      setDiagnoses(diag ? [diag] : []);
      setActiveDay('thu');
      setActiveTab('diagnosis');
      setCurrentWeekNumber(1);
    }
  };

  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGoal(null);
    setStatedWeeklyMinutes(1800);
    setCommitmentMinutes(360);
    setPersonalModel(DEFAULT_PERSONAL_MODEL);
    setWeeklyPlan(null);
    setActiveDay('mon');
    setCurrentWeekNumber(1);
    setDiagnoses([]);
    setRecoveryState({
      isActive: false,
      consecutiveLowDays: 0,
      protectedBlockMinutes: ENGINE_CONFIG.RECOVERY_MODE_PROTECTED_BLOCK_MAX_MINUTES,
    });
    setWeeklyComparisons([]);
    setActiveTab('overview');
  };

  const setGoalAndBreakdown = (title: string, problemStatement?: string, category: string = 'coding') => {
    const newGoal = breakdownGoal({
      title,
      problemStatement,
      category: category as TaskCategory,
    });

    const allTasks = newGoal.milestones.flatMap((m) => m.tasks);

    const plan = generateWeeklyPlan({
      tasks: allTasks,
      capacity,
      personalModel,
    });

    setGoal(newGoal);
    setWeeklyPlan(plan);
    setActiveTab('planner');
  };

  const updateCapacityInputs = (statedMins: number, commitMins: number) => {
    setStatedWeeklyMinutes(statedMins);
    setCommitmentMinutes(commitMins);

    if (weeklyPlan) {
      const allTasks = Object.values(weeklyPlan.days).flatMap((d) => d.tasks);
      const newCap = computeCapacity({
        statedWeeklyMinutes: statedMins,
        commitmentMinutes: commitMins,
        closedWeeks: personalModel.closedWeeksHistory,
      });

      const updatedPlan = generateWeeklyPlan({
        tasks: allTasks,
        capacity: newCap,
        personalModel,
      });
      setWeeklyPlan(updatedPlan);
    }
  };

  const updateTaskStatus = (
    taskId: string,
    dayOfWeek: DayOfWeek,
    status: TaskStatus,
    actualMinutes?: number
  ) => {
    if (!weeklyPlan) return;

    const updatedDays = { ...weeklyPlan.days };
    const targetDay = { ...updatedDays[dayOfWeek] };

    const taskIndex = targetDay.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const existingTask = targetDay.tasks[taskIndex];
    const updatedTask: Task = {
      ...existingTask,
      status,
      actualMinutes: actualMinutes !== undefined ? actualMinutes : existingTask.actualMinutes,
    };

    targetDay.tasks = [
      ...targetDay.tasks.slice(0, taskIndex),
      updatedTask,
      ...targetDay.tasks.slice(taskIndex + 1),
    ];

    // Recompute day metrics
    let completedCount = 0;
    let actualSum = 0;
    for (const t of targetDay.tasks) {
      if (t.status === 'completed') completedCount++;
      if (t.actualMinutes) actualSum += t.actualMinutes;
    }

    targetDay.completionRatio = targetDay.tasks.length > 0 ? completedCount / targetDay.tasks.length : 0;
    targetDay.totalActualMinutes = actualSum;

    updatedDays[dayOfWeek] = targetDay;

    setWeeklyPlan({
      ...weeklyPlan,
      days: updatedDays,
    });

    // Check for automatic Recovery Mode trigger
    const recentDaysList = Object.values(updatedDays);
    const recoveryEval = evaluateRecoveryMode({
      recentDays: recentDaysList,
      currentRecoveryState: recoveryState,
    });

    if (recoveryEval.shouldActivate && !recoveryState.isActive) {
      setRecoveryState(recoveryEval.recoveryState);
    }
  };

  const rescheduleTask = (
    taskId: string,
    fromDay: DayOfWeek,
    toDay: DayOfWeek,
    reason?: string
  ) => {
    if (!weeklyPlan) return;

    const updatedDays = { ...weeklyPlan.days };
    const sourceDay = { ...updatedDays[fromDay] };
    const destDay = { ...updatedDays[toDay] };

    const taskIndex = sourceDay.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const taskToMove = sourceDay.tasks[taskIndex];

    const updatedTask: Task = {
      ...taskToMove,
      dayOfWeek: toDay,
      rescheduledCount: taskToMove.rescheduledCount + 1,
      rescheduleHistory: [
        ...taskToMove.rescheduleHistory,
        {
          fromDate: fromDay,
          toDate: toDay,
          reason: reason || 'Pushed forward',
        },
      ],
      scheduledOrder: destDay.tasks.length + 1,
    };

    // Remove from source
    sourceDay.tasks = sourceDay.tasks.filter((t) => t.id !== taskId);
    // Add to dest
    destDay.tasks = [...destDay.tasks, updatedTask];

    updatedDays[fromDay] = sourceDay;
    updatedDays[toDay] = destDay;

    setWeeklyPlan({
      ...weeklyPlan,
      days: updatedDays,
    });

    // Step 6: Diagnose Repeated Failure if rescheduledCount >= 3
    if (updatedTask.rescheduledCount >= ENGINE_CONFIG.RESCHEDULE_EVIDENCE_THRESHOLD) {
      const diag = diagnoseTaskFailure({
        task: updatedTask,
        observedSessionMaxMinutes: personalModel.observedSustainableSessionMinutes,
      });

      if (diag) {
        setDiagnoses((prev) => {
          const filtered = prev.filter((d) => d.taskId !== updatedTask.id);
          return [...filtered, diag];
        });
        setActiveTab('diagnosis');
      }
    }
  };

  const resolveDiagnosis = (diagnosisId: string, applyExperiment: boolean = true) => {
    setDiagnoses((prev) =>
      prev.map((d) => (d.id === diagnosisId ? { ...d, resolved: true, resolvedAt: new Date().toISOString() } : d))
    );

    if (applyExperiment && weeklyPlan) {
      const diag = diagnoses.find((d) => d.id === diagnosisId);
      if (!diag) return;

      // Apply the experiment: Shrink session to 30-45 mins and assign kickoff prompt
      const updatedDays = { ...weeklyPlan.days };
      for (const dayKey of Object.keys(updatedDays) as DayOfWeek[]) {
        updatedDays[dayKey].tasks = updatedDays[dayKey].tasks.map((t) => {
          if (t.id === diag.taskId) {
            return {
              ...t,
              plannedMinutes: 45,
              notes: 'Adapted by Coach Diagnosis: Scaled to 45m Minimum Viable Session.',
              nextAction: {
                id: `na-diag-${Date.now()}`,
                taskId: t.id,
                title: 'Start 30-min targeted sprint',
                estimatedMinutes: 30,
                kickoffPrompt: 'Sit down, set 30 min timer, and start with step 1.',
              },
            };
          }
          return t;
        });
      }

      setWeeklyPlan({
        ...weeklyPlan,
        days: updatedDays,
      });
    }
  };

  const triggerRecoveryMode = () => {
    setRecoveryState({
      isActive: true,
      triggeredReason: 'User initiated Recovery Mode to clear backlog paralysis.',
      consecutiveLowDays: 2,
      activatedAt: new Date().toISOString(),
      protectedBlockMinutes: ENGINE_CONFIG.RECOVERY_MODE_PROTECTED_BLOCK_MAX_MINUTES,
    });

    if (weeklyPlan) {
      const today = weeklyPlan.days[activeDay];
      const recTask = createRecoveryTask(today.tasks);
      if (recTask) {
        const updatedDays = { ...weeklyPlan.days };
        updatedDays[activeDay] = {
          ...today,
          tasks: [recTask],
          totalPlannedMinutes: recTask.plannedMinutes,
        };
        setWeeklyPlan({
          ...weeklyPlan,
          days: updatedDays,
        });
      }
    }
  };

  const exitRecoveryMode = () => {
    setRecoveryState({
      isActive: false,
      consecutiveLowDays: 0,
      protectedBlockMinutes: ENGINE_CONFIG.RECOVERY_MODE_PROTECTED_BLOCK_MAX_MINUTES,
    });
  };

  const runWeeklyReflection = () => {
    if (!weeklyPlan) return;

    const daysList = Object.values(weeklyPlan.days);
    const result = analyzeWeeklyOutcomes({
      days: daysList,
      currentModel: personalModel,
      weekNumber: currentWeekNumber,
    });

    setWeeklyComparisons((prev) => [...prev, result.comparison]);
    setPersonalModel(result.updatedPersonalModel);
    setActiveTab('learning');
  };

  // Step 5: Adapt - Add Real-World Disruption & Recalculate Week
  const addDisruption = (dayOfWeek: DayOfWeek, lostMinutes: number, note: string) => {
    if (!weeklyPlan) return;

    const updatedDays = { ...weeklyPlan.days };
    const targetDay = { ...updatedDays[dayOfWeek] };
    targetDay.isDisrupted = true;
    targetDay.disruptionNote = note;

    // Deduct available capacity from target day by shifting uncompleted tasks forward or deferring
    const uncompletedTasks = targetDay.tasks.filter((t) => t.status !== 'completed');
    if (uncompletedTasks.length > 0 && lostMinutes >= 45) {
      // Move uncompleted tasks to subsequent active days or defer
      const daysKeys: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const currentIdx = daysKeys.indexOf(dayOfWeek);
      const nextDayKey = daysKeys[(currentIdx + 1) % 7];

      for (const t of uncompletedTasks) {
        rescheduleTask(t.id, dayOfWeek, nextDayKey, `Disruption: ${note}`);
      }
    }

    updatedDays[dayOfWeek] = targetDay;
    setWeeklyPlan({
      ...weeklyPlan,
      days: updatedDays,
    });
  };

  // Add custom task on the fly
  const addTask = (dayOfWeek: DayOfWeek, title: string, minutes: number, category: TaskCategory = 'coding') => {
    if (!weeklyPlan) return;

    const updatedDays = { ...weeklyPlan.days };
    const targetDay = { ...updatedDays[dayOfWeek] };

    const newTask: Task = {
      id: `task-custom-${Date.now()}`,
      goalId: goal?.id || 'goal-custom',
      title,
      category,
      plannedMinutes: minutes,
      status: 'planned',
      dayOfWeek,
      scheduledOrder: targetDay.tasks.length + 1,
      rescheduledCount: 0,
      rescheduleHistory: [],
      nextAction: {
        id: `na-${Date.now()}`,
        taskId: `task-custom-${Date.now()}`,
        title: `Kickstart ${title}`,
        estimatedMinutes: Math.min(minutes, 30),
        kickoffPrompt: 'Open work environment and write 1st deliverable.',
      },
    };

    targetDay.tasks.push(newTask);
    targetDay.totalPlannedMinutes += minutes;
    updatedDays[dayOfWeek] = targetDay;

    setWeeklyPlan({
      ...weeklyPlan,
      days: updatedDays,
      totalAllocatedMinutes: weeklyPlan.totalAllocatedMinutes + minutes,
    });
  };

  // Advance to Next Week (The Core Proof of V1: Plan gets measurably better)
  const advanceToNextWeek = () => {
    if (!weeklyPlan) return;

    // 1. Analyze outcomes of current week
    const daysList = Object.values(weeklyPlan.days);
    const result = analyzeWeeklyOutcomes({
      days: daysList,
      currentModel: personalModel,
      weekNumber: currentWeekNumber,
    });

    const nextWeekNum = currentWeekNumber + 1;
    setWeeklyComparisons((prev) => [...prev, result.comparison]);
    setPersonalModel(result.updatedPersonalModel);
    setCurrentWeekNumber(nextWeekNum);

    // 2. Generate Week N+1 Plan with newly updated Personal Model & session caps
    const allRemainingTasks = daysList
      .flatMap((d) => d.tasks)
      .filter((t) => t.status !== 'completed')
      .map((t) => ({
        ...t,
        status: 'planned' as TaskStatus,
        rescheduledCount: 0,
        // Capped by learned sustainable session size
        plannedMinutes: Math.min(
          t.plannedMinutes,
          result.updatedPersonalModel.observedSustainableSessionMinutes
        ),
      }));

    // If all tasks were completed, add next progression tasks
    if (allRemainingTasks.length === 0 && goal) {
      allRemainingTasks.push({
        id: `task-w${nextWeekNum}-1`,
        goalId: goal.id,
        title: `${goal.title}: Progression Sprint`,
        category: goal.category,
        plannedMinutes: result.updatedPersonalModel.observedSustainableSessionMinutes,
        status: 'planned',
        dayOfWeek: 'mon',
        scheduledOrder: 1,
        rescheduledCount: 0,
        rescheduleHistory: [],
        nextAction: {
          id: `na-w${nextWeekNum}-1`,
          taskId: `task-w${nextWeekNum}-1`,
          title: 'Start first 30m milestone',
          estimatedMinutes: 30,
          kickoffPrompt: 'Open project and build next component.',
        },
      });
    }

    const nextCap = computeCapacity({
      statedWeeklyMinutes,
      commitmentMinutes,
      closedWeeks: result.updatedPersonalModel.closedWeeksHistory,
    });

    const nextPlan = generateWeeklyPlan({
      tasks: allRemainingTasks,
      capacity: nextCap,
      personalModel: result.updatedPersonalModel,
    });

    setWeeklyPlan(nextPlan);
    setActiveDay('mon');
    setDiagnoses([]);
    setRecoveryState({
      isActive: false,
      consecutiveLowDays: 0,
      protectedBlockMinutes: ENGINE_CONFIG.RECOVERY_MODE_PROTECTED_BLOCK_MAX_MINUTES,
    });
    setActiveTab('planner');
  };

  return (
    <CoachContext.Provider
      value={{
        goal,
        statedWeeklyMinutes,
        commitmentMinutes,
        capacity,
        personalModel,
        weeklyPlan,
        activeDay,
        currentWeekNumber,
        diagnoses,
        recoveryState,
        weeklyComparisons,
        activeTab,
        setActiveTab,
        setActiveDay,
        setGoalAndBreakdown,
        updateCapacityInputs,
        updateTaskStatus,
        rescheduleTask,
        resolveDiagnosis,
        triggerRecoveryMode,
        exitRecoveryMode,
        runWeeklyReflection,
        advanceToNextWeek,
        addDisruption,
        addTask,
        loadPresetScenario,
        resetAll,
      }}
    >
      {children}
    </CoachContext.Provider>
  );
};

export const useCoach = () => {
  const context = useContext(CoachContext);
  if (!context) {
    throw new Error('useCoach must be used within a CoachProvider');
  }
  return context;
};
