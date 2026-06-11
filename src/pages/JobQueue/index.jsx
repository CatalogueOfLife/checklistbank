import { useEffect } from "react";
import _ from "lodash";
import moment from "dayjs";
import axios from "axios";
import config from "../../config";

import { Helmet } from "react-helmet-async";
import { Divider, Empty, List, Tag, Typography, Button, Popconfirm } from "antd";
import { NavLink } from "react-router-dom";

import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withContext from "../../components/hoc/withContext";

const { Text } = Typography;

const JobQueuePage = ({ jobQueue, getJobQueue, addError }) => {
  useEffect(() => {
    getJobQueue();
    // background polling (healthHeartBeat) keeps it fresh afterwards
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    importsRunning = [],
    importsRunningCount = 0,
    importsQueued = 0,
    importsQueuedMine = [],
    jobsRunning = [],
    jobsQueued = 0,
    jobsQueuedMine = [],
  } = jobQueue || {};

  const cancelImport = (datasetKey) =>
    axios
      .delete(`${config.dataApi}importer/${datasetKey}`)
      .then(getJobQueue)
      .catch((err) => addError(err));

  const cancelJob = (key) =>
    axios
      .delete(`${config.dataApi}job/${key}`)
      .then(getJobQueue)
      .catch((err) => addError(err));

  const cancelButton = (onConfirm) => (
    <Popconfirm
      title="Cancel this queued job?"
      okText="Yes"
      cancelText="No"
      onConfirm={onConfirm}
    >
      <Button danger size="small">
        Cancel
      </Button>
    </Popconfirm>
  );

  return (
    <Layout title="Job Queue">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Job Queue</title>
      </Helmet>
      <PageContent>
        <Divider titlePlacement="left">
          Imports{" "}
          <Text type="secondary" style={{ fontWeight: "normal" }}>
            ({importsRunningCount} running, {importsQueued} queued)
          </Text>
        </Divider>
        {importsRunning.length === 0 && importsQueuedMine.length === 0 ? (
          <Empty
            description="No imports running"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={[
              ...importsRunning.map((i) => ({ ...i, queued: false })),
              ...importsQueuedMine.map((i) => ({ ...i, queued: true })),
            ]}
            renderItem={(imp) => (
              <List.Item
                key={`${imp.datasetKey}-${imp.attempt ?? "q"}`}
                extra={
                  imp.queued ? (
                    cancelButton(() => cancelImport(imp.datasetKey))
                  ) : (
                    <Tag color="blue">{_.startCase(imp.state)}</Tag>
                  )
                }
              >
                <List.Item.Meta
                  title={
                    imp.attempt != null ? (
                      <NavLink
                        to={`/dataset/${imp.datasetKey}/imports/${imp.attempt}`}
                      >
                        Dataset {imp.datasetKey} · attempt {imp.attempt}
                      </NavLink>
                    ) : (
                      <NavLink to={`/dataset/${imp.datasetKey}/imports`}>
                        Dataset {imp.datasetKey}
                      </NavLink>
                    )
                  }
                  description={
                    imp.queued ? (
                      "Queued"
                    ) : (
                      <>
                        {_.startCase(imp.job)}
                        {imp.started &&
                          ` · started ${moment(imp.started).format("lll")}`}
                      </>
                    )
                  }
                />
              </List.Item>
            )}
          />
        )}

        <Divider titlePlacement="left">
          Background jobs{" "}
          <Text type="secondary" style={{ fontWeight: "normal" }}>
            ({jobsRunning.length} running, {jobsQueued} queued)
          </Text>
        </Divider>
        {jobsRunning.length === 0 && jobsQueuedMine.length === 0 ? (
          <Empty
            description="No background jobs running"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={[
              ...jobsRunning.map((j) => ({ ...j, queued: false })),
              ...jobsQueuedMine.map((j) => ({ ...j, queued: true })),
            ]}
            renderItem={(job) => (
              <List.Item
                key={job.key}
                extra={
                  job.queued ? (
                    cancelButton(() => cancelJob(job.key))
                  ) : (
                    <Tag color="blue">{_.startCase(job.status)}</Tag>
                  )
                }
              >
                <List.Item.Meta
                  title={_.startCase(job.job)}
                  description={
                    <>
                      {_.get(job, "dataset.title") &&
                        `${_.get(job, "dataset.title")} · `}
                      {_.get(job, "user.username")}
                      {job.queued
                        ? ` · ${_.startCase(job.status)}`
                        : job.started &&
                          ` · started ${moment(job.started).format("lll")}`}
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ jobQueue, getJobQueue, addError }) => ({
  jobQueue,
  getJobQueue,
  addError,
});

export default withContext(mapContextToProps)(JobQueuePage);
