import React, { useState, useEffect } from "react";
import Layout from "../../components/LayoutNew";
import { NavLink } from "react-router-dom";
import withRouter from "../../withRouter";
import PresentationItem from "../../components/PresentationItem";
import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import Exception from "../../components/exception/Exception";
import config from "../../config";
import axios from "axios";
import _ from "lodash";
import { DownloadOutlined, HistoryOutlined, SyncOutlined, StopOutlined } from "@ant-design/icons";
import { Tag, List, Row, Col, Button, Tabs, Tooltip, Card, Spin, Popconfirm, message } from "antd";
import moment from "dayjs";
import history from "../../history";
const UserProfile = ({ user, countryAlpha2, match }) => {
  const [editorDatasets, setEditorDatasets] = useState([]);
  const [reviewerDatasets, setReviewerDatasets] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [hasRunningDownload, setHasRunningDownload] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [intervalHandle, setIntervalHandle] = useState(null)
  const [cancelingKey, setCancelingKey] = useState(null)

  const loadDownloads = async () => {
    const downloads_ = await axios(
      `${config.dataApi}export?createdBy=${user?.key}`
    );
    if (downloads_?.data?.result) {
      setDownloads(downloads_.data.result);
      setHasRunningDownload(
        !!downloads_.data.result.find((e) => e.status === "running")
      );
    }
  };

  const cancelDownload = async (key) => {
    setCancelingKey(key);
    try {
      await axios.delete(`${config.dataApi}job/${key}`);
      await loadDownloads();
    } catch (err) {
      message.error(
        `Could not cancel download: ${
          err?.response?.data?.message || err?.message || err
        }`
      );
    } finally {
      setCancelingKey(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      const editorDatasets_ = await axios(
        `${config.dataApi}dataset?editor=${user?.key}&limit=1000`
      );
      const reviewerDatasets_ = await axios(
        `${config.dataApi}dataset?reviewer=${user?.key}&limit=1000`
      );

      if (editorDatasets_?.data?.result) {
        setEditorDatasets(editorDatasets_?.data?.result);
      }
      if (reviewerDatasets_?.data?.result) {
        setReviewerDatasets(reviewerDatasets_?.data?.result);
      }
      await loadDownloads();
    };
    if(user){
      init();
    }
  }, [user]);

  useEffect(()=>{
    setActiveTab(match.params.tab)
  },[match.params.tab])

  useEffect(() => {
    if(hasRunningDownload && !intervalHandle){
     let hdl = setInterval(() => {
        loadDownloads();
      }, 5000)
      setIntervalHandle(hdl)
    };
    if(!hasRunningDownload && intervalHandle){
      clearInterval(intervalHandle)
    }
  }, [hasRunningDownload])

  useEffect(() => {
    return () => {
        if(intervalHandle){
          clearInterval(intervalHandle)
        }
    }
}, [])

  const renderItem = (item) => (
    <List.Item key={item?.key}>
      <List.Item.Meta
        avatar={
          <Tag>{item?.origin === "project" ? "project" : item?.origin}</Tag>
        }
        description={
          <NavLink
            to={{
              pathname:
                item?.origin === "project"
                  ? `/project/${item?.key}/assembly`
                  : `/dataset/${item?.key}/metadata`,
            }}
          >
            {item?.title}
          </NavLink>
        }
      />
    </List.Item>
  );
  const renderDownload = (item) => (
    <List.Item key={item?.key}>
      <Card title={<>
        {item?.error ? (
              <Tooltip title={item?.error}>
                <Tag color="error">Failed</Tag>
              </Tooltip>
          ) : item?.status === "finished" ? (
            <Button type="link" href={item?.download} style={{color: "#1890ff"}}>
              <DownloadOutlined /> {item?.sizeWithUnit}
            </Button>
          ) : item?.status === "waiting" ? (
            <HistoryOutlined style={{ marginRight: "10px", marginLeft: "10px" }} />
          ) : item?.status === "canceled" ? (
            <Tag>Cancelled</Tag>
          ) : <SyncOutlined style={{ marginRight: "10px", marginLeft: "10px" }} spin />}

          <span>{moment(item?.created).format("MMM Do YYYY")}</span>
        </>}
      extra={
        item?.status === "running" || item?.status === "waiting" ? (
          <Popconfirm
            title="Cancel this download?"
            okText="Yes, cancel"
            cancelText="No"
            okButtonProps={{ danger: true }}
            onConfirm={() => cancelDownload(item?.key)}
          >
            <Button
              danger
              size="small"
              icon={<StopOutlined />}
              loading={cancelingKey === item?.key}
            >
              Cancel
            </Button>
          </Popconfirm>
        ) : null
      }>
        <>
            <div> <PresentationItem md={4} label="Request">
             {item.request && <div>{Object.keys(item.request).map((key) => (
                <Tag key={key}>{`${key}: ${item.request[key]}`}</Tag>
              ))}</div>}
                </PresentationItem>
                </div>
                <div style={{marginTop: "10px"}}>
                <PresentationItem  md={4} label="Taxa By Rank">
                {item.taxaByRankCount && <div>{Object.keys(item.taxaByRankCount).map((key) => (
                <Tag key={key}>{`${key}: ${item.taxaByRankCount[key]}`}</Tag>
              ))}</div>}
                </PresentationItem>   
                </div>      
            
              </>
        </Card>
      
    </List.Item>
  );
  return (
    <Layout title={user?.username ? `User profile: ${user?.username}` : ""}>
      {user ? (
        <PageContent>
          <Tabs
            activeKey={activeTab}
            onChange={(tb) => {
              history.push({
                pathname:
                  tb === "profile" ? "/user-profile" : `/user-profile/${tb}`,
              });
            }}
            items={[
              {
                key: "profile",
                label: "Profile",
                children: (
                  <>
                    <Row>
                      <Col flex="auto"></Col>
                      <Col>
                        <Button href="https://www.gbif.org/user/profile">
                          Edit on gbif.org
                        </Button>
                      </Col>
                    </Row>
                    <Row>
                      <PresentationItem label="UserName">
                        {user?.username}
                      </PresentationItem>
                      <PresentationItem label="Name">
                        {user?.firstname} {user?.lastname}
                      </PresentationItem>
                      <PresentationItem label="Email">
                        {user?.email}
                      </PresentationItem>
                      <PresentationItem label="Orcid">
                        {user?.orcid && (
                          <a
                            style={{ display: "block" }}
                            href={`https://orcid.org/${user.orcid}`}
                          >
                            <img
                              src="/images/orcid_16x16.png"
                              style={{ flex: "0 0 auto" }}
                              alt=""
                            ></img>{" "}
                            {user.orcid}
                          </a>
                        )}
                      </PresentationItem>
                      <PresentationItem label="Country">
                        {user?.country && countryAlpha2[user?.country]?.name}
                      </PresentationItem>
                      <PresentationItem label="Roles">
                        {user?.roles?.length && (
                          <div>
                            {user.roles.map((r) => (
                              <Tag key={r}>{r}</Tag>
                            ))}{" "}
                          </div>
                        )}
                      </PresentationItem>
                    </Row>
                  </>
                ),
              },
              {
                key: "editor",
                label: `Editor (${editorDatasets.length})`,
                children: (
                  <List dataSource={editorDatasets} renderItem={renderItem} />
                ),
              },
              {
                key: "reviewer",
                label: `Reviewer (${reviewerDatasets.length})`,
                children: (
                  <List
                    dataSource={reviewerDatasets}
                    renderItem={renderItem}
                  />
                ),
              },
              {
                key: "downloads",
                label: `Downloads (${downloads.length})`,
                children: (
                  <Row>
                    <Col flex="auto"></Col>
                    <Col>
                      <List
                        dataSource={downloads}
                        renderItem={renderDownload}
                        split={false}
                      />
                    </Col>
                    <Col flex="auto"></Col>
                  </Row>
                ),
              },
            ]}
          />

          {/*         <Row>
          <Col span={12} style={{ padding: "0px 12px 0px 12px" }}>
            <List
              header={<h4>Editor scope</h4>}
              dataSource={editorDatasets}
              renderItem={renderItem}
            />
          </Col>
          <Col span={12} style={{ padding: "0px 12px 0px 20px" }}>
            <List
              header={<h4>Reviewer scope</h4>}
              dataSource={reviewerDatasets}
              renderItem={renderItem}
            />
          </Col>
        </Row> */}
        </PageContent>
      ) : (
        <Exception type="401"></Exception>
      )}
    </Layout>
  );
};

const mapContextToProps = ({ user, countryAlpha2 }) => ({
  user,
  countryAlpha2,
});

export default withContext(mapContextToProps)(withRouter(UserProfile));
