import React from "react";
import { Button, Icon, Popover, notification } from "antd";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";

const {MANAGEMENT_CLASSIFICATION} = config

class SyncButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      importTriggered: false,
      error: null
    };
  }

  startSync = () => {
    const {record} = this.props;  
    this.setState({ importTriggered: true });
    axios
      .post(
        `${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}/sync`,
        {
          'sectorKey': record.sectorKey,
          'datasetKey': MANAGEMENT_CLASSIFICATION.key
        }
      )
      .then(res => {
        this.setState({ importTriggered: false });
        notification.open({
          title: "Sync started",
          message: `Now syncyning sector ${record.sectorKey}`
        })
        if(this.props.onStartSyncSuccess && typeof this.props.onStartSyncSuccess === 'function'){
          this.props.onStartSyncSuccess();
        }
      })
      .catch(err => {
        this.setState({ importTriggered: false, error: err });
      });
  };

  stopSync = () => {
    const {record} = this.props;  
    this.setState({ importTriggered: true });
    axios
      .delete(`${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}/sync/${record.sectorKey}`)
      .then(res => {
        this.setState({ importTriggered: false });
        notification.open({
          title: 'Sync canceled'
        })
        
        if(this.props.onDeleteSuccess && typeof this.props.onDeleteSuccess === 'function'){
          this.props.onDeleteSuccess();
        }
        
      })
      .catch(err => {
        this.setState({ importTriggered: false, error: err });
      });
  };

  render = () => {
    const { error } = this.state;
    const { record } = this.props;
    const isStopButton = record.state && ['finished', 'canceled', 'failed'].indexOf(record.state) === -1;
    
    return (
      <div style={this.props.style || {}}>
        <Button
          type={isStopButton ? 'danger' : 'primary'}
          loading={this.state.importTriggered}
          onClick={isStopButton ? this.stopSync : this.startSync}
        >
          {!isStopButton && 'Sync'}
          {isStopButton && record.state !== 'in queue' &&  'Stop sync'}
          {isStopButton && record.state === 'in queue' &&  'Remove'}
        </Button>
        {error && (
          <Popover
            placement="bottom"
            title="Error"
            content={<ErrorMsg error={error} />}
            trigger="click"
          >
            <Icon
              type="warning"
              style={{ color: "red", marginLeft: "10px", cursor: "pointer" }}
            />
          </Popover>
        )}
      </div>
    );
  };
}

export default SyncButton;
