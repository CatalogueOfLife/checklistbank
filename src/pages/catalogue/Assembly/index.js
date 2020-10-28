import React from "react";
import { EyeOutlined, PlusOutlined, SyncOutlined } from "@ant-design/icons";
import {
  Row,
  Col,
  notification,
  Button,
  Card,
  Alert,
  Radio,
  Slider,
  Switch,
} from "antd";
import { NavLink } from "react-router-dom";
import _ from "lodash";
import Layout from "../../../components/LayoutNew";
import axios from "axios";
import config from "../../../config";
import { ColTreeContext } from "./ColTreeContext";
import ErrorMsg from "../../../components/ErrorMsg";
import ColTree from "./ColTree";
import DatasetAutocomplete from "./DatasetAutocomplete";
import NameAutocomplete from "./NameAutocomplete";
import PageContent from "../../../components/PageContent";
import SyncState from "./SyncState";
import AddChildModal from "./AddChildModal";
import Helmet from "react-helmet";
import qs from "query-string";
import history from "../../../history";
import withContext from "../../../components/hoc/withContext";

const { syncStateHeartbeat } = config;
class Assembly extends React.Component {
  constructor(props) {
    super(props);
    const params = qs.parse(_.get(this.props, "location.search"));

    this.state = {
      mode: "attach",
      assemblyColSpan: 12,
      sourceColSpan: 12,
      showSync: true,
      syncState: {},
      syncingDataset: null,
      syncingSector: null,
      assemblyTaxonKey: params.assemblyTaxonKey || null,
      sourceTaxonKey: null,
      childModalVisible: false,
      missingTargetKeys: {}, // A map of keys that could not be found in the assembly. If a sectors target key is missing, flag that the sector is broken and may be deleted
      height: 600,
    };

    // this.assemblyRef = React.createRef();
    // this.sourceRef = React.createRef();
    this.wrapperRef = React.createRef();
  }

  componentDidMount() {
    const params = qs.parse(_.get(this.props, "location.search"));
    if (params.sourceTaxonKey && params.datasetKey) {
      this.showSourceTaxon(
        { subject: { id: params.sourceTaxonKey } },
        { key: params.datasetKey }
      );
    }
    this.getSyncState();
    this.timer = setInterval(() => {
      this.getSyncState();
    }, syncStateHeartbeat);
    this.resizeHandler();
    window.addEventListener("resize", this.resizeHandler);
  }
  resizeHandler = () => {
    const height = _.get(this.wrapperRef, "current.clientHeight");
    if (height) {
      this.setState({ height });
    }
  };
  componentDidUpdate = (prevProps) => {
    const params = qs.parse(_.get(this.props, "location.search"));
    const prevParams = qs.parse(_.get(prevProps, "location.search"));
    if (
      _.get(params, "assemblyTaxonKey") !==
      _.get(prevParams, "assemblyTaxonKey")
    ) {
      this.setState({
        assemblyTaxonKey: _.get(params, "assemblyTaxonKey") || null,
      });
    }
    if (
      _.get(params, "sourceTaxonKey") !== _.get(prevParams, "sourceTaxonKey")
    ) {
      this.setState({
        sourceTaxonKey: _.get(params, "sourceTaxonKey") || null,
      });
    }
  };

  componentWillUnmount() {
    clearInterval(this.timer);
    window.removeEventListener("resize", this.resizeHandler);
  }

  getSyncState = async () => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;

