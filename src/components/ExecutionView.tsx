'use client';

import React, { useState, useEffect } from 'react';
import { useCoach } from '../store/coachStore';
import { DayOfWeek, Task } from '../types/coach';

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const ExecutionView: React.FC = () => {
  const {
    weeklyPlan,
    activeDay,
    setActiveDay,
    updateTaskStatus,
    rescheduleTask,
    recoveryState,
    triggerRecoveryMode,
    exitRecoveryMode,
    addDisruption,
  } = useCoach();

  // Reschedule state
  const [reschedulingTaskId, setReschedulingTaskId] = useState<string | null>(null);
  const [rescheduleToDay, setRescheduleToDay] = useState<DayOfWeek>('tue');
  const [rescheduleReason, setRescheduleReason] = useState<string>('Session felt too long/overwhelming');
  const [actualTimeInputs, setActualTimeInputs] = useState<Record<string, number>>({});

  // Focus Timer state
  const [activeTimerTask, setActiveTimerTask] = useState<Task | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [elapsedTimerSeconds, setElapsedTimerSeconds] = useState<number>(0);

  // Disruption Modal state
  const [showDisruptionModal, setShowDisruptionModal] = useState<boolean>(false);
  const [disruptionMinutes, setDisruptionMinutes] = useState<number>(60);
  const [disruptionNote, setDisruptionNote] = useState<string>('Urgent college assignment / surprise meeting');

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
        setElapsedTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  if (!weeklyPlan) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <h3 className="font-semibold text-lg text-ink">No Active Plan</h3>
        <p className="text-sm text-muted">Generate a weekly plan first in Onboarding.</p>
      </div>
    );
  }

  const currentDay = weeklyPlan.days[activeDay];
  const tasks = currentDay.tasks;

  const handleStartTimer = (task: Task) => {
    setActiveTimerTask(task);
    const targetMins = task.nextAction ? task.nextAction.estimatedMinutes : Math.min(task.plannedMinutes, 45);
    setTimerSecondsLeft(targetMins * 60);
    setElapsedTimerSeconds(0);
    setIsTimerRunning(true);
  };

  const handleFinishTimer = () => {
    if (!activeTimerTask) return;
    const actualMins = Math.max(1, Math.round(elapsedTimerSeconds / 60));
    updateTaskStatus(activeTimerTask.id, activeDay, 'completed', actualMins);
    setIsTimerRunning(false);
    setActiveTimerTask(null);
  };

  const handleMarkComplete = (task: Task) => {
    const actual = actualTimeInputs[task.id] || task.plannedMinutes;
    updateTaskStatus(task.id, activeDay, 'completed', actual);
  };

  const handleRescheduleSubmit = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    rescheduleTask(taskId, activeDay, rescheduleToDay, rescheduleReason);
    setReschedulingTaskId(null);
  };

  const handleDisruptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDisruption(activeDay, disruptionMinutes, disruptionNote);
    setShowDisruptionModal(false);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      {/* Day Selector Ribbon */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border pb-4">
        <div className="flex flex-wrap gap-1.5">
          {ALL_DAYS.map((d) => {
            const isSelected = activeDay === d;
            const dayObj = weeklyPlan.days[d];
            const dayTaskCount = dayObj.tasks.length;
            const completedCount = dayObj.tasks.filter((t) => t.status === 'completed').length;

            return (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-ink text-paper shadow-1'
                    : 'bg-surface border border-border text-muted hover:text-ink hover:border-border-strong'
                }`}
              >
                <span>{DAY_LABELS[d]}</span>
                {dayTaskCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                      isSelected ? 'bg-paper/20 text-paper' : 'bg-surface-sunken text-muted'
                    }`}
                  >
                    {completedCount}/{dayTaskCount}
                  </span>
                )}
                {dayObj.isDisrupted && <span title="Disrupted">⚡</span>}
              </button>
            );
          })}
        </div>

        {/* Action Controls: Disruption & Recovery */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDisruptionModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs font-medium text-ink hover:bg-surface-sunken transition-colors"
            title="Step 5: Reality changes -> Add unexpected delay/meeting"
          >
            <span>⚡</span>
            <span>Add Disruption</span>
          </button>

          {recoveryState.isActive ? (
            <button
              onClick={exitRecoveryMode}
              className="rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs font-semibold text-ink hover:bg-surface-sunken transition-colors"
            >
              ✓ Exit Recovery Mode
            </button>
          ) : (
            <button
              onClick={triggerRecoveryMode}
              className="flex items-center gap-1.5 rounded-md border border-ember bg-ember-soft px-3 py-1.5 font-mono text-xs font-semibold text-ember-text hover:bg-ember hover:text-white transition-colors"
              title="Declare temporary pause: Diagnose -> Simplify -> Protect -> Restart"
            >
              <span>🛡️</span>
              <span>Recovery Mode</span>
            </button>
          )}
        </div>
      </div>

      {/* Disruption Modal */}
      {showDisruptionModal && (
        <form
          onSubmit={handleDisruptionSubmit}
          className="rounded-xl border border-ember bg-ember-soft/20 p-5 shadow-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <h4 className="font-bold text-sm text-ink">
                Step 5: Reality Disruption on {DAY_LABELS[activeDay]}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowDisruptionModal(false)}
              className="text-xs text-muted hover:text-ink"
            >
              ✕ Cancel
            </button>
          </div>
          <p className="text-xs text-muted">
            When reality interferes (unexpected college test, family emergency, or delay), Bearing recalculates remaining days rather than letting guilt compound.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="font-mono text-xs text-muted">Lost Focus Time:</label>
              <select
                value={disruptionMinutes}
                onChange={(e) => setDisruptionMinutes(Number(e.target.value))}
                className="w-full rounded border border-border bg-surface px-3 py-1.5 text-xs text-ink"
              >
                <option value={45}>45 minutes (Slight delay)</option>
                <option value={90}>90 minutes (Meeting / College test)</option>
                <option value={180}>180 minutes (Half day unavailable)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-xs text-muted">Disruption Event:</label>
              <input
                type="text"
                value={disruptionNote}
                onChange={(e) => setDisruptionNote(e.target.value)}
                className="w-full rounded border border-border bg-surface px-3 py-1.5 text-xs text-ink"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="rounded bg-ember px-4 py-2 font-semibold text-xs text-white hover:bg-ember/90 transition-colors"
            >
              Apply Disruption & Recalculate
            </button>
          </div>
        </form>
      )}

      {/* Active Focus Session Timer Widget */}
      {activeTimerTask && (
        <div className="rounded-xl border-2 border-insight bg-surface p-6 shadow-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-insight text-white text-xs font-mono">
                ⏱️
              </span>
              <h4 className="font-bold text-sm text-ink">
                Active Execution Focus: {activeTimerTask.title}
              </h4>
            </div>
            <button
              onClick={() => setActiveTimerTask(null)}
              className="text-xs text-muted hover:text-ink"
            >
              ✕ Exit Focus
            </button>
          </div>

          {/* 2-Minute Kickstart Hero */}
          {activeTimerTask.nextAction && (
            <div className="rounded-lg bg-insight-soft/50 p-4 border border-insight/20 space-y-1.5">
              <span className="font-mono text-[10px] font-bold text-insight uppercase tracking-wider">
                Immediate 2-Minute Physical Kickstart:
              </span>
              <p className="text-sm font-semibold text-ink">
                {activeTimerTask.nextAction.kickoffPrompt}
              </p>
            </div>
          )}

          {/* Timer Display */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="font-mono text-5xl font-black text-ink tracking-tight">
              {formatTimer(timerSecondsLeft)}
            </div>

            <div className="flex items-center gap-2">
              {isTimerRunning ? (
                <button
                  onClick={() => setIsTimerRunning(false)}
                  className="rounded-lg border border-border bg-surface-sunken px-4 py-2 text-xs font-semibold text-ink hover:bg-border"
                >
                  ⏸ Pause
                </button>
              ) : (
                <button
                  onClick={() => setIsTimerRunning(true)}
                  className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-[#232b44]"
                >
                  ▶ Resume
                </button>
              )}
              <button
                onClick={handleFinishTimer}
                className="rounded-lg bg-success px-5 py-2 text-xs font-bold text-white hover:bg-success/90 shadow-1"
              >
                ✓ Finish & Log {Math.max(1, Math.round(elapsedTimerSeconds / 60))}m
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Banner if Active */}
      {recoveryState.isActive && (
        <div className="rounded-xl border border-ember bg-ember-soft/50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <h4 className="font-bold text-sm text-ember-text">Recovery Mode Active</h4>
            <span className="font-mono text-xs text-muted">
              Diagnose → Simplify → Protect → Restart
            </span>
          </div>
          <p className="text-xs text-ink/80 leading-relaxed">
            Catch-up pressure has been halted. Your agenda for today is simplified to a single 45-minute protected block. No backlog guilt.
          </p>
        </div>
      )}

      {/* Daily Task List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base text-ink">
            {DAY_LABELS[activeDay]} Agenda ({tasks.length} tasks)
          </h3>
          <span className="font-mono text-xs text-muted">
            Planned: {currentDay.totalPlannedMinutes}m | Actual: {currentDay.totalActualMinutes}m
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center space-y-2">
            <div className="text-2xl">🌱</div>
            <p className="font-medium text-sm text-ink">No tasks scheduled for {DAY_LABELS[activeDay]}</p>
            <p className="text-xs text-muted">Use this day for recovery or unplanned overflow.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-xl border bg-surface p-5 shadow-1 space-y-4 transition-all ${
                task.status === 'completed'
                  ? 'border-success/30 bg-success/5'
                  : task.rescheduledCount >= 3
                  ? 'border-danger/50 ring-1 ring-danger/20'
                  : 'border-border'
              }`}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        task.category === 'coding'
                          ? 'bg-plan-soft text-plan'
                          : task.category === 'career'
                          ? 'bg-insight-soft text-insight'
                          : 'bg-surface-sunken text-muted'
                      }`}
                    >
                      {task.category}
                    </span>
                    <h4 className="font-semibold text-sm text-ink">{task.title}</h4>
                    {task.rescheduledCount > 0 && (
                      <span className="rounded-pill bg-ember-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-ember-text">
                        Moved {task.rescheduledCount}x
                      </span>
                    )}
                  </div>

                  {task.notes && <p className="text-xs text-muted italic">{task.notes}</p>}
                </div>

                {/* Duration Badge */}
                <div className="flex items-center gap-3 font-mono text-xs">
                  <div className="rounded bg-surface-sunken px-2.5 py-1 text-muted">
                    Planned: <strong className="text-ink">{task.plannedMinutes}m</strong>
                  </div>
                  {task.actualMinutes !== undefined && (
                    <div className="rounded bg-surface-sunken px-2.5 py-1 text-muted">
                      Actual: <strong className="text-ink">{task.actualMinutes}m</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Concrete NextAction with Kickoff Prompt */}
              {task.nextAction && (
                <div className="rounded-lg border border-border bg-surface-sunken p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-ink">
                      Next Action: {task.nextAction.title}
                    </span>
                    <span className="text-muted">~{task.nextAction.estimatedMinutes} mins</span>
                  </div>
                  <div className="flex items-start gap-2 rounded bg-surface p-2 text-xs text-ink/90 border border-border">
                    <span className="font-mono text-insight font-bold">2-Min Kickstart:</span>
                    <span>{task.nextAction.kickoffPrompt}</span>
                  </div>
                </div>
              )}

              {/* Action Controls */}
              {task.status !== 'completed' ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartTimer(task)}
                      className="flex items-center gap-1.5 rounded-lg bg-insight px-3.5 py-1.5 font-semibold text-xs text-white hover:bg-insight/90 transition-colors shadow-1"
                    >
                      <span>⏱️</span>
                      <span>Start Focus Timer</span>
                    </button>

                    <div className="flex items-center gap-1.5 pl-2">
                      <label className="font-mono text-xs text-muted">Actual Mins:</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={actualTimeInputs[task.id] || task.plannedMinutes}
                        onChange={(e) =>
                          setActualTimeInputs({
                            ...actualTimeInputs,
                            [task.id]: Number(e.target.value),
                          })
                        }
                        className="w-16 rounded border border-border-strong bg-surface px-2 py-1 font-mono text-xs text-ink"
                      />
                      <button
                        type="button"
                        onClick={() => handleMarkComplete(task)}
                        className="rounded bg-success px-3 py-1 font-medium text-xs text-white hover:bg-success/90 transition-colors"
                      >
                        ✓ Mark Done
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReschedulingTaskId(task.id)}
                      className="rounded border border-border bg-surface-sunken px-3 py-1 font-mono text-xs text-muted hover:text-ink hover:border-border-strong transition-colors"
                    >
                      ⤾ Reschedule Task
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 font-mono text-xs text-success border-t border-border pt-2">
                  <span>✓ Completed</span>
                  <span>(Logged {task.actualMinutes || task.plannedMinutes}m actual execution)</span>
                </div>
              )}

              {/* Reschedule Modal / Panel */}
              {reschedulingTaskId === task.id && (
                <form
                  onSubmit={(e) => handleRescheduleSubmit(e, task.id)}
                  className="rounded-lg border border-ember bg-ember-soft/30 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-xs text-ember-text">
                      Reschedule &ldquo;{task.title}&rdquo;
                    </h5>
                    <button
                      type="button"
                      onClick={() => setReschedulingTaskId(null)}
                      className="text-xs text-muted hover:text-ink"
                    >
                      ✕ Cancel
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="font-mono text-[11px] text-muted">Move to day:</label>
                      <select
                        value={rescheduleToDay}
                        onChange={(e) => setRescheduleToDay(e.target.value as DayOfWeek)}
                        className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-ink"
                      >
                        {ALL_DAYS.filter((d) => d !== activeDay).map((d) => (
                          <option key={d} value={d}>
                            {DAY_LABELS[d]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[11px] text-muted">Reason for delay:</label>
                      <input
                        type="text"
                        value={rescheduleReason}
                        onChange={(e) => setRescheduleReason(e.target.value)}
                        placeholder="Why couldn't this happen today?"
                        className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-ink"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <p className="text-[11px] text-muted">
                      {task.rescheduledCount >= 2 && (
                        <strong className="text-danger">
                          Warning: This will be the 3rd reschedule. Coach will stop and diagnose root cause.
                        </strong>
                      )}
                    </p>
                    <button
                      type="submit"
                      className="rounded bg-ember px-3.5 py-1 font-medium text-xs text-white hover:bg-ember/90 transition-colors"
                    >
                      Confirm Reschedule
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
