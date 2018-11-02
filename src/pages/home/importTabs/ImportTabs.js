import React from "react";
import { Menu, Icon } from "antd";
import { NavLink } from "react-router-dom";

class ImportTabs extends React.Component {
  render() {
    return (
      <Menu
        selectedKeys={[this.props.selectedItem]}
        mode="horizontal"
        style={{ marginBottom: "10px" }}
      >
        <Menu.Item key="running">
          <NavLink to={{ pathname: `/imports/running` }}>
            Running Imports
          </NavLink>
        </Menu.Item>
        <Menu.Item key="failed">
          <NavLink to={{ pathname: `/imports/failed` }}>
            Failed Imports
          </NavLink>
        </Menu.Item>
     
      </Menu>
    );
  }
}

export default ImportTabs;
