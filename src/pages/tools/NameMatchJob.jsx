import React, { useState, useEffect, useRef } from "react";
import {
  SyncOutlined,
  HistoryOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import PresentationItem from "../../components/PresentationItem";
import Exception from "../../components/exception/Exception";
import history from "../../history";
import moment from "dayjs";
import withRouter from "../../withRouter";
import axios from "axios";
import config from "../../config";
import _ from "lodash";
import { Button, Card, Tag, Spin, Row, Col, Alert } from "antd";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import ToolHeader from "./ToolHeader";
import withContext from "../../components/hoc/withContext";
import JobStatusTag from "../../components/job/JobStatusTag";
import { getJob, jobResultUrl, isLive, humanSize, JOB_STATUS } from "../../api/job";

const NameMatchJob = ({ match, addError }) => {
  const [job, setjob] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultUrlHasBeenChecked, setResultUrlHasBeenChecked] = useState(false);
  const init = async () => {
    setLoading(true);
    try {
      setjob(await getJob(match.params.key));
      setLoading(false);
    } catch (error) {
      if (error.response.status === 404) {
        getResultUrl();
      } else {
        addError(error);
      }
      setjob(null);
      setLoading(false);
    }
  };

  const getResultUrl = async () => {
    setResultUrlHasBeenChecked(true);
    try {
      await axios.head(jobResultUrl(match.params.key));
      setResultUrl(jobResultUrl(match.params.key));
    } catch (error) {
      // no result archive - the job failed or produced nothing
    }
  };

  useEffect(() => {
    if (match?.params?.key) {
      init();
    }
  }, [match.params.key]);

  // Poll for status while the job is running. setInterval (not a one-shot
  // setTimeout) so it keeps refreshing, handle in a ref so the guard never
  // goes stale and unmount cleanup actually clears it.
  useEffect(() => {
    const running = isLive(job?.status);
    if (running && !timerRef.current) {
      timerRef.current = setInterval(init, config.pollingHeartBeat || 5000);
    } else if (!running && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [job]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return (
    <Layout openKeys={[]} selectedKeys={[]} title="Name Matching">
      <PageContent>
        <ToolHeader id="name-match-job" />
        {(job?.status === JOB_STATUS.FAILED || job?.errorMessage) && (
          <Alert
            type="error"
            style={{ marginBottom: "16px" }}
            title="Matching job failed"
            description={job?.errorMessage || "An unknown error occurred"}
            showIcon
          />
        )}
        {job?.status === JOB_STATUS.CANCELED && (
          <Alert
            type="warning"
            style={{ marginBottom: "16px" }}
            title="Matching job was cancelled"
            showIcon
          />
        )}
        {resultUrl && (
          <Row>
            <Col flex="auto"></Col>
            <Col>
              <Button type="primary" size="large" href={resultUrl}>
                Download matching result <DownloadOutlined />
              </Button>
            </Col>
            <Col flex="auto"></Col>
            <Col>
              <Button
                type="primary"
                onClick={() => {
                  history.push({
                    pathname: `/tools/name-match`,
                  });
                }}
              >
                New upload
              </Button>
            </Col>
          </Row>
        )}
        {!job && !resultUrl && resultUrlHasBeenChecked && (
          <>
            <Alert
              type="error"
              style={{ marginBottom: "16px" }}
              showIcon
              title="Matching job not found"
              description="The job result could not be found. This usually means the job failed to start — most likely because the uploaded file could not be parsed. Please make sure your file is a valid CSV or TSV with a scientificName column."
            />
            <Button
              onClick={() => history.push({ pathname: "/tools/name-match" })}
            >
              New upload
            </Button>
          </>
        )}
        <Spin spinning={loading}>
          {job && (
            <Card
              title={
                <>
                  <JobStatusTag
                    status={job?.status}
                    step={job?.step}
                    error={job?.errorMessage}
                    style={{ marginRight: "10px" }}
                  />
                  {job?.status === JOB_STATUS.FINISHED && job?.result && (
                    <Button
                      type="link"
                      href={jobResultUrl(job.key)}
                      style={{ color: "#1890ff" }}
                    >
                      <DownloadOutlined /> {humanSize(job.result.size)}
                    </Button>
                  )}
                  {isLive(job?.status) &&
                    (job?.status === JOB_STATUS.RUNNING ? (
                      <SyncOutlined style={{ marginRight: "10px" }} spin />
                    ) : (
                      <HistoryOutlined style={{ marginRight: "10px" }} />
                    ))}

                  <span>{moment(job?.created).format("MMM Do YYYY")}</span>
                </>
              }
            >
              <div>
                <PresentationItem md={4} label="Request">
                  {job.params && (
                    <div>
                      {Object.keys(job.params).map((key) => {
                        const value = job.params[key];
                        return (
                          <Tag key={key}>{`${key}: ${
                            value?.label || value
                          }`}</Tag>
                        );
                      })}
                    </div>
                  )}
                </PresentationItem>
              </div>
            </Card>
          )}
        </Spin>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError }) => ({
  addError,
});
export default withRouter(withContext(mapContextToProps)(NameMatchJob));
