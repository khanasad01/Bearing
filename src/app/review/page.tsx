'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import {
  loadWeeklyPlan,
  saveWeeklyPlan,
  getWeekStartDate,
  type WeeklyPlan,
  type WeeklyPlanTask,
} from '@/lib/weekly-plan-storage';
import {
  loadWeeklyReview,
  saveWeeklyReview,
  createEmptyWeeklyReview,
  type WeeklyReview,
} from '@/lib/weekly-review-storage';
import type { ExecutionStatus } from '@/lib/execution-storage';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type TaskPriority = 'high' | 'medium' | 'low';

interface TaskDraft {
  title: string;
  description?: string;
  estimatedDurationMinutes: number;
  priority: TaskPriority;
  plannedDay: number;
}

function getStatusClass(status: ExecutionStatus | undefined): string {
  switch (status) {
    case 'completed':
      return 'bg-success';
    case 'partial':
      return 'bg-warning';
    case 'missed':
      return 'bg-error';
    case 'not-started':
      return 'bg-muted';
    default:
      return 'bg-border-strong/50';
  }
}

// Calculate coach inferences based on the review data
function calculateCoachInferences(review: WeeklyReview): string[] {
  const inferences: string[] = [];

  if (!review.plannedTasks || review.plannedTasks.length === 0) {
    return inferences;
  }

  // 1. Check if planned time consistently exceeds actual time
  let totalPlannedMinutes = 0;
  let totalActualMinutes = 0;
  let tasksWithMissingData = 0;

  for (const task of review.plannedTasks) {
    totalPlannedMinutes += task.estimatedDurationMinutes;
    if (task.actualDurationMinutes !== undefined) {
      totalActualMinutes += task.actualDurationMinutes;
    } else {
      tasksWithMissingData++;
    }
  }

  if (totalActualMinutes > 0) {
    const ratio = totalPlannedMinutes / totalActualMinutes;
    if (ratio > 1.2) {
      inferences.push(
        `You planned ${totalPlannedMinutes} minutes of work but only recorded ${totalActualMinutes} minutes of execution. ` +
          `Consider adjusting your time estimates for future weeks.`
      );
    } else if (ratio < 0.8) {
      inferences.push(
        `You recorded ${totalActualMinutes} minutes of execution but only planned for ${totalPlannedMinutes} minutes. ` +
          `You may have capacity for more work than you planned.`
      );
    }
  }

  // 2. Check for incomplete tasks
  const incompleteTasks = review.plannedTasks.filter(
    (task) =>
      task.executionStatus === 'not-started' ||
      task.executionStatus === 'partial'
  );
  if (incompleteTasks.length > 0) {
    const taskNames = incompleteTasks.map((t) => t.title).join(', ');
    inferences.push(
      `The following tasks were not completed or only partially completed: ${taskNames}. ` +
        `Consider breaking them down into smaller steps or allocating more time.`
    );
  }

  // 3. Check for tasks with missing execution data
  if (tasksWithMissingData > 0) {
    inferences.push(
      `${tasksWithMissingData} tasks have no execution data recorded. ` +
        `Make sure to track your work daily to get accurate insights.`
    );
  }

  // 4. Check completion rate
  const completedCount = review.plannedTasks.filter(
    (task) => task.executionStatus === 'completed'
  ).length;
  const completionRate =
    review.plannedTasks.length > 0
      ? (completedCount / review.plannedTasks.length) * 100
      : 0;

  if (completionRate < 50) {
    inferences.push(
      `Your completion rate was ${completionRate.toFixed(0)}%. ` +
        `This suggests your plans may be too ambitious or you're facing unexpected obstacles.`
    );
  } else if (completionRate > 80) {
    inferences.push(
      `Your completion rate was ${completionRate.toFixed(0)}%. ` +
        `You're consistently achieving your goals - consider setting slightly more challenging targets.`
    );
  }

  return inferences;
}

