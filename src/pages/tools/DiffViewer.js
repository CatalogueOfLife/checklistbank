import React, { useEffect, useState } from "react";
import {
  Alert,
  Empty,
  Row,
  Col,
  Select,
  notification,
  Tag,
  Spin,
  Button,
  Space,
} from "antd";
import axios from "axios";
import config from "../../config";
import ErrorMsg from "../../components/ErrorMsg";
import { withRouter } from "react-router-dom";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { Diff2Html } from "diff2html";
import "diff2html/dist/diff2html.min.css";
import _ from "lodash";
import moment from "moment";
import history from "../../history";
import qs from "query-string";
import withContext from "../../components/hoc/withContext";

import DatasetAutocomplete from "../catalogue/Assembly/DatasetAutocomplete";
import NameAutocomplete from "../catalogue/Assembly/NameAutocomplete";

const { Option } = Select;

const DiffViewer = ({ location, addError, rank }) => {
  const [html, setHTML] = useState(null);
  const [loading, setLoading] = useState(false);
  const [datasetKey1, setDatasetKey1] = useState(null);
  const [datasetKey2, setDatasetKey2] = useState(null);
  const [root, setRoot] = useState([]);
  const [root2, setRoot2] = useState([]);
  const [minRank, setMinRank] = useState(null);

  useEffect(() => {
    const { search } = location;

    const params = qs.parse(search);
    console.log(params);
    if (params.dataset && params.root) {
      decorateRootsFromQuery(params.root, params.dataset).then((r) => {
        setRoot(r);
        setDatasetKey1(params.dataset);
      });
    }
    if (params.dataset2 && params.root2) {
      decorateRootsFromQuery(params.root2, params.dataset2).then((r) => {
        setRoot2(r);
        setDatasetKey2(params.dataset2);
      });
    }
  }, [location]);

  const getData = async () => {
    let search = "";
    if (root.length > 0) {
      search += root.map((t) => `root=${t.key}`).join("&");
    }
    if (root2.length > 0) {
      if (search) {
        search += "&";
      }
      search += root2.map((t) => `root2=${t.key}`).join("&");
    }
    if (search) {
      search = "?" + search;
    }
    setLoading(true);
    history.push({
      ...location,
      search: search + `&dataset=${datasetKey1}&dataset2=${datasetKey2}`,
    });
    try {
      const { data: diff } = await axios(
        `${config.dataApi}dataset/${datasetKey1}/diff/${datasetKey2}${search}`
      );
      let html;

      html = Diff2Html.getPrettyHtml(diff, {
        inputFormat: "diff",
        showFiles: false,
        matching: "lines",
        outputFormat: "side-by-side",
      });
      setHTML(html);
    } catch (error) {
      addError(error);
      setHTML(null);
    }

    setLoading(false);
  };

  const decorate = async (id, datasetKey_) => {
    const { data } = await axios(
      `${config.dataApi}dataset/${datasetKey_}/taxon/${id}`
    );
    console.log(data);
    return {
      key: data.id,
      title: _.get(data, "name.scientificName"),
    };
  };
  const decorateRootsFromQuery = async (roots, datasetKey_) => {
    if (typeof roots === "string") {
      const result = await decorate(roots, datasetKey_);
      return [result];
    } else if (_.isArray(roots)) {
      return Promise.all(roots.map((r) => decorate(r, datasetKey_)));
    }
  };

  return (
    <Layout
      selectedKeys={["diffviewer"]}
      openKeys={["tools"]}
      title="Diff Viewer"
    >
      <PageContent>
        <Row style={{ marginBottom: "8px" }}>
          <Col span={10} style={{ padding: "8px" }}>
            <DatasetAutocomplete
              defaultDatasetKey={datasetKey1}
              onResetSearch={() => setDatasetKey1(null)}
              onSelectDataset={(dataset) => setDatasetKey1(dataset.key)}
              // contributesTo={this.props.catalogueKey}
              placeHolder="Choose 1st dataset"
            />
            <div style={{ marginTop: "8px", marginBottom: "8px" }}>
              <NameAutocomplete
                minRank="GENUS"
                datasetKey={datasetKey1}
                onError={addError}
                disabled={!datasetKey1}
                onSelectName={(name) => {
                  setRoot([...root, name]);
                }}
                onResetSearch={() => {}}
              />
            </div>
            {root.length > 0 && (
              <React.Fragment>
                <span className="small-text">Selected root(s): </span>
                {root.map((t) => (
                  <Tag
                    key={t.key}
                    closable
                    onClose={() => {
                      setRoot([...root.filter((tx) => tx.key !== t.key)]);
                    }}
                  >
                    {t.title}
                  </Tag>
                ))}
              </React.Fragment>
            )}
          </Col>
          <Col span={10} style={{ padding: "8px" }}>
            <DatasetAutocomplete
              defaultDatasetKey={datasetKey2}
              onResetSearch={() => setDatasetKey2(null)}
              onSelectDataset={(dataset) => setDatasetKey2(dataset.key)}
              // contributesTo={this.props.catalogueKey}
              placeHolder="Choose 2nd dataset"
            />
            <div style={{ marginTop: "8px", marginBottom: "8px" }}>
              <NameAutocomplete
                minRank="GENUS"
                datasetKey={datasetKey2}
                onError={addError}
                disabled={!datasetKey2}
                onSelectName={(name) => {
                  setRoot2([...root2, name]);
                }}
                onResetSearch={() => {}}
              />
            </div>
            {root2.length > 0 && (
              <React.Fragment>
                <span className="small-text">Selected root(s): </span>

                {root2.map((t) => (
                  <Tag
                    key={t.key}
                    closable
                    onClose={() => {
                      setRoot2([...root2.filter((tx) => tx.key !== t.key)]);
                    }}
                  >
                    {t.title}
                  </Tag>
                ))}
              </React.Fragment>
            )}
          </Col>
          <Col span={4} style={{ padding: "8px", textAlign: "right" }}>
            <Button
              loading={loading}
              disabled={loading}
              type="primary"
              onClick={getData}
            >
              Get Diff
            </Button>
          </Col>
        </Row>

        {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
        {loading && (
          <Row style={{ marginTop: "40px" }}>
            <Col flex="auto"></Col>
            <Col>
              <Spin size="large" />
            </Col>
            <Col flex="auto"></Col>
          </Row>
        )}
        {_.get(this.state, "data") === "" && (
          <Row style={{ marginTop: "40px" }}>
            <Col flex="auto"></Col>
            <Col>
              <Empty description="No diff between import attempts" />
            </Col>
            <Col flex="auto"></Col>
          </Row>
        )}
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError, rank }) => ({ addError, rank });

export default withContext(mapContextToProps)(withRouter(DiffViewer));
