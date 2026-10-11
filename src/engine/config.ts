// Engine configuration constants
export const ENGINE_CONFIG = {
  // Capacity model constants
  DEFAULT_HAIRCUT: 0.6, // week 1: assume 60% of stated is realistic
  BUFFER_RATIO: 0.8,    // always keep 20% buffer
  
  // Estimate multipliers
  MIN_SAMPLES_FOR_MULTIPLIER: 3,
  MULTIPLIER_CLAMP_MIN: 0.5,
  MULTIPLIER_CLAMP_MAX: 3.0,
  
  // Planning constraints
  MAX_SESSION_SIZE_DEFAULT: 90, // minutes
  MAX_TASKS_PER_DAY_DEFAULT: 4,
  
  // Learning thresholds
  LEARNING_SUPPORTED_THRESHOLD: 0.7,
  LEARNING_HYPOTHESIS_MIN: 0.4,
  LEARNING_RETIRE_THRESHOLD: 0.4,
  
  // Diagnosis confidence thresholds
  DIAGNOSIS_CONFIDENCE_HIGH: 0.7,
  DIAGNOSIS_CONFIDENCE_MEDIUM: 0.5,
  
  // Rescheduling
  RESCHEDULE_EVIDENCE_THRESHOLD: 3, // 3rd reschedule triggers evidence review
  
  // Recovery mode
  RECOVERY_MODE_MIN_COMPLETION_RATIO: 0.4,
  RECOVERY_MODE_CONSECUTIVE_DAYS: 2,
  RECOVERY_MODE_PROTECTED_BLOCK_MAX_MINUTES: 45,
};
