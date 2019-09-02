import React from "react";
import { Row, Col, notification, Button, Icon, Card, Alert } from "antd";
import { NavLink } from "react-router-dom";
import _ from "lodash";
import Layout from "../../components/LayoutNew";
import axios from "axios";
import config from "../../config";
import { ColTreeContext } from "./ColTreeContext";
import ErrorMsg from "../../components/ErrorMsg";
import ColTree from "./ColTree";
import DatasetAutocomplete from "./DatasetAutocomplete";
import NameAutocomplete from "./NameAutocomplete";
import PageContent from "../../components/PageContent";
import SyncState from "./SyncState";
import Helmet from "react-helmet";
import qs from "query-string";
import history from "../../history";
import colTreeActions from "./ColTreeActions";

const { MANAGEMENT_CLASSIFICATION } = config;

class ManagementClassification extends React.Component {
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
      missingTargetKeys: {} // A map of keys that could not be found in the assembly. If a sectors target key is missing, flag that the sector is broken and may be deleted
    };
  }

  componentWillMount() {
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

  componentWillReceiveProps = nextProps => {
    let params = qs.parse(_.get(nextProps, "location.search"));
    // this.setState({defaultAssemblyExpandKey: _.get(params, "assemblyTaxonKey") || null ,defaultExpandKey : _.get(params, "sourceTaxonKey") || null});
    this.setState({
      assemblyTaxonKey: _.get(params, "assemblyTaxonKey") || null,
      sourceTaxonKey: _.get(params, "sourceTaxonKey") || null
    });
  };
  componentWillUnmount() {
    clearInterval(this.timer);
  }

  getSyncState = () => {
    axios(`${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}`)
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
              `${config.dataApi}sector/${_.get(res, "data.running.sectorKey")}`
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
    const { datasetKey } = this.state;
    return axios
      .all([
        axios(
          `${config.dataApi}dataset/${
            MANAGEMENT_CLASSIFICATION.key
          }/taxon/${encodeURIComponent(attachment.props.dataRef.key)}`
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
            ? this.replace(
                // null, // No colsources anymore ??
                rootName.data,
                attachmentName.data,
                mode
              )
            : this.saveSector(
                // null, // No colsources anymore ??
                rootName.data,
                attachmentName.data,
                mode
              );
        })
      )

      .catch(err => {
        this.setState({ sectorMappingError: err });
        console.log(err);
      });
  };

  saveChild = (subject, target) => {
    return axios
      .post(
        `${config.dataApi}dataset/${MANAGEMENT_CLASSIFICATION.key}/tree/${
          target.id
        }/copy`,
        {
          datasetKey: subject.datasetKey,
          id: subject.id
        }
      )
      .then(res => {
        return axios(
          `${config.dataApi}dataset/${
            MANAGEMENT_CLASSIFICATION.key
          }/taxon/${encodeURIComponent(res.data)}`
        );
      });
  };
  replace = (subject, target, mode) => {
    const { parentId } = target;
    return axios(
      `${config.dataApi}dataset/${
        MANAGEMENT_CLASSIFICATION.key
      }/taxon/${encodeURIComponent(parentId)}`
    )
      .then(res => {
        const parent = res.data;
        // delete recursive
        return axios
          .delete(
            `${config.dataApi}dataset/${MANAGEMENT_CLASSIFICATION.key}/tree/${
              target.id
            }`
          )
          .then(() => parent);
      })
      .then(parent => {
        notification.open({
          message: "Removed existing taxon",
          description: `Old ${
            target.name
          } was removed from the CoL draft, removing children.`
        });
        return this.saveSector(subject, parent, "ATTACH");
      });
  };

  saveSector = (subject, target, mode) => {
    const sector = {
      datasetKey: subject.datasetKey,
      mode: mode,
      subject: { id: subject.id, status: subject.status },
      target: { id: target.id, status: target.status }
    };

    return axios
      .post(`${config.dataApi}sector`, sector)
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
    axios(`${config.dataApi}dataset/${source.key}`)
      .then(res => {
        this.setState(
          {
            sourceTaxonKey: sector.subject.id,
            datasetKey: source.key,
            datasetName: res.data.title,
            selectedDataset: { key: res.data.key, title: res.data.title }
          },
          () => {
            const params = qs.parse(_.get(this.props, "location.search"));
            const newParams = {
              ...params,
              sourceTaxonKey: sector.subject.id,
              datasetKey: source.key
            };
            history.push({
              pathname: `/assembly`,
              search: `?${qs.stringify(newParams)}`
            });
            colTreeActions.refreshSource();
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
    const {location} = this.props
    this.setState({
      datasetKey: dataset.key,
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
      pathname: `/assembly`,
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
      defaultAssemblyExpandKey
    } = this.state;
    const { match, location } = this.props;
    //  const {assemblyTaxonKey, sourceTaxonKey} = location
    return (
      <Layout
        openKeys={["assembly"]}
        selectedKeys={["colAssembly"]}
        title={MANAGEMENT_CLASSIFICATION.title}
      >
        <Helmet>
          <meta charSet="utf-8" />
          <title>CoL+ Assembly</title>
          <link rel="canonical" href="http://www.col.plus" />
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
                  <h4>CoL Draft</h4>{" "}
                  <NameAutocomplete
                    datasetKey={MANAGEMENT_CLASSIFICATION.key}
                    onSelectName={name => {
                      const params = qs.parse(_.get(location, "search"));

                      const newParams = {
                        ...params,
                        assemblyTaxonKey: _.get(name, "key")
                      };
                      history.push({
                        pathname: `/assembly`,
                        search: `?${qs.stringify(newParams)}`
                      });
                      this.setState({ assemblyTaxonKey: name.key }, () =>
                        colTreeActions.refreshAssembly()
                      );
                    }}
                    onResetSearch={() => {
                      const params = qs.parse(_.get(location, "search"));

                      const newParams = { ...params, assemblyTaxonKey: null };
                      history.push({
                        pathname: `/assembly`,
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
                  <div style={{ overflowY: "scroll", height: "800px" }}>
                    <ColTree
                      location={location}
                      dataset={MANAGEMENT_CLASSIFICATION}
                      treeType="mc"
                      attachFn={this.getSectorInfo}
                      onDragStart={e =>
                        this.onDragStart(e, MANAGEMENT_CLASSIFICATION)
                      }
                      dragNode={this.state.dragNode}
                      draggable={true}
                      showSourceTaxon={this.showSourceTaxon}
                      defaultExpandKey={assemblyTaxonKey}
                      addMissingTargetKey={this.addMissingTargetKey}
                    />
                  </div>
                </Card>
              </Col>
              <Col span={12} style={{ padding: "10px" }}>
                <Card>
                  <h4>
                    {this.state.selectedDataset ? (
                      <React.Fragment>
                        {" "}
                        {this.state.selectedDataset.title}
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
                  <DatasetAutocomplete onSelectDataset={this.onSelectDataset} />

                  <br />
                  {this.state.selectedDataset && (
                    <NameAutocomplete
                      datasetKey={this.state.selectedDataset.key}
                      onSelectName={name => {
                        const params = qs.parse(_.get(location, "search"));

                        const newParams = {
                          ...params,
                          sourceTaxonKey: _.get(name, "key")
                        };
                        history.push({
                          pathname: `/assembly`,
                          search: `?${qs.stringify(newParams)}`
                        });
                        this.setState({ sourceTaxonKey: name.key }, () =>
                          colTreeActions.refreshSource()
                        );
                      }}
                      onResetSearch={() => {
                        const params = qs.parse(_.get(location, "search"));

                        const newParams = { ...params, sourceTaxonKey: null };
                        history.push({
                          pathname: `/assembly`,
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
                        location={location}
                        dataset={this.state.selectedDataset}
                        treeType="gsd"
                        onDragStart={e =>
                          this.onDragStart(e, this.state.selectedDataset)
                        }
                        draggable={this.state.mode === "attach"}
                        defaultExpandKey={this.state.sourceTaxonKey}
                        // showSourceTaxon={(sector) => this.setState({defaultAssemblyExpandKey: _.get(sector, 'target.id')})}
                        showSourceTaxon={sector => {
                          const params = qs.parse(_.get(location, "search"));
                          const newParams = {
                            ...params,
                            assemblyTaxonKey: _.get(sector, "target.id")
                          };
                          history.push({
                            pathname: `/assembly`,
                            search: `?${qs.stringify(newParams)}`
                          });
                          colTreeActions.refreshAssembly();
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

export default ManagementClassification;
