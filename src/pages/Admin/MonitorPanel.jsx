import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Progress,
  Row,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  ReloadOutlined,
} from "@ant-design/icons";
import config from "../../config";
import {
  getHealth,
  getMetrics,
  summarizeHealth,
  summarizeMetrics,
  formatBytes,
  formatDuration,
  formatSeconds,
} from "../../api/monitor";

const { Text } = Typography;

// The panel is a glance, not a live dashboard: a slow refresh keeps it current
// while it is left open without hammering the admin ports.
const REFRESH = 30000;

const num = (v) => (v === undefined || v === null ? "–" : v.toLocaleString());
const pct = (v, digits = 1) =>
  v === undefined || v === null ? "–" : `${(v * 100).toFixed(digits)}%`;
const share = (a, b) => (a >= 0 && b > 0 ? Math.min(100, (a / b) * 100) : 0);

// "G1-Young-Generation" -> "GC young gen", "G1-Concurrent-GC" -> "GC concurrent"
const gcLabel = (name) =>
  `GC ${name
    .replace(/^G1-/, "")
    .replace(/-Generation$/, " gen")
    .replace(/-GC$/, "")
    .toLowerCase()}`;

const Stat = ({ label, value, help, status, cols = { xs: 12, sm: 8, md: 6 } }) => {
  const { token } = theme.useToken();
  const color =
    status === "error"
      ? token.colorError
      : status === "warning"
        ? token.colorWarning
        : token.colorText;
  return (
    <Col {...cols}>
      <Tooltip title={help}>
        <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>
          {label}
        </div>
        <div
          style={{
            color,
            fontSize: 16,
            fontVariantNumeric: "tabular-nums",
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </div>
      </Tooltip>
    </Col>
  );
};

// a labelled bar for a used-of-available figure
const Meter = ({ label, percent, text }) => {
  const { token } = theme.useToken();
  const status = percent >= 90 ? "exception" : "normal";
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: token.colorTextSecondary,
        }}
      >
        <span>{label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{text}</span>
      </div>
      <Progress
        percent={percent}
        status={status}
        showInfo={false}
        size="small"
        strokeColor={
          status === "normal" && percent >= 75 ? token.colorWarning : undefined
        }
        style={{ margin: 0 }}
      />
    </div>
  );
};

const Section = ({ title, children }) => (
  <>
    <Divider titlePlacement="left" plain style={{ margin: "12px 0 8px" }}>
      <Text strong>{title}</Text>
    </Divider>
    {children}
  </>
);

const StatusTag = ({ loading, failed, unhealthy }) => {
  if (failed)
    return (
      <Tag icon={<CloseCircleFilled />} color="error">
        unreachable
      </Tag>
    );
  if (loading) return <Tag>loading</Tag>;
  if (unhealthy > 0)
    return (
      <Tag icon={<ExclamationCircleFilled />} color="error">
        {unhealthy} unhealthy
      </Tag>
    );
  return (
    <Tag icon={<CheckCircleFilled />} color="success">
      healthy
    </Tag>
  );
};

