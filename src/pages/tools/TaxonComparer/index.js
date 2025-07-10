import React, { useEffect, useState } from "react";
import {
  Alert,
  Empty,
  Row,
  Col,
  Select,
  Popconfirm,
  Checkbox,
  Tag,
  Spin,
  Button,
  Tooltip,
  Slider,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";
import { withRouter } from "react-router-dom";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import { Diff2Html } from "diff2html";
import "diff2html/dist/diff2html.min.css";
import _ from "lodash";
import moment from "moment";
import history from "../../../history";
import qs from "query-string";
import withContext from "../../../components/hoc/withContext";

import DatasetAutocomplete from "../../catalogue/Assembly/DatasetAutocomplete";
import NameAutocomplete from "../../catalogue/Assembly/NameAutocomplete";
import TaxonSummary from "./TaxonSummary";
const TaxonComparer = ({ location, addError, rank }) => {
  const [loading, setLoading] = useState(false);
  const [datasetKey1, setDatasetKey1] = useState(null);
  const [datasetKey2, setDatasetKey2] = useState(null);
  const [dataset1, setDataset1] = useState(null);
  const [dataset2, setDataset2] = useState(null);
  const [root, setRoot] = useState(null);
  const [root2, setRoot2] = useState(null);
  const [suggestedDataset2Taxon, setSuggestedDataset2Taxon] = useState(null);
  const [suggestedDataset1Taxon, setSuggestedDataset1Taxon] = useState(null);

  useEffect(() => {
    const { search } = location;

    const params = qs.parse(search);
    if (params.dataset2) {
      setDatasetKey2(params.dataset2);
      getDataset(params.dataset2).then((dataset) => {
        setDataset2(dataset);
      });
    } else {
      setDatasetKey2(null);
    }
    if (params.dataset) {
      setDatasetKey1(params.dataset);
      getDataset(params.dataset).then((dataset) => {
        setDataset1(dataset);
      });
    } else {
      setDatasetKey1(null);
    }
    if (params.dataset && params.root) {
      decorate(params.root, params.dataset).then((r) => {
        setRoot(r);
        if (params.dataset2) {
          getSuggestedTaxonInOtherDataset(r, params.dataset2).then(
            (related) => {
              setSuggestedDataset2Taxon(related);
            }
          );
        }
      });
    } else {
      setRoot(null);
    }
    if (params.dataset2 && params.root2) {
      decorate(params.root2, params.dataset2).then((r) => {
        setRoot2(r);
        if (params.dataset) {
          getSuggestedTaxonInOtherDataset(r, params.dataset).then((related) => {
            setSuggestedDataset1Taxon(related);
          });
        }
      });
    } else {
      setRoot2(null);
    }
  }, [location]);

  const updateSearch = (params) => {
    let newParams = {
      ...qs.parse(location.search),
      ...params,
    };
    Object.keys(params).forEach((param) => {
      if (!params[param]) {
        delete newParams[param];
      }
    });
    history.push({
      pathname: _.get(location.pathname),
      search: qs.stringify(newParams),
    });
  };

  const decorate = async (id, datasetKey_) => {
    const { data } = await axios(
      `${config.dataApi}dataset/${datasetKey_}/taxon/${id}`
    );
    return data;
  };

  const getSuggestedTaxonInOtherDataset = async (tx, datasetKey_) => {
    const Id = tx?.id;
    try {
      const relatedres = await axios(
        `${config.dataApi}dataset/${tx?.datasetKey}/nameusage/${Id}/related?datasetKey=${datasetKey_}`
      );
      if (_.get(relatedres, "data[0]")) {
        return _.get(relatedres, "data[0]");
      }
    } catch (err) {
      addError(err);
    }
  };

  const getDataset = async (key) => {
    const { data } = await axios(`${config.dataApi}dataset/${key}`);
    return data;
  };

  return (
    <Layout
      selectedKeys={["datasetComparison"]}
      openKeys={["tools"]}
      title="Dataset comparison (taxon to taxon)"
    >
      <PageContent>
        <Row style={{ marginBottom: "12px" }}>
          <Col span={12} style={{ paddingLeft: "8px" }}>
            <h4>Dataset 1</h4>
          </Col>
          <Col span={6} style={{ paddingLeft: "8px" }}>
            <h4>Dataset 2</h4>
          </Col>
          <Col flex="auto"></Col>
          <Col>
            <Button
              type="primary"
              onClick={() => {
                history.push({
                  pathname: "/tools/diff-viewer",
                  search: location.search,
                });
              }}
              disabled={!root || !root2 || !datasetKey1 || !datasetKey2}
            >
              Show diff
            </Button>
          </Col>
        </Row>
        <Row>
          <Col
            span={12}
            style={{
              borderRightStyle: "solid",
              borderRightColor: "rgba(0, 0, 0, 0.06)",
              borderRightWidth: "1px",
            }}
          >
            <Row>
              <Col span={12}>
                <DatasetAutocomplete
                  defaultDatasetKey={datasetKey1}
                  style={{ width: "100%" }}
                  onError={addError}
                  onResetSearch={() => {
                    updateSearch({ dataset: null, root: [] });
                  }}
                  onSelectDataset={(dataset) => {
                    if (Number(datasetKey1) !== dataset.key) {
                      updateSearch({ dataset: dataset.key, root: null });
                      // setDatasetKey1(dataset.key), setRoot([])
                    }
                  }}
                  // contributesTo={this.props.catalogueKey}
                  placeHolder="Choose 1st dataset"
                />
              </Col>
              <Col
                span={12}
                style={{ paddingLeft: "8px", paddingRight: "12px" }}
              >
                <NameAutocomplete
                  minRank="GENUS"
                  defaultTaxonKey={root?.id}
                  datasetKey={datasetKey1}
                  onError={addError}
                  disabled={!datasetKey1}
                  onSelectName={(name) => {
                    updateSearch({ root: name.key });
                  }}
                  onResetSearch={() => updateSearch({ root: null })}
                />
                {suggestedDataset1Taxon &&
                  suggestedDataset1Taxon?.id !== root?.id && (
                    <Button
                      type="link"
                      onClick={() =>
                        updateSearch({ root: suggestedDataset1Taxon.id })
                      }
                    >
                      <span style={{ marginRight: "5px" }}>Go to</span>{" "}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: suggestedDataset1Taxon.labelHtml,
                        }}
                      ></span>
                    </Button>
                  )}
              </Col>
            </Row>
            <Row>
              {(datasetKey1 && root &&
                <TaxonSummary
                  datasetKey={datasetKey1}
                  dataset={dataset1}
                  taxon={root}
                  onTaxonClick={(id) => updateSearch({ root: id })}
                />
              )}
            </Row>
          </Col>
          <Col span={12} style={{ paddingLeft: "8px" }}>
            <Row>
              <Col span={12}>
                <DatasetAutocomplete
                  defaultDatasetKey={datasetKey2}
                  style={{ width: "100%" }}
                  onError={addError}
                  onResetSearch={() => {
                    updateSearch({ dataset2: null, root2: null });
                  }}
                  onSelectDataset={(dataset) => {
                    if (Number(datasetKey2) !== dataset.key) {
                      updateSearch({ dataset2: dataset.key, root2: null });
                      // setDatasetKey2(dataset.key), setRoot2([])
                    }
                  }}
                  // contributesTo={this.props.catalogueKey}
                  placeHolder="Choose 2nd dataset"
                />
              </Col>
              <Col span={12} style={{ paddingLeft: "8px" }}>
                <NameAutocomplete
                  minRank="GENUS"
                  defaultTaxonKey={root2?.id}
                  datasetKey={datasetKey2}
                  onError={addError}
                  disabled={!datasetKey2}
                  onSelectName={(name) => {
                    updateSearch({ root2: name.key });
                    // setRoot2([...root2, name]);
                  }}
                  onResetSearch={() => updateSearch({ root2: null })}
                />
                {suggestedDataset2Taxon &&
                  suggestedDataset2Taxon?.id !== root2?.id && (
                    <Button
                      type="link"
                      onClick={() =>
                        updateSearch({ root2: suggestedDataset2Taxon.id })
                      }
                    >
                      <span style={{ marginRight: "5px" }}>Go to</span>{" "}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: suggestedDataset2Taxon.labelHtml,
                        }}
                      ></span>
                    </Button>
                  )}
              </Col>
            </Row>
            <Row style={{ paddingLeft: "8px" }}>
              {datasetKey2 && root2 && (
                <TaxonSummary
                  datasetKey={datasetKey2}
                  dataset={dataset2}
                  taxon={root2}
                  onTaxonClick={(id) => updateSearch({ root2: id })}
                />
              )}
            </Row>
          </Col>
        </Row>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError, rank }) => ({ addError, rank });

export default withContext(mapContextToProps)(withRouter(TaxonComparer));
