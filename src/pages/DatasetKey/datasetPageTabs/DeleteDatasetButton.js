import React from "react";
import { Button, Icon, Popover, Popconfirm, notification } from "antd";
import {Redirect} from 'react-router-dom'
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";

class DeleteDatasetButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    deletionTriggered: false,
      error: null,
      deleteSuccess: false
    };
  }

  deleteDataset = () => {
    const {record} = this.props;  
    this.setState({ deletionTriggered: true });
    axios
      .delete(
        `${config.dataApi}dataset/${record.key}`
      )
      .then(res => {
        notification.success({
          message: 'Deletion succeeded',
          description: `The dataset "${record.title}" was deleted`,
        });
        this.setState({ importTriggered: false, deleteSuccess: true });
        
      })
      .catch(err => {
        this.setState({ deletionTriggered: false, error: err, deleteSuccess: false });
      });
  };

onDeleteClick = () => {

}

  render = () => {
    const { error, deleteSuccess } = this.state;
    const { record } = this.props;
    
    if(deleteSuccess) return <Redirect to={{
      pathname: '/dataset'
    }} />

    return (
      <React.Fragment>
        <Popconfirm placement="left" title={`Delete ${record.title}?`} onConfirm={this.deleteDataset} okText="Yes" cancelText="No">
        <Button
          type={'danger'}
          loading={this.state.importTriggered}
        >
          Delete
        </Button>
        </Popconfirm>
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
      </React.Fragment>
    );
  };
}

export default DeleteDatasetButton;
