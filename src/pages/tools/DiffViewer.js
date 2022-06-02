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
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
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
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false)
  const [datasetKey1, setDatasetKey1] = useState(null);
  const [datasetKey2, setDatasetKey2] = useState(null);
  const [root, setRoot] = useState([]);
  const [root2, setRoot2] = useState([]);
  const [minRank, setMinRank] = useState(null);
  const [synonyms, setSynonyms] = useState(false);
  const [showParent, setShowParent] = useState(false);
  const [parentRank, setParentRank] = useState("");
  const [authorship, setAuthorship] = useState(true)
  useEffect(() => {
    const { search } = location;

    const params = qs.parse(search);
    console.log(params);
    if(params.dataset2 ){
      setDatasetKey2(params.dataset2);
    } else {
      setDatasetKey2(null);
    }
    if(params.dataset  ){
      setDatasetKey1(params.dataset);
    }else {
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
    setHTML(null);
    setDiff(null);
    setEmpty(false);
    setDatasetKey1(null);
    setDatasetKey2(null);
    setRoot([]);
    setRoot2([]);
    setMinRank(null);
    history.push({
      ...location,
      search: "",
    });
  };

  const getData = async () => {

    let params = {
      dataset: datasetKey1,
      dataset2: datasetKey2
    }
    if (root.length > 0) {
      params.root = root.map((t) => t.key);
    }
    if (root2.length > 0) {
      params.root2 = root2.map((t) => t.key);
    }
    const search = `?${qs.stringify(params)}`;
    setEmpty(false)
    setLoading(true); 
    history.push({
      ...location,
      search // search + `&dataset=${datasetKey1}&dataset2=${datasetKey2}`,
    });
    try {
      const { data: diff } = await axios(
        `${config.dataApi}dataset/${datasetKey1}/diff/${datasetKey2}${search}${
          minRank ? "&minRank=" + minRank : ""
        }${synonyms ? "&synonyms=true" : ""}${showParent ? "&showParent=true":"" }${showParent ? "&parentRank=" + parentRank :"" }${!authorship ? "&authorship=false":""}`
      );
      let html;
      if(!diff){
        setEmpty(true)
      }
      makeFile(diff);
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
  const makeFile = function (text) {
    var data = new Blob([text], { type: "text/plain" });

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (diff !== null) {
      setDiff(null);
      window.URL.revokeObjectURL(diff);
    }
    return setDiff(window.URL.createObjectURL(data));
  };

  const decorate = async (id, datasetKey_) => {
    const { data } = await axios(
      `${config.dataApi}dataset/${datasetKey_}/taxon/${id}`
    );
    const {data: {total}}  = await axios(
      // `${config.dataApi}dataset/${datasetKey_}/taxon/${id}`
      `${config.dataApi}dataset/${datasetKey_}/nameusage/search?TAXON_ID=${id}&limit=0`
     );
    return {
      key: data.id,
      title: _.get(data, "name.scientificName"),
      total
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
      ...params
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
      selectedKeys={["diffviewer"]}
      openKeys={["tools"]}
      title="Diff Viewer"
    >
      <PageContent>
        <Row style={{ marginBottom: "8px" }}>
          <Col span={9} style={{ padding: "8px" }}>
            <DatasetAutocomplete
              defaultDatasetKey={datasetKey1}
              onError={addError}
              onResetSearch={() => { updateSearch({dataset: null, root: []})}}
              onSelectDataset={(dataset) => {
                if(Number(datasetKey1) !== dataset.key){
                  updateSearch({dataset: dataset.key, root: null})
                  // setDatasetKey1(dataset.key), setRoot([])
                }}}
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
                  updateSearch({root: [...root, name].map(tx => tx.key)})
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
                      updateSearch({root: [...root.filter((tx) => tx.key !== t.key)].map(tx => tx.key)})
                      //setRoot([...root.filter((tx) => tx.key !== t.key)]);
                    }}
                  >
                    {t.title} {t?.total ? `(${t?.total?.toLocaleString()})` : ""}
                  </Tag>
                ))}
              </React.Fragment>
            )}
          </Col>
          <Col span={9} style={{ padding: "8px" }}>
            <DatasetAutocomplete
              defaultDatasetKey={datasetKey2}
              onError={addError}
              onResetSearch={() => {
                updateSearch({dataset2: null, root2: []})
              }}
              onSelectDataset={(dataset) => {
                if(Number(datasetKey2) !== dataset.key){
                  updateSearch({dataset2: dataset.key, root2: null})
                 // setDatasetKey2(dataset.key), setRoot2([])
                }}}
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
                  updateSearch({root2: [...root2, name].map(tx => tx.key)})
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
                      updateSearch({root2: [...root2.filter((tx) => tx.key !== t.key)].map(tx => tx.key)})
                     // setRoot2([...root2.filter((tx) => tx.key !== t.key)]);
                    }}
                  >
                    {t.title} {t?.total ? `(${t?.total?.toLocaleString()})` : ""}
                  </Tag>
                ))}
              </React.Fragment>
            )}
          </Col>
          <Col span={6} style={{ padding: "8px" }}>
            <Row style={{ marginBottom: "8px" }}>
            <Col >
                <Checkbox checked={authorship} onChange={(e) => setAuthorship(e.target.checked)}>
                  Authorship
                </Checkbox>
              </Col>
              <Col flex="auto">
                <Checkbox onChange={(e) => setSynonyms(e.target.checked)}>
                  Synonyms
                </Checkbox>
              </Col>
              </Row>
            
            <Row style={{ marginBottom: "8px" }}>
            <Col flex="auto">
                <Checkbox onChange={(e) => setShowParent(e.target.checked)}>
                  Show parent
                </Checkbox>
              </Col>
              <Col >
              <Select
                  value={parentRank}
                  onChange={setParentRank}
                  placeholder="Select parent rank"
                  allowClear
                  showSearch
                  disabled={!showParent}
                  style={{width: '140px'}}
                >
                  <Option key="" value="">
                      Direct parent
                    </Option>
                  {rank.map((r) => (
                    <Option key={r} value={r}>
                      {r}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Row style={{ marginBottom: "8px" }}>
              <Col flex="auto"></Col>
              <Col>
                <Select
                  value={minRank}
                  onChange={setMinRank}
                  placeholder="Select min rank"
                  allowClear
                  showSearch
                  style={{width: '140px'}}

                >
                  {rank.map((r) => (
                    <Option key={r} value={r}>
                      {r}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Row>
              <Col flex="auto"></Col>
              <Col>
              
              {diff && !empty && (
                <Tooltip title="Download unified diff">
                  <Button
                    disabled={loading}
                    type="primary"
                    href={diff}
                    download={`dataset${datasetKey1}_dataset${datasetKey2}.diff`}
                    style={{ marginRight: "10px" }}
                  >
                    <DownloadOutlined />
                  </Button>
                </Tooltip>
              )}
              
                
            

              
                <Button                   
                style={{ marginRight: "10px" }}
                type="danger" onClick={resetAll}>
                  Reset
                </Button>
            <Popconfirm
            disabled={root.length > 0 && root2.length > 0}
            title={<>You have not selected root taxa for both datasets, proceed anyways?<br /> This may produce very large diffs or the server may be overloaded.</>}
            onConfirm={getData}
            placement="leftTop"
            >

              <Button
                  loading={loading}
                  disabled={loading || !datasetKey1 || !datasetKey2}
                  type="primary"
                  onClick={() => { if(root.length > 0 && root2.length > 0){
                    getData()
                  }}}
                >
                  Get Diff
                </Button>
                </Popconfirm>
              </Col>
              
            </Row>
            
          </Col>
        </Row>

        {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
        {empty && <Empty description="No diff"/>}
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
    </Layout>
  );
};

const mapContextToProps = ({ addError, rank }) => ({ addError, rank });

export default withContext(mapContextToProps)(withRouter(DiffViewer));
