'use client';

import Image from 'next/image';

// Importers/callers: This component will be imported and used in plan/page.tsx to display intake context
// Affected API: None, this is a new UI component
// Data schemas: Consumes OnboardingIntake type from @/lib/onboarding-storage
// User's verbatim instruction: Create a reusable IntakeContext component to eliminate duplicated code in plan/page.tsx as suggested in the code review

interface IntakeContextProps {
  intake: ReturnType<typeof import('@/lib/onboarding-storage').loadOnboardingIntake> | null;
}

export default function IntakeContext({ intake }: IntakeContextProps) {
  if (!intake) return null;

  return (
    <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
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
  );
}