import React from "react";
import { BookOutlined } from "@ant-design/icons";
import { Popover, Spin } from "antd";
import axios from "axios";
import config from "../../../config";
import _ from "lodash";

class ReferencePopover extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      reference: [],
      loading: false,
      error: null,
    };
  }

  getData = () => {
    const { referenceId, datasetKey, references } = this.props;
    if (referenceId) {
      const refIds = !_.isArray(referenceId) ? [referenceId] : referenceId;
      const reference = [];
      this.setState({ loading: true });
      Promise.all(
        refIds.map((id) =>
          _.get(references, id)
            ? Promise.resolve(reference.push(references[id]))
            : axios(
                `${config.dataApi}dataset/${datasetKey}/reference/${id}`
              ).then((res) => reference.push(res.data))
        )
      ).then(() => this.setState({ reference, loading: false }));
    }
  };

  getContent = () => {
    const { reference, loading } = this.state;
    if (loading) {
      return <Spin />;
    } else if (reference.length === 1) {
      return reference[0].citation;
    } else {
      return (
        <ul>
          {reference.map((r) => (
            <li>{r.citation}</li>
          ))}
        </ul>
      );
    }
  };

  render = () => {
    const { referenceId } = this.props;

    return referenceId ? (
      <Popover
        placement={this.props.placement || "left"}
        title="Reference"
        onVisibleChange={(visible) => visible && this.getData()}
        content={<div style={{ maxWidth: "500px" }}>{this.getContent()}</div>}
        trigger="click"
      >
        <BookOutlined style={{ cursor: "pointer" }} />
      </Popover>
    ) : (
      ""
    );
  };
}

export default ReferencePopover;
