import config from "../config";

// The two backend servers, each with its own Dropwizard admin endpoints.
export const SERVERS = [
  { key: "rw", title: "Read-write", path: "monitor" },
  { key: "ro", title: "Read-only", path: "monitor-ro" },
];

/**
 * Fetches a JSON document from a monitor endpoint. Native fetch, not axios:
 * the monitor endpoints are anonymous, and the healthcheck answers 500 with the
 * very same JSON body as soon as one check fails, which is what we want to show.
 */
const fetchJson = async (url) => {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    // a proxy error page or an empty body
  }
  if (!body) {
    throw new Error(`${res.status} ${res.statusText || "no JSON"} from ${url}`);
  }
  return body;
};

export const getHealth = (path) =>
  fetchJson(`${config.dataApi}${path}/healthcheck`);

export const getMetrics = (path) =>
  fetchJson(`${config.dataApi}${path}/metrics`);

/**
 * Turns the healthcheck map into a list sorted unhealthy first, then by name.
 */
export const summarizeHealth = (health) => {
  const checks = Object.entries(health || {})
    .map(([name, c]) => ({
      name,
      healthy: !!c?.healthy,
      message: c?.message || c?.error?.message,
      duration: c?.duration,
      timestamp: c?.timestamp,
    }))
    .sort(
      (a, b) =>
        Number(a.healthy) - Number(b.healthy) || a.name.localeCompare(b.name)
    );
  return {
    checks,
    unhealthy: checks.filter((c) => !c.healthy).length,
  };
};

const JETTY = "io.dropwizard.jetty.MutableServletContextHandler.";
const HIKARI = "HikariPool-1.pool.";

// Metric names that carry a varying part, like the pool name or the git sha.
const findKey = (section, pattern) =>
  Object.keys(section || {}).find((k) => pattern.test(k));

/**
 * Picks the few numbers worth looking at out of the Dropwizard metrics registry.
 * Every field is undefined if the server does not report it.
 */
