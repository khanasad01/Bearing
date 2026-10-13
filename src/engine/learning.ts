import {
  DailyExecutionDay,
  PersonalModel,
  WeeklyComparison,
  LearnedHypothesis,
  Task,
} from '../types/coach';
import { ENGINE_CONFIG } from './config';

export interface WeeklyAnalysisInput {
  days: DailyExecutionDay[];
  currentModel: PersonalModel;
  weekNumber?: number;
}

export interface WeeklyLearningOutput {
  comparison: WeeklyComparison;
  updatedPersonalModel: PersonalModel;
  newHypotheses: LearnedHypothesis[];
}

/**
 * Step 8: Learning Engine
 * Compares Planned vs. Actual execution, computes category multipliers,
 * updates personal behavioral hypotheses, and feeds parameters to next week's planner.
 */
export function analyzeWeeklyOutcomes(input: WeeklyAnalysisInput): WeeklyLearningOutput {
  const { days, currentModel, weekNumber = 1 } = input;

  let totalPlannedMinutes = 0;
  let totalActualMinutes = 0;
  let totalPlannedTasks = 0;
  let totalCompletedTasks = 0;

  const categoryBuckets: Record<
    string,
    { planned: number; actual: number; completedCount: number; sampleCount: number }
  > = {};

  const allTasks: Task[] = [];

  for (const day of days) {
    totalPlannedMinutes += day.totalPlannedMinutes;
    totalActualMinutes += day.totalActualMinutes;

    for (const task of day.tasks) {
      allTasks.push(task);
      totalPlannedTasks++;
      if (task.status === 'completed') {
        totalCompletedTasks++;
      }

      if (!categoryBuckets[task.category]) {
        categoryBuckets[task.category] = { planned: 0, actual: 0, completedCount: 0, sampleCount: 0 };
      }

      categoryBuckets[task.category].planned += task.plannedMinutes;
      categoryBuckets[task.category].actual += task.actualMinutes || 0;
      categoryBuckets[task.category].sampleCount += 1;
      if (task.status === 'completed') {
        categoryBuckets[task.category].completedCount += 1;
      }
    }
  }

  const completionRate = totalPlannedTasks > 0 ? totalCompletedTasks / totalPlannedTasks : 0;

  // Compute category multipliers and differences
  const differencesByCategory: Record<string, { planned: number; actual: number; multiplier: number }> =
    {};
  const newMultipliers = { ...currentModel.categoryMultipliers };
  const newSampleCounts = { ...currentModel.categorySampleCounts };

  const keyLearnings: string[] = [];
  const nextWeekAdjustments: string[] = [];
  const discoveredHypotheses: LearnedHypothesis[] = [];

  for (const [cat, bucket] of Object.entries(categoryBuckets)) {
    const rawRatio = bucket.planned > 0 && bucket.actual > 0 ? bucket.actual / bucket.planned : 1.0;
    const clampedMultiplier = Math.min(
      ENGINE_CONFIG.MULTIPLIER_CLAMP_MAX,
      Math.max(ENGINE_CONFIG.MULTIPLIER_CLAMP_MIN, Number(rawRatio.toFixed(2)))
    );

    differencesByCategory[cat] = {
      planned: bucket.planned,
      actual: bucket.actual,
      multiplier: clampedMultiplier,
    };

    const totalSamples = (newSampleCounts[cat] || 0) + bucket.sampleCount;
    newSampleCounts[cat] = totalSamples;

    // Only update stored multiplier if we meet min samples
    if (totalSamples >= ENGINE_CONFIG.MIN_SAMPLES_FOR_MULTIPLIER) {
      // Exponential smoothing between previous multiplier and new observation
      const oldMult = currentModel.categoryMultipliers[cat] || 1.0;
      const smoothed = Number((0.6 * clampedMultiplier + 0.4 * oldMult).toFixed(2));
      newMultipliers[cat] = smoothed;

      if (smoothed > 1.25) {
        keyLearnings.push(
          `${cat.toUpperCase()} tasks consistently require ${smoothed}x more time than initially estimated.`
        );
        nextWeekAdjustments.push(
          `Auto-scale future ${cat} session allocations by ${smoothed}x during weekly plan generation.`
        );

        discoveredHypotheses.push({
          id: `hyp-${cat}-${Date.now()}`,
          statement: `Underestimation bias on ${cat}: Real execution time is ~${Math.round(
            (smoothed - 1) * 100
          )}% greater than stated plan.`,
          confidence: Math.min(1.0, 0.5 + totalSamples * 0.1),
          status: totalSamples >= 5 ? 'supported' : 'hypothesis',
          evidenceCount: totalSamples,
          discoveredAt: new Date().toISOString(),
        });
      }
    }
  }

  // Session size analysis
  const longTasks = allTasks.filter((t) => t.plannedMinutes > 60);
  const shortTasks = allTasks.filter((t) => t.plannedMinutes <= 45);

  const longCompletedRatio =
    longTasks.length > 0 ? longTasks.filter((t) => t.status === 'completed').length / longTasks.length : 0;
  const shortCompletedRatio =
    shortTasks.length > 0
      ? shortTasks.filter((t) => t.status === 'completed').length / shortTasks.length
      : 1;

  if (longTasks.length >= 2 && longCompletedRatio < 0.4 && shortCompletedRatio >= 0.7) {
    keyLearnings.push(
      `Sessions over 60m had low completion (${Math.round(
        longCompletedRatio * 100
      )}%), while ≤45m sessions had ${Math.round(shortCompletedRatio * 100)}% completion.`
    );
    nextWeekAdjustments.push(
      `Hard-cap maximum individual session size to 45m to prevent mid-week dropoff.`
    );

    discoveredHypotheses.push({
      id: `hyp-session-size-${Date.now()}`,
      statement: `Session fatigue threshold is ~45 minutes for this user. Shorter sessions yield >2x completion consistency.`,
      confidence: 0.82,
      status: 'supported',
      evidenceCount: allTasks.length,
      discoveredAt: new Date().toISOString(),
    });
  }

  // Record closed week actual minutes
  const updatedClosedWeeks = [...currentModel.closedWeeksHistory, totalActualMinutes];

  // Merge hypotheses
  const updatedHypotheses = [...currentModel.learnedHypotheses];
  for (const newHyp of discoveredHypotheses) {
    const existingIndex = updatedHypotheses.findIndex((h) => h.statement === newHyp.statement);
    if (existingIndex >= 0) {
      updatedHypotheses[existingIndex] = {
        ...updatedHypotheses[existingIndex],
        confidence: Math.min(1, updatedHypotheses[existingIndex].confidence + 0.1),
        evidenceCount: updatedHypotheses[existingIndex].evidenceCount + newHyp.evidenceCount,
        status:
          updatedHypotheses[existingIndex].confidence >= ENGINE_CONFIG.LEARNING_SUPPORTED_THRESHOLD
            ? 'supported'
            : 'hypothesis',
      };
    } else {
      updatedHypotheses.push(newHyp);
    }
  }

  return {
    comparison: {
      weekNumber,
      totalPlannedMinutes,
      totalActualMinutes,
      totalPlannedTasks,
      totalCompletedTasks,
      completionRate,
      differencesByCategory,
      keyLearnings,
      nextWeekAdjustments,
    },
    updatedPersonalModel: {
      ...currentModel,
      categoryMultipliers: newMultipliers,
      categorySampleCounts: newSampleCounts,
      observedSustainableSessionMinutes:
        longCompletedRatio < 0.4 ? 45 : currentModel.observedSustainableSessionMinutes,
      learnedHypotheses: updatedHypotheses,
      closedWeeksHistory: updatedClosedWeeks,
    },
    newHypotheses: discoveredHypotheses,
  };
}
