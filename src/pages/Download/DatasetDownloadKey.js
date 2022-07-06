import React, { useState, useEffect } from "react";
import {
  SyncOutlined,
  DownloadOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import PresentationItem from "../../components/PresentationItem";
import moment from "moment";
import { withRouter } from "react-router-dom";
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


const DatasetDownload = ({ match, addError}) => {
  const [download, setDownload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [intervalHandle, setIntervalHandle] = useState(null);

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

  useEffect(() => {
    if (["running", "waiting"].includes(download?.status)) {
      if (!intervalHandle) {
        let hdl = setTimeout(init, 5000);
        setIntervalHandle(hdl);
      }
    } else if (intervalHandle) {
      clearInterval(intervalHandle);
    }
  }, [download]);

  useEffect(() => {
    return () => {
      if (intervalHandle) {
        clearInterval(intervalHandle);
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
                        {Object.keys(download.request).map((key) => (
                          <Tag
                            key={key}
                          >{`${key}: ${download.request[key]}`}</Tag>
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
