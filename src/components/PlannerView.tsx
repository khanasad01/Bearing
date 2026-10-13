'use client';

import React, { useState } from 'react';
import { useCoach } from '../store/coachStore';
import { DayOfWeek, TaskCategory } from '../types/coach';

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export const PlannerView: React.FC = () => {
  const {
    weeklyPlan,
    activeDay,
    setActiveDay,
    setActiveTab,
    goal,
    currentWeekNumber,
    addTask,
  } = useCoach();

  const [addingTaskDay, setAddingTaskDay] = useState<DayOfWeek | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState(45);
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('coding');

  if (!weeklyPlan) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <div className="text-4xl">📋</div>
        <h3 className="font-semibold text-lg text-ink">No Plan Generated Yet</h3>
        <p className="text-sm text-muted">
          Start by telling the coach your goal and constraints in the Onboarding tab.
        </p>
        <button
          onClick={() => setActiveTab('overview')}
          className="rounded-md bg-ink px-4 py-2 text-xs font-medium text-paper"
        >
          Go to Onboarding
        </button>
      </div>
    );
  }

  const { days, totalAllocatedMinutes, plannableCapacityMinutes, deferredTasks } = weeklyPlan;
  const utilizationPercent = Math.min(
    100,
    Math.round((totalAllocatedMinutes / (plannableCapacityMinutes || 1)) * 100)
  );

  const handleAddTaskSubmit = (e: React.FormEvent, day: DayOfWeek) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(day, newTaskTitle, newTaskMinutes, newTaskCategory);
    setAddingTaskDay(null);
    setNewTaskTitle('');
    setNewTaskMinutes(45);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      {/* Top Banner: Goal & Capacity Ledger */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-1 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-pill bg-insight-soft px-2.5 py-0.5 font-mono text-xs font-semibold text-insight">
              Week {currentWeekNumber} Active
            </span>
            <h2 className="font-bold text-lg text-ink">{goal?.title || 'Weekly Execution Goal'}</h2>
          </div>
          {goal?.initialProblemStatement && (
            <p className="text-xs text-muted italic">&ldquo;{goal.initialProblemStatement}&rdquo;</p>
          )}
        </div>

        {/* Capacity Budget Ledger */}
        <div className="rounded-lg border border-border bg-surface-sunken p-4 font-mono text-xs md:w-80">
          <div className="flex justify-between pb-1 text-muted">
            <span>Capacity Budget:</span>
            <span className="font-semibold text-ink">
              {totalAllocatedMinutes}m / {Math.round(plannableCapacityMinutes)}m
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className={`h-full transition-all ${
                utilizationPercent > 95 ? 'bg-danger' : utilizationPercent > 80 ? 'bg-ember' : 'bg-success'
              }`}
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
          <div className="flex justify-between pt-1 text-[11px] text-muted">
            <span>{utilizationPercent}% of Plannable Cap</span>
            <span>20% Buffer Intact</span>
          </div>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
        {(Object.keys(days) as DayOfWeek[]).map((dayKey) => {
          const day = days[dayKey];
          const isSelected = activeDay === dayKey;

          return (
            <div
              key={dayKey}
              onClick={() => setActiveDay(dayKey)}
              className={`flex flex-col rounded-xl border transition-all cursor-pointer p-3.5 space-y-3 ${
                isSelected
                  ? 'border-ink bg-surface shadow-2 ring-2 ring-ink/10'
                  : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <h4 className="font-semibold text-xs text-ink">{DAY_LABELS[dayKey]}</h4>
                  <span className="font-mono text-[10px] text-muted">
                    {day.totalPlannedMinutes} mins
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingTaskDay(dayKey);
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded text-xs text-muted hover:text-ink hover:bg-surface-sunken"
                    title="Add Task"
                  >
                    +
                  </button>
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-ember animate-pulse" title="Active Focus" />
                  )}
                </div>
              </div>

              {/* Add Task Popover for this day */}
              {addingTaskDay === dayKey && (
                <form
                  onSubmit={(e) => handleAddTaskSubmit(e, dayKey)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg border border-border bg-surface-sunken p-2.5 space-y-2 text-xs"
                >
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task name..."
                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-ink"
                    autoFocus
                    required
                  />
                  <div className="flex gap-1.5 font-mono text-[11px]">
                    <input
                      type="number"
                      value={newTaskMinutes}
                      onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                      className="w-14 rounded border border-border bg-surface px-1.5 py-1 text-ink"
                      min={15}
                      max={90}
                    />
                    <select
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
                      className="flex-1 rounded border border-border bg-surface px-1 py-1 text-ink"
                    >
                      <option value="coding">Coding</option>
                      <option value="career">Career</option>
                      <option value="academic">Academic</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setAddingTaskDay(null)}
                      className="px-2 py-0.5 text-muted hover:text-ink text-[10px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded bg-ink px-2 py-0.5 text-[10px] font-semibold text-paper"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              {/* Task list for day */}
              <div className="flex-1 space-y-2">
                {day.tasks.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-[11px] text-muted">
                    Rest / Buffer
                  </div>
                ) : (
                  day.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`rounded-lg border p-2 text-xs space-y-1.5 transition-all ${
                        task.status === 'completed'
                          ? 'border-success/30 bg-success/5 opacity-80'
                          : task.rescheduledCount >= 3
                          ? 'border-danger/40 bg-danger/5'
                          : 'border-plan/30 bg-plan-soft/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-medium text-ink leading-tight line-clamp-2">
                          {task.title}
                        </span>
                        {task.rescheduledCount > 0 && (
                          <span
                            className="shrink-0 rounded bg-ember-soft px-1 py-0.2 font-mono text-[9px] font-bold text-ember-text"
                            title={`Rescheduled ${task.rescheduledCount} times`}
                          >
                            ⤾ {task.rescheduledCount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between font-mono text-[10px] text-muted">
                        <span>{task.plannedMinutes}m</span>
                        <span className="capitalize">{task.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Switch to Execution Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDay(dayKey);
                  setActiveTab('execution');
                }}
                className="w-full rounded border border-border bg-surface-sunken py-1 font-mono text-[10px] text-muted hover:text-ink hover:bg-border transition-colors"
              >
                Execute Day →
              </button>
            </div>
          );
        })}
      </div>

      {/* Deferred Tasks Ledger (Reality Check Protections) */}
      {deferredTasks.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <h3 className="font-semibold text-sm text-ink">
                Protected by Reality Check ({deferredTasks.length} tasks deferred)
              </h3>
            </div>
            <span className="font-mono text-xs text-muted">Overload Prevention</span>
          </div>
          <p className="text-xs text-muted">
            The coach deferred these tasks to next week&apos;s horizon rather than overloading your current week beyond plannable capacity.
          </p>

          <div className="grid gap-2 md:grid-cols-3">
            {deferredTasks.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-border bg-surface-sunken p-2.5 text-xs space-y-1 opacity-70"
              >
                <div className="font-medium text-ink line-clamp-1">{t.title}</div>
                <div className="font-mono text-[10px] text-muted">{t.notes}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
