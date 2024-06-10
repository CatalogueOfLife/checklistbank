import React, { useEffect, useState } from "react";
import { Row, Col, Popconfirm, Tag, Spin, Button, Divider, Modal } from "antd";
import axios from "axios";
import config from "../../config";
import { withRouter } from "react-router-dom";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import "diff2html/dist/diff2html.min.css";
import _ from "lodash";
import history from "../../history";
import qs from "query-string";
import withContext from "../../components/hoc/withContext";

import DatasetAutocomplete from "../catalogue/Assembly/DatasetAutocomplete";
import NameAutocomplete from "../catalogue/Assembly/NameAutocomplete";
import { error } from "highcharts";

const TaxAlign = ({ location, addError }) => {
  const [loading, setLoading] = useState(false);
  const [datasetKey1, setDatasetKey1] = useState(null);
  const [datasetKey2, setDatasetKey2] = useState(null);
  const [root, setRoot] = useState([]);
  const [root2, setRoot2] = useState([]);
  const [submittedJob, setSubmittedJob] = useState(null);

  useEffect(() => {
    const { search } = location;

    const params = qs.parse(search);
    console.log(params);
    if (params.dataset2) {
      setDatasetKey2(params.dataset2);
    } else {
      setDatasetKey2(null);
    }
    if (params.dataset) {
      setDatasetKey1(params.dataset);
    } else {
      setDatasetKey1(null);
    }
    if (params.dataset && params.root) {
      decorateRootsFromQuery(params.root, params.dataset).then((r) => {
        setRoot(r);
      });
    } else {
      setRoot([]);
    }
    if (params.dataset2 && params.root2) {
      decorateRootsFromQuery(params.root2, params.dataset2).then((r) => {
        setRoot2(r);
      });
    } else {
      setRoot2([]);
    }
  }, [location]);

  const resetAll = () => {
    setDatasetKey1(null);
    setDatasetKey2(null);
    setRoot([]);
    setRoot2([]);
    history.push({
      ...location,
      search: "",
    });
  };

  const submitJob = async () => {
    let params = {
      dataset: datasetKey1,
      dataset2: datasetKey2,
    };
    if (root.length > 0) {
      params.root = root.map((t) => t.key);
    }
    if (root2.length > 0) {
      params.root2 = root2.map((t) => t.key);
    }
    const search = `?${qs.stringify(params)}`;
    setLoading(true);
    history.push({
      ...location,
      search, // search + `&dataset=${datasetKey1}&dataset2=${datasetKey2}`,
    });
    try {
      const res = await axios.post(
        `${config.dataApi}dataset/${datasetKey1}/taxalign/${datasetKey2}${search}`
      );

      setSubmittedJob(res?.data);
      console.log(res?.data);
    } catch (error) {
      addError(error);
      setLoading(false);
    }
  };

  const decorate = async (id, datasetKey_) => {
    const { data } = await axios(
      `${config.dataApi}dataset/${datasetKey_}/taxon/${encodeURIComponent(id)}`
    );
    const {
      data: { total },
    } = await axios(
      // `${config.dataApi}dataset/${datasetKey_}/taxon/${id}`
      `${
        config.dataApi
      }dataset/${datasetKey_}/nameusage/search?TAXON_ID=${encodeURIComponent(
        id
      )}&limit=0`
    );
    return {
      key: data.id,
      title: _.get(data, "name.scientificName"),
      total,
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

  return (
    <Layout
      selectedKeys={["taxalign"]}
      openKeys={["tools"]}
      title="Taxonomic alignment"
    >
      <PageContent>
        <Row style={{ marginBottom: "8px" }}>
          <Col>
            This tool allows you to run{" "}
            <a href="https://github.com/jar398/listtools" target="_blank">
              listtools
            </a>{" "}
            on two selected datasets in ChecklistBank. Read more about the
            semantics of listtools{" "}
            <a
              href="https://github.com/jar398/listtools/blob/main/doc/guide.md#semantics"
              target="_blank"
            >
              here.
            </a>
          </Col>
          <Col flex="auto"></Col>

          <Button
            style={{ marginRight: "10px" }}
            type="danger"
            onClick={resetAll}
          >
            Reset
          </Button>
          <Popconfirm
            disabled={root.length > 0 && root2.length > 0}
            title={
              <>
                You have not selected root taxa for both datasets, proceed
                anyways?
                <br /> This may produce very large diffs or the server may be
                overloaded.
              </>
            }
            onConfirm={submitJob}
            placement="leftTop"
          >
            <Button
              loading={loading}
              disabled={loading || !datasetKey1 || !datasetKey2}
              type="primary"
              onClick={() => {
                if (root.length > 0 && root2.length > 0) {
                  submitJob();
                }
              }}
            >
              Submit
            </Button>
          </Popconfirm>
        </Row>

        <Row style={{ marginBottom: "8px" }}>
          <Col
            span={12}
            style={{
              padding: "8px",
              borderRightStyle: "solid",
              borderRightColor: "rgba(0, 0, 0, 0.06)",
              borderRightWidth: "1px",
            }}
          >
            <Divider orientation="left" plain>
              Dataset 1
            </Divider>
            <DatasetAutocomplete
              defaultDatasetKey={datasetKey1}
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
            <div style={{ marginTop: "8px", marginBottom: "8px" }}>
              <NameAutocomplete
                minRank="GENUS"
                datasetKey={datasetKey1}
                onError={addError}
                disabled={!datasetKey1}
                onSelectName={(name) => {
                  updateSearch({ root: [...root, name].map((tx) => tx.key) });
                  // setRoot([...root, name]);
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
                      updateSearch({
                        root: [...root.filter((tx) => tx.key !== t.key)].map(
                          (tx) => tx.key
                        ),
                      });
                      //setRoot([...root.filter((tx) => tx.key !== t.key)]);
                    }}
                  >
                    {t.title}{" "}
                    {t?.total ? `(${t?.total?.toLocaleString()})` : ""}
                  </Tag>
                ))}
              </React.Fragment>
            )}
          </Col>
          <Col span={12} style={{ padding: "8px" }}>
            <Divider orientation="left" plain>
              Dataset 2
            </Divider>
            <DatasetAutocomplete
              defaultDatasetKey={datasetKey2}
              onError={addError}
              onResetSearch={() => {
                updateSearch({ dataset2: null, root2: [] });
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
            <div style={{ marginTop: "8px", marginBottom: "8px" }}>
              <NameAutocomplete
                minRank="GENUS"
                datasetKey={datasetKey2}
                onError={addError}
                disabled={!datasetKey2}
                onSelectName={(name) => {
                  updateSearch({ root2: [...root2, name].map((tx) => tx.key) });
                  // setRoot2([...root2, name]);
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
                      updateSearch({
                        root2: [...root2.filter((tx) => tx.key !== t.key)].map(
                          (tx) => tx.key
                        ),
                      });
                      // setRoot2([...root2.filter((tx) => tx.key !== t.key)]);
                    }}
                  >
                    {t.title}{" "}
                    {t?.total ? `(${t?.total?.toLocaleString()})` : ""}
                  </Tag>
                ))}
              </React.Fragment>
            )}
          </Col>
        </Row>

        {loading && (
          <Row style={{ marginTop: "40px" }}>
            <Col flex="auto"></Col>
            <Col>
              <Spin size="large" />
            </Col>
            <Col flex="auto"></Col>
          </Row>
        )}
      </PageContent>
      <Modal
        visible={!!submittedJob}
        footer={null}
        onCancel={() => setSubmittedJob(null)}
      >
        <p>
          The data is being processed. You will recieive an email shortly with
          instructions on how to download the results.
        </p>
      </Modal>
    </Layout>
  );
};

const mapContextToProps = ({ addError, rank }) => ({ addError, rank });

export default withContext(mapContextToProps)(withRouter(TaxAlign));
