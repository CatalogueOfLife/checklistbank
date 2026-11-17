import { describe, it, expect } from "vitest";
import {
  summarizeHealth,
  summarizeMetrics,
  formatBytes,
  formatDuration,
  formatSeconds,
} from "./monitor";

const J = "io.dropwizard.jetty.MutableServletContextHandler.";

// trimmed from a real /monitor/metrics response
const METRICS = {
  version: "4.0.0",
  gauges: {
    "HikariPool-1.pool.ActiveConnections": { value: 1 },
    "HikariPool-1.pool.MaxConnections": { value: 64 },
    "jvm.attribute.name": { value: "16074@apps.example.org" },
    "jvm.attribute.uptime": { value: 6848971 },
    "jvm.memory.heap.used": { value: 482334568 },
    "jvm.memory.heap.max": { value: 33285996544 },
    "jvm.gc.G1-Young-Generation.count": { value: 134 },
    "jvm.gc.G1-Young-Generation.time": { value: 1429 },
    "jvm.threads.count": { value: 78 },
    [`${J}percent-5xx-15m`]: { value: 0.001 },
    "life.catalogue.concurrent.JobExecutor.jobs.queue.import": { value: 3 },
    "org.apache.hc.client5.http.io.HttpClientConnectionManager.ChecklistBank.max-connections":
      { value: 1024 },
    "org.apache.hc.client5.http.io.HttpClientConnectionManager.ChecklistBank.leased-connections":
      { value: 2 },
  },
  counters: {
    "jersey-client-ChecklistBank/0de79e1 2026-11-16.running": { count: 0 },
    "life.catalogue.import.failed": { count: 4 },
  },
  meters: {
    [`${J}5xx-responses`]: { count: 129, m1_rate: 0.5 },
    "ch.qos.logback.core.Appender.all": { count: 464 },
    "ch.qos.logback.core.Appender.error": { count: 2 },
  },
  timers: {
    [`${J}requests`]: { count: 42473, p95: 0.004, m1_rate: 4.4 },
  },
};

describe("summarizeMetrics", () => {
  it("picks host, build and resource figures", () => {
    const s = summarizeMetrics(METRICS);
    expect(s.host).toBe("apps.example.org");
    expect(s.pid).toBe("16074");
    expect(s.version).toBe("0de79e1 2026-11-16");
    expect(s.heap.max).toBe(33285996544);
    expect(s.gc).toEqual([
      { name: "G1-Young-Generation", count: 134, time: 1429 },
    ]);
    expect(s.db.active).toBe(1);
    expect(s.http.count).toBe(42473);
    expect(s.http.responses.find((r) => r.status === "5xx").count).toBe(129);
    expect(s.httpClient).toEqual({ leased: 2, pending: undefined, max: 1024 });
    expect(s.jobs.queues).toEqual([{ name: "import", size: 3 }]);
    expect(s.jobs.importsFailed).toBe(4);
    expect(s.log.error).toBe(2);
  });

  it("leaves out what a server does not report", () => {
    const s = summarizeMetrics({ gauges: {} });
    expect(s.version).toBeUndefined();
    expect(s.jobs).toBeUndefined();
    expect(s.log).toBeUndefined();
    expect(s.httpClient).toBeUndefined();
    expect(summarizeMetrics(null).heap.used).toBeUndefined();
  });
});

describe("summarizeHealth", () => {
  it("lists unhealthy checks first", () => {
    const s = summarizeHealth({
      db: { healthy: true, duration: 1 },
      elastic: { healthy: false, message: "down" },
      broker: { healthy: true },
    });
    expect(s.unhealthy).toBe(1);
    expect(s.checks.map((c) => c.name)).toEqual(["elastic", "broker", "db"]);
    expect(s.checks[0].message).toBe("down");
  });
});

describe("formatters", () => {
  it("formats bytes, durations and seconds", () => {
    expect(formatBytes(482334568)).toBe("460 MB");
    expect(formatBytes(33285996544)).toBe("31 GB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(-1)).toBe("–");
    expect(formatDuration(6848971)).toBe("1h 54m");
    expect(formatDuration(3 * 86400000 + 5 * 3600000)).toBe("3d 5h");
    expect(formatDuration(500)).toBe("0s");
    expect(formatSeconds(0.004)).toBe("4.0 ms");
    expect(formatSeconds(0.049)).toBe("49 ms");
    expect(formatSeconds(1.29)).toBe("1.3 s");
  });
});
