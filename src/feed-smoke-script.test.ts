import { describe, expect, it } from "vitest";

const { percentile, computeSummary } = require("../scripts/feed-smoke.js") as {
  percentile: (values: number[], p: number) => number;
  computeSummary: (
    samples: number[],
    threshold: number,
  ) => { mean: number; p50: number; p95: number; passes: boolean };
};

describe("feed smoke script helpers", () => {
  it("computes percentiles from unsorted values", () => {
    const values = [8, 2, 5, 1, 3];
    expect(percentile(values, 50)).toBe(3);
    expect(percentile(values, 95)).toBe(8);
  });

  it("flags failures when p95 exceeds threshold", () => {
    const passing = computeSummary([5, 6, 5, 7], 10);
    expect(passing.p95).toBe(7);
    expect(passing.passes).toBe(true);

    const failing = computeSummary([5, 6, 300, 7], 250);
    expect(failing.p95).toBe(300);
    expect(failing.passes).toBe(false);
  });
});
