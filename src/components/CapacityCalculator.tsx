'use client';

import { computeCapacity } from '../engine/capacity';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Stat from '@/components/ui/Stat';

export interface CapacityInputs {
  statedWeeklyMinutes: number;
  commitmentMinutes: number;
  closedWeeks: number[];
}

export interface CapacityOutput {
  statedWeeklyMinutes: number;
  commitmentMinutes: number;
  availableStated: number;
  observedWeeklyMinutes: number;
  confidence: number;
  effectiveCapacity: number;
  plannable: number;
}

export default function CapacityCalculator() {
  const [inputs, setInputs] = useState<CapacityInputs>({
    statedWeeklyMinutes: 0,
    commitmentMinutes: 0,
    closedWeeks: [],
  });
  const [output, setOutput] = useState<CapacityOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError(null);
    if (name === 'closedWeeks') {
      // Parse comma-separated numbers
      const weeks = value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
        .map((v) => parseInt(v, 10))
        .filter((v) => !isNaN(v) && v >= 0);
      setInputs((prev) => ({ ...prev, closedWeeks: weeks }));
    } else {
      const num = parseInt(value, 10);
      setInputs((prev) => ({
        ...prev,
        [name]: isNaN(num) ? 0 : num,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = computeCapacity(inputs);
      setOutput(result);
    } catch (err) {
      setError('Failed to calculate capacity');
      console.error(err);
    }
  };

  return (
    <div className="bg-paper text-ink min-h-screen flex flex-col items-center py-8">
      <h1 className="text-2xl font-bold mb-6 text-actual">
        Capacity Calculator
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-surface p-6 rounded-lg shadow-1 w-full max-w-md space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-muted mb-1">
            Stated Weekly Minutes (available time)
          </label>
          <input
            type="number"
            name="statedWeeklyMinutes"
            value={inputs.statedWeeklyMinutes.toString()}
            onChange={handleChange}
            min="0"
            className="bg-surface-sunken border border-muted rounded-md p-2 w-full text-ink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-1">
            Commitment Minutes (fixed commitments)
          </label>
          <input
            type="number"
            name="commitmentMinutes"
            value={inputs.commitmentMinutes.toString()}
            onChange={handleChange}
            min="0"
            className="bg-surface-sunken border border-muted rounded-md p-2 w-full text-ink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-1">
            Closed Weeks (actual minutes per week, comma-separated)
          </label>
          <input
            type="text"
            name="closedWeeks"
            value={inputs.closedWeeks.join(',')}
            onChange={handleChange}
            className="bg-surface-sunken border border-muted rounded-md p-2 w-full text-ink"
          />
          <p className="text-xs text-muted mt-1">
            Enter actual minutes for each closed week, separated by commas.
            Example: 540,600,580
          </p>
        </div>
        <Button
          variant="primary"
          type="submit"
          disabled={Object.values(inputs).some((v) => (Array.isArray(v) ? v.length === 0 : v < 0))}
          className="w-full"
        >
          Calculate Capacity
        </Button>
      </form>

      {error && (
        <div className="bg-danger/10 text-danger border border-danger/20 rounded-md p-4 mt-4 w-full max-w-md">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {output && (
        <div className="bg-surface p-6 rounded-lg shadow-1 w-full max-w-md mt-6 space-y-4">
          <h2 className="text-xl font-bold text-actual">Results</h2>
          <div className="space-y-4">
            <Stat label="Available Stated Minutes" value={output.availableStated} />
            <Stat label="Observed Weekly Minutes (median)" value={output.observedWeeklyMinutes} />
            <Stat label="Confidence" value={output.confidence.toFixed(2)} />
            <Stat label="Effective Capacity" value={output.effectiveCapacity.toFixed(1)} />
            <Stat label="Plannable Minutes (80% buffer)" value={output.plannable.toFixed(1)} />
          </div>
          <p className="text-muted mt-4 text-center">
            Capacity estimation helps determine how much work may realistically fit into your week. It is an input to planning, not a complete weekly plan.
          </p>
        </div>
      )}
    </div>
  );
}