'use client';

import { useState } from 'react';
import { loadWeeklyPlan, WeeklyPlan, WeeklyPlanTask } from '@/lib/weekly-plan-storage';
import {
  loadExecutionDayRecord,
  saveExecutionDayRecord,
  ExecutionStatus,
  ExecutionDayRecord,
  ExecutionTaskRecord,
} from '@/lib/execution-storage';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Stat from '@/components/ui/Stat';

interface Summary {
  completedCount: number;
  partialCount: number;
  missedCount: number;
  totalTasks: number;
  totalPlannedMinutes: number;
  totalActualMinutes: number;
}

function computeSummary(tasks: WeeklyPlanTask[], records: ExecutionTaskRecord[]): Summary {
  let completedCount = 0;
  let partialCount = 0;
  let missedCount = 0;
  let totalPlannedMinutes = 0;
  let totalActualMinutes = 0;

  for (const task of tasks) {
    totalPlannedMinutes += task.estimatedDurationMinutes;
    const record = records.find(record => record.taskId === task.id);
    if (record && record.status === 'completed') {
      completedCount += 1;
      totalActualMinutes += record.actualDurationMinutes ?? 0;
    } else if (record && record.status === 'partial') {
      partialCount += 1;
      totalActualMinutes += record.actualDurationMinutes ?? 0;
    } else if (record && record.status === 'missed') {
      missedCount += 1;
    }
  }

  return {
    completedCount,
    partialCount,
    missedCount,
    totalTasks: tasks.length,
    totalPlannedMinutes,
    totalActualMinutes,
  };
}

