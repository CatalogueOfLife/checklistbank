import React from "react";
import { Button, Icon, Popover, notification } from "antd";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";

class ImportButton extends React.Component {
  constructor(props) {
    super(props);
    this.startImport = this.startImport.bind(this);
    this.stopImport = this.stopImport.bind(this);
    this.state = {
      importTriggered: false,
      error: null
    };
  }

  startImport = () => {
    const {record} = this.props;  
    this.setState({ importTriggered: true });
    axios
      .post(
        `${config.dataApi}importer/queue`,
        {
          'datasetKey': record.datasetKey,
          'priority': true,
          'force': true,
        }
      )
      .then(res => {
        this.setState({ importTriggered: false });
        if(this.props.onStartImportSuccess && typeof this.props.onStartImportSuccess === 'function'){
          this.props.onStartImportSuccess();
        }
      })
      .catch(err => {
        this.setState({ importTriggered: false, error: err });
      });
  };

  stopImport = () => {
    const {record} = this.props;  
    this.setState({ importTriggered: true });
    axios
      .delete(`${config.dataApi}importer/${record.datasetKey}`)
      .then(res => {
        this.setState({ importTriggered: false });
        if(record.state !== 'in queue'){
          notification.open({
            title: 'Import stopped',
            description: `Import of ${record.dataset.title} was stopped`
          })
        } else {
          notification.open({
            title: 'Import canceled',
            description: `${record.dataset.title} was removed from the queue`
          })
        }
        
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
    const isStopButton = ['processing', 'inserting', 'downloading', 'in queue'].indexOf(record.state) > -1;
    
    return (
      <div>
        <Button
          type={isStopButton ? 'danger' : 'primary'}
          loading={this.state.importTriggered}
          onClick={isStopButton ? this.stopImport : this.startImport}
        >
          {!isStopButton && 'Import'}
          {isStopButton && record.state !== 'in queue' &&  'Stop import'}
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

export default ImportButton;
