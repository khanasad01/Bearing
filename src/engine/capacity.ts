/**
 * Calculate effective capacity for planning based on stated time, commitments, and historical data
 */

import { ENGINE_CONFIG } from './config';

export interface CapacityInputs {
  statedWeeklyMinutes: number;
  commitmentMinutes: number;
  closedWeeks: number[]; // array of actual minutes per week for closed weeks
}

export interface CapacityOutput {
  statedWeeklyMinutes: number;
  commitmentMinutes: number;
  availableStated: number;
  observedWeeklyMinutes: number;
  confidence: number;
  effectiveCapacity: number; // = (1-confidence) * (available_stated * DEFAULT_HAIRCUT) + confidence * observed_weekly_minutes
  plannable: number; // = effective_capacity * 0.8 (always keep 20% buffer)
}

/**
 * Calculate effective capacity for planning
 *
 * Algorithm:
 * 1. available_stated = statedWeeklyMinutes - commitmentMinutes (if stated is "free time")
 * 2. observed_weekly_minutes = median(actual_minutes_per_week) over latest up to 4 closed weeks
 * 3. confidence = min(1, closed_weeks / 4)
 * 4. effective_capacity = (1-confidence) * (available_stated * DEFAULT_HAIRCUT) + confidence * observed_weekly_minutes
 * 5. plannable_minutes = effective_capacity * 0.8 (always keep 20% buffer)
 */
export function computeCapacity(inputs: CapacityInputs): CapacityOutput {
  const { statedWeeklyMinutes, commitmentMinutes, closedWeeks } = inputs;
  
  // Calculate available stated time (stated time minus commitments)
  const availableStated = Math.max(0, statedWeeklyMinutes - commitmentMinutes);

  // Calculate observed weekly minutes (median of latest up to 4 closed weeks)
  const observedWeeklyMinutes = calculateMedian(closedWeeks.slice(-4));

  // Calculate confidence based on number of closed weeks (max 4 weeks)
  const confidence = Math.min(1, closedWeeks.length / 4);

  // Use constants from config
  const DEFAULT_HAIRCUT = ENGINE_CONFIG.DEFAULT_HAIRCUT;
  const BUFFER_RATIO = ENGINE_CONFIG.BUFFER_RATIO;

  // Calculate effective capacity: blend between haircut-based estimate and observed data
  const effectiveCapacity = (1 - confidence) * (availableStated * DEFAULT_HAIRCUT) + confidence * observedWeeklyMinutes;

  // Apply 20% buffer (always keep 20% of capacity uncommitted for flexibility)
  const plannable = effectiveCapacity * BUFFER_RATIO;
  
  return {
    statedWeeklyMinutes,
    commitmentMinutes,
    availableStated,
    observedWeeklyMinutes,
    confidence,
    effectiveCapacity,
    plannable,
  };
}

/**
 * Calculate median of an array of numbers
 * Returns 0 for empty array
 */
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    // Even number of elements: average of two middle values
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    // Odd number of elements: middle value
    return sorted[mid];
  }
}
