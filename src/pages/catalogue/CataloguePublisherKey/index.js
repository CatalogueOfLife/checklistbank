import React, { useState, useEffect } from "react";
import { Tooltip } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import PresentationItem from "../../../components/PresentationItem";
import moment from "moment";
import { withRouter, NavLink } from "react-router-dom";
import axios from "axios";
import config from "../../../config";
import _ from "lodash";
import { Button, Card, Tag, Spin } from "antd";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";

const DatasetDownload = ({ catalogueKey, match, addError }) => {
  const [publisher, setPublisher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sectorCount, setSectorCount] = useState(0);
  const [datasetCount, setDatasetCount] = useState(0);
  const init = async () => {
    setLoading(true);
    try {
      const res = await axios(
        `${config.dataApi}dataset/${catalogueKey}/sector/publisher/${match?.params?.key}`
      );
      setPublisher(res.data);
      const datasetRes = await axios(
        `${config.dataApi}dataset?limit=0&gbifPublisherKey=${match?.params?.key}`
      );
      setDatasetCount(datasetRes?.data?.total);
      const sectorRes = await axios(
        `${config.dataApi}dataset/${catalogueKey}/sector?limit=0&gbifPublisherKey=${match?.params?.key}`
      );
      setSectorCount(sectorRes?.data?.total);
      setLoading(false);
    } catch (error) {
      addError(error);
      setPublisher(null);
      setLoading(false);
    }
  };
  useEffect(() => {
    if (match?.params?.key) {
      init();
    }
  }, [match.params.key]);

  return (
    <Layout
      openKeys={[]}
      selectedKeys={[]}
      title={`Publisher: ${publisher?.alias}`}
    >
      <PageContent>
        <Spin spinning={loading}>
          <PresentationItem md={4} label="Alias">
            {publisher?.alias}{" "}
          </PresentationItem>
          <PresentationItem md={4} label="Title">
            {publisher?.title}
          </PresentationItem>
          <PresentationItem md={4} label="Description">
            {publisher?.description}
          </PresentationItem>
          <PresentationItem md={4} label="Sectors in project">
            <NavLink
              to={{
                pathname: `/catalogue/${catalogueKey}/sector`,
                search: `?limit=100&offset=0&publisherKey=${publisher?.id}`,
              }}
            >
              {Number(sectorCount).toLocaleString()}
            </NavLink>
          </PresentationItem>
          <PresentationItem md={4} label="Datasets in ChecklistBank">
            <NavLink
              to={{
                pathname: `/dataset`,
                search: `?gbifPublisherKey=${publisher?.id}`,
              }}
            >
              {Number(datasetCount).toLocaleString()}
            </NavLink>
          </PresentationItem>
          <PresentationItem md={4} label="Link">
            <a
              href={`https://www.gbif.org/publisher/${publisher?.id}`}
              target="_blank"
            >
              GBIF <LinkOutlined />
            </a>
          </PresentationItem>
        </Spin>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ catalogueKey, addError }) => ({
  catalogueKey,
  addError,
});
export default withRouter(withContext(mapContextToProps)(DatasetDownload));
