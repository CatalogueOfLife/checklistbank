import React from "react";
import {
  EyeOutlined,
  PlusOutlined,
  SyncOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Row,
  Col,
  notification,
  Button,
  Alert,
  Radio,
  Slider,
  Switch,
  Popover,
} from "antd";
import { NavLink } from "react-router-dom";
import _ from "lodash";
import Layout from "../../../components/LayoutNew";
import axios from "axios";
import config from "../../../config";
import { ColTreeContext, applyDecision } from "./ColTreeContext";
import ErrorMsg from "../../../components/ErrorMsg";
import ColTree from "./ColTree";
import DatasetAutocomplete from "./DatasetAutocomplete";
import NameAutocomplete from "./NameAutocomplete";
import PageContent from "../../../components/PageContent";
import AddChildModal from "./AddChildModal";
import DecisionForm from "../../WorkBench/DecisionForm";
import Helmet from "react-helmet";
import qs from "query-string";
import history from "../../../history";
import withContext from "../../../components/hoc/withContext";
import { CanEditDataset } from "../../../components/Auth/hasAccess";
import Auth from "../../../components/Auth";
const { canEditDataset } = Auth;
class Assembly extends React.Component {
  constructor(props) {
    super(props);
    const params = qs.parse(_.get(this.props, "location.search"));

    this.state = {
      mode: "attach",
      assemblyColSpan: 12,
      sourceColSpan: 12,
      assemblyTaxonKey: params.assemblyTaxonKey || null,
      sourceTaxonKey: params.sourceTaxonKey || null,
      datasetKey: params.datasetKey || null,
      selectedDataset: null,
      childModalVisible: false,
      insertPlaceholder: false,
      missingTargetKeys: {}, // A map of keys that could not be found in the assembly. If a sectors target key is missing, flag that the sector is broken and may be deleted
      height: 600,
      decisionFormVisible: false,
    };

    // this.assemblyRef = React.createRef();
    // this.sourceRef = React.createRef();
    this.wrapperRef = React.createRef();
  }

