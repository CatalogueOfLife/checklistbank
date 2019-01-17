import React from "react";
import { Row, Col, notification, Input, Button, Icon, Card } from "antd";
import {NavLink} from 'react-router-dom'
import _ from "lodash";
import Layout from "../../components/LayoutNew";
import axios from "axios";
import config from "../../config";
import {ColTreeContext} from "./ColTreeContext"
import ErrorMsg from "../../components/ErrorMsg";
import ColTree from "./ColTree";
import DatasetAutocomplete from "./DatasetAutocomplete";
import NameAutocomplete from "./NameAutocomplete";
import PageContent from "../../components/PageContent";
import Helmet from 'react-helmet'
import SectorModal from "./SectorModal";

const Search = Input.Search;

const MANAGEMENT_CLASSIFICATION = {
  key: 3,
  title: "CoL draft"
};

class ManagementClassification extends React.Component {
  constructor(props) {
    super(props);

    this.saveSector = this.saveSector.bind(this);
    this.showSourceTaxon = this.showSourceTaxon.bind(this);

    this.state = {
      mode: "attach"
    };
  }

  getSectorInfo = (attachment, root, mode) => {
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
          } else if (colsources.data.length === 0) {
            this.setState({
              sectorModal: {
                datasetKey: datasetKey,
                title: "No Col Sources for dataset"
              }
            });
            return;
          } else {
            if (mode === "ATTACH") {
              return this.saveChild(rootName.data, attachmentName.data)
                .then(res => {
                  return this.saveSector(
                    colsources.data[0],
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
                          colsources.data[0],
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
      .post(`${config.dataApi}dataset/${MANAGEMENT_CLASSIFICATION.key}/tree`, {
        datasetKey: subject.datasetKey,
        id: subject.id,
        status: subject.status,
        parentId: target.id
      })
      .then(res => {
        return axios(
          `${config.dataApi}dataset/${
            MANAGEMENT_CLASSIFICATION.key
          }/taxon/${encodeURIComponent(res.data)}`
        );
      });
  };

  saveSector = (source, subject, target, mode) => {
    return axios
      .post(`${config.dataApi}sector`, {
        colSourceKey: source.key,
        datasetKey: subject.datasetKey,
        subject: { id: subject.id, status: subject.status },
        target: { id: target.id, status: target.status }
      })
      .then(res => {
        const msg = `${_.get(target, "name.scientificName") ||
          target.id} attached to ${subject.name ||
          subject.id} using colSource ${source.title} (${source.alias})`;
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
    axios(`${config.dataApi}dataset/${source.datasetKey}`)
      .then(res => {
        this.setState({
          defaultExpandKey: sector.root.id,
          datasetKey: source.datasetKey,
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
          <link rel="canonical" href="http://test.col.plus" />
        </Helmet>
        <PageContent>
        <ColTreeContext.Provider value={{mode: this.state.mode, toggleMode: this.toggleMode}}>

          <Row style={{ paddingLeft: "16px" }}>
           <ColTreeContext.Consumer>
           {({mode, toggleMode}) => (
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
            
          </Row>
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
                  {this.state.selectedDataset
                    ? <React.Fragment> {this.state.selectedDataset.title} 
                        <NavLink to={`/dataset/${this.state.selectedDataset.key}/sources`}>
                       {" "} <Icon type="eye"></Icon> source
                        </NavLink></React.Fragment>
                    : "No dataset selected"}
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
