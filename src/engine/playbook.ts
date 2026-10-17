import { PersonalModel } from '../types/coach';
import { METHODOLOGY_LIBRARY } from './methodologies';

export interface PlaybookRule {
  id: string;
  category: 'capacity' | 'session' | 'friction' | 'recovery';
  title: string;
  ruleStatement: string;
  evidenceBase: string;
}

export interface PersonalPlaybook {
  operatingRules: PlaybookRule[];
  energyProfile: {
    peakWindow: string;
    sustainableSessionMinutes: number;
    recommendedDailyTaskCap: number;
  };
  activeExperiments: Array<{
    frameworkId: string;
    name: string;
    hypothesis: string;
    progressPercent: number;
  }>;
}

/**
 * Section 14: Personal Playbook Generator
 * Synthesizes learned habits, failure patterns, and rules into an individual operating playbook.
 */
export function generatePersonalPlaybook(model: PersonalModel): PersonalPlaybook {
  const rules: PlaybookRule[] = [];

  // Rule 1: Sustainable Session Size
  rules.push({
    id: 'rule-session-size',
    category: 'session',
    title: 'Hard Session Duration Cap',
    ruleStatement: `Never plan an individual work session exceeding ${model.observedSustainableSessionMinutes} minutes.`,
    evidenceBase: `Observed data indicates completion consistency drops sharply when sessions exceed ${model.observedSustainableSessionMinutes}m.`,
  });

  // Rule 2: Category Scaling Multipliers
  for (const [cat, mult] of Object.entries(model.categoryMultipliers)) {
    if (mult > 1.2) {
      rules.push({
        id: `rule-scale-${cat}`,
        category: 'capacity',
        title: `${cat.toUpperCase()} Reality Multiplier`,
        ruleStatement: `Always inflate initial ${cat} time estimates by ${mult}x.`,
        evidenceBase: `Based on actual execution tracking across closed weeks.`,
      });
    }
  }

  // Rule 3: Reschedule Rule of Three
  rules.push({
    id: 'rule-three-strikes',
    category: 'friction',
    title: 'The Three-Reschedule Stop Rule',
    ruleStatement: 'On the 3rd reschedule, halt all date shifts and force a 25-minute micro next-action breakdown.',
    evidenceBase: 'Rescheduling past 3 times indicates friction in starting, not lack of calendar slots.',
  });

  // Rule 4: Clean Slate Recovery
  rules.push({
    id: 'rule-recovery-slate',
    category: 'recovery',
    title: 'Zero Backlog Guilt Policy',
    ruleStatement: 'After 2 low-execution days, cancel catch-up lists and protect exactly 1 single 45-minute block.',
    evidenceBase: 'Catch-up debt causes psychological overload and multi-week dropoff.',
  });

  // Active Experiments mapping
  const activeExperiments = METHODOLOGY_LIBRARY.slice(0, 3).map((m, idx) => ({
    frameworkId: m.id,
    name: m.name,
    hypothesis: m.experiment.hypothesis,
    progressPercent: Math.min(100, (idx + 1) * 33),
  }));

  return {
    operatingRules: rules,
    energyProfile: {
      peakWindow: 'Morning (09:00 - 12:00)',
      sustainableSessionMinutes: model.observedSustainableSessionMinutes,
      recommendedDailyTaskCap: 4,
    },
    activeExperiments,
  };
}