  componentDidMount() {
    /* const params = qs.parse(_.get(this.props, "location.search"));
    if (params.sourceTaxonKey && params.datasetKey) {
      this.showSourceTaxon(
         { subject: { id: params.sourceTaxonKey } },
        { key: params.datasetKey } 
      );
    } */

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
      .post(
        `${config.dataApi}dataset/${catalogueKey}/tree/${encodeURIComponent(
          target.id
        )}/copy`,
        {
          datasetKey: subject.datasetKey,
          id: subject.id,
        }
      )
      .then((res) => {
        return axios(
          `${config.dataApi}dataset/${catalogueKey}/taxon/${encodeURIComponent(
            res.data
          )}`
        );
      });
  };
  replace = (subject, target) => {
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
          .delete(
            `${config.dataApi}dataset/${catalogueKey}/tree/${encodeURIComponent(
              target.id
            )}`
          )
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
  showSourceTaxon = async (taxon) => {
    const taxonId = taxon?.id;
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    try {
      const res = await axios(
        `${config.dataApi}dataset/${catalogueKey}/taxon/${taxonId}/source`
      );
      const datasetRes = await axios(
        `${config.dataApi}dataset/${res.data.sourceDatasetKey}`
      );
      const params = qs.parse(_.get(this.props, "location.search"));
      const newParams = {
        ...params,
        sourceTaxonKey: res.data.sourceId,
        datasetKey: res.data.sourceDatasetKey,
      };
      history.push({
        pathname: `/catalogue/${catalogueKey}/assembly`,
        search: `?${qs.stringify(newParams)}`,
      });
      this.setState({
        sourceTaxonKey: res.data.sourceId,
        datasetKey: res.data.sourceDatasetKey,
        datasetName: datasetRes.data.title,
        selectedDataset: {
          key: datasetRes.data.key,
          title: datasetRes.data.alias || datasetRes.data.title,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  /*   showSourceTaxon = (sector, source) => {
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
        this.setState({
          sourceTaxonKey: subjectID,
          datasetKey: res.data.key,
          datasetName: res.data.title,
          selectedDataset: {
            key: res.data.key,
            title: res.data.alias || res.data.title,
          },
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }; */

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
    const { datasetKey } = this.state;
    const shouldUpdate = Number(datasetKey) !== Number(dataset.key);
    if (shouldUpdate) {
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
    } else {
      // If it is the initial load, the title of the dataset comes from the dataset select component
      this.setState({ selectedDataset: dataset });
    }
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
      error,
      assemblyTaxonKey,
      childModalVisible,
      assemblyColSpan,
      sourceColSpan,
      height,
      insertPlaceholder,
      decisionFormVisible,
      datasetKey,
    } = this.state;

    const {
      match: {
        params: { catalogueKey },
      },
      location,
      catalogue,
      user,
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
          <title>Assembly</title>
        </Helmet>
        <PageContent style={{ padding: 12, marginBottom: 0, height: "100%" }}>
          <ColTreeContext.Provider
            value={{
              mode: this.state.mode,
              toggleMode: this.toggleMode,
              missingTargetKeys: this.state.missingTargetKeys,
              selectedSourceDatasetKey: _.get(
                this.state,
                "selectedDataset.key"
              ),
              selectedSourceTreeNodes:
                _.get(this.sourceRef, "state.selectedNodes") || [],
              selectedAssemblyTreeNodes:
                _.get(this.assemblyRef, "state.selectedNodes") || [],
              applyDecision: applyDecision,
            }}
          >
            {decisionFormVisible && (
              <ColTreeContext.Consumer>
                {({ selectedSourceTreeNodes }) => (
                  <DecisionForm
                    destroyOnClose={true}
                    rowsForEdit={selectedSourceTreeNodes.map((n) => ({
                      usage: {
                        name: {
                          scientificName: n?.ref?.taxon?.name,
                          authorship: n?.ref?.taxon?.authorship,
                          rank: n?.ref?.taxon?.rank,
                        },
                        id: n?.ref?.taxon?.id,
                        status: n?.ref?.taxon?.status,
                      },
                      parent: n?.parent?.name,
                      decisions: n?.ref?.taxon?.decision
                        ? [n?.ref?.taxon?.decision]
                        : null,
                    }))}
                    onCancel={() =>
                      this.setState(
                        { decisionFormVisible: false },
                        this.sourceRef.reloadRoot
                      )
                    }
                    onOk={() => {
                      this.setState(
                        { decisionFormVisible: false },
                        this.sourceRef.reloadRoot
                      );
                    }}
                    onSaveDecision={(name) => {
                      console.log(name);
                    }}
                    datasetKey={catalogueKey}
                    subjectDatasetKey={datasetKey}
                  />
                )}
              </ColTreeContext.Consumer>
            )}
            <Row>
              <Col>
                <CanEditDataset dataset={catalogue}>
                  <ColTreeContext.Consumer>
                    {({ mode, toggleMode }) => (
                      <Radio.Group
                        value={mode}
                        onChange={(e) => toggleMode(e.target.value)}
                      >
                        <Radio.Button value="modify">Modify Tree</Radio.Button>
                        <Radio.Button value="attach">Add sectors</Radio.Button>
                      </Radio.Group>
                    )}
                  </ColTreeContext.Consumer>
                </CanEditDataset>
              </Col>
              <Col flex="auto"></Col>
              <Col>
                <Switch
                  onChange={(checked) =>
                    this.setState({ insertPlaceholder: checked })
                  }
                  checkedChildren={"Show placeholder ranks"}
                  unCheckedChildren={"Show placeholder ranks"}
                />
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
                            this.assemblyRef.reloadRoot
                          )
                        }
                        parent={null}
                        catalogueKey={catalogueKey}
                      />
                    )}
                    <CanEditDataset dataset={catalogue}>
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
                    </CanEditDataset>
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
                    description={<ErrorMsg error={error} />}
                    type="error"
                  />
                )}
                {catalogue && (
                  <div ref={this.wrapperRef} style={{ height: "100%" }}>
                    {" "}
                    <ColTree
                      insertPlaceholder={insertPlaceholder}
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
                      draggable={canEditDataset({ key: catalogueKey }, user)}
                      showSourceTaxon={this.showSourceTaxon}
                      defaultExpandKey={assemblyTaxonKey}
                      addMissingTargetKey={this.addMissingTargetKey}
                    />
                  </div>
                )}
              </Col>

