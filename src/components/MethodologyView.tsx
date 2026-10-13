'use client';

import React from 'react';
import { METHODOLOGY_LIBRARY } from '../engine/methodologies';

export const MethodologyView: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      {/* Intro Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-1 space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-paper text-base">
            📚
          </span>
          <h2 className="font-bold text-lg text-ink">Section 8: Curated Methodology Library</h2>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Bearing does not attempt &ldquo;10,000 book summaries&rdquo;. Instead, it converts battle-tested productivity principles into testable empirical experiments:
          <span className="font-mono text-ink ml-1 font-semibold">Concept → Mechanism → Situation → Action → Limitation → Experiment</span>.
        </p>
      </div>

      {/* Grid of Frameworks */}
      <div className="grid gap-6 md:grid-cols-2">
        {METHODOLOGY_LIBRARY.map((m) => (
          <div
            key={m.id}
            className="flex flex-col rounded-xl border border-border bg-surface p-6 shadow-1 space-y-4 justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="font-bold text-base text-ink">{m.name}</h3>
                <span className="rounded-pill bg-insight-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-insight">
                  Curated Protocol
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-mono font-bold text-muted uppercase text-[10px]">Concept:</span>
                  <p className="font-medium text-ink">{m.concept}</p>
                </div>

                <div>
                  <span className="font-mono font-bold text-muted uppercase text-[10px]">Mechanism:</span>
                  <p className="text-muted leading-relaxed">{m.mechanism}</p>
                </div>

                <div>
                  <span className="font-mono font-bold text-muted uppercase text-[10px]">When to use (Situation):</span>
                  <p className="text-muted italic">{m.situation}</p>
                </div>

                <div className="rounded-lg border border-border bg-surface-sunken p-2.5 space-y-1">
                  <span className="font-mono font-bold text-ink uppercase text-[10px]">Prescribed Action:</span>
                  <p className="text-ink">{m.action}</p>
                </div>

                <div>
                  <span className="font-mono font-bold text-danger uppercase text-[10px]">Known Limitation:</span>
                  <p className="text-muted">{m.limitation}</p>
                </div>
              </div>
            </div>

            {/* Experiment Card */}
            <div className="rounded-lg border border-ember bg-ember-soft/30 p-3 text-xs space-y-1 mt-2">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-ember-text">🧪 Testable Experiment</span>
                <span className="text-[10px] text-muted">{m.experiment.testPeriod}</span>
              </div>
              <p className="font-medium text-ink">{m.experiment.title}</p>
              <p className="text-[11px] text-muted">{m.experiment.hypothesis}</p>
              <div className="font-mono text-[10px] text-muted pt-1 border-t border-ember/20">
                Target Metric: <strong className="text-ink">{m.experiment.targetMetric}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
