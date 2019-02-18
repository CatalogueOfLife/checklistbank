import React from "react";
import { Row, Col, notification, Input, Button, Icon, Card, Tag } from "antd";
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
import Helmet from "react-helmet";
import SectorModal from "./SectorModal";
import PresentationItem from "../../components/PresentationItem";
import moment from "moment"
const Search = Input.Search;

const { MANAGEMENT_CLASSIFICATION } = config;

class ManagementClassification extends React.Component {
  constructor(props) {
    super(props);

    this.saveSector = this.saveSector.bind(this);
    this.showSourceTaxon = this.showSourceTaxon.bind(this);

    this.state = {
      mode: "attach",
      syncState: {}
    };
  }

  componentWillMount() {
    this.getSyncState();

    this.timer = setInterval(() => {
      this.getSyncState();
    }, 3000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  getSyncState = () => {
    axios(`${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}/sync`)
      .then(res => this.setState({ syncState: res.data }))
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
          if (mode === "ATTACH") {
            return this.saveChild(rootName.data, attachmentName.data)
              .then(res => {
                return this.saveSector(
                  null, // No colsources anymore ??
                  rootName.data,
                  res.data,
                  mode
                );
              })
              .catch(err => {
                // TODO handle error
                alert(err);
              });
          } else if (mode === "MERGE") {
            return axios(
              `${config.dataApi}dataset/${datasetKey}/tree/${encodeURIComponent(
                root.props.dataRef.key
              )}/children`
            ).then(res => {
              return Promise.all(
                res.data.result.map(e => {
                  return this.saveChild(e, attachmentName.data)
                    .then(n => {
                      return this.saveSector(null, e, n.data, mode);
                    })
                    .catch(err => {
                      // TODO handle error
                      alert(err);
                    });
                })
              );
            });
          }
        })
      )

