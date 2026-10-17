'use client';

import React from 'react';
import { useCoach } from '../store/coachStore';

export const LearningView: React.FC = () => {
  const {
    personalModel,
    weeklyComparisons,
    runWeeklyReflection,
    advanceToNextWeek,
    currentWeekNumber,
  } = useCoach();

  const latestComparison = weeklyComparisons[weeklyComparisons.length - 1];

  const handleExportMarkdown = () => {
    if (!latestComparison) return;
    const content = `# Bearing Coaching Report — Week ${latestComparison.weekNumber}
Completion Rate: ${Math.round(latestComparison.completionRate * 100)}%
Total Planned: ${latestComparison.totalPlannedMinutes} mins
Total Actual: ${latestComparison.totalActualMinutes} mins

## Key Empirical Learnings
${latestComparison.keyLearnings.map((l) => `- ${l}`).join('\n')}

## Next Week Plan Adjustments
${latestComparison.nextWeekAdjustments.map((a) => `- ${a}`).join('\n')}

## Learned Multipliers
${Object.entries(personalModel.categoryMultipliers)
  .map(([k, v]) => `- ${k.toUpperCase()}: ${v}x`)
  .join('\n')}
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bearing-week-${latestComparison.weekNumber}-report.md`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-1 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-paper text-base">
              📈
            </span>
            <h2 className="font-bold text-lg text-ink">
              Step 8: The Learning Loop (Current Week {currentWeekNumber})
            </h2>
          </div>
          <p className="text-xs text-muted">
            The core advantage of Bearing: The system gets better at planning by observing your actual execution history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={runWeeklyReflection}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-sunken px-3.5 py-2 font-medium text-ink text-xs hover:bg-border transition-colors"
          >
            <span>🔄</span>
            <span>Reflect on Week {currentWeekNumber}</span>
          </button>

          <button
            onClick={advanceToNextWeek}
            className="flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 font-semibold text-paper text-xs shadow-2 hover:bg-[#232b44] transition-colors"
            title="Step 8 -> Replan: Feed accumulated learnings into generating next week's plan"
          >
            <span>🚀</span>
            <span>Advance to Week {currentWeekNumber + 1} Plan →</span>
          </button>
        </div>
      </div>

      {/* Latest Reflection: Planned vs Actual Comparison */}
      {latestComparison ? (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-1 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-semibold text-sm text-ink">
                Week {latestComparison.weekNumber} Reflection: Planned vs. Actual
              </h3>
              <span className="font-mono text-xs text-muted">
                Comparative Execution Ledger
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-insight">
                Completion Rate: {Math.round(latestComparison.completionRate * 100)}%
              </span>
              <button
                onClick={handleExportMarkdown}
                className="rounded border border-border bg-surface-sunken px-2.5 py-1 font-mono text-[11px] text-muted hover:text-ink hover:bg-border transition-colors"
              >
                📥 Export Markdown
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 font-mono text-xs">
            <div className="rounded-lg border border-border bg-surface-sunken p-3">
              <span className="text-muted text-[11px]">Total Planned</span>
              <p className="text-base font-bold text-ink mt-0.5">{latestComparison.totalPlannedMinutes} mins</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-sunken p-3">
              <span className="text-muted text-[11px]">Total Actual</span>
              <p className="text-base font-bold text-ink mt-0.5">{latestComparison.totalActualMinutes} mins</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-sunken p-3">
              <span className="text-muted text-[11px]">Planned Tasks</span>
              <p className="text-base font-bold text-ink mt-0.5">{latestComparison.totalPlannedTasks}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-sunken p-3">
              <span className="text-muted text-[11px]">Completed Tasks</span>
              <p className="text-base font-bold text-success mt-0.5">{latestComparison.totalCompletedTasks}</p>
            </div>
          </div>

          {/* Key Learnings & Next Week Adjustments */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-sunken p-4 space-y-2">
              <h4 className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
                💡 Key Empirical Learnings
              </h4>
              {latestComparison.keyLearnings.length === 0 ? (
                <p className="text-xs text-muted">Baseline week. More samples needed for pattern derivation.</p>
              ) : (
                <ul className="space-y-1.5 pl-4 text-xs text-ink list-disc marker:text-insight">
                  {latestComparison.keyLearnings.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-border bg-surface-sunken p-4 space-y-2">
              <h4 className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
                🎯 Next Week Plan Adjustments
              </h4>
              {latestComparison.nextWeekAdjustments.length === 0 ? (
                <p className="text-xs text-muted">Standard planning parameters will carry forward.</p>
              ) : (
                <ul className="space-y-1.5 pl-4 text-xs text-ink list-disc marker:text-ember">
                  {latestComparison.nextWeekAdjustments.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center space-y-3">
          <p className="text-xs text-muted">
            No closed week reflection recorded yet. Click <strong>&ldquo;Reflect on Week {currentWeekNumber}&rdquo;</strong> to analyze current execution history.
          </p>
        </div>
      )}

      {/* Personal Model: Multipliers & Learned Hypotheses */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Multipliers */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-ink">Personal Duration Multipliers</h3>
            <span className="font-mono text-xs text-muted">Learned Scaling</span>
          </div>
          <p className="text-xs text-muted">
            The coach auto-scales future task durations in each category based on actual vs. planned ratios.
          </p>

          <div className="space-y-2.5 font-mono text-xs">
            {Object.entries(personalModel.categoryMultipliers).map(([cat, mult]) => (
              <div
                key={cat}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-sunken px-3.5 py-2"
              >
                <span className="font-medium uppercase text-ink">{cat}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted">
                    Samples: {personalModel.categorySampleCounts[cat] || 0}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 font-bold ${
                      mult > 1.25 ? 'bg-ember-soft text-ember-text' : 'bg-surface text-ink'
                    }`}
                  >
                    {mult.toFixed(2)}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Behavioral Hypotheses Ledger */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-ink">Empirical Behavioral Hypotheses</h3>
            <span className="font-mono text-xs text-muted">Pattern Twin</span>
          </div>
          <p className="text-xs text-muted">
            Hypotheses are promoted to <span className="text-success font-semibold">Supported</span> when confidence ≥ 70%.
          </p>

          <div className="space-y-2.5">
            {personalModel.learnedHypotheses.length === 0 ? (
              <p className="text-xs text-muted">No hypotheses discovered yet.</p>
            ) : (
              personalModel.learnedHypotheses.map((h) => (
                <div
                  key={h.id}
                  className="rounded-lg border border-border bg-surface-sunken p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-bold uppercase ${
                        h.status === 'supported'
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {h.status}
                    </span>
                    <span className="font-mono text-[10px] text-muted">
                      Confidence: {Math.round(h.confidence * 100)}% ({h.evidenceCount} ev)
                    </span>
                  </div>
                  <p className="text-ink font-medium leading-relaxed">{h.statement}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
