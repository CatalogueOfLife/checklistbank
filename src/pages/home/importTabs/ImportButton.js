import React from "react";
import { Button, Icon, Popover } from "antd";
import axios from "axios";
import config from "../../../config";
import history from "../../../history";
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
        `${config.dataApi}importer/?datasetKey=${record.datasetKey}&force=false`
      )
      .then(res => {
        this.setState({ importTriggered: false });
        history.push(`/imports/running`);
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
        this.props.onDeleteSuccess();
      })
      .catch(err => {
        this.setState({ importTriggered: false, error: err });
      });
  };

  render = () => {
    const { error } = this.state;
    const { record } = this.props;
    const isStopButton = ['processing', 'inserting', 'downloading'].indexOf(record.state) > -1;

    return (
      <div>
        <Button
          type={isStopButton ? 'danger' : 'primary'}
          loading={this.state.importTriggered}
          onClick={isStopButton ? this.stopImport : this.startImport}
        >
          Import
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
