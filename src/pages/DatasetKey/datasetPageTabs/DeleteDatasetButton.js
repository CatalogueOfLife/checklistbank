import React from "react";
import { WarningOutlined } from "@ant-design/icons";
import { Button, Popover, Popconfirm, notification } from "antd";
import { Redirect } from "react-router-dom";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";

class DeleteDatasetButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      deletionTriggered: false,
      error: null,
      deleteSuccess: false,
    };
  }

  deleteDataset = () => {
    const { record } = this.props;
    this.setState({ deletionTriggered: true });
    axios
      .delete(`${config.dataApi}dataset/${record.key}`)
      .then((res) => {
        notification.success({
          message: "Deletion succeeded",
          description: `The dataset "${record.title}" was deleted`,
        });
        this.setState({ deletionTriggered: false, deleteSuccess: true });
      })
      .catch((err) => {
        this.setState({
          deletionTriggered: false,
          error: err,
          deleteSuccess: false,
        });
      });
  };

  onDeleteClick = () => {};

  render = () => {
    const { error, deleteSuccess } = this.state;
    const { record, style } = this.props;

    if (deleteSuccess)
      return (
        <Redirect
          to={{
            pathname: "/dataset",
          }}
        />
      );

    return (
      <React.Fragment>
        <Popconfirm
          placement="left"
          title={`Delete ${record.title}?`}
          onConfirm={this.deleteDataset}
          okText="Yes"
          cancelText="No"
        >
          <Button
            style={style}
            type={"danger"}
            loading={this.state.deletionTriggered}
            disabled={this.state.deletionTriggered}
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
            <WarningOutlined
              style={{ color: "red", marginLeft: "10px", cursor: "pointer" }}
            />
          </Popover>
        )}
      </React.Fragment>
    );
  };
}

export default DeleteDatasetButton;
