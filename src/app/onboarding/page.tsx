'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import {
  createEmptyOnboardingIntake,
  loadOnboardingIntake,
  saveOnboardingIntake,
  OnboardingIntake,
  Timeframe
} from '@/lib/onboarding-storage';

type Step = 'welcome' | 'understand' | 'confirm';

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [intake, setIntake] = useState<OnboardingIntake>(() => {
    // Try to load existing intake, or create empty one
    const saved = loadOnboardingIntake();
    return saved ?? createEmptyOnboardingIntake();
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const router = useRouter();

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setError(null);

    if (type === 'checkbox') {
      setIntake((prev: OnboardingIntake) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'timeframe') {
      setIntake((prev: OnboardingIntake) => ({ ...prev, timeframe: value as Timeframe }));
    } else if (name === 'targetDate') {
      setIntake((prev: OnboardingIntake) => ({ ...prev, targetDate: value || null }));
    } else {
      setIntake((prev: OnboardingIntake) => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // Validate required fields
      if (!intake.description.trim()) {
        setError("Please describe what you'd like to change or achieve.");
        setIsSaving(false);
        return;
      }

      // Save the intake
      const success = saveOnboardingIntake(intake);
      if (!success) {
        setError("Failed to save your responses. Please try again.");
        setIsSaving(false);
        return;
      }

      // Move to next step or complete
      if (step === 'welcome') {
        setStep('understand');
      } else if (step === 'understand') {
        setStep('confirm');
      } else if (step === 'confirm') {
        // Onboarding complete, redirect to capacity page
        router.push('/capacity');
      }
    } catch (err) {
      console.error('Error saving onboarding intake:', err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle going back to previous step
  const handleBack = () => {
    if (step === 'understand') {
      setStep('welcome');
    } else if (step === 'confirm') {
      setStep('understand');
    }
  };

  // Generate the confirmed understanding summary
  const generateConfirmedUnderstanding = (): string => {
    const timeframeLabels: Record<Timeframe, string> = {
      'short-term': 'Short-term',
      'medium-term': 'Medium-term',
      'long-term': 'Long-term',
    };

    let summary = `**What I understand**\n\n`;
    summary += `- **Your ${intake.intakeType === 'goal' ? 'goal' : 'problem'}:** ${intake.description.trim()}\n`;

    if (intake.whyItMatters.trim()) {
      summary += `- **Why it matters:** ${intake.whyItMatters.trim()}\n`;
    }

    summary += `- **Timeframe:** ${timeframeLabels[intake.timeframe]}\n`;

    if (intake.targetDate) {
      const date = new Date(intake.targetDate);
      summary += `- **Target date:** ${date.toLocaleDateString()}\n`;
    }

    summary += `- **Next step:** Estimate your available weekly capacity before building a realistic plan.`;

    return summary;
  };

  // Welcome step content
  if (step === 'welcome') {
    return (
      <main className="min-h-screen bg-paper flex flex-col justify-center px-4 py-8">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center">
            {/* Bearing mark — served from /public (next/image optimizers reject SVG) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bearing-mark.svg"
              alt="Bearing"
              width={40}
              height={40}
              className="h-10 w-10"
            />

            <div className="mt-6 space-y-4">
              <h1 className="font-display text-[clamp(1.75rem,6vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.015em] text-ink">
                Plan for who you actually are.
              </h1>

              <p className="mx-auto max-w-[68ch] text-base leading-[1.6] text-muted">
                Bearing helps you turn a goal into a realistic plan, then adjust that plan based on what actually happens.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setIntake((prev: OnboardingIntake) => ({ ...prev, intakeType: 'problem' }));
                setStep('understand');
              }}
              className="min-h-[44px] w-full rounded-md border border-border-strong bg-surface px-6 py-4 text-left text-base font-medium text-ink transition-colors duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:border-ink hover:bg-plan-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:bg-plan-soft motion-reduce:transition-none"
            >
              Solve a problem
            </button>

            <button
              type="button"
              onClick={() => {
                setIntake((prev: OnboardingIntake) => ({ ...prev, intakeType: 'goal' }));
                setStep('understand');
              }}
              className="min-h-[44px] w-full rounded-md border border-border-strong bg-surface px-6 py-4 text-left text-base font-medium text-ink transition-colors duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:border-ink hover:bg-plan-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:bg-plan-soft motion-reduce:transition-none"
            >
              Achieve a goal
            </button>
          </div>

          <p className="text-sm leading-relaxed text-muted">
            Already have an answer?{' '}
            <button
              type="button"
              onClick={() => setStep('understand')}
              className="min-h-[44px] align-middle text-ink underline underline-offset-4 transition-colors duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:text-plan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper motion-reduce:transition-none"
            >
              Start with your goal
            </button>
          </p>
        </div>
      </main>
    );
  }

  // Understand step content
  if (step === 'understand') {
    return (
      <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-ink">
              Tell us about your {intake.intakeType === 'goal' ? 'goal' : 'problem'}
            </h2>
            <Button
              variant="link"
              onClick={handleBack}
            >
              Back
            </Button>
          </div>

          <p className="text-muted mb-2">
            Tell me what&apos;s going on. We&apos;ll turn it into a realistic plan and learn from what works for you.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                What would you like to change or achieve?
              </label>
              <textarea
                name="description"
                value={intake.description}
                onChange={handleChange}
                rows={4}
                className="w-full bg-surface-sunken border border-border-strong rounded-lg p-3 text-ink focus:border-actual focus:ring-2 focus:ring-actual/20"
                placeholder="e.g., I want to improve my DSA skills for internship interviews"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Why does this matter to you? (optional)
              </label>
              <textarea
                name="whyItMatters"
                value={intake.whyItMatters}
                onChange={handleChange}
                rows={3}
                className="w-full bg-surface-sunken border border-border-strong rounded-lg p-3 text-ink focus:border-actual focus:ring-2 focus:ring-actual/20"
                placeholder="e.g., Prepare for internship opportunities at top tech companies"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Desired timeframe
              </label>
              <select
                name="timeframe"
                value={intake.timeframe}
                onChange={handleChange}
                className="w-full bg-surface-sunken border border-border-strong rounded-lg p-3 text-ink focus:border-actual focus:ring-2 focus:ring-actual/20"
              >
                <option value="short-term">Short-term (days to weeks)</option>
                <option value="medium-term">Medium-term (weeks to months)</option>
                <option value="long-term">Long-term (months to a year)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Target date (optional)
              </label>
              <input
                name="targetDate"
                type="date"
                value={intake.targetDate || ''}
                onChange={handleChange}
                className="w-full bg-surface-sunken border border-border-strong rounded-lg p-3 text-ink focus:border-actual focus:ring-2 focus:ring-actual/20"
              />
            </div>
          </div>

          {error && (
            <div className="bg-danger/10 text-danger border border-danger/20 rounded-lg p-4">
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="primary"
              type="submit"
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </main>
    );
  }

  // Confirm step content
  if (step === 'confirm') {
    const confirmedUnderstanding = generateConfirmedUnderstanding();

    return (
      <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-ink">
              Have I understood you correctly?
            </h2>
            <Button
              variant="link"
              onClick={handleBack}
            >
              Edit my answers
            </Button>
          </div>

          <div className="bg-surface rounded-lg border border-border-strong p-6 space-y-4">
            <p className="text-ink">{confirmedUnderstanding}</p>
          </div>

          <p className="text-xs text-muted">
            This summary is based on your actual responses. You can edit your answers by clicking &quot;Edit my answers&quot; above.
          </p>

          {error && (
            <div className="bg-danger/10 text-danger border border-danger/20 rounded-lg p-4">
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="primary"
              type="submit"
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Confirm and continue'}
            </Button>
          </div>
        </form>
      </main>
    );
  }

  // Should never reach here, but fallback to welcome
  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="font-display text-2xl text-ink">
          Plan for who you actually are.
        </h1>
        <p className="text-muted">
          Bearing helps you turn a goal into a realistic plan, then adjust that plan based on what actually happens.
        </p>
        <Button
          variant="primary"
          className="w-full"
          onClick={() => setStep('welcome')}
        >
          Start over
        </Button>
      </div>
    </main>
  );
}