const { performance } = require("node:perf_hooks");

const baseUrl = process.env.FEED_SMOKE_BASE_URL || "http://localhost:3000";
const runs = Number.parseInt(process.env.FEED_SMOKE_RUNS || "10", 10);
const warmupRuns = Number.parseInt(process.env.FEED_SMOKE_WARMUP_RUNS || "1", 10);
const limit = Number.parseInt(process.env.FEED_SMOKE_LIMIT || "20", 10);
const thresholdMs = Number.parseInt(process.env.FEED_SMOKE_P95_MS || "250", 10);
const clerkUserId = process.env.FEED_SMOKE_USER || "perf-smoke-user";

async function requestFeed() {
  const url = `${baseUrl}/api/feed?limit=${limit}`;
  const started = performance.now();
  const response = await fetch(url, {
    headers: { "x-clerk-user-id": clerkUserId },
  });
  const elapsedMs = performance.now() - started;
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Feed request failed with status ${response.status}: ${body.slice(0, 200)}`,
    );
  }
  await response.arrayBuffer();
  return elapsedMs;
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function computeSummary(samples, threshold) {
  const mean =
    samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
  const p50 = percentile(samples, 50);
  const p95 = percentile(samples, 95);
  const passes = p95 <= threshold;
  return { mean, p50, p95, passes };
}

async function run() {
  if (!Number.isFinite(runs) || runs <= 0) {
    throw new Error("FEED_SMOKE_RUNS must be a positive integer");
  }

  const samples = [];
  for (let i = 0; i < warmupRuns; i += 1) {
    const warmupMs = await requestFeed();
    console.log(`warmup ${i + 1}/${warmupRuns}: ${warmupMs.toFixed(1)} ms`);
  }

  for (let i = 0; i < runs; i += 1) {
    const elapsedMs = await requestFeed();
    samples.push(elapsedMs);
    console.log(`run ${i + 1}/${runs}: ${elapsedMs.toFixed(1)} ms`);
  }

  const { mean, p50, p95, passes } = computeSummary(samples, thresholdMs);

  console.log(
    `feed latency summary -> avg=${mean.toFixed(1)}ms p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms threshold=${thresholdMs}ms`,
  );

  if (!passes) {
    throw new Error(
      `Feed p95 ${p95.toFixed(1)}ms exceeded threshold ${thresholdMs}ms`,
    );
  }
}

module.exports = {
  percentile,
  computeSummary,
};

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
