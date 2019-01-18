import React from "react";
import {
  Row,
  Col,
  notification,
  Tag,
  Popconfirm,
  Icon,
  Button,
  Popover
} from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import {ColTreeContext} from "./ColTreeContext"
import history from "../../history";

const MANAGEMENT_CLASSIFICATION = {
  key: 3,
  title: "CoL draft"
};
class ColTreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      style: {},
      popOverVisible: false
    };
  }
  setMode = mode => {
    this.setState({ mode });
  };
  componentWillMount = () => {
    if (this.props.taxon.sector) {
      axios(
        `${config.dataApi}dataset/${this.props.taxon.sector.datasetKey}`
      )
        .then(res => {
          this.setState({ sectorSource: res.data });
        })
        .catch(err => {
          this.setState({ sectorSourceError: err });
        });
    }
  };


  hidePopover = () => {
    this.setState({
      popOverVisible: false
    });
  };
  handleVisibleChange = popOverVisible => {
    this.setState({ popOverVisible });
  };

  syncSector = sector => {
    axios
      .post(`${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}/sync/sector/${sector.key}`)
      .then(() => {
        this.props.reloadSelfAndSiblings();
        notification.open({
          message: "Sync started",
          description: `Copying taxa from ${
            sector.attachment.name
          } `
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };

  deleteSector = sector => {
    axios
      .delete(`${config.dataApi}sector/${sector.key}`)
      .then(() => {
        this.props.reloadSelfAndSiblings();
        notification.open({
          message: "Sector deleted",
          description: `${
            sector.attachment.name
          } was deleted from the CoL draft`
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };

  deleteTaxon = taxon => {
   axios
      .delete(`${config.dataApi}dataset/${taxon.datasetKey}/tree/${taxon.id}`)
      .then(() => {
        this.props.reloadSelfAndSiblings();
        notification.open({
          message: "Taxon deleted",
          description: `${
            taxon.name
          } was deleted from the CoL draft`
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };

  render = () => {
    const {
      taxon,
      taxon: { sector },
      hasPopOver,
      isUpdating
    } = this.props;
    const { sectorSource } = this.state;
    return (
      <div>
        <ColTreeContext.Consumer>
        { ({mode} )=> (mode === "modify" &&
          hasPopOver && (
            <Popover
              content={
                <Row>
                  <Col span={12}>
                    <Button type="danger" onClick={() => this.deleteTaxon(taxon)}>Delete taxon</Button>
                  </Col>
                 { /* <Col span={12}>
                    {" "}
                    <Button style={{ marginLeft: "12px" }} type="primary">
                      Add child
                    </Button>
              </Col> */}
                </Row>
              }
              title="Options"
              visible={this.state.popOverVisible}
              onVisibleChange={this.handleVisibleChange}
              trigger="click"
              placement="rightTop"
            >
              <Popconfirm
                visible={this.props.confirmVisible}
                title={this.props.confirmTitle}
                onConfirm={this.props.onConfirm}
                onCancel={this.props.onCancel}
              >
                <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                  {taxon.rank}:{" "}
                </span>
                <span dangerouslySetInnerHTML={{__html: taxon.name}}></span>
                {mode === "modify" &&
                  !_.isUndefined(taxon.speciesCount) && (
                    <span>
                      {" "}
                      • {taxon.speciesCount}{" "}
                      {!_.isUndefined(taxon.speciesEstimate) && (
                        <span> of {taxon.speciesEstimate} est. </span>
                      )}
                      living species
                    </span>
                  )}
                {isUpdating && (
                  <span>
                    {" "}
                    <Icon type="sync" spin />
                  </span>
                )}
                {taxon.status !== "accepted" && (
                  <Tag color="red" style={{ marginLeft: "6px" }}>
                    {taxon.status}
                  </Tag>
                )}
              </Popconfirm>
            </Popover>
          ) )}
          </ColTreeContext.Consumer>
          <ColTreeContext.Consumer>

          { ({mode} ) => ((mode !== "modify" || !hasPopOver) && (
          <Popconfirm
            visible={this.props.confirmVisible}
            title={this.props.confirmTitle}
            onConfirm={this.props.onConfirm}
            onCancel={this.props.onCancel}
          >
            <div>
              <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                {taxon.rank}:{" "}
              </span>
              <span dangerouslySetInnerHTML={{__html: taxon.name}}></span>
              {mode === "modify" &&
                !_.isUndefined(taxon.speciesCount) && (
                  <span>
                    {" "}
                    • {taxon.speciesCount}{" "}
                    {!_.isUndefined(taxon.speciesEstimate) && (
                      <span> of {taxon.speciesEstimate} est. </span>
                    )}
                    living species
                  </span>
                )}
              {isUpdating && (
                <span>
                  {" "}
                  <Icon type="sync" spin />
                </span>
              )}
              {taxon.status !== "accepted" && (
                <Tag color="red" style={{ marginLeft: "6px" }}>
                  {taxon.status}
                </Tag>
              )}

              {sectorSource &&
                sector &&
                this.props.showSourceTaxon && (
                  <span>
                    <span> • </span>
                    <Popover
                      content={
                        <div>
                          <Button
                            style={{ width: "100%" }}
                            type="danger"
                            onClick={() => {
                              this.deleteSector(sector);
                            }}
                          >
                            Delete sector
                          </Button>
                          <br />
                          <Button
                            style={{ marginTop: "8px", width: "100%" }}
                            type="primary"
                            onClick={() => {
                              this.syncSector(sector);
                            }}
                          >
                            Sync sector
                          </Button>
                          <br />
                          { /*   <Button
                            style={{ marginTop: "8px", width: "100%" }}
                            type="primary"
                            onClick={() =>
                              this.props.showSourceTaxon(sector, sectorSource)
                            }
                          >
                            Show in source tree
                          </Button>
                          <br /> */}
                          <Button
                            style={{ marginTop: "8px", width: "100%" }}
                            type="primary"
                            onClick={() => {
                              history.push(
                                `dataset/${sectorSource.datasetKey}/sources`
                              );
                            }}
                          >
                            Source Metadata
                          </Button>
                        </div>
                      }
                      title="Sector Options"
                      visible={this.state.popOverVisible}
                      onVisibleChange={this.handleVisibleChange}
                      trigger="click"
                      placement="top"
                    >
                      <Tag color="blue">{`Source:  ${
                        sectorSource.title
                      }`}</Tag>
                    </Popover>
                  </span>
                )}
            </div>
          </Popconfirm>
        ))}
      </ColTreeContext.Consumer>
      </div>
    );
  };
}


export default ColTreeNode;