              <Col span={sourceColSpan} style={{ paddingLeft: "8px" }}>
                <Row>
                  <Col>
                    <h4>
                      {this.state.selectedDataset ? (
                        <React.Fragment>
                          {" "}
                          {this.state.selectedDataset.alias ||
                            this.state.selectedDataset.title}
                          <NavLink
                            to={`/dataset/${this.state.selectedDataset.key}/about`}
                          >
                            {" "}
                            <EyeOutlined /> source
                          </NavLink>
                        </React.Fragment>
                      ) : (
                        "No dataset selected"
                      )}
                    </h4>
                  </Col>
                  <Col flex="auto"></Col>
                  <Col>
                    <CanEditDataset dataset={{ key: catalogueKey }}>
                      <ColTreeContext.Consumer>
                        {({ selectedSourceTreeNodes }) =>
                          selectedSourceTreeNodes.length > 0 && (
                            <>
                              <span>
                                {selectedSourceTreeNodes.length} selected
                              </span>
                              <Popover
                                trigger="click"
                                placement="bottomRight"
                                content={
                                  <>
                                    <Button
                                      style={{
                                        marginTop: "8px",
                                        width: "100%",
                                      }}
                                      type="danger"
                                      onClick={() => {
                                        Promise.allSettled(
                                          selectedSourceTreeNodes.map((n) =>
                                            applyDecision(n.taxon, catalogueKey)
                                          )
                                        ).then(() => {
                                          this.sourceRef.reloadRoot();
                                        });
                                      }}
                                    >
                                      {`Block ${selectedSourceTreeNodes.length} taxa`}
                                    </Button>
                                    <Button
                                      style={{
                                        marginTop: "8px",
                                        width: "100%",
                                      }}
                                      type="primary"
                                      onClick={() =>
                                        this.setState({
                                          decisionFormVisible: true,
                                        })
                                      }
                                    >
                                      {`Apply decisions`}
                                    </Button>
                                    <Button
                                      style={{
                                        marginTop: "8px",
                                        width: "100%",
                                      }}
                                      type="danger"
                                      onClick={() => {
                                        const taxaWithdecisions =
                                          selectedSourceTreeNodes.filter(
                                            (n) => !!n?.taxon?.decision
                                          );
                                        Promise.allSettled(
                                          taxaWithdecisions.map((n) => {
                                            return axios.delete(
                                              `${config.dataApi}dataset/${catalogueKey}/decision/${n.taxon.decision.id}`
                                            );
                                          })
                                        ).then(() => {
                                          this.sourceRef.reloadRoot();
                                          notification.open({
                                            message: "Decisions deleted for:",
                                            description: (
                                              <ul>
                                                {taxaWithdecisions.map((n) => (
                                                  <li>{n?.taxon?.name}</li>
                                                ))}
                                              </ul>
                                            ),
                                          });
                                        });
                                      }}
                                    >
                                      {`Delete decisions`}
                                    </Button>
                                  </>
                                }
                              >
                                <Button
                                  type="link"
                                  style={{ padding: "0px 3px" }}
                                >
                                  <SettingOutlined />
                                </Button>
                              </Popover>
                            </>
                          )
                        }
                      </ColTreeContext.Consumer>
                    </CanEditDataset>
                  </Col>
                </Row>

                <DatasetAutocomplete
                  minSize={1}
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
                    insertPlaceholder={insertPlaceholder}
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
                    draggable={
                      canEditDataset({ key: catalogueKey }, user) &&
                      this.state.mode === "attach"
                    }
                    defaultExpandKey={this.state.sourceTaxonKey}
                    showSourceTaxon={({ sector }) => {
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

const mapContextToProps = ({ catalogue, user }) => ({ catalogue, user });

export default withContext(mapContextToProps)(Assembly);
