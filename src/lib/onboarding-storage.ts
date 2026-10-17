export type IntakeType = "problem" | "goal";

export type Timeframe = "short-term" | "medium-term" | "long-term";

interface OnboardingIntakeV1 {
  version: 1;
  intakeType: IntakeType;
  description: string;
  whyItMatters: string;
  timeframe: Timeframe;
  targetDate: string | null;
  confirmedUnderstanding: string;
  createdAt: string;
  updatedAt: string;
}

export type OnboardingIntake = OnboardingIntakeV1;

const STORAGE_KEY = "bearing.onboarding.v1";

/**
 * Save onboarding intake to localStorage
 * @param intake - The intake object to save
 * @returns true if successful, false otherwise
 */
export function saveOnboardingIntake(intake: OnboardingIntake): boolean {
  // If we are not in the browser, do nothing and return false to avoid errors during SSR/build.
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    // Validate the intake before saving
    if (!isValidOnboardingIntake(intake)) {
      console.error("Invalid onboarding intake:", intake);
      return false;
    }

    // Update the updatedAt timestamp
    const intakeToSave = {
      ...intake,
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(intakeToSave));
    return true;
  } catch (error) {
    console.error("Failed to save onboarding intake:", error);
    return false;
  }
}

/**
 * Load onboarding intake from localStorage
 * @returns The intake object if valid and exists, null otherwise
 */
export function loadOnboardingIntake(): OnboardingIntake | null {
  // If we are not in the browser, return null to avoid errors during SSR/build.
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    let intake: OnboardingIntake;
    try {
      intake = JSON.parse(stored);
    } catch (error) {
      console.error("Failed to parse onboarding intake from storage:", error);
      return null;
    }

    // Validate the loaded intake
    if (!isValidOnboardingIntake(intake)) {
      console.error("Invalid onboarding intake loaded from storage:", intake);
      // Clear invalid data
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return intake;
  } catch (error) {
    console.error("Failed to load onboarding intake:", error);
    return null;
  }
}

/**
 * Clear onboarding intake from localStorage
 */
export function clearOnboardingIntake(): void {
  // If we are not in the browser, do nothing to avoid errors during SSR/build.
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear onboarding intake:", error);
  }
}

/**
 * Validate an onboarding intake object
 * @param intake - The object to validate
 * @returns true if valid, false otherwise
 */
function isValidOnboardingIntake(intake: unknown): intake is OnboardingIntake {
  if (!intake || typeof intake !== "object") {
    return false;
  }

  // Check version
  if (!('version' in intake) || intake.version !== 1) {
    return false;
  }

  // Check intakeType
  if (!('intakeType' in intake) || !(intake.intakeType === "problem" || intake.intakeType === "goal")) {
    return false;
  }

  // Check description
  if (!('description' in intake) || typeof intake.description !== "string" || intake.description.trim() === "") {
    return false;
  }

  // Check whyItMatters
  if (!('whyItMatters' in intake) || typeof intake.whyItMatters !== "string") {
    return false;
  }

  // Check timeframe
  if (!('timeframe' in intake) || !(intake.timeframe === "short-term" || intake.timeframe === "medium-term" || intake.timeframe === "long-term")) {
    return false;
  }

  // Check targetDate
  if (!('targetDate' in intake)) {
    return false;
  }
  if (intake.targetDate !== null && typeof intake.targetDate !== "string") {
    return false;
  }
  if (intake.targetDate !== null) {
    const date = new Date(intake.targetDate);
    if (isNaN(date.getTime())) {
      return false;
    }
  }

  // Check confirmedUnderstanding
  if (!('confirmedUnderstanding' in intake) || typeof intake.confirmedUnderstanding !== "string") {
    return false;
  }

  // Check createdAt
  if (!('createdAt' in intake) || typeof intake.createdAt !== "string" || isNaN(new Date(intake.createdAt).getTime())) {
    return false;
  }

  // Check updatedAt
  if (!('updatedAt' in intake) || typeof intake.updatedAt !== "string" || isNaN(new Date(intake.updatedAt).getTime())) {
    return false;
  }

  return true;
}

/**
 * Create a new onboarding intake with default values
 * @returns A new onboarding intake object
 */
export function createEmptyOnboardingIntake(): OnboardingIntake {
  const now = typeof window !== 'undefined' ? new Date().toISOString() : '2024-01-01T00:00:00.000Z';
  return {
    version: 1,
    intakeType: "goal",
    description: "",
    whyItMatters: "",
    timeframe: "medium-term",
    targetDate: null,
    confirmedUnderstanding: "",
    createdAt: now,
    updatedAt: now,
  };
}