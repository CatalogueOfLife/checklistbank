import React, { useState, useEffect } from "react";
import {
  SyncOutlined,
  jobOutlined,
  HistoryOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import PresentationItem from "../../components/PresentationItem";
import Exception from "../../components/exception/Exception";
import history from "../../history";
import moment from "moment";
import { withRouter } from "react-router-dom";
import axios from "axios";
import config from "../../config";
import _ from "lodash";
import { Button, Card, Tag, Spin, Row, Col } from "antd";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withContext from "../../components/hoc/withContext";

const NameMatchJob = ({ match, addError }) => {
  const [job, setjob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [intervalHandle, setIntervalHandle] = useState(null);
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

  useEffect(() => {
    if (["running", "waiting"].includes(job?.status)) {
      if (!intervalHandle) {
        let hdl = setTimeout(init, 5000);
        setIntervalHandle(hdl);
      }
    } else if (intervalHandle) {
      clearInterval(intervalHandle);
    }
  }, [job]);

  useEffect(() => {
    return () => {
      if (intervalHandle) {
        clearInterval(intervalHandle);
      }
    };
  }, []);
  return (
    <Layout openKeys={[]} selectedKeys={[]} title="ChecklistBank Name Matching">
      <PageContent>
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
                    pathname: `/tools/name-match-async`,
                  });
                }}
              >
                New upload
              </Button>
            </Col>
          </Row>
        )}
        {!job && !resultUrl && resultUrlHasBeenChecked && (
          <Exception type="404" />
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
                      <jobOutlined /> {job?.sizeWithUnit}
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
              <>
                <div>
                  {" "}
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
              </>
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
