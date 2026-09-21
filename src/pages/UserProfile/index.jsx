import React, { useState, useEffect, useRef } from "react";
import Layout from "../../components/LayoutNew";
import { NavLink } from "react-router-dom";
import withRouter from "../../withRouter";
import PresentationItem from "../../components/PresentationItem";
import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import Exception from "../../components/exception/Exception";
import config from "../../config";
import axios from "axios";
import { DownloadOutlined, HistoryOutlined, SyncOutlined, StopOutlined } from "@ant-design/icons";
import { Tag, List, Row, Col, Button, Tabs, Tooltip, Card, Popconfirm, App } from "antd";
import { formatTime } from "../../dateTime";
import history from "../../history";
import { getDatasetsBatch } from "../../api/dataset";
import { searchJobs, humanSize, jobResultUrl, isLive } from "../../api/job";
import {
  searchParamsOfRequest,
  searchUrlOfJob,
} from "../NameSearch/searchDownload";
const UserProfile = ({ user, countryAlpha2, match }) => {
  const { message } = App.useApp();
  const [editorDatasets, setEditorDatasets] = useState([]);
  const [reviewerDatasets, setReviewerDatasets] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [hasRunningDownload, setHasRunningDownload] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const pollRef = useRef(null)
  const [cancelingKey, setCancelingKey] = useState(null)

  // Dataset exports and search downloads live in different places on the backend:
  // exports in their own table, search downloads only as unified jobs.
  const loadDownloads = async () => {
    const [exports_, searches_] = await Promise.all([
      axios(`${config.dataApi}export?createdBy=${user?.key}`).catch(() => null),
      searchJobs({ createdBy: user?.key, job: "SearchExport", limit: 100 }).catch(
        () => null
      ),
    ]);
    const all = [
      ...(exports_?.data?.result || []),
      ...(searches_?.result || []).map((j) => ({ ...j, kind: "search" })),
    ].sort((a, b) => String(b.created || "").localeCompare(String(a.created || "")));
    const keys = [
      ...new Set(
        all.filter((e) => e.kind === "search" && e.datasetKey).map((e) => e.datasetKey)
      ),
    ];
    if (keys.length) {
      const datasets = await getDatasetsBatch(keys);
      const titles = Object.fromEntries(
        keys.map((k, i) => [k, datasets[i]?.alias || datasets[i]?.title])
      );
      all.forEach((e) => {
        if (e.kind === "search") e.datasetTitle = titles[e.datasetKey];
      });
    }
    setDownloads(all);
    setHasRunningDownload(!!all.find((e) => isLive(e.status)));
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
    if (hasRunningDownload && !pollRef.current) {
      pollRef.current = setInterval(() => {
        loadDownloads();
      }, config.pollingHeartBeat || 5000);
    }
    if (!hasRunningDownload && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [hasRunningDownload]);

  useEffect(
    () => () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    },
    []
  );

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
  const renderCancel = (item) =>
    isLive(item?.status) ? (
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
    ) : null;

  const renderSearchDownload = (item) => {
    const search = searchParamsOfRequest(item?.params);
    return (
      <List.Item key={item?.key}>
        <Card
          title={
            <>
              {item?.status === "failed" ? (
                <Tooltip title={item?.errorMessage}>
                  <Tag color="error">Failed</Tag>
                </Tooltip>
              ) : item?.status === "finished" ? (
                item?.result?.deleted ? (
                  <Tag>Expired</Tag>
                ) : (
                  <Button
                    type="link"
                    href={jobResultUrl(item?.key)}
                    style={{ color: "#1890ff" }}
                  >
                    <DownloadOutlined /> {humanSize(item?.result?.size)}
                  </Button>
                )
              ) : item?.status === "canceled" ? (
                <Tag>Cancelled</Tag>
              ) : item?.status === "running" ? (
                <SyncOutlined
                  style={{ marginRight: "10px", marginLeft: "10px" }}
                  spin
                />
              ) : (
                <HistoryOutlined
                  style={{ marginRight: "10px", marginLeft: "10px" }}
                />
              )}
              <span>{formatTime(item?.created, "MMM Do YYYY")}</span>
            </>
          }
          extra={renderCancel(item)}
        >
          <PresentationItem md={6} label="Type">
            <Tag>search download</Tag>
          </PresentationItem>
          <PresentationItem md={6} label="Dataset">
            <NavLink to={{ pathname: `/dataset/${item?.datasetKey}/about` }}>
              {item?.datasetTitle || item?.datasetKey}
            </NavLink>
          </PresentationItem>
          <PresentationItem md={6} label="Search">
            <div>
              {Object.keys(search)
                .filter((k) => !["sortBy", "content", "reverse"].includes(k))
                .map((k) => (
                  <Tag key={k}>{`${k}: ${[].concat(search[k]).join(", ")}`}</Tag>
                ))}
              <NavLink to={searchUrlOfJob(item?.datasetKey, item?.params)}>
                Re-run search
              </NavLink>
            </div>
          </PresentationItem>
        </Card>
      </List.Item>
    );
  };

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

          <span>{formatTime(item?.created, "MMM Do YYYY")}</span>
        </>}
      extra={renderCancel(item)}>
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
                        <Button href={`${config.gbifUrl}user/profile`}>
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
                        renderItem={(item) =>
                          item?.kind === "search"
                            ? renderSearchDownload(item)
                            : renderDownload(item)
                        }
                        split={false}
                      />
                    </Col>
                    <Col flex="auto"></Col>
                  </Row>
                ),
              },
            ]}
          />

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
