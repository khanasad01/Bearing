'use client';

import React from 'react';
import { useCoach } from '../store/coachStore';
import { generateIcsCalendar } from '../engine/calendar';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    diagnoses,
    recoveryState,
    loadPresetScenario,
    resetAll,
    capacity,
    weeklyPlan,
  } = useCoach();

  const unresolvedDiagnoses = diagnoses.filter((d) => !d.resolved);

  const handleExportIcs = () => {
    if (!weeklyPlan) return;
    const icsContent = generateIcsCalendar(weeklyPlan);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bearing-weekly-plan.ics';
    a.click();
  };

  return (
    <header className="border-b border-border bg-surface px-6 py-4 shadow-1">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Brand & Positioning */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-paper font-mono font-bold text-lg">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-lg text-ink tracking-tight">Bearing</h1>
              <span className="rounded-pill bg-plan-soft px-2.5 py-0.5 font-mono text-xs font-medium text-plan">
                V1: Adaptive Personal Coach
              </span>
              {recoveryState.isActive && (
                <span className="rounded-pill bg-ember-soft px-2.5 py-0.5 font-mono text-xs font-semibold text-ember-text animate-pulse">
                  ⚠️ Recovery Mode
                </span>
              )}
            </div>
            <p className="text-xs text-muted">
              Plans your week based on what actually happened — not what you hoped would happen.
            </p>
          </div>
        </div>

        {/* Quick Scenario Simulators & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {weeklyPlan && (
            <button
              onClick={handleExportIcs}
              className="rounded-md border border-border bg-surface-sunken px-3 py-1.5 text-xs font-mono font-medium text-ink hover:bg-border transition-colors"
              title="Export to Google Calendar / Apple Calendar (.ics)"
            >
              📥 Sync to Calendar (.ics)
            </button>
          )}

          <button
            onClick={() => loadPresetScenario('dsa_dropoff')}
            className="rounded-md border border-ember bg-ember-soft px-3 py-1.5 text-xs font-medium text-ember-text hover:bg-ember hover:text-white transition-colors"
            title="Load Section 9 DSA dropoff scenario from spec"
          >
            ⚡ Load DSA Dropoff Scenario (Spec §9)
          </button>

          <button
            onClick={resetAll}
            className="rounded-md border border-border bg-surface-sunken px-3 py-1.5 text-xs font-medium text-muted hover:text-ink hover:bg-border transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="mx-auto mt-4 flex max-w-7xl gap-1 overflow-x-auto border-t border-border pt-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-ink text-paper'
              : 'text-muted hover:bg-surface-sunken hover:text-ink'
          }`}
        >
          <span>🎯</span>
          <span>Goal & Onboarding</span>
        </button>

        <button
          onClick={() => setActiveTab('planner')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'planner'
              ? 'bg-ink text-paper'
              : 'text-muted hover:bg-surface-sunken hover:text-ink'
          }`}
        >
          <span>📅</span>
          <span>Weekly Plan ({Math.round(capacity.plannable / 60)}h)</span>
        </button>

        <button
          onClick={() => setActiveTab('execution')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'execution'
              ? 'bg-ink text-paper'
              : 'text-muted hover:bg-surface-sunken hover:text-ink'
          }`}
        >
          <span>⚡</span>
          <span>Daily Execution</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnosis')}
          className={`relative flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'diagnosis'
              ? 'bg-insight text-white'
              : 'text-muted hover:bg-surface-sunken hover:text-ink'
          }`}
        >
          <span>🔬</span>
          <span>Diagnosis & Recovery</span>
          {unresolvedDiagnoses.length > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {unresolvedDiagnoses.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('learning')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'learning'
              ? 'bg-ink text-paper'
              : 'text-muted hover:bg-surface-sunken hover:text-ink'
          }`}
        >
          <span>📈</span>
          <span>Weekly Learning</span>
        </button>

        <button
          onClick={() => setActiveTab('playbook')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'playbook'
              ? 'bg-ink text-paper'
              : 'text-muted hover:bg-surface-sunken hover:text-ink'
          }`}
        >
          <span>📖</span>
          <span>Personal Playbook</span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'metrics'
              ? 'bg-ink text-paper'
              : 'text-muted hover:bg-surface-sunken hover:text-ink'
          }`}
        >
          <span>📊</span>
          <span>V1 Success Metrics</span>
        </button>

        <button
          onClick={() => setActiveTab('methodologies')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'methodologies'
              ? 'bg-ink text-paper'
              : 'text-muted hover:bg-surface-sunken hover:text-ink'
          }`}
        >
          <span>📚</span>
          <span>Methodology Library</span>
        </button>
      </nav>
    </header>
  );
};
