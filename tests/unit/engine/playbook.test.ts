import { describe, it, expect } from 'vitest';
import { generatePersonalPlaybook } from '../../../src/engine/playbook';
import { PersonalModel } from '../../../src/types/coach';

describe('playbook engine', () => {
  it('generates customized rules from personal execution model', () => {
    const mockModel: PersonalModel = {
      categoryMultipliers: { coding: 1.5, career: 1.0 },
      categorySampleCounts: { coding: 5 },
      timeOfDaySuccessRates: { morning: 0.8, afternoon: 0.5, evening: 0.3 },
      observedSustainableSessionMinutes: 40,
      learnedHypotheses: [],
      closedWeeksHistory: [500],
    };

    const playbook = generatePersonalPlaybook(mockModel);
    expect(playbook.operatingRules.length).toBeGreaterThanOrEqual(3);
    const sessionRule = playbook.operatingRules.find((r) => r.id === 'rule-session-size');
    expect(sessionRule?.ruleStatement).toContain('40 minutes');
    const scaleRule = playbook.operatingRules.find((r) => r.id === 'rule-scale-coding');
    expect(scaleRule?.ruleStatement).toContain('1.5x');
    expect(playbook.activeExperiments.length).toBeGreaterThan(0);
  });
});
