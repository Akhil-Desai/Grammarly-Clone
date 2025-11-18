import { recordMetric, getMetricsSnapshot } from "../metrics.js";

describe("metrics", () => {
  test("records and summarizes grammar latency", () => {
    for (let i = 1; i <= 10; i++) recordMetric("grammar", i);
    const snap = getMetricsSnapshot();
    expect(snap.grammar.count).toBeGreaterThanOrEqual(10);
    expect(snap.grammar.min).toBe(1);
    expect(snap.grammar.max).toBeGreaterThanOrEqual(10);
    expect(snap.grammar.avg).toBeGreaterThan(0);
    expect(snap.grammar.p50).toBeGreaterThan(0);
  });

  test("handles unknown metric names", () => {
    recordMetric("ai:openai", 123);
    const snap = getMetricsSnapshot();
    expect(snap["ai:openai"].count).toBeGreaterThanOrEqual(1);
  });
});


