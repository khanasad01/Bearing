import { describe, it, expect } from 'vitest';
import { computeCapacity } from '../../../src/engine/capacity';

describe('capacity', () => {
  it('week 1 applies haircut and buffer', () => {
    const r = computeCapacity({ statedWeeklyMinutes: 1800, commitmentMinutes: 0, closedWeeks: [] });
    expect(r.confidence).toBe(0);
    expect(r.effectiveCapacity).toBe(1080);   // 1800 * 0.6
    expect(r.plannable).toBe(864);            // * 0.8
  });

  it('applies commitments correctly', () => {
    const r = computeCapacity({ statedWeeklyMinutes: 1800, commitmentMinutes: 360, closedWeeks: [] });
    expect(r.availableStated).toBe(1440); // 1800 - 360
    expect(r.effectiveCapacity).toBe(864); // 1440 * 0.6
    expect(r.plannable).toBe(691.2);      // 864 * 0.8
  });

  it('blends toward observed with history', () => {
    const r = computeCapacity({ statedWeeklyMinutes: 1800, commitmentMinutes: 0, closedWeeks: [600, 540] });
    expect(r.confidence).toBe(0.5);
    expect(r.observedWeeklyMinutes).toBe(570); // median of [540, 600]
    expect(r.effectiveCapacity).toBeCloseTo(0.5 * 1080 + 0.5 * 570, 0);
    // effectiveCapacity = 0.5 * (1800 * 0.6) + 0.5 * 570 = 0.5 * 1080 + 0.5 * 570 = 540 + 285 = 825
    expect(r.plannable).toBeCloseTo(825 * 0.8, 0); // 660
  });

  it('uses latest up to four weeks for observed median', () => {
    const r = computeCapacity({ statedWeeklyMinutes: 1800, commitmentMinutes: 0, closedWeeks: [540, 580, 600, 610, 620] });
    expect(r.confidence).toBe(1); // max confidence with 4+ weeks
    expect(r.observedWeeklyMinutes).toBe(605); // median of [580, 600, 610, 620] (latest 4 weeks)
    expect(r.effectiveCapacity).toBe(605); // should equal observed when confidence=1
    expect(r.plannable).toBe(484); // 605 * 0.8
  });

  it('ignores older weeks beyond the latest four', () => {
    const r = computeCapacity({ statedWeeklyMinutes: 1800, commitmentMinutes: 0, closedWeeks: [100, 200, 300, 400, 500] });
    // Latest four weeks: [200,300,400,500] -> median of [300,400] = 350
    expect(r.confidence).toBe(1);
    expect(r.observedWeeklyMinutes).toBe(350);
    expect(r.effectiveCapacity).toBe(350);
    expect(r.plannable).toBe(280); // 350 * 0.8
  });

  it('handles zero stated hours', () => {
    const r = computeCapacity({ statedWeeklyMinutes: 0, commitmentMinutes: 0, closedWeeks: [600, 540] });
    expect(r.availableStated).toBe(0);
    expect(r.effectiveCapacity).toBeCloseTo(0.5 * 0 + 0.5 * 570, 0); // 285
    expect(r.plannable).toBeCloseTo(285 * 0.8, 0); // 228
  });

  it('handles zero history with commitments', () => {
    const r = computeCapacity({ statedWeeklyMinutes: 1800, commitmentMinutes: 900, closedWeeks: [] });
    expect(r.availableStated).toBe(900); // 1800 - 900
    expect(r.confidence).toBe(0);
    expect(r.effectiveCapacity).toBe(540); // 900 * 0.6
    expect(r.plannable).toBe(432); // 540 * 0.8
  });

  it('handles outlier week in history', () => {
    const r = computeCapacity({ statedWeeklyMinutes: 1800, commitmentMinutes: 0, closedWeeks: [100, 540, 600, 2000] });
    expect(r.confidence).toBe(1); // 4 weeks = full confidence
    expect(r.observedWeeklyMinutes).toBe(570); // median of [100, 540, 600, 2000]
    expect(r.effectiveCapacity).toBe(570); // should equal observed when confidence=1
    expect(r.plannable).toBe(456); // 570 * 0.8
  });

  it('ensures plannable never exceeds effective capacity', () => {
    const r = computeCapacity({ statedWeeklyMinutes: 1800, commitmentMinutes: 0, closedWeeks: [] });
    expect(r.plannable).toBeLessThanOrEqual(r.effectiveCapacity);
  });

  it('ensures effective capacity is non-negative', () => {
    const r = computeCapacity({ statedWeeklyMinutes: 0, commitmentMinutes: 0, closedWeeks: [] });
    expect(r.effectiveCapacity).toBeGreaterThanOrEqual(0);
    expect(r.plannable).toBeGreaterThanOrEqual(0);
  });
});