const HealthCheck = ({ check }) => {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "4px 0",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      {check.healthy ? (
        <CheckCircleFilled
          style={{ color: token.colorSuccess, marginTop: 4 }}
          aria-label="healthy"
        />
      ) : (
        <CloseCircleFilled
          style={{ color: token.colorError, marginTop: 4 }}
          aria-label="unhealthy"
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong={!check.healthy}>{check.name}</Text>
        {check.message && (
          <div
            style={{
              color: check.healthy ? token.colorTextSecondary : token.colorError,
              fontSize: 12,
              overflowWrap: "anywhere",
            }}
          >
            {check.message}
          </div>
        )}
      </div>
      {check.duration !== undefined && (
        <Text
          type="secondary"
          style={{ fontSize: 12, whiteSpace: "nowrap", marginTop: 2 }}
        >
          {check.duration} ms
        </Text>
      )}
    </div>
  );
};

/**
 * One backend server at a glance, from its Dropwizard healthcheck and metrics.
 * Health checks come last so that the metric sections of the read-write and
 * read-only panels line up when they sit side by side.
 */
const MonitorPanel = ({ title, path }) => {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [healthError, setHealthError] = useState(null);
  const [metricsError, setMetricsError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [h, m] = await Promise.allSettled([getHealth(path), getMetrics(path)]);
    if (h.status === "fulfilled") {
      setHealth(summarizeHealth(h.value));
      setHealthError(null);
    } else {
      setHealthError(h.reason);
    }
    if (m.status === "fulfilled") {
      setMetrics(summarizeMetrics(m.value));
      setMetricsError(null);
    } else {
      setMetricsError(m.reason);
    }
    setUpdated(new Date());
    setLoading(false);
  }, [path]);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (!document.hidden) load();
    }, REFRESH);
    return () => clearInterval(t);
  }, [load]);

  const failed = !!healthError && !!metricsError;
  const s = metrics;
  const unhealthyChecks = health?.checks.filter((c) => !c.healthy) || [];

  return (
    <Card
      size="small"
      style={{ height: "100%" }}
      title={
        <span>
          {title}{" "}
          <StatusTag
            loading={!health && !healthError}
            failed={failed}
            unhealthy={healthError ? 1 : health?.unhealthy}
          />
        </span>
      }
      extra={
        <span>
          {updated && (
            <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
              {updated.toLocaleTimeString()}
            </Text>
          )}
          <Tooltip title="Refresh">
            <Button
              size="small"
              type="text"
              icon={<ReloadOutlined spin={loading} />}
              onClick={load}
              aria-label="Refresh"
            />
          </Tooltip>
        </span>
      }
    >
      {healthError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 8 }}
          title="Health checks unavailable"
          description={healthError.message}
        />
      )}
      {unhealthyChecks.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 8 }}
          title={unhealthyChecks.map((c) => c.name).join(", ")}
          description={
            unhealthyChecks.length === 1 ? unhealthyChecks[0].message : undefined
          }
        />
      )}
      {metricsError && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 8 }}
          title="Metrics unavailable"
          description={metricsError.message}
        />
      )}

      {s && (
        <>
          <Row gutter={[16, 8]}>
            <Stat
              cols={{ xs: 24, md: 10 }}
              label="Host"
              value={s.host || "–"}
              help={s.pid && `pid ${s.pid}`}
            />
            <Stat
              cols={{ xs: 12, md: 8 }}
              label="Build"
              value={s.version || "–"}
            />
            <Stat
              cols={{ xs: 12, md: 6 }}
              label="Uptime"
              value={formatDuration(s.uptime)}
            />
          </Row>
          {s.vendor && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {s.vendor}
            </Text>
          )}

          <Section title="Memory & threads">
            <Meter
              label="Heap"
              percent={share(s.heap.used, s.heap.max)}
              text={`${formatBytes(s.heap.used)} of ${formatBytes(s.heap.max)}`}
            />
            <Row gutter={[16, 8]}>
              <Stat
                label="Heap committed"
                value={formatBytes(s.heap.committed)}
              />
              <Stat label="Non-heap" value={formatBytes(s.nonHeap.used)} />
              <Stat
                label="File descriptors"
                value={pct(s.fileDescriptors, 2)}
                help="Share of the open file limit in use"
              />
              <Stat
                label="Threads"
                value={num(s.threads.count)}
                help={`peak ${num(s.threads.peak)}, ${num(
                  s.threads.runnable
                )} runnable, ${num(s.threads.waiting)} waiting, ${num(
                  s.threads.timedWaiting
                )} timed waiting`}
              />
              <Stat
                label="Blocked threads"
                value={num(s.threads.blocked)}
                status={s.threads.blocked > 0 ? "warning" : undefined}
              />
              <Stat
                label="Deadlocks"
                value={num(s.threads.deadlocks)}
                status={s.threads.deadlocks > 0 ? "error" : undefined}
              />
              {s.gc.map((gc) => (
                <Stat
                  key={gc.name}
                  label={gcLabel(gc.name)}
                  value={num(gc.count)}
                  help={`${num(gc.time)} ms in total`}
                />
              ))}
            </Row>
          </Section>

          <Section title="HTTP">
            <Meter
              label="Jetty worker threads busy"
              percent={(s.http.threadUtilization || 0) * 100}
              text={`${pct(s.http.threadUtilization, 0)} of ${num(
                s.http.threadPoolSize
              )}`}
            />
            <Row gutter={[16, 8]}>
              <Stat
                label="Active requests"
                value={num(s.http.active)}
                help="Requests being served right now"
              />
              <Stat
                label="Requests / min"
                value={
                  s.http.rate1m === undefined
                    ? "–"
                    : Math.round(s.http.rate1m * 60).toLocaleString()
                }
                help={`last minute; ${num(s.http.count)} since start`}
              />
              <Stat label="Median" value={formatSeconds(s.http.p50)} />
              <Stat label="95th pct" value={formatSeconds(s.http.p95)} />
              <Stat
                label="99th pct"
                value={formatSeconds(s.http.p99)}
                help={`max ${formatSeconds(s.http.max)}`}
              />
              <Stat
                label="4xx (15 min)"
                value={pct(s.http.percent4xx)}
                help="Share of responses with a client error"
              />
              <Stat
                label="5xx (15 min)"
                value={pct(s.http.percent5xx, 2)}
                status={s.http.percent5xx > 0.01 ? "error" : undefined}
                help="Share of responses with a server error"
              />
              <Stat
                label="5xx since start"
                value={num(
                  s.http.responses.find((r) => r.status === "5xx")?.count
                )}
              />
              <Stat
                label="Queued"
                value={num(s.http.queued)}
                status={s.http.queued > 0 ? "warning" : undefined}
                help="Requests waiting for a Jetty worker thread"
              />
            </Row>
          </Section>

          <Section title="Database pool">
            <Meter
              label="Connections in use"
              percent={share(s.db.active, s.db.max)}
              text={`${num(s.db.active)} of ${num(s.db.max)}`}
            />
            <Row gutter={[16, 8]}>
              <Stat label="Open" value={num(s.db.total)} />
              <Stat label="Idle" value={num(s.db.idle)} />
              <Stat
                label="Waiting"
                value={num(s.db.pending)}
                status={s.db.pending > 0 ? "warning" : undefined}
                help="Threads waiting for a connection"
              />
              <Stat
                label="Timeouts"
                value={num(s.db.timeouts)}
                status={s.db.timeouts > 0 ? "error" : undefined}
                help="Connection requests that timed out since start"
              />
              <Stat
                label="Held 99th pct"
                value={
                  s.db.usageP99 === undefined ? "–" : `${num(s.db.usageP99)} ms`
                }
                help="How long a connection is held"
              />
              <Stat
                label="Wait 99th pct"
                value={formatSeconds(s.db.waitP99)}
                help="How long it takes to get a connection"
              />
            </Row>
          </Section>

          {(s.jobs || s.log) && (
            <Section title="Jobs & log">
              <Row gutter={[16, 8]}>
                {s.jobs?.queues.map((q) => (
                  <Stat
                    key={q.name}
                    label={`Queue ${q.name}`}
                    value={num(q.size)}
                  />
                ))}
                {s.jobs && (
                  <>
                    <Stat
                      label="Jobs finished"
                      value={num(s.jobs.finished)}
                      help="since start"
                    />
                    <Stat
                      label="Imports failed"
                      value={num(s.jobs.importsFailed)}
                      status={s.jobs.importsFailed > 0 ? "warning" : undefined}
                      help="since start"
                    />
                  </>
                )}
                {s.log && (
                  <>
                    <Stat
                      label="Log errors"
                      value={num(s.log.error)}
                      status={s.log.error > 0 ? "error" : undefined}
                      help="since start"
                    />
                    <Stat
                      label="Log warnings"
                      value={num(s.log.warn)}
                      help="since start"
                    />
                  </>
                )}
              </Row>
            </Section>
          )}
        </>
      )}

      {health && (
        <Section title={`Health checks (${health.checks.length})`}>
          {health.checks.map((c) => (
            <HealthCheck key={c.name} check={c} />
          ))}
        </Section>
      )}

      <div style={{ marginTop: 8, fontSize: 12 }}>
        <Text type="secondary">
          Raw:{" "}
          <a href={`${config.dataApi}${path}/healthcheck`}>healthcheck</a>
          {" · "}
          <a href={`${config.dataApi}${path}/metrics`}>metrics</a>
        </Text>
      </div>
    </Card>
  );
};

export default MonitorPanel;
