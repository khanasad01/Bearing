'use client';

import React from 'react';
import { useCoach } from '../store/coachStore';
import { calculateV1Metrics } from '../engine/metrics';

export const MetricsView: React.FC = () => {
  const { weeklyPlan, weeklyComparisons, currentWeekNumber } = useCoach();
  const metrics = calculateV1Metrics(weeklyPlan, weeklyComparisons);

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-6">
      {/* Intro Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-1 space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-paper text-base">
            📊
          </span>
          <h2 className="font-bold text-lg text-ink">Section 11: V1 Success Metrics & Telemetry</h2>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          &ldquo;We should not judge V1 by number of chats or tasks. We need to measure: Are plans becoming more realistic? Does the user recover faster after disruption? Does the system perform better after learning?&rdquo;
        </p>
      </div>

      {/* 6 Core Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {/* Metric 1 */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-1 space-y-2">
          <span className="font-mono text-[10px] text-muted uppercase font-bold">1. Planning Accuracy</span>
          <div className="font-mono text-3xl font-black text-ink">{metrics.planningAccuracy}%</div>
          <p className="text-[11px] text-muted">
            Ratio of planned vs. actual time consumed. Reaches 100% when estimates match execution.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-1 space-y-2">
          <span className="font-mono text-[10px] text-muted uppercase font-bold">2. Important Work Completion</span>
          <div className="font-mono text-3xl font-black text-success">{metrics.importantWorkCompletionRate}%</div>
          <p className="text-[11px] text-muted">
            Proportion of high-leverage outcomes achieved without abandonment.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-1 space-y-2">
          <span className="font-mono text-[10px] text-muted uppercase font-bold">3. Disruption Recovery Rate</span>
          <div className="font-mono text-3xl font-black text-insight">{metrics.recoveryRate}%</div>
          <p className="text-[11px] text-muted">
            Percentage of rescheduled or delayed tasks that were ultimately completed.
          </p>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-1 space-y-2">
          <span className="font-mono text-[10px] text-muted uppercase font-bold">4. Plan Correction Rate</span>
          <div className="font-mono text-3xl font-black text-ember-text">{metrics.rescheduleRate}%</div>
          <p className="text-[11px] text-muted">
            Frequency of needing to push tasks forward across week days.
          </p>
        </div>

        {/* Metric 5 */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-1 space-y-2">
          <span className="font-mono text-[10px] text-muted uppercase font-bold">5. Personalization Lift</span>
          <div className="font-mono text-3xl font-black text-insight">
            {metrics.personalizationLift > 0 ? `+${metrics.personalizationLift}%` : `${metrics.personalizationLift}%`}
          </div>
          <p className="text-[11px] text-muted">
            Measurable increase in plan realism from baseline Week 1 to current Week {currentWeekNumber}.
          </p>
        </div>

        {/* Metric 6 */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-1 space-y-2">
          <span className="font-mono text-[10px] text-muted uppercase font-bold">6. Execution Consistency</span>
          <div className="font-mono text-3xl font-black text-ink">{metrics.executionConsistency}%</div>
          <p className="text-[11px] text-muted">
            Percentage of planned active days that recorded successful work sessions.
          </p>
        </div>
      </div>

      {/* V1 Thesis Validation Assessment */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-1 space-y-3 font-mono text-xs">
        <h3 className="font-bold text-sm text-ink uppercase tracking-wider">
          V1 Thesis Validation Status (Spec §12)
        </h3>
        <p className="font-sans text-xs text-muted leading-relaxed">
          &ldquo;Ask: Is the later plan measurably better for that person? More realistic? Better prioritized? More frequently completed? Better at handling disruptions? If yes: V1 thesis gains evidence.&rdquo;
        </p>

        <div className="rounded-lg border border-border bg-surface-sunken p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink">Core Advantage Proof:</span>
            <span className="rounded bg-success/10 px-2 py-0.5 font-bold text-success">
              {weeklyComparisons.length > 0 ? '✓ Evidence Accumulated' : '⏳ Baseline Recording'}
            </span>
          </div>
          <p className="font-sans text-[11px] text-muted">
            {weeklyComparisons.length > 0
              ? `System has recorded ${weeklyComparisons.length} closed weeks of execution data and calibrated personal scaling models.`
              : 'Complete your first week execution reflection to see comparative lift calculations.'}
          </p>
        </div>
      </div>
    </div>
  );
};
