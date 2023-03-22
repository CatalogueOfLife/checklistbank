import React from "react";
import { TagOutlined } from "@ant-design/icons";
import { Popover, Spin, Tag } from "antd";
import axios from "axios";
import config from "../../config";
import _ from "lodash";
import { getTypeColor } from "./TypeMaterial"
class TypeMaterialPopover extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      typeMaterial: [],
      loading: false,
      error: null,
    };
  }

  getData = () => {
    const { nameId, datasetKey, references } = this.props;
    if (referenceId) {
      const refIds = !_.isArray(referenceId) ? [referenceId] : referenceId;
      const typeMaterial = [];
      this.setState({ loading: true });
      Promise.all(
        refIds.map((id) =>
          _.get(references, id)
            ? Promise.resolve(typeMaterial.push(references[nameId]))
            : axios(
              `${config.dataApi}dataset/${datasetKey}/name/${nameId}/types`
            ).then((res) => typeMaterial.push(res.data))
        )
      ).then(() => this.setState({ typeMaterial, loading: false }));
    }
  };

  getContent = () => {
    const { typeMaterial, loading } = this.state;
    if (loading) {
      return <Spin />;
    } else if (typeMaterial.length === 1) {
      return typeMaterial[0].citation;
    } else {
      return (
        <ul>
          {typeMaterial.map((s) => (
            <> <Tag color={getTypeColor(s?.status)}>{s?.status}</Tag>{s?.citation && <span
              dangerouslySetInnerHTML={{ __html: linkify(s?.citation || "") }}
            ></span>}</>
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
        title="Type Material"
        onVisibleChange={(visible) => visible && this.getData()}
        content={<div style={{ maxWidth: "500px" }}>{this.getContent()}</div>}
        trigger="click"
      >
        <TagOutlined style={{ cursor: "pointer" }} />
      </Popover>
    ) : (
      ""
    );
  };
}

export default TypeMaterialPopover;
