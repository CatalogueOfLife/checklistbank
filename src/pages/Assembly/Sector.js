import React from "react";
import { notification, Tag, Icon, Button, Tooltip, Popover } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import history from "../../history";
import { stringToColour } from "../../components/util";
import {ColTreeContext} from "./ColTreeContext"

const { MANAGEMENT_CLASSIFICATION } = config;

class Sector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      popOverVisible: false
    };
  }

  
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
      .post(
        `${config.dataApi}assembly/${
          MANAGEMENT_CLASSIFICATION.key
        }/sync`, {sectorKey: sector.key, key: sector.key, target: sector.target, subject: sector.subject}
      )
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
      .delete(`${config.dataApi}sector/${sector.key}`)
      .then(() => {
        this.props.reloadSelfAndSiblings();
        notification.open({
          message: "Sector deleted",
          description: `${sector.key} was deleted from the CoL draft`
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };
  render = () => {
    const { taxon } = this.props;
    const { sector } = taxon;
    const { dataset: sectorSourceDataset } = sector;
    const isRootSector =
      _.get(taxon, "parentId") &&
      _.get(sector, "target.id") &&
      sector.target &&
      taxon.parentId === sector.target.id;
    const isSourceTree = _.get(MANAGEMENT_CLASSIFICATION, 'key') !== _.get(taxon, 'datasetKey')

    if(!sectorSourceDataset){
        return ""
    }
    return  !isSourceTree ? (
        <ColTreeContext.Consumer>
        { ({syncState} )=> (
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
            
            {_.get(syncState, 'running.sectorKey') !== sector.key && <React.Fragment>
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

            </React.Fragment>}
               
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
            {_.get(syncState, 'running.sectorKey') === sector.key && <Icon type="sync" style={{marginLeft: '5px'}} spin />}
          </Tag>

        
        
          
        </Tooltip>
      </Popover>
      )} 
      </ColTreeContext.Consumer>
    ) : (
        <ColTreeContext.Consumer>
        { ({syncState} )=> (
        <Tag color={stringToColour(sectorSourceDataset.title)}>
        {isRootSector && <Icon type="caret-right" />}
        {sectorSourceDataset.alias || sectorSourceDataset.key}
        {_.get(syncState, 'running.sectorKey') === sector.key && <Icon type="sync" style={{marginLeft: '5px'}} spin />}
      </Tag>
      )}
      </ColTreeContext.Consumer>
    );
  };
}

export default Sector;
