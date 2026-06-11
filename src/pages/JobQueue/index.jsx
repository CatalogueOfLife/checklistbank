import { useEffect } from "react";
import _ from "lodash";
import moment from "dayjs";

import { Helmet } from "react-helmet-async";
import { Divider, Empty, List, Tag, Typography } from "antd";
import { NavLink } from "react-router-dom";

import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withContext from "../../components/hoc/withContext";

const { Text } = Typography;

const JobQueuePage = ({ jobQueue, getJobQueue }) => {
  useEffect(() => {
    getJobQueue();
    // background polling (healthHeartBeat) keeps it fresh afterwards
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    importsRunning = [],
    importsRunningCount = 0,
    importsQueued = 0,
    jobsRunning = [],
    jobsQueued = 0,
  } = jobQueue || {};

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
        {importsRunning.length === 0 ? (
          <Empty
            description="No imports running"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={importsRunning}
            renderItem={(imp) => (
              <List.Item
                key={`${imp.datasetKey}-${imp.attempt}`}
                extra={<Tag color="blue">{_.startCase(imp.state)}</Tag>}
              >
                <List.Item.Meta
                  title={
                    <NavLink
                      to={`/dataset/${imp.datasetKey}/imports/${imp.attempt}`}
                    >
                      Dataset {imp.datasetKey} · attempt {imp.attempt}
                    </NavLink>
                  }
                  description={
                    <>
                      {_.startCase(imp.job)}
                      {imp.started &&
                        ` · started ${moment(imp.started).format("lll")}`}
                    </>
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
        {jobsRunning.length === 0 ? (
          <Empty
            description="No background jobs running"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={jobsRunning}
            renderItem={(job) => (
              <List.Item
                key={job.key}
                extra={<Tag color="blue">{_.startCase(job.status)}</Tag>}
              >
                <List.Item.Meta
                  title={_.startCase(job.job)}
                  description={
                    <>
                      {_.get(job, "dataset.title") &&
                        `${_.get(job, "dataset.title")} · `}
                      {_.get(job, "user.username")}
                      {job.started &&
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

const mapContextToProps = ({ jobQueue, getJobQueue }) => ({
  jobQueue,
  getJobQueue,
});

export default withContext(mapContextToProps)(JobQueuePage);
