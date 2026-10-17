'use client';

import React from 'react';
import { CoachProvider, useCoach } from '../store/coachStore';
import { Header } from '../components/Header';
import { OnboardingView } from '../components/OnboardingView';
import { PlannerView } from '../components/PlannerView';
import { ExecutionView } from '../components/ExecutionView';
import { DiagnosisView } from '../components/DiagnosisView';
import { LearningView } from '../components/LearningView';
import { MethodologyView } from '../components/MethodologyView';
import { PlaybookView } from '../components/PlaybookView';
import { MetricsView } from '../components/MetricsView';

function DashboardContent() {
  const { activeTab } = useCoach();

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans">
      <Header />

      <main className="flex-1 px-4 sm:px-6 md:px-8">
        {activeTab === 'overview' && <OnboardingView />}
        {activeTab === 'planner' && <PlannerView />}
        {activeTab === 'execution' && <ExecutionView />}
        {activeTab === 'diagnosis' && <DiagnosisView />}
        {activeTab === 'learning' && <LearningView />}
        {activeTab === 'playbook' && <PlaybookView />}
        {activeTab === 'metrics' && <MetricsView />}
        {activeTab === 'methodologies' && <MethodologyView />}
      </main>

      <footer className="mt-auto border-t border-border bg-surface py-6 px-6 text-center text-xs text-muted">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[11px]">
            Bearing V1 • PLAN → EXECUTE → OBSERVE → LEARN → REPLAN
          </p>
          <p className="italic">
            &ldquo;Your plan gets better because the system learns from what actually happened.&rdquo;
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <CoachProvider>
      <DashboardContent />
    </CoachProvider>
  );
}
