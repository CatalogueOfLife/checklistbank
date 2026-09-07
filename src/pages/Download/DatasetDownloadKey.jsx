import React, { useState, useEffect, useRef } from "react";
import { SyncOutlined, DownloadOutlined, HistoryOutlined } from "@ant-design/icons";
import { Tooltip } from 'antd';
import PresentationItem from "../../components/PresentationItem";
import { formatTime } from "../../dateTime";
import withRouter from "../../withRouter";
import axios from "axios";
import config from "../../config";
import { Button, Card, Tag, Spin } from "antd";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withContext from "../../components/hoc/withContext";
import { formatRequestValue } from "./requestValue";


const DatasetDownload = ({ match, downloadKey, addError }) => {
  const [download, setDownload] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  // Which route param holds the export uuid depends on how we got here:
  //   /download/:key                  - no props, :key IS the uuid
  //   /project/:projectKey/download/:key - :key is the uuid too
  //   /dataset/:key/download/:uuid    - :key is the DATASET, the uuid arrives
  //                                     as the downloadKey prop
  // So prefer the prop and only fall back to the param. Reading match.params.key
  // unconditionally made the in-dataset URL request `export/<datasetKey>`.
  const exportKey = downloadKey || match?.params?.key;

  const init = async () => {
    setLoading(true);
    try {
      const dl = await axios(`${config.dataApi}export/${exportKey}`);
      setDownload(dl.data);
      setLoading(false);
    } catch (error) {
      addError(error)
      setDownload(null);
      setLoading(false);
    }
  };
  useEffect(() => {
    if (exportKey) {
      init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportKey]);

  // Poll for status while the export is running. setInterval (not a one-shot
  // setTimeout) so it keeps refreshing, and the handle lives in a ref so the
  // guard never goes stale and unmount cleanup actually clears it.
  useEffect(() => {
    const running = ["running", "waiting"].includes(download?.status);
    if (running && !timerRef.current) {
      timerRef.current = setInterval(init, config.pollingHeartBeat || 5000);
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

                  <span>{formatTime(download?.created, "MMM Do YYYY")}</span>
                </>
              }
            >
              <>
                <div>
                  {" "}
                  <PresentationItem md={4} label="Request">
                    {download.request && (
                      <div>
                        {Object.keys(download.request).map((key) => (
                          <Tag key={key}>{`${key}: ${formatRequestValue(
                            download.request[key]
                          )}`}</Tag>
                        ))}
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
