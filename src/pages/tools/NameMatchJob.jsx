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
import { Button, Card, Tag, Spin, Row, Col, Alert, Tooltip } from "antd";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withContext from "../../components/hoc/withContext";

const NameMatchJob = ({ match, addError }) => {
  const [job, setjob] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultUrlHasBeenChecked, setResultUrlHasBeenChecked] = useState(false);
  const init = async () => {
    setLoading(true);
    try {
      const res = await axios(`${config.dataApi}job/${match.params.key}`);
      setjob(res.data);
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
      const res = await axios.head(
        `${config.dataApi}job/${match.params.key}.zip`
      );
      console.log(res);

      setResultUrl(`${config.dataApi}job/${match.params.key}.zip`);
    } catch (error) {
      console.log(error);
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
    const running = ["running", "waiting"].includes(job?.status);
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
    <Layout openKeys={[]} selectedKeys={[]} title="ChecklistBank Name Matching">
      <PageContent>
        {(job?.status === "failed" || job?.error) && (
          <Alert
            type="error"
            style={{ marginBottom: "16px" }}
            title="Matching job failed"
            description={job?.error || "An unknown error occurred"}
            showIcon
          />
        )}
        {job?.status === "cancelled" && (
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
                  {job?.error ? (
                    <Tooltip title={job?.error}>
                      <Tag color="error">Failed</Tag>
                    </Tooltip>
                  ) : job?.status === "finished" ? (
                    <Button
                      type="link"
                      href={job?.job}
                      style={{ color: "#1890ff" }}
                    >
                      <DownloadOutlined /> {job?.sizeWithUnit}
                    </Button>
                  ) : job?.status === "waiting" ? (
                    <HistoryOutlined
                      style={{ marginRight: "10px", marginLeft: "10px" }}
                    />
                  ) : (
                    <SyncOutlined
                      style={{ marginRight: "10px", marginLeft: "10px" }}
                      spin
                    />
                  )}

                  <span>{moment(job?.created).format("MMM Do YYYY")}</span>
                </>
              }
            >
              <div>
                <PresentationItem md={4} label="Request">
                  {job.request && (
                    <div>
                      {Object.keys(job.request).map((key) => {
                        const value = job.request[key];
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
