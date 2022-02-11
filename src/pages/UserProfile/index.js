import React, { useState, useEffect } from "react";
import Layout from "../../components/LayoutNew";
import { NavLink } from "react-router-dom";
import PresentationItem from "../../components/PresentationItem";
import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import Exception from "../../components/exception/Exception";
import config from "../../config";
import axios from "axios";
import _ from "lodash";
import { Tag, List, Row, Col, Button } from "antd";
const UserProfile = ({ user, countryAlpha2 }) => {
  const [editorDatasets, setEditorDatasets] = useState([]);
  const [reviewerDatasets, setReviewerDatasets] = useState([]);
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
    };
    init();
  }, [user]);

  const renderItem = (item) => (
    <List.Item >
        <List.Item.Meta
          avatar={<Tag>{item?.origin === "managed" ? "project" : item?.origin}</Tag>}
          description={<NavLink
            to={{
              pathname:
                item?.origin === "managed"
                  ? `/catalogue/${item?.key}/assembly`
                  : `/dataset/${item?.key}/about`,
            }}
          >
            {item?.title}
          </NavLink>}
        />
      

      
    </List.Item>
  );
  return (
    <Layout 
    title={user?.username ? `User profile: ${user?.username}` : ""}>
        
        {user ?  <PageContent >
        <Row><Col flex="auto"></Col><Col><Button href="https://www.gbif.org/user/profile">Edit on gbif.org</Button></Col></Row>
        <Row>
          <PresentationItem label="UserName">{user?.username}</PresentationItem>
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
            {user?.country && _.startCase(countryAlpha2[user?.country]?.name)}
          </PresentationItem>
          <PresentationItem label="Roles">
            {user?.roles?.length && (
              <div>
                {user.roles.map((r) => (
                  <Tag>{r}</Tag>
                ))}{" "}
              </div>
            )}
          </PresentationItem>
        </Row>
        <Row>
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
        </Row>
      </PageContent> : <Exception type={401}></Exception>}
    </Layout> 
  );
};

const mapContextToProps = ({ user, countryAlpha2 }) => ({
  user,
  countryAlpha2,
});

export default withContext(mapContextToProps)(UserProfile);
