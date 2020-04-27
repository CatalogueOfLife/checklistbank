import React from "react";
import { Row, Col, notification, Button, Icon, Card, Alert } from "antd";
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

class Assembly extends React.Component {
  constructor(props) {
    super(props);
    const params = qs.parse(_.get(this.props, "location.search"));

    this.state = {
      mode: "attach",
      syncState: {},
      syncingDataset: null,
      syncingSector: null,
      assemblyTaxonKey: params.assemblyTaxonKey || null,
      sourceTaxonKey: null,
      childModalVisible: false,
      missingTargetKeys: {} // A map of keys that could not be found in the assembly. If a sectors target key is missing, flag that the sector is broken and may be deleted
    };

    // this.assemblyRef = React.createRef();
    // this.sourceRef = React.createRef();
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
    }, 3000);
  }

  componentDidUpdate = prevProps => {
    const params = qs.parse(_.get(this.props, "location.search"));
    const prevParams = qs.parse(_.get(prevProps, "location.search"));
    if (
      _.get(params, "assemblyTaxonKey") !==
      _.get(prevParams, "assemblyTaxonKey")
    ) {
      this.setState({
        assemblyTaxonKey: _.get(params, "assemblyTaxonKey") || null
      });
    }
    if (
      _.get(params, "sourceTaxonKey") !== _.get(prevParams, "sourceTaxonKey")
    ) {
      this.setState({
        sourceTaxonKey: _.get(params, "sourceTaxonKey") || null
      });
    }
  };

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  getSyncState = () => {
    const {
      match: {
        params: { catalogueKey }
      }
    } = this.props;
    axios(`${config.dataApi}dataset/${catalogueKey}/assembly`)
      .then(res => {
        if (
          _.get(res, "data.running") &&
          _.get(res, "data.running.sectorKey") !==
            _.get(this.state, "syncState.running.sectorKey")
        ) {
          return Promise.all([
            axios(
              `${config.dataApi}dataset/${_.get(
                res,
                "data.running.datasetKey"
              )}`
            ),
            axios(
              `${config.dataApi}dataset/${catalogueKey}/sector/${_.get(res, "data.running.sectorKey")}`
            )
          ]).then(resp => {
            this.setState({
              syncingDataset: resp[0].data,
              syncingSector: resp[1].data,
              syncState: res.data
            });
          });
        } else if (!_.get(res, "data.running")) {
          this.setState({
            syncingDataset: null,
            syncingSector: null,
            syncState: res.data
          });
        } else {
          this.setState({ syncState: res.data });
        }
      })
      .catch(err => this.setState({ syncError: err }));
  };

  getSectorInfo = (attachment, root, mode) => {
    /* const { datasetKey } = this.state;
    const {
      match: {
        params: { catalogueKey }
      }
    } = this.props; */
    const rootData = _.get(root, 'props.dataRef.taxon');
    const attachmentData = _.get(attachment, 'props.dataRef.taxon');
    return mode === "REPLACE"
            ? this.replace(rootData, attachmentData, mode)
            : this.saveSector(rootData, attachmentData, mode);

   /* return axios
      .all([
        axios(
          `${config.dataApi}dataset/${catalogueKey}/taxon/${encodeURIComponent(
            attachment.props.dataRef.key
          )}`
        ),
        axios(
          `${config.dataApi}dataset/${datasetKey}/taxon/${encodeURIComponent(
            root.props.dataRef.key
          )}`
        )
      ])
      .then(
        axios.spread((attachmentName, rootName) => {
          console.log(attachmentName.data);
          console.log(rootName.data);
          attachmentName.data.name = attachmentName.data.scientificName;
          rootName.data.name = rootName.data.scientificName;

          return mode === "REPLACE"
            ? this.replace(rootName.data, attachmentName.data, mode)
            : this.saveSector(rootName.data, attachmentName.data, mode);
        })
      )

      .catch(err => {
        this.setState({ sectorMappingError: err });
        console.log(err);
      }); */
  };

  saveChild = (subject, target) => {
    const {
      match: {
        params: { catalogueKey }
      }
    } = this.props;

    return axios
      .post(`${config.dataApi}dataset/${catalogueKey}/tree/${target.id}/copy`, {
        datasetKey: subject.datasetKey,
        id: subject.id
      })
      .then(res => {
        return axios(
          `${config.dataApi}dataset/${catalogueKey}/taxon/${encodeURIComponent(
            res.data
          )}`
        );
      });
  };
  replace = (subject, target, mode) => {
    const { parentId } = target;
    const {
      match: {
        params: { catalogueKey }
      }
    } = this.props;

    return axios(
      `${config.dataApi}dataset/${catalogueKey}/taxon/${encodeURIComponent(
        parentId
      )}`
    )
      .then(res => {
        const parent = res.data;
        // delete recursive
        return axios
          .delete(`${config.dataApi}dataset/${catalogueKey}/tree/${target.id}`)
          .then(() => parent);
      })
      .then(parent => {
        notification.open({
          message: "Removed existing taxon",
          description: `Old ${target.name} was removed from the CoL draft, removing children.`
        });
        return this.saveSector(subject, parent, "ATTACH");
      });
  };

  saveSector = (subject, target, mode) => {
    const {
      match: {
        params: { catalogueKey }
      }
    } = this.props;
    const sector = {
      subjectDatasetKey: subject.datasetKey,
      datasetKey: catalogueKey,
      mode: mode,
      subject: { id: subject.id, status: subject.status, rank: subject.rank },
      target: { id: target.id, status: target.status , rank: target.rank}
    };

    return axios
      .post(`${config.dataApi}dataset/${catalogueKey}/sector`, sector)
      .then(res => {
        const msg = `${_.get(target, "name.scientificName") ||
          target.id} attached to ${subject.name || subject.id} `;
        notification.open({
          message: "Sector created",
          description: msg
        });
      })
      .catch(err => {
        this.setState({ sectorMappingError: err });
        console.log(err);
      });
  };

  showSourceTaxon = (sector, source) => {
    const oldDatasetKey = Number(this.state.datasetKey);
    const isPlaceholder = !_.isUndefined(sector.placeholderRank);
    const subjectID = isPlaceholder ? `${sector.subject.id}--incertae-sedis--${sector.placeholderRank.toUpperCase()}`: sector.subject.id;
    const {
      match: {
        params: { catalogueKey }
      }
    } = this.props;
    axios(`${config.dataApi}dataset/${source.key}`)
      .then(res => {
        const params = qs.parse(_.get(this.props, "location.search"));
        const newParams = {
          ...params,
          sourceTaxonKey: subjectID,
          datasetKey: source.key
        };
        history.push({
          pathname: `/catalogue/${catalogueKey}/assembly`,
          search: `?${qs.stringify(newParams)}`
        });
        this.setState(
          {
            sourceTaxonKey: subjectID,
            datasetKey: source.key,
            datasetName: res.data.title,
            selectedDataset: {
              key: res.data.key,
              title: res.data.alias || res.data.title
            }
          },
          () => {
            // If the datasetKey is new, refresh, otherwise its is done by the the tree in componentDidUpdate
            if (oldDatasetKey === source.key) {
              this.sourceRef.reloadRoot();
            }
          }
        );
      })
      .catch(err => {
        console.log(err);
      });
  };

  addMissingTargetKey = key => {
    this.setState({
      missingTargetKeys: { ...this.state.missingTargetKeys, [key]: true }
    });
  };

  onSelectDataset = dataset => {
    const {
      location,
      match: {
        params: { catalogueKey }
      }
    } = this.props;
    this.setState({
      datasetKey: Number(dataset.key),
      datasetName: dataset.title,
      selectedDataset: dataset,
      sourceTaxonKey: null
    });
    const params = qs.parse(_.get(location, "search"));

    const newParams = {
      ...params,
      datasetKey: _.get(dataset, "key")
    };
    history.push({
      pathname: `/catalogue/${catalogueKey}/assembly`,
      search: `?${qs.stringify(_.omit(newParams, ["sourceTaxonKey"]))}`
    });
  };

  onDragStart = (e, dataset) => {
    e.node.dataset = dataset;
    this.setState({ dragNode: e.node });
  };

  toggleMode = mode => {
    this.setState({ mode: mode });
  };

  render() {
    const {
      syncState,
      syncingDataset,
      syncingSector,
      sectorMappingError,
      assemblyTaxonKey,
      childModalVisible
    } = this.state;

    const {
      match: {
        params: { catalogueKey }
      },
      location,
      catalogue
    } = this.props;
    //  const {assemblyTaxonKey, sourceTaxonKey} = location
    return (
      <Layout
        openKeys={["assembly"]}
        selectedKeys={["colAssembly"]}
        title={catalogue ? catalogue.title : ""}
      >
        <Helmet>
          <meta charSet="utf-8" />
          <title>CoL+ Assembly</title>
          <link rel="canonical" href="http://data.catalogue.life" />
        </Helmet>
        <PageContent>
          <ColTreeContext.Provider
            value={{
              mode: this.state.mode,
              toggleMode: this.toggleMode,
              getSyncState: this.getSyncState,
              syncState: this.state.syncState,
              syncingSector: this.state.syncingSector,
              missingTargetKeys: this.state.missingTargetKeys,
              selectedSourceDatasetKey: _.get(this.state, "selectedDataset.key")
            }}
          >
            <Row style={{ paddingLeft: "16px" }}>
              <Col span={12}>
                <ColTreeContext.Consumer>
                  {({ mode, toggleMode }) => (
                    <React.Fragment>
                      <Button
                        type={mode === "modify" ? "primary" : ""}
                        onClick={() => toggleMode("modify")}
                        size="large"
                        style={{ marginBottom: "20px" }}
                      >
                        Modify Tree
                      </Button>
                      <Button
                        style={{ marginLeft: "10px", marginBottom: "20px" }}
                        type={mode === "attach" ? "primary" : ""}
                        onClick={() => toggleMode("attach")}
                        size="large"
                      >
                        Attach sectors
                      </Button>
                    </React.Fragment>
                  )}
                </ColTreeContext.Consumer>
              </Col>

              <Col span={12}>
                {syncState && (
                  <SyncState
                    syncState={syncState}
                    dataset={syncingDataset}
                    sector={syncingSector}
                  />
                )}
              </Col>
            </Row>

            <Row style={{ padding: "10px", height: "100%" }}>
              <Col span={12} style={{ padding: "10px" }}>
                <Card>
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
                        icon="plus"
                        size="small"
                        style={{marginRight: '6px'}}
                        onClick={e => {
                          this.setState({ childModalVisible: true });
                        }}
                      >
                        Add root
                      </Button>
                      <Button
                        icon="sync"
                        size="small"
                        onClick={e => {
                          const params = qs.parse(_.get(location, "search"));

                          const newParams = {
                            ...params,
                            assemblyTaxonKey: null
                          };
                          history.push({
                            pathname: `/catalogue/${catalogueKey}/assembly`,
                            search: `?${qs.stringify(
                              _.omit(newParams, ["assemblyTaxonKey"])
                            )}`
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
                    defaultTaxonKey={_.get(qs.parse(_.get(location, "search")), 'assemblyTaxonKey') || null}
                    onSelectName={name => {
                      const params = qs.parse(_.get(location, "search"));

                      const newParams = {
                        ...params,
                        assemblyTaxonKey: _.get(name, "key")
                      };
                      history.push({
                        pathname: `/catalogue/${catalogueKey}/assembly`,
                        search: `?${qs.stringify(newParams)}`
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
                        )}`
                      });
                      this.setState({ assemblyTaxonKey: null });
                    }}
                  />
                  {sectorMappingError && (
                    <Alert
                      closable
                      onClose={() =>
                        this.setState({ sectorMappingError: null })
                      }
                      message={<ErrorMsg error={sectorMappingError} />}
                      type="error"
                    />
                  )}
                  {catalogue && (
                    <div style={{ overflowY: "scroll", height: "800px" }}>
                      <ColTree
                        treeRef={ref => (this.assemblyRef = ref)}
                        location={location}
                        dataset={{ key: catalogueKey }}
                        treeType="CATALOGUE"
                        catalogueKey={catalogueKey}
                        attachFn={this.getSectorInfo}
                        onDragStart={e => this.onDragStart(e, catalogue)}
                        dragNode={this.state.dragNode}
                        draggable={true}
                        showSourceTaxon={this.showSourceTaxon}
                        defaultExpandKey={assemblyTaxonKey}
                        addMissingTargetKey={this.addMissingTargetKey}
                      />
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={12} style={{ padding: "10px" }}>
                <Card>
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
                          <Icon type="eye" /> source
                        </NavLink>
                      </React.Fragment>
                    ) : (
                      "No dataset selected"
                    )}
                  </h4>
                  <DatasetAutocomplete onSelectDataset={this.onSelectDataset} defaultDatasetKey={_.get(this.state.selectedDataset, 'key') || null}/>

                  <br />
                  {this.state.selectedDataset && (
                    <NameAutocomplete
                      datasetKey={this.state.selectedDataset.key}
                      defaultTaxonKey={_.get(qs.parse(_.get(location, "search")), 'sourceTaxonKey') || null}
                      onSelectName={name => {
                        const params = qs.parse(_.get(location, "search"));

                        const newParams = {
                          ...params,
                          sourceTaxonKey: _.get(name, "key")
                        };
                        history.push({
                          pathname: `/catalogue/${catalogueKey}/assembly`,
                          search: `?${qs.stringify(newParams)}`
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
                          )}`
                        });
                        this.setState({ sourceTaxonKey: null });
                      }}
                    />
                  )}
                  <div style={{ overflowY: "scroll", height: "800px" }}>
                    {this.state.selectedDataset && (
                      <ColTree
                        treeRef={ref => (this.sourceRef = ref)}
                        location={location}
                        dataset={this.state.selectedDataset}
                        treeType="SOURCE"
                        catalogueKey={catalogueKey}
                        onDragStart={e =>
                          this.onDragStart(e, this.state.selectedDataset)
                        }
                        draggable={this.state.mode === "attach"}
                        defaultExpandKey={this.state.sourceTaxonKey}
                        showSourceTaxon={sector => {
                          const isPlaceholder = !_.isUndefined(sector.placeholderRank);
    const targetID = isPlaceholder ? `${sector.target.id}--incertae-sedis--${sector.placeholderRank.toUpperCase()}`: sector.target.id;
                          const params = qs.parse(_.get(location, "search"));
                          const newParams = {
                            ...params,
                            assemblyTaxonKey: targetID
                          };
                          history.push({
                            pathname: `/catalogue/${catalogueKey}/assembly`,
                            search: `?${qs.stringify(newParams)}`
                          });
                          this.setState({assemblyTaxonKey: targetID}, this.assemblyRef.reloadRoot)
                         // this.assemblyRef.reloadRoot();
                        }}
                      />
                    )}
                  </div>
                </Card>
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