    try {
      const { data: syncState } = await axios(
        `${config.dataApi}dataset/${catalogueKey}/assembly`
      );
      if (
        _.get(syncState, "running") &&
        _.get(syncState, "running.sectorKey") !==
          _.get(this.state, "syncState.running.sectorKey")
      ) {
        const { data: sector } = await axios(
          `${config.dataApi}dataset/${catalogueKey}/sector/${_.get(
            syncState,
            "running.sectorKey"
          )}`
        );
        const { data: sectorDataset } = await axios(
          `${config.dataApi}dataset/${sector.subjectDatasetKey}`
        );
        this.setState({
          syncingDataset: sectorDataset,
          syncingSector: sector,
          syncState: syncState,
        });
      } else if (!_.get(syncState, "running")) {
        this.setState({
          syncingDataset: null,
          syncingSector: null,
          syncState: syncState,
        });
      } else {
        this.setState({ syncState: syncState });
      }
    } catch (err) {
      this.setState({ syncError: err });
    }
  };

  getSectorInfo = (attachment, root, mode) => {
    /* const { datasetKey } = this.state;
    const {
      match: {
        params: { catalogueKey }
      }
    } = this.props; */
    const rootData = _.get(root, "taxon");
    const attachmentData = _.get(attachment, "taxon");
    return mode === "REPLACE"
      ? this.replace(rootData, attachmentData, mode)
      : this.saveSector(rootData, attachmentData, mode);
  };

  saveChild = (subject, target) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;

    return axios
      .post(`${config.dataApi}dataset/${catalogueKey}/tree/${target.id}/copy`, {
        datasetKey: subject.datasetKey,
        id: subject.id,
      })
      .then((res) => {
        return axios(
          `${config.dataApi}dataset/${catalogueKey}/taxon/${encodeURIComponent(
            res.data
          )}`
        );
      });
  };
  replace = (subject, target, mode) => {
    const { parentId } = target;
    const { assemblyTaxonKey } = this.state;
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    const params = qs.parse(_.get(this.props, "location.search"));
    return axios(
      `${config.dataApi}dataset/${catalogueKey}/taxon/${encodeURIComponent(
        parentId
      )}`
    )
      .then((res) => {
        const parent = res.data;
        // delete recursive
        return axios
          .delete(`${config.dataApi}dataset/${catalogueKey}/tree/${target.id}`)
          .then(() => parent);
      })
      .then((parent) => {
        if (assemblyTaxonKey === target.id) {
          history.push({
            pathname: `/catalogue/${catalogueKey}/assembly`,
            search: `?${qs.stringify(_.omit(params, ["assemblyTaxonKey"]))}`,
          });
          this.setState({ assemblyTaxonKey: null });
        }
        notification.open({
          message: "Removed existing taxon",
          description: `Old ${target.name} was removed from the assembly, removing children.`,
        });
        return this.saveSector(subject, parent, "ATTACH");
      });
  };
  onDeleteSector = () => {
    this.assemblyRef.reloadRoot();
    if (this.sourceRef && typeof this.sourceRef.reloadRoot === "function") {
      this.sourceRef.reloadRoot();
    }
  };
  saveSector = (subject, target, mode) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    const sector = {
      subjectDatasetKey: subject.datasetKey,
      datasetKey: catalogueKey,
      mode: mode,
      subject: { id: subject.id, status: subject.status, rank: subject.rank },
      target: { id: target.id, status: target.status, rank: target.rank },
    };

    return axios
      .post(`${config.dataApi}dataset/${catalogueKey}/sector`, sector)
      .then((res) => {
        const msg = `${
          _.get(target, "name.scientificName") || target.id
        } attached to ${subject.name || subject.id} `;
        notification.open({
          message: "Sector created",
          description: msg,
        });
      })
      .catch((err) => {
        this.setState({ error: err });
        console.log(err);
      });
  };

  showSourceTaxon = (sector, source) => {
    const oldDatasetKey = Number(this.state.datasetKey);
    const isPlaceholder = !_.isUndefined(sector.placeholderRank);
    const subjectID = isPlaceholder
      ? `${
          sector.subject.id
        }--incertae-sedis--${sector.placeholderRank.toUpperCase()}`
      : sector.subject.id;
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    axios(`${config.dataApi}dataset/${source.key}`)
      .then((res) => {
        const params = qs.parse(_.get(this.props, "location.search"));
        const newParams = {
          ...params,
          sourceTaxonKey: subjectID,
          datasetKey: source.key,
        };
        history.push({
          pathname: `/catalogue/${catalogueKey}/assembly`,
          search: `?${qs.stringify(newParams)}`,
        });
        this.setState(
          {
            sourceTaxonKey: subjectID,
            datasetKey: source.key,
            datasetName: res.data.title,
            selectedDataset: {
              key: res.data.key,
              title: res.data.alias || res.data.title,
            },
          },
          () => {
            // If the datasetKey is new, refresh, otherwise its is done by the the tree in componentDidUpdate
            if (oldDatasetKey === source.key) {
              this.sourceRef.reloadRoot();
            }
          }
        );
      })
      .catch((err) => {
        console.log(err);
      });
  };

  addMissingTargetKey = (key) => {
    this.setState({
      missingTargetKeys: { ...this.state.missingTargetKeys, [key]: true },
    });
  };

  onSelectDataset = (dataset) => {
    const {
      location,
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    this.setState({
      datasetKey: Number(dataset.key),
      datasetName: dataset.title,
      selectedDataset: dataset,
      sourceTaxonKey: null,
    });
    const params = qs.parse(_.get(location, "search"));

    const newParams = {
      ...params,
      datasetKey: _.get(dataset, "key"),
    };
    history.push({
      pathname: `/catalogue/${catalogueKey}/assembly`,
      search: `?${qs.stringify(_.omit(newParams, ["sourceTaxonKey"]))}`,
    });
  };

  onDragStart = (e, dataset) => {
    e.node.ref.dataset = dataset;
    this.setState({ dragNode: e.node });
  };

  toggleMode = (mode) => {
    this.setState({ mode: mode });
  };

  render() {
    const {
      syncState,
      syncingDataset,
      syncingSector,
      error,
      assemblyTaxonKey,
      childModalVisible,
      assemblyColSpan,
      sourceColSpan,
      showSync,
      height,
    } = this.state;

    const {
      match: {
        params: { catalogueKey },
      },
      location,
      catalogue,
    } = this.props;
    const params = qs.parse(_.get(location, "search"));

    //  const {assemblyTaxonKey, sourceTaxonKey} = location
    return (
      <Layout
        openKeys={["assembly"]}
        selectedKeys={["colAssembly"]}
        title={catalogue ? catalogue.title : ""}
      >
        <Helmet>
          <meta charSet="utf-8" />
          <title>COL Assembly</title>
          <link rel="canonical" href="http://data.catalogueoflife.org" />
        </Helmet>
        <PageContent style={{ padding: 12, marginBottom: 0, height: "100%" }}>
          <ColTreeContext.Provider
            value={{
              mode: this.state.mode,
              toggleMode: this.toggleMode,
              getSyncState: this.getSyncState,
              syncState: this.state.syncState,
              syncingSector: this.state.syncingSector,
              missingTargetKeys: this.state.missingTargetKeys,
              selectedSourceDatasetKey: _.get(
                this.state,
                "selectedDataset.key"
              ),
              selectedSourceTreeNodes:
                _.get(this.sourceRef, "state.selectedNodes") || [],
              selectedAssemblyTreeNodes:
                _.get(this.assemblyRef, "state.selectedNodes") || [],
            }}
          >
            <Row>
              <Col span={8}>
                <ColTreeContext.Consumer>
                  {({ mode, toggleMode }) => (
                    <Radio.Group
                      value={mode}
                      onChange={(e) => toggleMode(e.target.value)}
                    >
                      <Radio.Button value="modify">Modify Tree</Radio.Button>
                      <Radio.Button value="attach">Attach sectors</Radio.Button>
                    </Radio.Group>
                  )}
                </ColTreeContext.Consumer>
              </Col>
              <Col span={4} style={{ textAlign: "right" }}>
                <Switch
                  style={{ marginRight: "10px" }}
                  onChange={(checked) => {
                    this.setState({ showSync: checked });
                  }}
                  checked={showSync}
                  checkedChildren="Hide syncstate"
                  unCheckedChildren="Show syncstate"
                />
              </Col>

              <Col span={12}>
                {showSync && syncState && (
                  <SyncState
                    syncState={syncState}
                    dataset={syncingDataset}
                    sector={syncingSector}
                  />
                )}
              </Col>
            </Row>
            <Row>
              <div style={{ width: "100%" }}>
                <Slider
                  min={0}
                  max={24}
                  value={assemblyColSpan}
                  onChange={(value) => {
                    this.setState({
                      assemblyColSpan: value,
                      sourceColSpan: 24 - value,
                    });
                  }}
                  step={1}
                />
              </div>
            </Row>

            <Row>
              <Col span={assemblyColSpan} className="assembly-tree-box">
                <Row>
                  <Col span={12}>
                    <h4>{catalogue.title}</h4>{" "}
                  </Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    {childModalVisible && (
                      <AddChildModal
                        onCancel={() =>
                          this.setState({ childModalVisible: false })
                        }
                        onSuccess={() =>
                          this.setState(
                            { childModalVisible: false },
                            this.assemblyRef.reloadRoot()
                          )
                        }
                        parent={null}
                        catalogueKey={catalogueKey}
                      />
                    )}
                    <Button
                      icon={<PlusOutlined />}
                      size="small"
                      style={{ marginRight: "6px" }}
                      onClick={(e) => {
                        this.setState({ childModalVisible: true });
                      }}
                    >
                      Add root
                    </Button>
                    <Button
                      icon={<SyncOutlined />}
                      size="small"
                      onClick={(e) => {
                        const params = qs.parse(_.get(location, "search"));

                        const newParams = {
                          ...params,
                          assemblyTaxonKey: null,
                        };
                        history.push({
                          pathname: `/catalogue/${catalogueKey}/assembly`,
                          search: `?${qs.stringify(
                            _.omit(newParams, ["assemblyTaxonKey"])
                          )}`,
                        });
                        this.setState({ assemblyTaxonKey: null }, () =>
                          this.assemblyRef.reloadLoadedKeys()
                        );
                      }}
                    >
                      Refresh
                    </Button>
                  </Col>
                </Row>

                <NameAutocomplete
                  datasetKey={catalogueKey}
                  defaultTaxonKey={
                    _.get(
                      qs.parse(_.get(location, "search")),
                      "assemblyTaxonKey"
                    ) || null
                  }
                  onError={(error) => this.setState({ error })}
                  onSelectName={(name) => {
                    const params = qs.parse(_.get(location, "search"));

                    const newParams = {
                      ...params,
                      assemblyTaxonKey: _.get(name, "key"),
                    };
                    history.push({
                      pathname: `/catalogue/${catalogueKey}/assembly`,
                      search: `?${qs.stringify(newParams)}`,
                    });
                    this.setState({ assemblyTaxonKey: name.key }, () =>
                      this.assemblyRef.reloadRoot()
                    );
                  }}
                  onResetSearch={() => {
                    const params = qs.parse(_.get(location, "search"));

                    const newParams = { ...params, assemblyTaxonKey: null };
                    history.push({
                      pathname: `/catalogue/${catalogueKey}/assembly`,
                      search: `?${qs.stringify(
                        _.omit(newParams, ["assemblyTaxonKey"])
                      )}`,
                    });
                    this.setState({ assemblyTaxonKey: null });
                  }}
                />
                {error && (
                  <Alert
                    closable
                    onClose={() => this.setState({ error: null })}
                    message={<ErrorMsg error={error} />}
                    type="error"
                  />
                )}
                {catalogue && (
                  <div ref={this.wrapperRef} style={{ height: "100%" }}>
                    {" "}
                    <ColTree
                      height={height}
                      treeRef={(ref) => (this.assemblyRef = ref)}
                      location={location}
                      dataset={{ key: catalogueKey }}
                      treeType="CATALOGUE"
                      catalogueKey={catalogueKey}
                      onDeleteSector={this.onDeleteSector}
                      attachFn={this.getSectorInfo}
                      onDragStart={(e) => this.onDragStart(e, catalogue)}
                      dragNode={this.state.dragNode}
                      selectedSourceTreeNodes={
                        _.get(this.sourceRef, "state.selectedNodes") || []
                      }
                      draggable={true}
                      showSourceTaxon={this.showSourceTaxon}
                      defaultExpandKey={assemblyTaxonKey}
                      addMissingTargetKey={this.addMissingTargetKey}
                    />
                  </div>
                )}
              </Col>

              <Col span={sourceColSpan} style={{ paddingLeft: "8px" }}>
                <h4>
                  {this.state.selectedDataset ? (
                    <React.Fragment>
                      {" "}
                      {this.state.selectedDataset.alias ||
                        this.state.selectedDataset.title}
                      <NavLink
                        to={`/dataset/${this.state.selectedDataset.key}/meta`}
                      >
                        {" "}
                        <EyeOutlined /> source
                      </NavLink>
                    </React.Fragment>
                  ) : (
                    "No dataset selected"
                  )}
                </h4>
                <DatasetAutocomplete
                  onSelectDataset={this.onSelectDataset}
                  defaultDatasetKey={_.get(params, "datasetKey") || null}
                  onResetSearch={() => {
                    history.push({
                      pathname: `/catalogue/${catalogueKey}/assembly`,
                      search: `?${qs.stringify(
                        _.omit(params, ["datasetKey"])
                      )}`,
                    });
                    this.setState({ selectedDataset: null });
                  }}
                />

                <br />
                {this.state.selectedDataset && (
                  <NameAutocomplete
                    datasetKey={this.state.selectedDataset.key}
                    defaultTaxonKey={
                      _.get(
                        qs.parse(_.get(location, "search")),
                        "sourceTaxonKey"
                      ) || null
                    }
                    onError={(error) => this.setState({ error })}
                    onSelectName={(name) => {
                      const params = qs.parse(_.get(location, "search"));

                      const newParams = {
                        ...params,
                        sourceTaxonKey: _.get(name, "key"),
                      };
                      history.push({
                        pathname: `/catalogue/${catalogueKey}/assembly`,
                        search: `?${qs.stringify(newParams)}`,
                      });
                      this.setState({ sourceTaxonKey: name.key }, () =>
                        this.sourceRef.reloadRoot()
                      );
                    }}
                    onResetSearch={() => {
                      const params = qs.parse(_.get(location, "search"));

                      const newParams = { ...params, sourceTaxonKey: null };
                      history.push({
                        pathname: `/catalogue/${catalogueKey}/assembly`,
                        search: `?${qs.stringify(
                          _.omit(newParams, ["sourceTaxonKey"])
                        )}`,
                      });
                      this.setState({ sourceTaxonKey: null });
                    }}
                  />
                )}
                {this.state.selectedDataset && (
                  <ColTree
                    height={height}
                    treeRef={(ref) => (this.sourceRef = ref)}
                    location={location}
                    dataset={this.state.selectedDataset}
                    treeType="SOURCE"
                    catalogueKey={catalogueKey}
                    onDeleteSector={this.onDeleteSector}
                    onDragStart={(e) =>
                      this.onDragStart(e, this.state.selectedDataset)
                    }
                    draggable={this.state.mode === "attach"}
                    defaultExpandKey={this.state.sourceTaxonKey}
                    showSourceTaxon={(sector) => {
                      const isPlaceholder = !_.isUndefined(
                        sector.placeholderRank
                      );
                      const targetID = isPlaceholder
                        ? `${
                            sector.target.id
                          }--incertae-sedis--${sector.placeholderRank.toUpperCase()}`
                        : sector.target.id;
                      const params = qs.parse(_.get(location, "search"));
                      const newParams = {
                        ...params,
                        assemblyTaxonKey: targetID,
                      };
                      history.push({
                        pathname: `/catalogue/${catalogueKey}/assembly`,
                        search: `?${qs.stringify(newParams)}`,
                      });
                      this.setState(
                        { assemblyTaxonKey: targetID },
                        this.assemblyRef.reloadRoot
                      );
                      // this.assemblyRef.reloadRoot();
                    }}
                  />
                )}
              </Col>
            </Row>
          </ColTreeContext.Provider>
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ catalogue }) => ({ catalogue });

export default withContext(mapContextToProps)(Assembly);
