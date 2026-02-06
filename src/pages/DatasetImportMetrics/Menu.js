import React from "react";
import { withRouter } from "react-router-dom";
import { Menu } from "antd";
import { NavLink } from "react-router-dom";
import {
  DiffOutlined,
  PieChartOutlined,
  LineChartOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { RiNodeTree } from "react-icons/ri";
class ImportMenu extends React.Component {
  render() {
    // const { current } = this.state;
    const { datasetKey, attempt, location, dataset } = this.props;
    const isProject = dataset?.origin === "project";
    const splitted = location.pathname
      .split(`/dataset/${datasetKey}/`)[1]
      .split("/");

    const lastPart = splitted[splitted.length - 1];
    const current =
      lastPart === "tree"
        ? "tree"
        : lastPart === "metadata"
        ? "metadata"
        : splitted[0];
    return (
      <Menu
        onClick={this.handleClick}
        selectedKeys={[current]}
        mode="horizontal"
        style={{ marginBottom: "8px" }}
      >
        <Menu.Item key="imports" icon={<PieChartOutlined />}>
          <NavLink
            to={{
              pathname: attempt
                ? `/dataset/${datasetKey}/imports/${attempt}`
                : `/dataset/${datasetKey}/imports`,
            }}
          >
            {attempt && `${isProject ? "Release" : "Import"} ${attempt}`}
            {!attempt && `Current ${isProject ? "release" : "import"}`}
          </NavLink>
        </Menu.Item>
        {!isProject && attempt && (
          <Menu.Item key="tree" icon={<RiNodeTree />}>
            <NavLink
              to={{
                pathname: `/dataset/${datasetKey}/imports/${attempt}/tree`,
              }}
            >
              Archived tree
            </NavLink>
          </Menu.Item>
        )}
        {isProject && attempt && (
          <Menu.Item key="tree" icon={<RiNodeTree />}>
            <NavLink
              to={{
                pathname: `/dataset/${datasetKey}R${attempt}/classification`,
              }}
            >
              Browse tree
            </NavLink>
          </Menu.Item>
        )}
        {!isProject && attempt && (
          <Menu.Item key="metadata" icon={<FileTextOutlined />}>
            <NavLink
              to={{
                pathname: `/dataset/${datasetKey}/imports/${attempt}/metadata`,
              }}
            >
              Metadata
            </NavLink>
          </Menu.Item>
        )}

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
