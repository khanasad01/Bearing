'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loadOnboardingIntake, saveOnboardingIntake, createEmptyOnboardingIntake } from '@/lib/onboarding-storage';
import { loadWeeklyPlan, saveWeeklyPlan, createEmptyWeeklyPlan, isValidWeeklyPlan } from '@/lib/weekly-plan-storage';
import { computeCapacity, CapacityInputs, CapacityOutput } from '@/engine/capacity';
import Link from 'next/link';

// UI Components
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Card from '@/components/ui/Card';
import Stat from '@/components/ui/Stat';
import IntakeContext from '@/components/IntakeContext';
import { ROUTES } from '@/constants/routes';

// Using built-in crypto.randomUUID for reliable ID generation
// Note: crypto.randomUUID is available in modern environments including Node.js 14.17+

export default function PlanPage() {
  const router = useRouter();
  const [intake, setIntake] = useState<ReturnType<typeof loadOnboardingIntake> | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<ReturnType<typeof loadWeeklyPlan> | null>(null);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<'intake' | 'capacity' | 'plan'>('intake');

  // Capacity step state
  const [capacityInputs, setCapacityInputs] = useState<CapacityInputs>({
    statedWeeklyMinutes: 0,
    commitmentMinutes: 0,
    closedWeeks: [],
  });
  const [capacityOutput, setCapacityOutput] = useState<CapacityOutput | null>(null);
  const [capacityError, setCapacityError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load onboarding intake
        const storedIntake = loadOnboardingIntake();
        setIntake(storedIntake || createEmptyOnboardingIntake());

        // Load weekly plan
        const storedWeeklyPlan = loadWeeklyPlan();
        if (storedWeeklyPlan && isValidWeeklyPlan(storedWeeklyPlan)) {
          setWeeklyPlan(storedWeeklyPlan);
        } else {
          // Create new plan linked to intake if intake exists
          const newPlan = createEmptyWeeklyPlan(
            storedIntake ? crypto.randomUUID() : undefined
          );
          setWeeklyPlan(newPlan);
        }
      } catch (error) {
        console.error('Failed to load planner data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save intake when it changes
  useEffect(() => {
    if (intake) {
      saveOnboardingIntake(intake);
    }
  }, [intake]);

  // Save weekly plan when it changes
  useEffect(() => {
    if (weeklyPlan) {
      saveWeeklyPlan(weeklyPlan);
    }
  }, [weeklyPlan]);

  // Handle intake completion (move from intake step to capacity step)
  const handleIntakeComplete = useCallback((completedIntake: ReturnType<typeof loadOnboardingIntake>) => {
    setIntake(completedIntake);
    setActiveStep('capacity');
    // Reset capacity inputs and output
    setCapacityInputs({
      statedWeeklyMinutes: 0,
      commitmentMinutes: 0,
      closedWeeks: [],
    });
    setCapacityOutput(null);
    setCapacityError(null);
    setCapacity(null);
  }, []);

  // Form validation function
  const validateCapacityInputs = useCallback((inputs: CapacityInputs): string | null => {
    if (isNaN(inputs.statedWeeklyMinutes) || inputs.statedWeeklyMinutes < 0) {
      return 'Stated weekly minutes must be a non-negative number';
    }
    if (isNaN(inputs.commitmentMinutes) || inputs.commitmentMinutes < 0) {
      return 'Commitment minutes must be a non-negative number';
    }
    // Validate closed weeks array
    if (!Array.isArray(inputs.closedWeeks) ||
        inputs.closedWeeks.some(week => isNaN(week) || week < 0)) {
      return 'Closed weeks must be an array of non-negative numbers';
    }
    return null;
  }, []);

  // Handle capacity step completion (move to plan step)
  const handleCapacityComplete = useCallback((output: CapacityOutput) => {
    setCapacityOutput(output);
    setCapacity(output.plannable); // Use plannable minutes as the capacity for planning
    setActiveStep('plan');
  }, []);

  // Handle capacity form submission
  const handleCapacitySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setCapacityError(null);

    // Validate inputs
    const error = validateCapacityInputs(capacityInputs);
    if (error) {
      setCapacityError(error);
      return;
    }

    try {
      const result = computeCapacity(capacityInputs);
      setCapacityOutput(result);
      handleCapacityComplete(result);
    } catch (err) {
      setCapacityError('Failed to calculate capacity');
      console.error(err);
    }
  }, [capacityInputs, handleCapacityComplete, validateCapacityInputs]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center">
          <h2 className="font-semibold text-actual mb-4">Loading your plan...</h2>
          <p className="text-muted">Please wait while we load your data.</p>
        </div>
      </div>
    );
  }

  // Render appropriate step based on activeStep
  let content = null;
  switch (activeStep) {
    case 'intake':
      content = (
        <div className="min-h-screen bg-paper">
          {/* Onboarding intake form - reuse existing onboarding page but with navigation to planner */}
          <div className="min-h-screen bg-paper">
            {intake ? (
              <IntakeContext intake={intake} />
            ) : (
              <div className="bg-surface px-6 py-6 mt-6 border border-border-strong">
                <div className="text-center">
                  <h2 className="font-semibold text-actual mb-4">
                    Start with your goal or problem
                  </h2>
                  <p className="text-muted">
                    To begin, tell us what you&apos;d like to change or achieve. We&apos;ll help you turn it into a realistic plan.
                  </p>
                  <div className="text-center">
                    <Button
                      onClick={() => {
                        router.push(ROUTES.ONBOARDING);
                      }}
                    >
                      Start onboarding
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* If we have intake, show the planner steps */}
            {intake && (
              <>
                <main className="flex items-center justify-center flex-1 px-6">
                  {/* Capacity calculator would go here, but we're in intake step */}
                  {/* For now, show a button to proceed to capacity calculation */}
                  <div className="text-center mt-8">
                    <Button
                      onClick={() => {
                        // Move to capacity step with current intake
                        handleIntakeComplete(intake);
                      }}
                    >
                      Calculate Your Capacity
                    </Button>
                  </div>
                </main>
              </>
            )}
          </div>
        </div>
      );

    case 'capacity':
      content = (
        <div className="min-h-screen bg-paper">
          {/* Show intake context */}
          {intake && (
            <IntakeContext intake={intake} />
          )}

          <main className="flex items-center justify-center flex-1 px-6">
            {/* Capacity calculator form */}
            <div className="w-full max-w-xl">
              <h2 className="font-semibold text-actual mb-4">Your Available Capacity</h2>
              {/* Form to input capacity details */}
              <form className="space-y-4" onSubmit={handleCapacitySubmit}>
                <div className="space-y-3">
                  <Label htmlFor="stated-weekly-minutes">
                    Stated Weekly Minutes (available time)
                  </Label>
                  <Input
                    id="stated-weekly-minutes"
                    type="number"
                    min="0"
                    value={capacityInputs.statedWeeklyMinutes.toString()}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      setCapacityInputs(prev => ({
                        ...prev,
                        statedWeeklyMinutes: isNaN(value) ? 0 : value,
                      }));
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="commitment-minutes">
                    Commitment Minutes (fixed commitments)
                  </Label>
                  <Input
                    id="commitment-minutes"
                    type="number"
                    min="0"
                    value={capacityInputs.commitmentMinutes.toString()}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      setCapacityInputs(prev => ({
                        ...prev,
                        commitmentMinutes: isNaN(value) ? 0 : value,
                      }));
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="closed-weeks">
                    Closed Weeks (actual minutes per week, comma-separated)
                  </Label>
                  <Input
                    id="closed-weeks"
                    type="text"
                    value={capacityInputs.closedWeeks.join(',')}
                    onChange={(e) => {
                      const weeks = e.target.value
                        .split(',')
                        .map((v) => v.trim())
                        .filter((v) => v.length > 0)
                        .map((v) => parseInt(v, 10))
                        .filter((v) => !isNaN(v) && v >= 0);
                      setCapacityInputs(prev => ({
                        ...prev,
                        closedWeeks: weeks,
                      }));
                    }}
                  />
                  <p className="text-xs text-muted mt-1">
                    Enter actual minutes for each closed week, separated by commas.
                    Example: 540,600,580
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={capacityInputs.statedWeeklyMinutes < 0 || capacityInputs.commitmentMinutes < 0}
                  >
                    Calculate Capacity
                  </Button>
                </div>
              </form>

              {capacityError && (
                <div className="mt-4 p-4 bg-danger/10 text-danger border border-danger/20 rounded-lg">
                  <p>{capacityError}</p>
                </div>
              )}

              {capacityOutput && (
                <div className="mt-6">
                  <Card>
                    <h3 className="font-semibold text-actual mb-4">Results</h3>
                    <div className="space-y-4">
                      <Stat label="Available Stated Minutes" value={capacityOutput.availableStated} />
                      <Stat label="Observed Weekly Minutes (median)" value={capacityOutput.observedWeeklyMinutes} />
                      <Stat label="Confidence" value={capacityOutput.confidence.toFixed(2)} />
                      <Stat label="Effective Capacity" value={capacityOutput.effectiveCapacity.toFixed(1)} />
                      <Stat label="Plannable Minutes (80% buffer)" value={capacityOutput.plannable.toFixed(1)} />
                    </div>
                    <p className="text-muted mt-4 text-center">
                      Capacity estimation helps determine how much work may realistically fit into your week. It is an input to planning, not a complete weekly plan.
                    </p>
                  </Card>
                </div>
              )}

              {(capacityOutput?.plannable ?? 0) > 0 && (
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      // Move to planning step
                      setActiveStep('plan');
                    }}
                  >
                    Create Your Weekly Plan
                  </Button>
                </div>
              )}

              {(capacityOutput?.plannable ?? 0) <= 0 && (
                <div className="mt-6 p-4 bg-warning/10 border border-warning rounded-lg">
                  <p className="text-warning">
                    Based on your current commitments, you don&apos;t have available time this week.
                    Consider reviewing your commitments or adjusting your goal/timeframe.
                  </p>
                </div>
              )}

              <div className="mt-6">
                <Link href={ROUTES.HOME}>
                  <a className="inline-block text-actual hover:text-underline">
                    ← Back to Home
                  </a>
                </Link>
                <span className="mx-2">|</span>
                <Link href={ROUTES.ONBOARDING}>
                  <a className="inline-block text-muted hover:text-underline">
                    Revise Your Goal
                  </a>
                </Link>
              </div>
            </div>
          </main>
        </div>
      );

    case 'plan':
      content = (
        <div className="min-h-screen bg-paper">
          {/* Show intake context */}
          {intake && (
            <IntakeContext intake={intake} />
          )}

          <main className="flex items-center justify-center flex-1 px-6">
            <div className="w-full max-w-2xl">
              <h2 className="font-semibold text-actual mb-4">Your Weekly Plan</h2>
              {capacity !== null ? (
                <Card>
                  <p className="text-muted mb-2">
                    You have <strong className="text-actual">{capacity}</strong> minutes available each week.
                  </p>
                  {(weeklyPlan?.tasks.length ?? 0) > 0 && (
                    <>
                      <h3 className="font-semibold text-actual mb-3">Planned Tasks ({weeklyPlan?.tasks.length})</h3>
                      <div className="space-y-3">
                        {weeklyPlan?.tasks?.map((task) => (
                          <Card key={task.id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-actual">{task.title}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full
                                ${task.priority === 'high' ? 'bg-error/20 text-error' :
                                  task.priority === 'medium' ? 'bg-warning/20 text-warning' :
                                  'bg-success/20 text-success'}`}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-muted text-sm mb-2">{task.estimatedDurationMinutes} min • {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][task.plannedDay]}</p>
                            {task.description && (
                              <p className="text-muted">{task.description}</p>
                            )}
                          </Card>
                        )) ?? []}
                      </div>
                    </>
                  )}
                  {(weeklyPlan?.tasks.length ?? 0) === 0 && (
                    <p className="text-muted">
                      No tasks planned yet. Add tasks to create your weekly plan.
                    </p>
                  )}
                </Card>
              ) : (
                <p className="text-muted">Calculating your capacity...</p>
              )}

              {/* In a real implementation, this would be a sophisticated planner UI */}
              {/* For now, we'll show a simple form to add tasks */}
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                // In a real app, we would add the task to the weekly plan
                alert("Task added! (This is a placeholder - in a real app, this would add the task to your plan)");
              }}>
                <div className="space-y-3">
                  <Label htmlFor="task-title">
                    Task Title
                  </Label>
                  <Input
                    id="task-title"
                    type="text"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="task-duration">
                      Estimated Duration (minutes)
                    </Label>
                    <Input
                      id="task-duration"
                      type="number"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-priority">
                      Priority
                    </Label>
                    <select
                      id="task-priority"
                      className="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-actual focus:border-actual"
                    >
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-day">
                      Day of Week
                    </Label>
                    <select
                      id="task-day"
                      className="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-actual focus:border-actual"
                    >
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="task-description">
                    Description (optional)
                  </Label>
                  <textarea
                    id="task-description"
                    rows={3}
                    className="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-actual focus:border-actual"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => {
                      // Navigate back to capacity page
                      router.push(ROUTES.CAPACITY);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                  >
                    Add Task to Plan
                  </Button>
                </div>
              </form>

              {(capacity !== null) && (
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      // In a real app, we would validate and save the plan
                      // For now, just show a success message
                      alert("Weekly plan saved! (This is a placeholder - in a real app, this would save your plan)");

                      // Navigate back to capacity page to show plan in context
                      router.push(ROUTES.CAPACITY);
                    }}
                  >
                    Save Weekly Plan
                  </Button>
                </div>
              )}

              <div className="mt-6 text-center text-muted text-sm">
                <p>
                  Your weekly plan helps you allocate your{' '}
                  <strong className="text-actual">{capacity}</strong>{' '}
                  available minutes each week toward your goal.
                </p>
              </div>
            </div>
          </main>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-paper">
      {content}
    </div>
  );
}