export default function ReviewPage() {
  const router = useRouter();
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekStartDate, setWeekStartDate] = useState<string>('');
  const [nextWeekStartDate, setNextWeekStartDate] = useState<string>('');

  // For replanning
  const [carryForwardTasks, setCarryForwardTasks] = useState<string[]>([]); // task IDs to carry forward
  const [editedTasks, setEditedTasks] = useState<Record<string, TaskDraft>>({});
  const [newTasks, setNewTasks] = useState<TaskDraft[]>([]);
  const [showReplanModal, setShowReplanModal] = useState(false);
  const [replanError, setReplanError] = useState<string | null>(null);
  const [replanSuccess, setReplanSuccess] = useState(false);

  const loadData = useCallback(async (startDate: string) => {
    setLoading(true);
    setError(null);
    try {
      // Load weekly plan for the current week
      const plan = loadWeeklyPlan(startDate);
      setWeeklyPlan(plan);

      // Load or create weekly review for the current week
      const review = loadWeeklyReview(startDate);
      if (review && review.weekStartDate === startDate) {
        setWeeklyReview(review);
      } else {
        const newReview = await createEmptyWeeklyReview();
        setWeeklyReview(newReview);
      }
    } catch (err) {
      console.error('Failed to load review data:', err);
      setError('Failed to load review data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initialize week start dates, then load data for that week
    const currentWeekStartDate = getWeekStartDate(new Date());
    setWeekStartDate(currentWeekStartDate);

    const nextWeekStart = new Date(currentWeekStartDate);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    setNextWeekStartDate(getWeekStartDate(nextWeekStart));

    loadData(currentWeekStartDate);
  }, [loadData]);

  // Save the user's answers to the review questions
  const saveReviewAnswers = (
    whatWentWell: string,
    whatPrevented: string,
    whatShouldChange: string
  ) => {
    if (!weeklyReview) return;

    const updatedReview = {
      ...weeklyReview,
      userAnswers: {
        whatWentWell,
        whatPrevented,
        whatShouldChange,
      },
      updatedAt: new Date().toISOString(),
    };

    if (saveWeeklyReview(updatedReview, weekStartDate)) {
      setWeeklyReview(updatedReview);
    } else {
      setError('Failed to save review answers.');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const whatWentWell = (form.elements.namedItem('whatWentWell') as HTMLTextAreaElement).value;
    const whatPrevented = (form.elements.namedItem('whatPrevented') as HTMLTextAreaElement).value;
    const whatShouldChange = (form.elements.namedItem('whatShouldChange') as HTMLTextAreaElement).value;
    saveReviewAnswers(whatWentWell, whatPrevented, whatShouldChange);
  };

  // Replan helpers
  const openReplanModal = () => {
    setReplanError(null);
    setReplanSuccess(false);
    setShowReplanModal(true);
  };

  const closeReplanModal = () => {
    setShowReplanModal(false);
    setCarryForwardTasks([]);
    setEditedTasks({});
    setNewTasks([]);
    setReplanError(null);
  };

  const updateEditedTask = (
    taskId: string,
    base: TaskDraft,
    patch: Partial<TaskDraft>
  ) => {
    setEditedTasks((prev) => ({
      ...prev,
      [taskId]: { ...(prev[taskId] ?? base), ...patch },
    }));
  };

  const updateNewTask = (index: number, patch: Partial<TaskDraft>) => {
    setNewTasks((prev) =>
      prev.map((task, i) => (i === index ? { ...task, ...patch } : task))
    );
  };

  // Handle saving the replanned week
  const handleSaveReplan = () => {
    setReplanError(null);

    const now = new Date().toISOString();
    const planId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Carried forward tasks (edited version if it exists, otherwise original)
    const carriedForwardPlanTasks: WeeklyPlanTask[] = [];
    for (const taskId of carryForwardTasks) {
      const originalTask = weeklyPlan?.tasks.find((t) => t.id === taskId);
      if (!originalTask) continue;
      const source: TaskDraft = editedTasks[taskId] ?? originalTask;
      carriedForwardPlanTasks.push({
        id: originalTask.id,
        title: source.title,
        description: source.description,
        estimatedDurationMinutes: source.estimatedDurationMinutes,
        priority: source.priority,
        plannedDay: source.plannedDay,
      });
    }

    // New tasks
    const newPlanTasks: WeeklyPlanTask[] = newTasks.map((task, index) => ({
      id: `new-task-${Date.now()}-${index}`,
      title: task.title,
      description: task.description,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      priority: task.priority,
      plannedDay: task.plannedDay,
    }));

    const allTasks = [...carriedForwardPlanTasks, ...newPlanTasks];

    if (allTasks.length === 0) {
      setReplanError('Select or add at least one task for next week.');
      return;
    }
    if (allTasks.some((task) => task.title.trim() === '')) {
      setReplanError('Every task needs a title.');
      return;
    }

    const newPlan: WeeklyPlan = {
      version: 1,
      planId,
      weekStartDate: nextWeekStartDate,
      intakeId: undefined, // No intake link for a carried forward plan
      tasks: allTasks,
      createdAt: now,
      updatedAt: now,
    };

    if (saveWeeklyPlan(newPlan, nextWeekStartDate)) {
      closeReplanModal();
      setReplanSuccess(true);
    } else {
      setReplanError('Failed to save the new weekly plan.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center">
          <h2 className="font-semibold text-actual mb-4">Loading your review...</h2>
          <p className="text-muted">Please wait while we load your data.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="bg-surface px-6 py-6 mt-6 border border-border-strong">
          <div className="text-center">
            <h2 className="font-semibold text-actual mb-4">Error loading review</h2>
            <p className="text-muted">{error}</p>
            <div className="mt-6">
              <Button
                variant="primary"
                className="px-6 py-3"
                onClick={() => {
                  loadData(weekStartDate);
                }}
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!weeklyPlan) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="bg-surface px-6 py-6 mt-6 border border-border-strong">
          <div className="text-center">
            <h2 className="font-semibold text-actual mb-4">No weekly plan found for this week</h2>
            <p className="text-muted">
              Please create a weekly plan first in the planning section.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                className="px-6 py-3"
                onClick={() => {
                  router.push('/plan');
                }}
              >
                Go to planning
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const replanTasks = weeklyPlan.tasks ?? [];
  const reviewTasks = weeklyReview?.plannedTasks ?? [];
  const plannedMinutes = reviewTasks.reduce(
    (sum, t) => sum + t.estimatedDurationMinutes,
    0
  );
  const actualMinutes = reviewTasks.reduce(
    (sum, t) => sum + (t.actualDurationMinutes ?? 0),
    0
  );
  const coachInferences = weeklyReview
    ? calculateCoachInferences(weeklyReview)
    : [];

  return (
    <div className="min-h-screen bg-paper">
      {/* Header with Bearing Mark and navigation */}
      <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {/* Bearing Mark (unoptimized: next/image rejects SVG otherwise) */}
            <Image
              src="/bearing-mark.svg"
              alt="Bearing"
              width={32}
              height={32}
              unoptimized
              className="h-8 w-auto text-muted"
            />
          </div>
          <div>
            <h2 className="font-semibold text-actual mb-1">Weekly Review</h2>
            <p className="text-muted text-sm">
              Reviewing the week of{' '}
              {new Date(weekStartDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}{' '}
              to{' '}
              {new Date(
                new Date(weekStartDate).getTime() + 6 * 24 * 60 * 60 * 1000
              ).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly plan context */}
      <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
        <div className="flex-1">
          <h2 className="font-semibold text-actual mb-2">Your weekly plan</h2>
          <div className="text-muted text-sm space-y-1">
            <p>
              <strong>Weekly tasks:</strong> {replanTasks.length} planned
            </p>
            {replanTasks.length > 0 && (
              <>
                <p className="mt-1">
                  <strong>Planned time:</strong>{' '}
                  {replanTasks.reduce((sum, task) => sum + task.estimatedDurationMinutes, 0)} minutes
                </p>
                <p className="text-xs">
                  {[...replanTasks]
                    .sort((a, b) => a.plannedDay - b.plannedDay)
                    .map(
                      (task) =>
                        DAY_NAMES[task.plannedDay] +
                        ': ' +
                        task.title +
                        ' (' +
                        task.estimatedDurationMinutes +
                        ' min)'
                    )
                    .join(', ')}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Review content */}
      <main className="flex-1 px-6">
        {replanSuccess && (
          <p className="mb-6 text-sm text-success" role="status">
            Next week&apos;s plan saved.
          </p>
        )}

        {weeklyReview ? (
          <>
            <div className="mb-6 flex justify-end">
              <Button
                variant="secondary"
                className="px-4 py-2"
                onClick={openReplanModal}
              >
                Replan next week
              </Button>
            </div>

            {/* Review summary */}
            <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
              <h2 className="font-semibold text-actual mb-2">Review Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <h3 className="font-medium text-actual mb-2">Completed</h3>
                  <p className="text-2xl font-bold text-success">
                    {reviewTasks.filter((t) => t.executionStatus === 'completed').length}/{reviewTasks.length}
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-actual mb-2">Partial</h3>
                  <p className="text-2xl font-bold text-warning">
                    {reviewTasks.filter((t) => t.executionStatus === 'partial').length}
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-actual mb-2">Missed</h3>
                  <p className="text-2xl font-bold text-error">
                    {reviewTasks.filter((t) => t.executionStatus === 'missed').length}
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-actual mb-2">Not Started</h3>
                  <p className="text-2xl font-bold text-muted">
                    {reviewTasks.filter((t) => t.executionStatus === 'not-started').length}
                  </p>
                </div>
              </div>

              {/* Time comparison */}
              <div className="bg-surface p-4 rounded-lg">
                <h3 className="font-semibold text-actual mb-2">Time Analysis</h3>
                <div className="space-y-2">
                  <p className="text-muted">
                    <strong>Planned time:</strong> {plannedMinutes} minutes
                  </p>
                  <p className="text-muted">
                    <strong>Actual time:</strong> {actualMinutes} minutes
                  </p>
                  <p className="text-muted">
                    {plannedMinutes > actualMinutes ? '(overestimated)' : '(underestimated)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Task details */}
            <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
              <h2 className="font-semibold text-actual mb-2">Task Details</h2>
              <div className="space-y-4">
                {reviewTasks.map((task) => {
                  const dayName = DAY_NAMES[task.plannedDay];
                  return (
                    <div
                      key={task.id}
                      className="border border-border-strong rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-actual">{task.title}</h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              task.priority === 'high'
                                ? 'bg-error/20 text-error'
                                : task.priority === 'medium'
                                  ? 'bg-warning/20 text-warning'
                                  : 'bg-success/20 text-success'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-muted text-sm mb-2">
                          {task.estimatedDurationMinutes} min • {dayName}
                        </p>
                        {task.description && (
                          <p className="text-muted">{task.description}</p>
                        )}

                        {/* Execution status for the week */}
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <div
                              aria-hidden="true"
                              className={`h-3 w-3 rounded-full inline-block ${getStatusClass(task.executionStatus)}`}
                            ></div>
                            <span className="text-sm">
                              {task.executionStatus ?? 'No data'}
                            </span>
                          </div>
                        </div>

                        {/* Daily breakdown */}
                        {task.executionRecords && task.executionRecords.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-actual mb-2">Daily breakdown</h4>
                            <div className="space-y-2">
                              {task.executionRecords.map((record) => {
                                const date = new Date(record.date);
                                const recordDayName = DAY_NAMES[date.getDay()];
                                return (
                                  <div
                                    key={record.date}
                                    className="flex items-center space-x-2 text-sm"
                                  >
                                    <div
                                      aria-hidden="true"
                                      className={`h-2 w-2 rounded-full inline-block ${getStatusClass(record.status)}`}
                                    ></div>
                                    <span>{recordDayName}: </span>
                                    <span className="font-mono">
                                      {record.status}
                                      {record.actualDurationMinutes !== undefined
                                        ? ' (' + record.actualDurationMinutes + ' min)'
                                        : ''}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {task.notes && (
                          <div className="mt-2">
                            <span className="block text-xs text-muted mb-1">Notes</span>
                            <p className="text-muted">{task.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User answers */}
            <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
              <h2 className="font-semibold text-actual mb-2">Your Reflections</h2>
              {weeklyReview.userAnswers ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-actual mb-2">What went well?</h3>
                    <p className="text-muted">{weeklyReview.userAnswers.whatWentWell}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-actual mb-2">
                      What prevented planned tasks from getting done?
                    </h3>
                    <p className="text-muted">{weeklyReview.userAnswers.whatPrevented}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-actual mb-2">
                      What should change next week?
                    </h3>
                    <p className="text-muted">{weeklyReview.userAnswers.whatShouldChange}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted">
                  You haven&apos;t saved your reflections yet. Use the form below to add them.
                </p>
              )}
            </div>

            {/* Coach inferences */}
            {coachInferences.length > 0 && (
              <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
                <h2 className="font-semibold text-actual mb-2">Coach Observations</h2>
                <p className="text-muted">
                  Note: These are automated observations based on your data. They are not definitive conclusions.
                </p>
                <div className="space-y-2">
                  {coachInferences.map((inference, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-muted">• </span>
                      <span>{inference}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form to save user answers */}
            <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
              <h2 className="font-semibold text-actual mb-2">Save Your Reflections</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-3">
                  <label
                    htmlFor="whatWentWell"
                    className="block text-sm font-medium text-actual mb-1"
                  >
                    What went well?
                  </label>
                  <textarea
                    id="whatWentWell"
                    name="whatWentWell"
                    rows={3}
                    className="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-actual focus:border-actual"
                    defaultValue={weeklyReview.userAnswers?.whatWentWell ?? ''}
                  />
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="whatPrevented"
                    className="block text-sm font-medium text-actual mb-1"
                  >
                    What prevented planned tasks from getting done?
                  </label>
                  <textarea
                    id="whatPrevented"
                    name="whatPrevented"
                    rows={3}
                    className="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-actual focus:border-actual"
                    defaultValue={weeklyReview.userAnswers?.whatPrevented ?? ''}
                  />
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="whatShouldChange"
                    className="block text-sm font-medium text-actual mb-1"
                  >
                    What should change next week?
                  </label>
                  <textarea
                    id="whatShouldChange"
                    name="whatShouldChange"
                    rows={3}
                    className="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-actual focus:border-actual"
                    defaultValue={weeklyReview.userAnswers?.whatShouldChange ?? ''}
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                  <Button
                    variant="ghost"
                    className="px-4 py-2"
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.form?.reset();
                    }}
                  >
                    Reset
                  </Button>
                  <Button variant="primary" className="px-4 py-2" type="submit">
                    Save Reflections
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="bg-surface px-6 py-6">
            <div className="text-center">
              <h2 className="font-semibold text-actual mb-4">No review data found</h2>
              <p className="text-muted">
                Create a review for this week to see your reflections and insights.
              </p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  className="px-6 py-3"
                  onClick={() => {
                    // Navigate to execute page to track this week's tasks
                    router.push('/execute');
                  }}
                >
                  Track This Week&apos;s Tasks
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Replanning Modal */}
      {showReplanModal && (
        <div
          className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Replan for next week"
        >
          <div className="bg-surface max-w-2xl w-full mx-4 p-6 rounded-lg border border-border-strong max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-semibold text-actual mb-2">Replan for Next Week</h2>
              <Button
                variant="ghost"
                className="text-muted hover:text-actual p-0"
                aria-label="Close"
                onClick={closeReplanModal}
              >
                ×
              </Button>
            </div>

            <div className="space-y-6">
              {/* Carried Forward Tasks */}
              <div>
                <h3 className="font-semibold text-actual mb-2">Carry Forward Unfinished Tasks</h3>
                <p className="text-sm text-muted mb-2">
                  Select tasks from this week that you want to move to next week&apos;s plan.
                </p>
                <div className="space-y-2">
                  {replanTasks.map((task) => {
                    const isSelected = carryForwardTasks.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        className="flex items-start space-x-3 p-3 border border-border-strong rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            id={`carry-${task.id}`}
                            aria-label={`Carry forward ${task.title}`}
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCarryForwardTasks([...carryForwardTasks, task.id]);
                              } else {
                                setCarryForwardTasks(
                                  carryForwardTasks.filter((id) => id !== task.id)
                                );
                              }
                            }}
                            className="h-4 w-4 text-actual"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="font-medium text-actual">{task.title}</h4>
                          <p className="text-muted text-sm">
                            {task.estimatedDurationMinutes} min • {DAY_NAMES[task.plannedDay]}
                          </p>
                          {task.description && (
                            <p className="text-muted text-sm">{task.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {replanTasks.length === 0 && (
                    <p className="text-muted text-center py-4">No tasks to carry forward.</p>
                  )}
                </div>
              </div>

              {/* Edit Carried Forward Tasks */}
              {carryForwardTasks.length > 0 && (
                <div>
                  <h3 className="font-semibold text-actual mb-2">Edit Carried Forward Tasks</h3>
                  <p className="text-sm text-muted mb-2">
                    Modify any carried forward tasks as needed for next week.
                  </p>
                  <div className="space-y-2">
                    {carryForwardTasks.map((taskId) => {
                      const originalTask = replanTasks.find((t) => t.id === taskId);
                      if (!originalTask) return null;
                      const edited: TaskDraft = editedTasks[taskId] ?? originalTask;

                      return (
                        <div
                          key={taskId}
                          className="p-3 border border-border-strong rounded-lg space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-actual">{edited.title}</h4>
                            <span className="px-2 py-1 text-xs rounded-full">
                              {edited.priority}
                            </span>
                          </div>
                          <p className="text-muted text-sm">
                            {edited.estimatedDurationMinutes} min • {DAY_NAMES[edited.plannedDay]}
                          </p>

                          {/* Edit controls */}
                          <div className="mt-3 pt-2 border-t border-border-strong space-y-2">
                            <div>
                              <label
                                htmlFor={`edit-title-${taskId}`}
                                className="block text-xs text-muted mb-1"
                              >
                                Title
                              </label>
                              <input
                                id={`edit-title-${taskId}`}
                                type="text"
                                value={edited.title}
                                onChange={(e) =>
                                  updateEditedTask(taskId, originalTask, {
                                    title: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-border-strong rounded bg-surface"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`edit-minutes-${taskId}`}
                                className="block text-xs text-muted mb-1"
                              >
                                Estimated Time (minutes)
                              </label>
                              <input
                                id={`edit-minutes-${taskId}`}
                                type="number"
                                min="0"
                                value={edited.estimatedDurationMinutes}
                                onChange={(e) =>
                                  updateEditedTask(taskId, originalTask, {
                                    estimatedDurationMinutes:
                                      e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                                  })
                                }
                                className="w-full px-3 py-2 border border-border-strong rounded bg-surface"
                              />
                            </div>
                            <div className="flex space-x-3">
                              <div className="flex-1">
                                <label
                                  htmlFor={`edit-priority-${taskId}`}
                                  className="block text-xs text-muted mb-1"
                                >
                                  Priority
                                </label>
                                <select
                                  id={`edit-priority-${taskId}`}
                                  value={edited.priority}
                                  onChange={(e) =>
                                    updateEditedTask(taskId, originalTask, {
                                      priority: e.target.value as TaskPriority,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-border-strong rounded bg-surface"
                                >
                                  <option value="high">High</option>
                                  <option value="medium">Medium</option>
                                  <option value="low">Low</option>
                                </select>
                              </div>
                              <div className="flex-1">
                                <label
                                  htmlFor={`edit-day-${taskId}`}
                                  className="block text-xs text-muted mb-1"
                                >
                                  Planned Day
                                </label>
                                <select
                                  id={`edit-day-${taskId}`}
                                  value={edited.plannedDay}
                                  onChange={(e) =>
                                    updateEditedTask(taskId, originalTask, {
                                      plannedDay: parseInt(e.target.value, 10),
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-border-strong rounded bg-surface"
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add New Tasks */}
              <div>
                <h3 className="font-semibold text-actual mb-2">Add New Tasks</h3>
                <p className="text-sm text-muted mb-2">
                  Add new tasks for next week&apos;s plan.
                </p>
                <div className="space-y-4">
                  {newTasks.map((task, index) => (
                    <div
                      key={index}
                      className="p-3 border border-border-strong rounded-lg space-y-2"
                    >
                      <div>
                        <label
                          htmlFor={`new-title-${index}`}
                          className="block text-xs text-muted mb-1"
                        >
                          Title
                        </label>
                        <input
                          id={`new-title-${index}`}
                          type="text"
                          value={task.title}
                          onChange={(e) => updateNewTask(index, { title: e.target.value })}
                          className="w-full px-3 py-2 border border-border-strong rounded bg-surface"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`new-minutes-${index}`}
                          className="block text-xs text-muted mb-1"
                        >
                          Estimated Time (minutes)
                        </label>
                        <input
                          id={`new-minutes-${index}`}
                          type="number"
                          min="0"
                          value={task.estimatedDurationMinutes}
                          onChange={(e) =>
                            updateNewTask(index, {
                              estimatedDurationMinutes:
                                e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full px-3 py-2 border border-border-strong rounded bg-surface"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <div className="flex-1">
                          <label
                            htmlFor={`new-priority-${index}`}
                            className="block text-xs text-muted mb-1"
                          >
                            Priority
                          </label>
                          <select
                            id={`new-priority-${index}`}
                            value={task.priority}
                            onChange={(e) =>
                              updateNewTask(index, {
                                priority: e.target.value as TaskPriority,
                              })
                            }
                            className="w-full px-3 py-2 border border-border-strong rounded bg-surface"
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label
                            htmlFor={`new-day-${index}`}
                            className="block text-xs text-muted mb-1"
                          >
                            Planned Day
                          </label>
                          <select
                            id={`new-day-${index}`}
                            value={task.plannedDay}
                            onChange={(e) =>
                              updateNewTask(index, {
                                plannedDay: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full px-3 py-2 border border-border-strong rounded bg-surface"
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

                      {/* Remove button */}
                      <div className="mt-2">
                        <Button
                          variant="ghost"
                          className="text-sm text-muted hover:text-actual underline p-0"
                          onClick={() => {
                            setNewTasks(newTasks.filter((_, i) => i !== index));
                          }}
                        >
                          Remove task
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      className="px-4 py-2"
                      onClick={() => {
                        setNewTasks([
                          ...newTasks,
                          {
                            title: '',
                            description: '',
                            estimatedDurationMinutes: 0,
                            priority: 'medium',
                            plannedDay: 1,
                          },
                        ]);
                      }}
                    >
                      <span className="mr-2">+</span>
                      Add New Task
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div>
                {replanError && (
                  <p className="mb-2 text-sm text-error" role="alert">
                    {replanError}
                  </p>
                )}
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="ghost"
                    className="px-4 py-2"
                    onClick={closeReplanModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="px-4 py-2"
                    onClick={handleSaveReplan}
                  >
                    Save Plan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}