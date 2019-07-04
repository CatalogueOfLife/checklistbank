import React from "react";
import { notification,Input, Tag, Icon, Button, Tooltip, Popover, Alert, Select, Row, Col } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import history from "../../history";
import { stringToColour } from "../../components/util";
import { ColTreeContext } from "./ColTreeContext";
import ErrorMsg from "../../components/ErrorMsg";
import SectorNote from "./SectorNote"
import withContext from "../../components/hoc/withContext"

const {Option} = Select; 
const { MANAGEMENT_CLASSIFICATION } = config;

class Sector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      popOverVisible: false,
      error: null
    };
  }

  hidePopover = () => {
    this.setState({
      popOverVisible: false
    });
  };
  handleVisibleChange = popOverVisible => {
    this.setState({ popOverVisible, error: null });
  };

  syncSector = sector => {
    axios
      .post(`${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}/sync`, {
        sectorKey: sector.key,
        key: sector.key,
        target: sector.target,
        subject: sector.subject
      })
      .then(() => {
        this.props.reloadSelfAndSiblings();
        this.props.getSyncState();
        notification.open({
          message: "Sync started",
          description: `Copying taxa from ${sector.key} `
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };

  deleteSector = sector => {
    axios
      .delete(
        `${config.dataApi}sector/${
          sector.key
        }`
      ) // /assembly/3/sync/
      .then(() => {
        this.props.reloadSelfAndSiblings();
        notification.open({
          message: "Deletion triggered",
          description: `Delete job for ${sector.key} placed on the sync queue`
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };
  updateSectorCode = code => {
    const { taxon : {sector}} = this.props;
    axios
      .put(
        `${config.dataApi}sector/${sector.key}`, {...sector, code: code}
      ) 
      .then(() => {
        notification.open({
          message: "Nom. code for sector updated",
          description: `New code is ${code}`
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  }

  updateSectorNote = note => {
    const { taxon : {sector}} = this.props;
    axios
      .put(
        `${config.dataApi}sector/${sector.key}`, {...sector, note: note}
      ) 
      .then(() => {
        notification.open({
          message: "Sector note updated:",
          description: note
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  }

  applyDecision = () => {
    const { taxon, decisionCallback } = this.props;
    const { sector } = taxon;

    const { datasetKey } = taxon;
    this.setState({ postingDecisions: true });

    return axios
      .post(`${config.dataApi}decision`, {
        datasetKey: datasetKey,
        subject: {
          id: _.get(taxon, "id"),

          name: _.get(taxon, "name")
        },
        mode: "block"
      })
      .then(decisionId => axios(`${config.dataApi}decision/${decisionId.data}`))
      .then(res => {
        taxon.decision = res;

        notification.open({
          message: `Decision apllied`,
          description: `${_.get(
            taxon,
            "name.scientificName"
          )} was blocked from the assembly`
        });
        if (typeof decisionCallback === "function") {
          decisionCallback();
        }
      })
      .catch(err => {
        notification.error({
          message: "Error",
          description: err.message
        });
      });
  };

  render = () => {
    const { taxon, nomCode } = this.props;

    const { error } = this.state;
    const { sector } = taxon;
    const { dataset: sectorSourceDataset } = sector;
    const isRootSector =
      !_.get(taxon, "parentId") ||
      (_.get(sector, "target.id") &&
        sector.target &&
        taxon.parentId === sector.target.id);
    const isRootSectorInSourceTree = taxon.id === sector.subject.id;
    const isSourceTree =
      _.get(MANAGEMENT_CLASSIFICATION, "key") !== _.get(taxon, "datasetKey");

    if (!sectorSourceDataset) {
      return "";
    }
    return !isSourceTree ? (
      <ColTreeContext.Consumer>
        {({ syncState }) => (
          <Popover
            content={
              <div>
                {isRootSector && (
                  <React.Fragment>
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

                    {_.get(syncState, "running.sectorKey") !== sector.key && (
                      <React.Fragment>
                        <Button
                          style={{ marginTop: "8px", width: "100%" }}
                          type="primary"
                          onClick={() => {
                            this.syncSector(sector);
                          }}
                        >
                          Sync sector
                        </Button>{" "}
                        <br />
                      </React.Fragment>
                    )}
                  </React.Fragment>
                )}

                <Button
                  style={{ marginTop: "8px", width: "100%" }}
                  type="primary"
                  onClick={() =>
                    this.props.showSourceTaxon(sector, sectorSourceDataset)
                  }
                >
                  Show sector in source
                </Button>
                <br />
                <Button
                  style={{ marginTop: "8px", width: "100%" }}
                  type="primary"
                  onClick={() => {
                    history.push(`dataset/${sectorSourceDataset.key}/meta`);
                  }}
                >
                  Source Dataset Metadata
                </Button>


                {isRootSector && (  
                <React.Fragment>
                <Row style={{ marginTop: "8px" }}>
                  <Col span={9}>
                    Nom. code
                  </Col>
                  <Col span={15} style={{paddingLeft: '8px'}}>
                <Select style={{ width: '100%' }} defaultValue={sector.code} onChange={value => this.updateSectorCode(value)}>

              {nomCode.map((f) => {
                return <Option key={f.name} value={f.name}>{f.name}</Option>
              })}
            </Select>
            </Col>
                </Row> 
                <Row style={{ marginTop: "8px" }}>
                <SectorNote note={sector.note} onSave={this.updateSectorNote}></SectorNote>
                </Row></React.Fragment>
                )}
                {/* !isRootSector && (
            <React.Fragment>
              <br />
              <Button
              style={{ marginTop: "8px", width: "100%" }}
              type="danger"
              onClick={() => {
                alert("block")
              }}
            >
              Block taxon
            </Button>
            </React.Fragment>
            ) */}
                {error && (
                  <Alert
                  closable
            onClose={() => this.setState({ error: null })}
                    message={
                      <ErrorMsg error={error} style={{ marginTop: "8px" }} />
                    }
                    type="error"
                  />
                )}
              </div>
            }
            title="Sector Options"
            visible={this.state.popOverVisible}
            onVisibleChange={this.handleVisibleChange}
            trigger="click"
            placement="rightTop"
          >
            <Tooltip title={sectorSourceDataset.title} placement="top">
              <Tag color={stringToColour(sectorSourceDataset.title)}>
                {isRootSector && <Icon type="caret-right" />}
                {sectorSourceDataset.alias || sectorSourceDataset.key}
                {_.get(syncState, "running.sectorKey") === sector.key && (
                  <Icon type="sync" style={{ marginLeft: "5px" }} spin />
                )}
              </Tag>
            </Tooltip>
          </Popover>
        )}
      </ColTreeContext.Consumer>
    ) : (
      <ColTreeContext.Consumer>
        {({ syncState }) => (
          <Popover
            content={
              <div>
                {isRootSectorInSourceTree &&
                  _.get(syncState, "running.sectorKey") !== sector.key && (
                    <React.Fragment>
                      <Button
                        style={{ marginTop: "8px", width: "100%" }}
                        type="primary"
                        onClick={() => {
                          this.syncSector(sector);
                        }}
                      >
                        Sync sector
                      </Button>{" "}
                      <br />
                    </React.Fragment>
                  )}
                {!isRootSectorInSourceTree && (
                  <Button
                    style={{ marginTop: "8px", width: "100%" }}
                    type="danger"
                    onClick={this.applyDecision}
                  >
                    Block taxon
                  </Button>
                )}
              </div>
            }
            title="Sector Options"
            visible={this.state.popOverVisible}
            onVisibleChange={this.handleVisibleChange}
            trigger="click"
            placement="rightTop"
          >
            <Tag color={stringToColour(sectorSourceDataset.title)}>
              {isRootSectorInSourceTree && <Icon type="caret-right" />}
              {sectorSourceDataset.alias || sectorSourceDataset.key}
              {_.get(syncState, "running.sectorKey") === sector.key && (
                <Icon type="sync" style={{ marginLeft: "5px" }} spin />
              )}
            </Tag>
          </Popover>
        )}
      </ColTreeContext.Consumer>
    );
  };
}

const mapContextToProps = ({ nomCode }) => ({ nomCode });
export default withContext(mapContextToProps)(Sector)



