import React from "react";
import { withRouter } from "react-router-dom";
import { Menu } from "antd";
import { NavLink } from "react-router-dom";
import {
  DiffOutlined,
  PieChartOutlined,
  LineChartOutlined,
} from "@ant-design/icons";

class ImportMenu extends React.Component {
  render() {
    // const { current } = this.state;
    const { datasetKey, location } = this.props;
    const current = location.pathname
      .split(`/dataset/${datasetKey}/`)[1]
      .split("/")[0];
    return (
      <Menu
        onClick={this.handleClick}
        selectedKeys={[current]}
        mode="horizontal"
        style={{ marginBottom: "8px" }}
      >
        <Menu.Item key="imports" icon={<PieChartOutlined />}>
          <NavLink to={{ pathname: `/dataset/${datasetKey}/imports` }}>
            Imports
          </NavLink>
        </Menu.Item>
        <Menu.Item key="import-timeline" icon={<LineChartOutlined />}>
          <NavLink to={{ pathname: `/dataset/${datasetKey}/import-timeline` }}>
            Timeline
          </NavLink>
        </Menu.Item>
        <Menu.Item key="diff" icon={<DiffOutlined />}>
          <NavLink to={{ pathname: `/dataset/${datasetKey}/diff` }}>
            Diff
          </NavLink>
        </Menu.Item>
      </Menu>
    );
  }
}

export default withRouter(ImportMenu);