export const summarizeMetrics = (m) => {
  const gauges = m?.gauges || {};
  const counters = m?.counters || {};
  const meters = m?.meters || {};
  const timers = m?.timers || {};
  const histograms = m?.histograms || {};
  const g = (name) => gauges[name]?.value;

  // The jersey client is named after the user agent, which carries the build.
  const clientKey = findKey(counters, /^jersey-client-[^/]+\/.+\.running$/);
  const version = clientKey?.match(/^jersey-client-[^/]+\/(.+)\.running$/)?.[1];

  const gc = Object.keys(gauges)
    .map((k) => k.match(/^jvm\.gc\.(.+)\.count$/)?.[1])
    .filter(Boolean)
    .map((name) => ({
      name,
      count: g(`jvm.gc.${name}.count`),
      time: g(`jvm.gc.${name}.time`),
    }));

  const responses = ["2xx", "3xx", "4xx", "5xx"].map((status) => ({
    status,
    count: meters[`${JETTY}${status}-responses`]?.count,
    rate: meters[`${JETTY}${status}-responses`]?.m1_rate,
  }));

  const requests = timers[`${JETTY}requests`];
  const httpPool = findKey(gauges, /^org\.apache\.hc\..+\.max-connections$/);
  const httpPoolPrefix = httpPool?.replace(/max-connections$/, "");

  const queues = Object.keys(gauges)
    .map((k) => k.match(/^life\.catalogue\.concurrent\.JobExecutor\.jobs\.queue\.(.+)$/)?.[1])
    .filter(Boolean)
    .map((name) => ({
      name,
      size: g(`life.catalogue.concurrent.JobExecutor.jobs.queue.${name}`),
    }));

  return {
    host: g("jvm.attribute.name")?.replace(/^\d+@/, ""),
    pid: g("jvm.attribute.name")?.match(/^(\d+)@/)?.[1],
    vendor: g("jvm.attribute.vendor"),
    uptime: g("jvm.attribute.uptime"),
    version,
    heap: {
      used: g("jvm.memory.heap.used"),
      committed: g("jvm.memory.heap.committed"),
      max: g("jvm.memory.heap.max"),
    },
    nonHeap: {
      used: g("jvm.memory.non-heap.used"),
      committed: g("jvm.memory.non-heap.committed"),
    },
    fileDescriptors: g("jvm.filedescriptor"),
    threads: {
      count: g("jvm.threads.count"),
      peak: g("jvm.threads.peak.count"),
      runnable: g("jvm.threads.runnable.count"),
      waiting: g("jvm.threads.waiting.count"),
      timedWaiting: g("jvm.threads.timed_waiting.count"),
      blocked: g("jvm.threads.blocked.count"),
      deadlocks: g("jvm.threads.deadlock.count"),
    },
    gc,
    db: {
      active: g(`${HIKARI}ActiveConnections`),
      idle: g(`${HIKARI}IdleConnections`),
      total: g(`${HIKARI}TotalConnections`),
      max: g(`${HIKARI}MaxConnections`),
      pending: g(`${HIKARI}PendingConnections`),
      // milliseconds a connection is held, and seconds waited for one
      usageP99: histograms[`${HIKARI}Usage`]?.p99,
      waitP99: timers[`${HIKARI}Wait`]?.p99,
      timeouts: meters[`${HIKARI}ConnectionTimeoutRate`]?.count,
    },
    http: {
      active: counters[`${JETTY}active-requests`]?.count,
      count: requests?.count,
      rate1m: requests?.m1_rate,
      rate15m: requests?.m15_rate,
      // seconds
      p50: requests?.p50,
      p95: requests?.p95,
      p99: requests?.p99,
      max: requests?.max,
      percent4xx: g(`${JETTY}percent-4xx-15m`),
      percent5xx: g(`${JETTY}percent-5xx-15m`),
      responses,
      threadUtilization: g("org.eclipse.jetty.util.thread.QueuedThreadPool.dw.utilization"),
      threadPoolSize: g("org.eclipse.jetty.util.thread.QueuedThreadPool.dw.size"),
      queued: g("org.eclipse.jetty.util.thread.QueuedThreadPool.dw.jobs"),
    },
    httpClient: httpPoolPrefix && {
      leased: g(`${httpPoolPrefix}leased-connections`),
      pending: g(`${httpPoolPrefix}pending-connections`),
      max: g(`${httpPoolPrefix}max-connections`),
    },
    jobs: queues.length
      ? {
          queues,
          finished: timers["life.catalogue.concurrent.JobExecutor.jobs.duration"]?.count,
          importsFailed: counters["life.catalogue.import.failed"]?.count,
        }
      : undefined,
    log: meters["ch.qos.logback.core.Appender.all"]
      ? {
          error: meters["ch.qos.logback.core.Appender.error"]?.count,
          warn: meters["ch.qos.logback.core.Appender.warn"]?.count,
          info: meters["ch.qos.logback.core.Appender.info"]?.count,
        }
      : undefined,
  };
};

const UNITS = ["B", "KB", "MB", "GB", "TB"];

export const formatBytes = (b) => {
  if (b === undefined || b === null || b < 0) return "–";
  let i = 0;
  let v = b;
  while (v >= 1024 && i < UNITS.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${UNITS[i]}`;
};

// milliseconds as the two largest units, e.g. "3d 4h" or "12m 5s"
export const formatDuration = (ms) => {
  if (ms === undefined || ms === null) return "–";
  const s = Math.floor(ms / 1000);
  const parts = [
    [Math.floor(s / 86400), "d"],
    [Math.floor((s % 86400) / 3600), "h"],
    [Math.floor((s % 3600) / 60), "m"],
    [s % 60, "s"],
  ];
  const first = parts.findIndex(([v]) => v > 0);
  if (first < 0) return "0s";
  return parts
    .slice(first, first + 2)
    .map(([v, u]) => `${v}${u}`)
    .join(" ");
};

// seconds as milliseconds, or seconds once it gets long
export const formatSeconds = (s) => {
  if (s === undefined || s === null) return "–";
  if (s >= 10) return `${s.toFixed(0)} s`;
  if (s >= 1) return `${s.toFixed(1)} s`;
  const ms = s * 1000;
  return `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`;
};
