import axios from "axios";
import React, { useState, useEffect } from "react";
import { withRouter } from "react-router-dom";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import Root from "./Root";
import { Select, Row, Col } from "antd";
import history from "../../../history";
import withContext from "../../../components/hoc/withContext";
import qs from "query-string";
import moment from "moment";
import _ from "lodash";
const { Option } = Select;
const DOWNLOADS_URL = "https://download.catalogueoflife.org/taxreview/";
const GBIFTaxonomyReview = ({ location }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [filesByFileName, setFilesByFileName] = useState({});
  useEffect(() => {
    if (location.search) {
      const params = qs.parse(location.search);
      if (params.csv) {
        setSelectedFile(params.csv);
      }
    }
  }, [location]);

  const getAvailableDataFiles = () => {
    axios
      .get("https://download.catalogueoflife.org/taxreview/index.json", {
        transformRequest: (data, headers) => {
          delete headers.common["Authorization"];
          return data;
        },
      })
      .then((res) => {
        setAvailableFiles(res.data.reports);
        setFilesByFileName(_.keyBy(res.data.reports, "filename"));
        // console.log(res.data.reports);
      });
  };
  useEffect(() => {
    getAvailableDataFiles();
  }, []);

  return (
    <Layout
      selectedKeys={["gbif-impact"]}
      openKeys={["tools"]}
      title="GBIF impact"
    >
      <PageContent>
        <Row>
          <Col span={4}>Selected file: </Col>
          <Col span={12}>
            <Select
              value={selectedFile}
              placeholder="Select a file for review"
              style={{ width: "78%", marginBottom: "8px", marginLeft: "-2px" }}
              onChange={(e) => {
                const search = e
                  ? `?csv=${e}&colKey=${filesByFileName[e].colKey}`
                  : null;
                history.push({
                  pathname: location.path,
                  search,
                });
                setSelectedFile(e);
              }}
            >
              <Option key={null} value={null}>
                <strong>- No file -</strong>
              </Option>
              {availableFiles.map((f) => (
                <Option key={f.filename} value={f.filename}>
                  <strong>{f.name}</strong>
                  <span className="small-text">
                    {" - "}
                    {moment(f.created).format("MMMM Do YYYY")}
                  </span>
                  <br />
                  <span className="small-text">{f.description}</span>
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={8} style={{ textAlign: "right" }}>
            {filesByFileName[selectedFile] && (
              <a
                href={`https://www.checklistbank.org/dataset/${filesByFileName[selectedFile].colKey}/names`}
              >
                Browse COL: {filesByFileName[selectedFile].colVersion}
              </a>
            )}
          </Col>
        </Row>

        {selectedFile && <Root />}
        {!selectedFile && (
          <Row style={{ marginTop: 20 }}>
            <Col style={{ paddingRight: "30px" }} span={24}>
              <p>
                This tool compares taxonomic interpretation of{" "}
                <a href="https://www.gbif.org/occurrence/search">
                  GBIF occurrence records
                </a>{" "}
                between the current GBIF taxonomic backbone and the Catalogue of
                Life.
              </p>
            </Col>
          </Row>
        )}
      </PageContent>
    </Layout>
  );
};
const mapContextToProps = ({ addError }) => ({ addError });

export default withContext(mapContextToProps)(withRouter(GBIFTaxonomyReview));
