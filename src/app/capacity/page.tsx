'use client';

import CapacityCalculator from '@/components/CapacityCalculator';
import { loadOnboardingIntake } from '@/lib/onboarding-storage';
import { loadWeeklyPlan } from '@/lib/weekly-plan-storage';
import Image from 'next/image';

export default function CapacityPage() {
  const intake = loadOnboardingIntake();
  const weeklyPlan = loadWeeklyPlan();

  return (
    <div className="min-h-screen bg-paper">
      {intake && (
        <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {/* Bearing Mark - simplified for context panel */}
              <Image
                src="/bearing-mark.svg"
                alt="Bearing"
                width={32}
                height={32}
                className="h-8 w-auto text-muted"
              />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-actual mb-2">
                Your confirmed understanding
              </h2>
              <div className="text-muted text-sm space-y-1">
                <p>
                  <strong>{intake.intakeType === 'goal' ? 'Goal' : 'Problem'}:</strong> {' '}
                  {intake.description}
                </p>
                {intake.whyItMatters && (
                  <p>
                    <strong>Why it matters:</strong> {' '}
                    {intake.whyItMatters}
                  </p>
                )}
                <p>
                  <strong>Timeframe:</strong> {' '}
                  {intake.timeframe.replace(/-/g, ' ')}
                </p>
                {intake.targetDate && (
                  <p>
                    <strong>Target date:</strong> {' '}
                    {new Date(intake.targetDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {weeklyPlan && (
        <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {/* Bearing Mark - simplified for context panel */}
              <Image
                src="/bearing-mark.svg"
                alt="Bearing"
                width={32}
                height={32}
                className="h-8 w-auto text-muted"
              />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-actual mb-2">
                Your weekly plan
              </h2>
              <div className="text-muted text-sm space-y-1">
                <p>
                  <strong>Weekly tasks:</strong> {' '}
                  {weeklyPlan.tasks.length} planned
                </p>
                {weeklyPlan.tasks.length > 0 && (
                  <>
                    <p className="mt-1">
                      <strong>Planned time:</strong> {' '}
                      {weeklyPlan.tasks.reduce((sum, task) => sum + task.estimatedDurationMinutes, 0)} minutes
                    </p>
                    <p className="text-xs">
                      {[...weeklyPlan.tasks]
                        .sort((a, b) => a.plannedDay - b.plannedDay)
                        .map(task =>
                          ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][task.plannedDay] + ': ' + task.title + ' (' + task.estimatedDurationMinutes + ' min)'
                        )
                        .join(', ')}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex items-center justify-center flex-1 px-6">
        <CapacityCalculator />
      </main>

      {!intake && (
        <div className="bg-surface px-6 py-6 mt-6 border border-border-strong">
          <div className="text-center">
            <h2 className="font-semibold text-actual mb-4">
              Start with your goal or problem
            </h2>
            <p className="text-muted">
              To begin, tell us what you&#x27;d like to change or achieve. We&#x27;ll help you turn it into a realistic plan.
            </p>
            <a
              href="/onboarding"
              className="inline-block bg-actual text-background px-6 py-3 rounded-lg font-medium transition-colors hover:bg-plan"
            >
              Start onboarding
            </a>
          </div>
        </div>
      )}
    </div>
  );
}