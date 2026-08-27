import React, { useState, useEffect, useRef } from "react";
import { Table, Row, Col, Statistic, Switch, Alert, Card } from "antd";
import _ from "lodash";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import ErrorMsg from "../../components/ErrorMsg";
import JobDetail from "../../components/job/JobDetail";
import { getJobQueue } from "../../api/job";
import { decorateJobs } from "./decorate";
import {
  statusColumn,
  jobColumn,
  datasetColumn,
  sectorColumn,
  userColumn,
  priorityColumn,
  dateColumn,
  durationColumn,
  logsColumn,
  actionColumn,
} from "./columns";

const pollingHeartBeat = config.pollingHeartBeat || 5000;

/**
 * The live queue, straight from executor memory. Everything that runs in the
 * background shows up here - imports, sector syncs, releases, exports, matching
 * and admin tasks - so this is also the only place a running release appears:
 * since the unified job API, /importer no longer lists them.
 */
const QueueTab = ({ mine, setMine, user }) => {
  const [queue, setQueue] = useState({
    running: [],
    queued: [],
    queuedCounts: {},
    queuedTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  const load = async () => {
    try {
      const q = await getJobQueue();
      const [running, queued] = await Promise.all([
        decorateJobs(q.running),
        decorateJobs(q.queued),
      ]);
      setQueue({ ...q, running, queued });
      setError(null);
    } catch (err) {
      // keep the last good queue on a transient error rather than blanking it
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    timer.current = setInterval(load, pollingHeartBeat);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const byMine = (j) => !mine || (user && j.userKey === user.key);
  const rows = [...queue.running, ...queue.queued].filter(byMine);

  const columns = [
    statusColumn,
    jobColumn,
    datasetColumn,
    sectorColumn,
    userColumn,
    priorityColumn,
    dateColumn("Created", "created"),
    durationColumn,
    logsColumn,
    actionColumn(load),
  ];

  return (
    <>
      {error && (
        <Alert
          style={{ marginBottom: 8 }}
          type="warning"
          closable
          onClose={() => setError(null)}
          description={<ErrorMsg error={error} />}
        />
      )}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Card size="small">
            <Statistic title="Running" value={queue.running.length} />
          </Card>
        </Col>
        <Col>
          <Card size="small">
            <Statistic title="Queued" value={queue.queuedTotal} />
          </Card>
        </Col>
        {Object.entries(queue.queuedCounts || {}).map(([lane, count]) => (
          <Col key={lane}>
            <Card size="small">
              <Statistic title={`${_.startCase(lane)} queue`} value={count} />
            </Card>
          </Col>
        ))}
        {user && (
          <Col flex="auto" style={{ textAlign: "right" }}>
            <Switch
              checked={!!mine}
              onChange={setMine}
              checkedChildren="Mine"
              unCheckedChildren="All"
            />
          </Col>
        )}
      </Row>
      <Table
        size="small"
        rowKey="key"
        scroll={{ x: "max-content" }}
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={false}
        expandable={{
          expandedRowRender: (record) => <JobDetail job={record} />,
        }}
      />
    </>
  );
};

const mapContextToProps = ({ user }) => ({ user });
export default withContext(mapContextToProps)(QueueTab);
