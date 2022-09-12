import React from "react";
import { withRouter } from "react-router-dom";
import { Menu } from "antd";
import { NavLink } from "react-router-dom";
import {
  DiffOutlined,
  PieChartOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { RiNodeTree } from "react-icons/ri";
class ImportMenu extends React.Component {
  render() {
    // const { current } = this.state;
    const { datasetKey, attempt, location } = this.props;
    const splitted = location.pathname
      .split(`/dataset/${datasetKey}/`)[1]
      .split("/");

      const current = splitted[splitted.length -1] === "tree" ? "tree" : splitted[0]
    return (
      <Menu
        onClick={this.handleClick}
        selectedKeys={[current]}
        mode="horizontal"
        style={{ marginBottom: "8px" }}
      >
        <Menu.Item key="imports" icon={<PieChartOutlined />}>
          <NavLink to={{ pathname: attempt ? `/dataset/${datasetKey}/imports/${attempt}` : `/dataset/${datasetKey}/imports` }}>
            {attempt && `Import ${attempt}`}
            {!attempt && `Latest import`}
          </NavLink>
        </Menu.Item>
        {attempt && <Menu.Item key="tree" icon={<RiNodeTree />}>
          <NavLink to={{ pathname: `/dataset/${datasetKey}/imports/${attempt}/tree`}}>
            Archived tree
          </NavLink>
        </Menu.Item>}
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
