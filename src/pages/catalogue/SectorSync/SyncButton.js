import React from "react";
import { WarningOutlined } from '@ant-design/icons';
import { Button, Popover, notification } from "antd";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";
import withContext from "../../../components/hoc/withContext";

import _ from "lodash"

class SyncButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      importTriggered: false,
      error: null
    };
  }

  startSync = () => {
    const {record, addError} = this.props;  
    this.setState({ importTriggered: true });
    axios
      .post(
        `${config.dataApi}dataset/${_.get(record, 'sector.datasetKey')}/sector/sync`,
        {
          'sectorKey': _.get(record, 'sector.id'),
          'datasetKey': _.get(record, 'sector.datasetKey')
        }
      )
      .then(res => {
        this.setState({ importTriggered: false });
        notification.open({
          title: "Sync started",
          message: `Now syncyning sector ${ _.get(record, 'sector.id')}`
        })
        if(this.props.onStartSyncSuccess && typeof this.props.onStartSyncSuccess === 'function'){
          this.props.onStartSyncSuccess();
        }
      })
      .catch(err => {
        addError(err)
        this.setState({ importTriggered: false, error: err });
      });
  };

  stopSync = () => {
    const {record, addError} = this.props;  
    this.setState({ importTriggered: true });
    axios
      .delete(`${config.dataApi}dataset/${_.get(record, 'sector.datasetKey')}/sector/${_.get(record, 'sector.id')}/sync`)
      .then(res => {
        this.setState({ importTriggered: false });
        notification.open({
          message: 'Sync canceled'
          //title: 'Sync canceled'
        })
        
        if(this.props.onDeleteSuccess && typeof this.props.onDeleteSuccess === 'function'){
          this.props.onDeleteSuccess();
        }
        
      })
      .catch(err => {
        addError(err)
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
            <WarningOutlined style={{ color: "red", marginLeft: "10px", cursor: "pointer" }} />
          </Popover>
        )}
      </div>
    );
  };
}

const mapContextToProps = ({ addError }) => ({
  addError
});

export default withContext(mapContextToProps)(SyncButton);
// export default SyncButton;
