// Lightweight in-memory metrics with rolling buffer and percentile summaries

const MAX_SAMPLES = 1000;

class Rolling {
  constructor() {
    this.values = [];
  }
  add(ms) {
    if (typeof ms !== "number" || !isFinite(ms) || ms < 0) return;
    this.values.push(ms);
    if (this.values.length > MAX_SAMPLES) this.values.shift();
  }
  summary() {
    const arr = [...this.values].sort((a, b) => a - b);
    const n = arr.length;
    const pick = (p) => (n === 0 ? null : arr[Math.min(n - 1, Math.floor(p * (n - 1)))]);
    const sum = arr.reduce((a, b) => a + b, 0);
    return {
      count: n,
      min: n ? arr[0] : null,
      p50: pick(0.5),
      p95: pick(0.95),
      p99: pick(0.99),
      max: n ? arr[n - 1] : null,
      avg: n ? Math.round((sum / n) * 100) / 100 : null,
    };
  }
}

const buckets = {
  grammar: new Rolling(),
  ai: new Rolling(),
  // per-provider sub-buckets e.g. ai:openai
};

export function recordMetric(name, ms) {
  if (!buckets[name]) buckets[name] = new Rolling();
  buckets[name].add(ms);
}

export function getMetricsSnapshot() {
  const out = {};
  for (const key of Object.keys(buckets)) {
    out[key] = buckets[key].summary();
  }
  return out;
}

export default { recordMetric, getMetricsSnapshot };


