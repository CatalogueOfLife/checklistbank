import React from "react";
import { Modal, Select } from "antd";
import { NavLink } from "react-router-dom";

const Option = Select.Option;

class SectorModal extends React.Component {
  render = () => {
    return (
      <Modal
        title={this.props.title}
        visible={true}
        onCancel={this.props.onCancel}
      >
        {this.props.options && (
          <Select style={{ width: 240 }} onChange={this.props.onChange}>
            {this.props.options.map(o => {
              return (
                <Option key={o.key} value={o.key}>
                  {o.alias} - {o.title}
                </Option>
              );
            })}
          </Select>
        )}
        {!this.props.options &&
          this.props.datasetKey && (
            <NavLink
              to={{ pathname: `/dataset${this.props.datasetKey}/sources` }}
            >
              Dataset
            </NavLink>
          )}
      </Modal>
    );
  };
}

export default SectorModal;
