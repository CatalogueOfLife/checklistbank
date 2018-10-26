import React from "react";
import { Menu, Icon } from "antd";
import { NavLink } from "react-router-dom";

class DatasetTabs extends React.Component {
  render() {
    return (
      <Menu
        selectedKeys={[this.props.selectedItem]}
        mode="horizontal"
        style={{ marginBottom: "10px" }}
      >
        <Menu.Item key="metrics">
          <NavLink to={{ pathname: `/dataset/${this.props.datasetKey}/metrics` }}>
            Import Metrics
          </NavLink>
        </Menu.Item>
        <Menu.Item key="meta">
          <NavLink to={{ pathname: `/dataset/${this.props.datasetKey}/meta` }}>
            Metadata
          </NavLink>
        </Menu.Item>
        <Menu.Item key="sources">
          <NavLink
            to={{ pathname: `/dataset/${this.props.datasetKey}/sources` }}
          >
            CoL Sources
          </NavLink>
        </Menu.Item>
        <Menu.Item key="classification">
          <NavLink
            to={{
              pathname: `/dataset/${this.props.datasetKey}/classification`
            }}
          >
            Classification
          </NavLink>
        </Menu.Item>
        <Menu.Item key="names">
          <NavLink to={{ pathname: `/dataset/${this.props.datasetKey}/names` }}>
            Search Names
          </NavLink>
        </Menu.Item>
      </Menu>
    );
  }
}

export default DatasetTabs;
