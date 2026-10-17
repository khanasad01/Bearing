import { MethodologyFramework } from '../types/coach';

export const METHODOLOGY_LIBRARY: MethodologyFramework[] = [
  {
    id: 'm-min-session',
    name: 'Minimum Viable Session',
    concept: 'Shrink session duration until resistance drops to zero.',
    mechanism:
      'The brain perceives long sessions (>90m) as high-threat energy drains, triggering avoidance. A 30-45m block lowers activation energy below the hesitation threshold.',
    situation:
      'User plans 2-hour deep work sessions but abandons after 2-3 days (e.g., DSA dropoff pattern).',
    action:
      'Hard cap session to 30-45 minutes. Define the finish line as exactly 1 problem or 1 sub-function. Stop when the timer rings.',
    limitation:
      'Deep flow states on sprawling architectural refactors may need longer, but consistency must precede duration.',
    experiment: {
      title: '45-Min Fixed Block Trial',
      hypothesis: 'Smaller 45-minute daily sessions will achieve >=80% weekly consistency compared to 2-hour targets.',
      testPeriod: '2 weeks',
      targetMetric: 'Weekly session completion rate >= 80%',
    },
  },
  {
    id: 'm-kickoff-intention',
    name: 'Two-Minute Physical Kickoff',
    concept: 'Eliminate cognitive ambiguity in the first 120 seconds.',
    mechanism:
      'Executive dysfunction peaks between deciding to work and typing the first characters. A prescriptive physical prompt eliminates choice fatigue.',
    situation:
      'Task is rescheduled repeatedly because the user sits down and wonders where to start.',
    action:
      'Attach a concrete kickoff prompt: exact URL, file path, and first 10-word action before closing the planning session.',
    limitation:
      'Does not solve conceptual difficulty once working, only the starting threshold.',
    experiment: {
      title: 'Zero-Hesitation Kickoff Test',
      hypothesis: 'Starting within 3 minutes of scheduled time increases full session completion by 60%.',
      testPeriod: '5 days',
      targetMetric: 'Start latency under 180 seconds',
    },
  },
  {
    id: 'm-protected-recovery',
    name: 'Protected Recovery Block',
    concept: 'Never build a catch-up schedule after falling behind.',
    mechanism:
      'Catch-up schedules double the required workload right when cognitive energy is already depleted, causing total burnout.',
    situation:
      'User misses 2 consecutive days and attempts to schedule 6 hours on Saturday to make up.',
    action:
      'Declare bankruptcy on missed backlog. Protect 1 single 45-minute session today. All other backlog items are cleared.',
    limitation:
      'Gross output is temporarily reduced for 24-48 hours, but prevents week-long abandonment.',
    experiment: {
      title: 'Clean Slate Restart Protocol',
      hypothesis: 'Completing 1 protected block today guarantees 3x higher probability of regular execution tomorrow.',
      testPeriod: '3 days',
      targetMetric: 'Next-day task start success rate',
    },
  },
  {
    id: 'm-capacity-haircut',
    name: 'Empirical Capacity Haircut',
    concept: 'Plan for the real human, not the hypothetical hero.',
    mechanism:
      'Human optimism bias consistently overestimates available focus by ~40% and ignores interruptions.',
    situation:
      'Week 1 user states "I have 30 hours this week" with high enthusiasm.',
    action:
      'Apply 60% haircut to stated available hours, followed by an uncommitted 20% safety buffer.',
    limitation:
      'May feel uncomfortably conservative to highly ambitious planners on Day 1.',
    experiment: {
      title: '48% Realistic Ceiling Test',
      hypothesis: 'Restricting plan to plannable capacity will eliminate Friday task triage panic.',
      testPeriod: '1 week',
      targetMetric: 'Unrescheduled completion ratio >= 75%',
    },
  },
];