      .catch(err => {
        this.setState({ sectorMappingError: err });
        console.log(err);
      });
  };
  getSectorInfo_WITH_COLSOURCE = (attachment, root, mode) => {
    // get the ColSources for the dataset
    const { datasetKey } = this.state;
    return axios
      .all([
        axios(`${config.dataApi}colsource?datasetKey=${datasetKey}`),
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
        axios.spread((colsources, attachmentName, rootName) => {
          console.log(colsources.data[0]);
          console.log(attachmentName.data);
          console.log(rootName.data);
          attachmentName.data.name = attachmentName.data.scientificName;
          rootName.data.name = rootName.data.scientificName;
          if (colsources.data.length > 1) {
            this.setState({
              sectorModal: {
                options: colsources.data,
                root: rootName.data,
                attachment: attachmentName.data,
                title: "Please select Col Source for sector"
              }
            });
            return;
          } else {
            if (mode === "ATTACH") {
              return this.saveChild(rootName.data, attachmentName.data)
                .then(res => {
                  return this.saveSector(
                    _.get(colsources, "data[0]"),
                    rootName.data,
                    res.data,
                    mode
                  );
                })
                .catch(err => {
                  // TODO handle error
                  alert(err);
                });
            } else if (mode === "MERGE") {
              return axios(
                `${
                  config.dataApi
                }dataset/${datasetKey}/tree/${encodeURIComponent(
                  root.props.dataRef.key
                )}/children`
              ).then(res => {
                return Promise.all(
                  res.data.result.map(e => {
                    return this.saveChild(e, attachmentName.data)
                      .then(n => {
                        return this.saveSector(
                          _.get(colsources, "data[0]"),
                          e,
                          n.data,
                          mode
                        );
                      })
                      .catch(err => {
                        // TODO handle error
                        alert(err);
                      });
                  })
                );
              });
            }
          }
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

  saveSector = (source, subject, target, mode) => {
    const sector = source
      ? {
          colSourceKey: source.key,
          datasetKey: subject.datasetKey,
          subject: { id: subject.id, status: subject.status },
          target: { id: target.id, status: target.status }
        }
      : {
          datasetKey: subject.datasetKey,
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
        this.setState({ sectorModal: null });
      })
      .catch(err => {
        this.setState({ sectorMappingError: err, sectorModal: null });
        console.log(err);
      });
  };

  showSourceTaxon = (sector, source) => {
    axios(`${config.dataApi}dataset/${source.key}`)
      .then(res => {
        this.setState({
          defaultExpandKey: sector.subject.id,
          datasetKey: source.key,
          datasetName: res.data.title,
          selectedDataset: { key: res.data.key, title: res.data.title }
        });
      })
      .catch(err => {
        console.log(err);
      });
  };

  onSelectDataset = dataset => {
    this.setState({
      datasetKey: dataset.key,
      datasetName: dataset.title,
      selectedDataset: dataset,
      defaultExpandKey: null
    });
  };

  onDragStart = (e, dataset) => {
    e.node.dataset = dataset;
    this.setState({ dragNode: e.node });
  };

  toggleMode = mode => {
    this.setState({ mode: mode });
  };
  cancelSectorModal = () => {
    this.setState({ sectorModal: null });
  };
  render() {
    return (
      <Layout openKeys={[]} selectedKeys={["assembly"]}>
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
              <Col span={3}>
                {!isNaN(_.get(this.state, "syncState.syncsCompleted")) && (
                  <PresentationItem md={20} label="Syncs completed">
                    {_.get(this.state, "syncState.syncsCompleted")}
                  </PresentationItem>
                )}
              </Col>
              <Col span={3} offset={1}>
                {!isNaN(_.get(this.state, "syncState.syncsFailed")) && (
                  <PresentationItem md={20} label="Syncs failed">
                    {_.get(this.state, "syncState.syncsFailed")}
                  </PresentationItem>
                )}
              </Col>
              <Col span={3} offset={1}>
                {"boolean" === typeof _.get(this.state, "syncState.idle") && (
                  <PresentationItem md={18} label="Status">
                    <Tag
                      color={
                        _.get(this.state, "syncState.idle") === false
                          ? "green"
                          : null
                      }
                    >
                      {_.get(this.state, "syncState.idle") === true
                        ? "Idle"
                        : "Running"}
                    </Tag>
                  </PresentationItem>
                )}
              </Col>
            </Row>
            {_.get(this.state, "syncState.syncsRunning") &&
              _.get(this.state, "syncState.syncsRunning.length") > 0 &&
              _.get(this.state, "syncState.syncsRunning").map(s => (
                <Row style={{ paddingLeft: "16px" }}>
                  <Col span={3} offset={12}>
                    <PresentationItem md={14} label="Status">
                      {s.status}
                    </PresentationItem>
                  </Col>
                  <Col span={3} offset={1}>
                    <PresentationItem md={14} label="Taxa created">
                      {s.taxaCreated}
                    </PresentationItem>
                  </Col>
                  <Col span={3} offset={1}>
                    <PresentationItem md={14} label="Sync started">
                      {moment(s.started).fromNow()}
                    </PresentationItem>
                  </Col>
                </Row>
              ))}
            <Row style={{ padding: "10px", height: "100%" }}>
              <Col span={12} style={{ padding: "10px" }}>
                <Card>
                  <h4>CoL Draft</h4>{" "}
                  <Search
                    placeholder="Find taxon (not yet functional)"
                    onSearch={value => console.log(value)}
                    style={{ width: "100%" }}
                  />
                  <div style={{ overflowY: "scroll", height: "800px" }}>
                    <ColTree
                      dataset={MANAGEMENT_CLASSIFICATION}
                      treeType="mc"
                      attachFn={this.getSectorInfo}
                      onDragStart={e =>
                        this.onDragStart(e, MANAGEMENT_CLASSIFICATION)
                      }
                      dragNode={this.state.dragNode}
                      draggable={true}
                      showSourceTaxon={this.showSourceTaxon}
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
                          to={`/dataset/${
                            this.state.selectedDataset.key
                          }/meta`}
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
                      onSelectName={name =>
                        this.setState({ defaultExpandKey: name.key })
                      }
                      onResetSearch={() =>
                        this.setState({ defaultExpandKey: null })
                      }
                    />
                  )}
                  <div style={{ overflowY: "scroll", height: "800px" }}>
                    {this.state.selectedDataset && (
                      <ColTree
                        dataset={this.state.selectedDataset}
                        treeType="gsd"
                        onDragStart={e =>
                          this.onDragStart(e, this.state.selectedDataset)
                        }
                        draggable={this.state.mode === "attach"}
                        defaultExpandKey={this.state.defaultExpandKey}
                      />
                    )}
                  </div>
                </Card>
              </Col>
            </Row>

            {this.state.sectorModal && (
              <SectorModal
                title={_.get(this.state, "sectorModal.title")}
                options={_.get(this.state, "sectorModal.options")}
                onCancel={() => this.setState({ sectorModal: null })}
                onChange={value =>
                  this.saveSector(
                    _.find(_.get(this.state, "sectorModal.options"), o => {
                      return o.key === value;
                    }),
                    _.get(this.state, "sectorModal.root"),
                    _.get(this.state, "sectorModal.attachment")
                  )
                }
                options={_.get(this.state, "sectorModal.options")}
                datasetKey={_.get(this.state, "sectorModal.datasetKey")}
              />
            )}
          </ColTreeContext.Provider>
        </PageContent>
      </Layout>
    );
  }
}

export default ManagementClassification;