export default function ExecutePage() {
  const router = useRouter();
  const [weekStartDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day;
      const sunday = new Date(today.setDate(diff));
      return sunday.toISOString().split('T')[0];
    }
    return '';
  });

  const [todayDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new Date().toISOString().split('T')[0];
    }
    return '';
  });

  const [weeklyPlan] = useState<WeeklyPlan | null>(() => {
    if (typeof window === 'undefined') return null;
    return loadWeeklyPlan(weekStartDate) ?? null;
  });
  const [executionRecord, setExecutionRecord] = useState<ExecutionDayRecord | null>(() => {
    if (typeof window === 'undefined' || !todayDate) return null;
    const record = loadExecutionDayRecord(todayDate);
    return record ?? null;
  });
  const [todayError, setTodayError] = useState<string | null>(null);

  const summary = weeklyPlan ? computeSummary(weeklyPlan.tasks, executionRecord?.records ?? []) : null;

  const handleSaveRecord = (): void => {
    if (typeof window === 'undefined' || !todayDate || !weeklyPlan) return;

    const existing = loadExecutionDayRecord(todayDate);
    const records = existing?.records ?? [];
    const existingById = new Map(records.map(r => [r.taskId, r]));

    const nextRecords: ExecutionTaskRecord[] = weeklyPlan.tasks.map(task => {
      const existing = existingById.get(task.id);
      if (existing) return existing;
      return {
        taskId: task.id,
        status: 'not-started',
        actualDurationMinutes: undefined,
        notes: undefined,
      };
    });

    const recordToSave: ExecutionDayRecord = {
      version: 1,
      date: todayDate,
      weekStartDate,
      records: nextRecords,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (saveExecutionDayRecord(recordToSave)) {
      setExecutionRecord(recordToSave);
      setTodayError(null);
    } else {
      setTodayError('Failed to save today\'s execution record.');
    }
  };

  const doesRecordExist = !!executionRecord;

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Image src="/favicon.svg" alt="Bearing" width={32} height={32} />
          <div>
            <h1 className="text-2xl font-bold text-actual">Execute</h1>
            <p className="text-muted">{weeklyPlan ? `Task for week of ${weekStartDate}` : 'No weekly plan loaded.'}</p>
          </div>
        </div>

        {!weeklyPlan ? (
          <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
            <p className="text-muted">No weekly plan found for this week. Please create a plan in the Planning section first.</p>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => router.push('/plan')}
              >
                Back to Planning
              </Button>
            </div>
          </div>
        ) : (
          <>
            {!doesRecordExist && (
              <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
                {todayError && (
                  <p className="text-error mb-4">{todayError}</p>
                )}
                <p className="text-muted">No execution record for today yet.</p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    onClick={handleSaveRecord}
                  >
                    Create execution record
                  </Button>
                </div>
              </div>
            )}

            {summary && (
              <div className="bg-surface px-6 py-4 mb-6 border border-border-strong">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Stat
                    label="Completed"
                    value={`${summary.completedCount}/${summary.totalTasks}`}
                    isPrimary
                  />
                  <Stat
                    label="Partial"
                    value={summary.partialCount}
                  />
                  <Stat
                    label="Missed"
                    value={summary.missedCount}
                  />
                  <Stat
                    label="Time"
                    value={`${summary.totalActualMinutes} / ${summary.totalPlannedMinutes} min`}
                    subtext={summary.totalActualMinutes < summary.totalPlannedMinutes ? `${summary.totalPlannedMinutes - summary.totalActualMinutes} min remaining` : undefined}
                  />
                </div>
              </div>
            )}

            {/* Task list */}
            <div className="space-y-4">
              {weeklyPlan.tasks.map(task => {
                const record = executionRecord?.records.find(r => r.taskId === task.id);
                const status: ExecutionStatus = record?.status ?? 'not-started';
                const actualMinutes = record?.actualDurationMinutes ?? 0;
                const notes = record?.notes ?? '';

                return (
                  <div key={task.id} className="bg-surface border border-border-strong rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-actual">{task.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            status === 'completed'
                              ? 'bg-success/15 text-success'
                              : status === 'partial'
                              ? 'bg-warning/15 text-warning'
                              : status === 'missed'
                              ? 'bg-error/15 text-error'
                              : 'bg-muted/15 text-muted'
                          }`}>
                            {status.replace('-', ' ')}
                          </span>
                        </div>
                        {task.description && <p className="text-muted mt-1">{task.description}</p>}
                        <p className="text-sm text-muted mt-1">
                          Planned: {task.estimatedDurationMinutes} min · Priority: {task.priority}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <label className="text-xs text-muted">Actual (min)</label>
                        <input
                          type="number"
                          value={actualMinutes}
                          onChange={e => {
                            const val = Number(e.target.value);
                            const next = Number.isFinite(val) && val >= 0 ? val : 0;
                            const nextRecord: ExecutionDayRecord = {
                              ...executionRecord!,
                              records: executionRecord!.records.map(r =>
                                r.taskId === task.id
                                  ? { ...r, actualDurationMinutes: next, status: 'partial' }
                                  : r
                              ),
                            };
                            setExecutionRecord(nextRecord);
                          }}
                          className="w-24 px-2 py-1 border border-border-strong rounded text-sm"
                          placeholder="0"
                        />
                        <label className="text-xs text-muted mt-2">Status</label>
                        <select
                          value={status}
                          onChange={e => {
                            const val = e.target.value as ExecutionStatus;
                            const nextRecord = {
                              ...executionRecord!,
                              records: executionRecord!.records.map(r =>
                                r.taskId === task.id ? { ...r, status: val } : r
                              ),
                            };
                            setExecutionRecord(nextRecord);
                          }}
                          className="px-2 py-1 border border-border-strong rounded text-sm"
                        >
                          <option value="not-started">Not started</option>
                          <option value="completed">Completed</option>
                          <option value="partial">Partial</option>
                          <option value="missed">Missed</option>
                        </select>
                      </div>
                    </div>
                    {notes && <p className="text-sm text-muted mt-3">Notes: {notes}</p>}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                variant="primary"
                onClick={() => router.push('/plan')}
              >
                Back to Planning
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
