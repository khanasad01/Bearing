'use client';

import React from 'react';
import { useCoach } from '../store/coachStore';

export const DiagnosisView: React.FC = () => {
  const {
    diagnoses,
    resolveDiagnosis,
    recoveryState,
    triggerRecoveryMode,
    exitRecoveryMode,
  } = useCoach();

  const activeDiagnoses = diagnoses.filter((d) => !d.resolved);
  const resolvedDiagnoses = diagnoses.filter((d) => d.resolved);

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-insight/30 bg-insight-soft/40 p-6 shadow-1 space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-insight text-white text-base">
            🔬
          </span>
          <h2 className="font-bold text-lg text-ink">Step 6: Repeated Failure Diagnosis Engine</h2>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          When ordinary calendar apps see a task move Mon → Tue → Wed → Thu, they dumbly push it to Friday.
          Bearing halts the cycle: <strong className="text-ink">&ldquo;We have evidence that rescheduling isn&apos;t solving this.&rdquo;</strong>
        </p>
      </div>

      {/* Active Diagnoses List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-ink uppercase tracking-wider font-mono">
          Active Diagnostic Alerts ({activeDiagnoses.length})
        </h3>

        {activeDiagnoses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center space-y-2">
            <div className="text-3xl">✨</div>
            <p className="font-medium text-sm text-ink">No Repeated Failure Detected</p>
            <p className="text-xs text-muted">
              Tasks are progressing without exceeding the 3-reschedule evidence threshold.
            </p>
          </div>
        ) : (
          activeDiagnoses.map((diag) => (
            <div
              key={diag.id}
              className="rounded-xl border border-ember bg-surface p-6 shadow-2 space-y-5"
            >
              {/* Card Header */}
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-pill bg-danger/10 px-2.5 py-0.5 font-mono text-xs font-bold text-danger">
                      Rescheduled {diag.rescheduleCount}x
                    </span>
                    <span className="rounded-pill bg-insight-soft px-2.5 py-0.5 font-mono text-xs font-semibold text-insight uppercase">
                      Cause: {diag.rootCause.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="mt-1.5 font-bold text-base text-ink">{diag.taskTitle}</h4>
                </div>

                <div className="rounded bg-surface-sunken px-3 py-1 font-mono text-xs text-muted">
                  Confidence: <strong className="text-ink">{Math.round(diag.confidence * 100)}%</strong>
                </div>
              </div>

              {/* Coach Diagnosis Quote */}
              <div className="rounded-lg border-l-4 border-insight bg-insight-soft/30 p-4 space-y-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-insight">
                  Coach Diagnosis
                </span>
                <p className="text-xs text-ink leading-relaxed font-medium">&ldquo;{diag.explanation}&rdquo;</p>
              </div>

              {/* Evidence Points */}
              <div className="space-y-2">
                <h5 className="font-mono text-xs font-semibold text-muted uppercase">
                  Observed Evidence Signals:
                </h5>
                <ul className="space-y-1 pl-4 text-xs text-ink list-disc marker:text-ember">
                  {diag.evidence.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>

              {/* Recommended Experiment */}
              {diag.recommendedExperiment && (
                <div className="rounded-lg border border-border bg-surface-sunken p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ember-text">
                      🧪 Proposed Experiment:
                    </span>
                    <span className="font-semibold text-xs text-ink">
                      {diag.recommendedExperiment.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{diag.recommendedExperiment.experimentDetails}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs text-muted italic">
                  Suggested Action: {diag.suggestedAction}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => resolveDiagnosis(diag.id, true)}
                    className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper shadow-1 hover:bg-[#232b44] transition-colors"
                  >
                    ⚡ Adapt Task (Apply 45m Experiment)
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Step 7: Recovery Protocol Card */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-1 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <h3 className="font-bold text-base text-ink">Step 7: Recovery Mode Protocol</h3>
            </div>
            <p className="text-xs text-muted">
              Triggered automatically when 2 consecutive days drop below 40% completion. Never creates a catch-up debt.
            </p>
          </div>

          {recoveryState.isActive ? (
            <button
              onClick={exitRecoveryMode}
              className="rounded-md border border-border bg-surface-sunken px-3 py-1.5 font-mono text-xs font-semibold text-ink hover:bg-border transition-colors"
            >
              Exit Recovery
            </button>
          ) : (
            <button
              onClick={triggerRecoveryMode}
              className="rounded-md border border-ember bg-ember-soft px-3.5 py-1.5 font-mono text-xs font-semibold text-ember-text hover:bg-ember hover:text-white transition-colors"
            >
              Trigger Recovery Mode
            </button>
          )}
        </div>

        {/* 4 Steps Graphic */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 font-mono text-xs">
          <div className="rounded-lg border border-border bg-surface-sunken p-3 space-y-1">
            <span className="font-bold text-insight">1. Diagnose</span>
            <p className="font-sans text-[11px] text-muted">Acknowledge overload without guilt.</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-sunken p-3 space-y-1">
            <span className="font-bold text-ember-text">2. Simplify</span>
            <p className="font-sans text-[11px] text-muted">Drop non-essential queue to 1 task.</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-sunken p-3 space-y-1">
            <span className="font-bold text-plan">3. Protect</span>
            <p className="font-sans text-[11px] text-muted">Protect single 45m block only.</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-sunken p-3 space-y-1">
            <span className="font-bold text-success">4. Restart</span>
            <p className="font-sans text-[11px] text-muted">Bank 1 clean win to reset momentum.</p>
          </div>
        </div>
      </div>

      {/* Resolved History */}
      {resolvedDiagnoses.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-mono text-xs font-semibold text-muted uppercase">
            Resolved Diagnoses History ({resolvedDiagnoses.length})
          </h4>
          <div className="space-y-2">
            {resolvedDiagnoses.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-xs"
              >
                <div>
                  <span className="font-semibold text-ink">{d.taskTitle}</span>
                  <span className="ml-2 font-mono text-muted">({d.rootCause})</span>
                </div>
                <span className="font-mono text-success font-semibold">✓ Adapted & Resolved</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
