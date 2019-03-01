import React from "react";
import {
  Row,
  Col,
  notification,
  Input,
  Button,
  Icon,
  Card,
  Tag,
  Statistic
} from "antd";
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
import SyncState from './SyncState';
import Helmet from "react-helmet";
import moment from "moment";

const Search = Input.Search;

const { MANAGEMENT_CLASSIFICATION } = config;

class ManagementClassification extends React.Component {
  constructor(props) {
    super(props);

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
    axios(`${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}`)
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

          return this.saveSector(
            // null, // No colsources anymore ??
            rootName.data,
            attachmentName.data,
            mode
          )
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

  render() {
    const {syncState, sectorMappingError} = this.state;
    return (
      <Layout openKeys={["assembly"]} selectedKeys={["colAssembly"]}>
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

                    {syncState && <SyncState syncState={syncState}></SyncState>}

              </Col>
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
                 {sectorMappingError && <ErrorMsg error={sectorMappingError} />}
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
          </ColTreeContext.Provider>
        </PageContent>
      </Layout>
    );
  }
}

export default ManagementClassification;
