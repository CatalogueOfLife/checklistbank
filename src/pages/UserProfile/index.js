import React, { useState, useEffect } from "react";
import Layout from "../../components/LayoutNew";
import { NavLink, withRouter } from "react-router-dom";
import PresentationItem from "../../components/PresentationItem";
import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import Exception from "../../components/exception/Exception";
import config from "../../config";
import axios from "axios";
import _ from "lodash";
import { DownloadOutlined, HistoryOutlined, SyncOutlined } from "@ant-design/icons";
import { Tag, List, Row, Col, Button, Tabs, Tooltip, Card, Spin } from "antd";
import moment from "moment";
import history from "../../history";
const { TabPane } = Tabs;
const UserProfile = ({ user, countryAlpha2, match }) => {
  const [editorDatasets, setEditorDatasets] = useState([]);
  const [reviewerDatasets, setReviewerDatasets] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [hasRunningDownload, setHasRunningDownload] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [intervalHandle, setIntervalHandle] = useState(null)
  useEffect(() => {
    const init = async () => {
      const editorDatasets_ = await axios(
        `${config.dataApi}dataset?editor=${user?.key}&limit=1000`
      );
      const reviewerDatasets_ = await axios(
        `${config.dataApi}dataset?reviewer=${user?.key}&limit=1000`
      );
      const downloads_ = await axios(
        `${config.dataApi}export?createdBy=${user?.key}`
      );

      if (editorDatasets_?.data?.result) {
        setEditorDatasets(editorDatasets_?.data?.result);
      }
      if (reviewerDatasets_?.data?.result) {
        setReviewerDatasets(reviewerDatasets_?.data?.result);
      }
      if (downloads_?.data?.result) {
        setDownloads(downloads_?.data?.result);
        const running = downloads_?.data?.result.find(e => e.status === "running");
        if(running){
          setHasRunningDownload(true)
        }
      }
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
     let hdl = setInterval(async () => {
        const downloads_ = await axios(
          `${config.dataApi}export?createdBy=${user?.key}`
        );
        if (downloads_?.data?.result) {
          setDownloads(downloads_?.data?.result);
          const running = downloads_?.data?.result.find(e => e.status === "running");
          if(running){
            setHasRunningDownload(true)
          }
        }
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
          <Tag>{item?.origin === "managed" ? "project" : item?.origin}</Tag>
        }
        description={
          <NavLink
            to={{
              pathname:
                item?.origin === "managed"
                  ? `/catalogue/${item?.key}/assembly`
                  : `/dataset/${item?.key}/about`,
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
          ) : <SyncOutlined style={{ marginRight: "10px", marginLeft: "10px" }} spin />}
          
          <span>{moment(item?.created).format("MMM Do YYYY")}</span> 
        </>}>
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
          <Tabs activeKey={activeTab} onChange={tb => {
            history.push({
              pathname: tb === "profile" ? "/user-profile" : `/user-profile/${tb}`
            })
          }} >
            <TabPane tab="Profile" key="profile">
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
                <PresentationItem label="Email">{user?.email}</PresentationItem>
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
                  {user?.country &&
                    _.startCase(countryAlpha2[user?.country]?.name)}
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
            </TabPane>
            <TabPane tab={`Editor (${editorDatasets.length})`} key="editor">
              <List dataSource={editorDatasets} renderItem={renderItem} />
            </TabPane>
            <TabPane tab={`Reviewer (${reviewerDatasets.length})`} key="reviewer">
              <List dataSource={reviewerDatasets} renderItem={renderItem} />
            </TabPane>
            <TabPane tab={`Downloads (${downloads.length})`} key="downloads" >
              <Row>
                <Col flex="auto"></Col>
                <Col><List dataSource={downloads} renderItem={renderDownload} split={false} /></Col>
                <Col flex="auto"></Col>
              </Row>
              
            </TabPane>
          </Tabs>

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
