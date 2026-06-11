import React, { useState, useEffect, useRef } from "react";
import {
  SyncOutlined,
  DownloadOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { Tooltip } from 'antd';
import PresentationItem from "../../components/PresentationItem";
import moment from "dayjs";
import withRouter from "../../withRouter";
import axios from "axios";
import config from "../../config";
import _ from "lodash";
import {
  Button,
  Card,
  Tag,
  Spin,

} from "antd";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withContext from "../../components/hoc/withContext";


const DatasetDownload = ({ match, addError }) => {
  const [download, setDownload] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const init = async () => {
    setLoading(true);
    try {
      const dl = await axios(`${config.dataApi}export/${match.params.key}`);
      setDownload(dl.data);
      setLoading(false);
    } catch (error) {
      addError(error)
      setDownload(null);
      setLoading(false);
    }
  };
  useEffect(() => {
    if (match?.params?.key) {
      init();
    }
  }, [match.params.key]);

  // Poll for status while the export is running. setInterval (not a one-shot
  // setTimeout) so it keeps refreshing, and the handle lives in a ref so the
  // guard never goes stale and unmount cleanup actually clears it.
  useEffect(() => {
    const running = ["running", "waiting"].includes(download?.status);
    if (running && !timerRef.current) {
      timerRef.current = setInterval(init, 5000);
    } else if (!running && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [download]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);
  return (
    <Layout openKeys={[]} selectedKeys={[]} title="ChecklistBank Download">
      <PageContent>
        <Spin spinning={loading}>
          {download && (
            <Card
              title={
                <>
                  {download?.error ? (
                    <Tooltip title={download?.error}>
                      <Tag color="error">Failed</Tag>
                    </Tooltip>
                  ) : download?.status === "finished" ? (
                    <Button
                      type="link"
                      href={download?.download}
                      style={{ color: "#1890ff" }}
                    >
                      <DownloadOutlined /> {download?.sizeWithUnit}
                    </Button>
                  ) : download?.status === "waiting" ? (
                    <HistoryOutlined
                      style={{ marginRight: "10px", marginLeft: "10px" }}
                    />
                  ) : (
                    <SyncOutlined
                      style={{ marginRight: "10px", marginLeft: "10px" }}
                      spin
                    />
                  )}

                  <span>{moment(download?.created).format("MMM Do YYYY")}</span>
                </>
              }
            >
              <>
                <div>
                  {" "}
                  <PresentationItem md={4} label="Request">
                    {download.request && (
                      <div>
                        {Object.keys(download.request).map((key) => {
                          const value = download.request[key];
                          return (
                            <Tag
                              key={key}
                            >{`${key}: ${value?.label || value}`}</Tag>
                          );
                        })}
                      </div>
                    )}
                  </PresentationItem>
                </div>
                <div style={{ marginTop: "10px" }}>
                  <PresentationItem md={4} label="Taxa By Rank">
                    {download.taxaByRankCount && (
                      <div>
                        {Object.keys(download.taxaByRankCount).map((key) => (
                          <Tag
                            key={key}
                          >{`${key}: ${download.taxaByRankCount[key]}`}</Tag>
                        ))}
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
  addError
});
export default withRouter(withContext(mapContextToProps)(DatasetDownload));
