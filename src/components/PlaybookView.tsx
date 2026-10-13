'use client';

import React from 'react';
import { useCoach } from '../store/coachStore';
import { generatePersonalPlaybook } from '../engine/playbook';

export const PlaybookView: React.FC = () => {
  const { personalModel } = useCoach();
  const playbook = generatePersonalPlaybook(personalModel);

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-6">
      {/* Intro Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-1 space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-insight text-white text-base">
            📖
          </span>
          <h2 className="font-bold text-lg text-ink">Section 14: Personal Playbook</h2>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          The synthesized operating manual for how you uniquely work. Instead of generic productivity rules, these principles are backed by your own observed execution data.
        </p>
      </div>

      {/* Energy Profile & Work Caps */}
      <div className="grid gap-4 md:grid-cols-3 font-mono text-xs">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-1 space-y-1">
          <span className="text-[10px] uppercase text-muted font-bold">Observed Peak Window</span>
          <div className="font-sans font-bold text-base text-ink">{playbook.energyProfile.peakWindow}</div>
          <p className="font-sans text-[11px] text-muted">Highest completion rate recorded.</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-1 space-y-1">
          <span className="text-[10px] uppercase text-muted font-bold">Max Session Cap</span>
          <div className="font-mono font-bold text-base text-ember-text">
            {playbook.energyProfile.sustainableSessionMinutes} minutes
          </div>
          <p className="font-sans text-[11px] text-muted">Threshold before mental fatigue causes dropoff.</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-1 space-y-1">
          <span className="text-[10px] uppercase text-muted font-bold">Daily Task Cap</span>
          <div className="font-mono font-bold text-base text-success">
            {playbook.energyProfile.recommendedDailyTaskCap} tasks/day
          </div>
          <p className="font-sans text-[11px] text-muted">Protects cognitive focus from diffusion.</p>
        </div>
      </div>

      {/* Synthesized Personal Operating Rules */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-ink uppercase tracking-wider font-mono">
          Synthesized Operating Rules ({playbook.operatingRules.length})
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {playbook.operatingRules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-1 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-ink">{rule.title}</h4>
                <span className="rounded-pill bg-surface-sunken px-2 py-0.5 font-mono text-[10px] font-semibold text-muted uppercase">
                  {rule.category}
                </span>
              </div>

              <div className="rounded-lg border-l-4 border-ink bg-surface-sunken p-3 text-xs text-ink font-medium">
                &ldquo;{rule.ruleStatement}&rdquo;
              </div>

              <p className="text-[11px] text-muted italic">
                <strong>Empirical Evidence:</strong> {rule.evidenceBase}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Behavioral Experiments */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-ink uppercase tracking-wider font-mono">
            Active Behavioral Experiments
          </h3>
          <span className="font-mono text-xs text-muted">Continuous Optimization</span>
        </div>

        <div className="space-y-3">
          {playbook.activeExperiments.map((exp) => (
            <div
              key={exp.frameworkId}
              className="rounded-lg border border-border bg-surface-sunken p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">{exp.name}</span>
                <span className="font-mono text-muted">{exp.progressPercent}% Target Consistency</span>
              </div>
              <p className="text-muted leading-relaxed">{exp.hypothesis}</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-insight transition-all"
                  style={{ width: `${exp.progressPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
