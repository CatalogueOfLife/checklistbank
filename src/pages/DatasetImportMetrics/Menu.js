import React from "react";
import withRouter from "../../withRouter";
import { Typography } from 'antd';
const { Title } = Typography;
import { Menu, Row, Col, Button } from "antd";
import { NavLink } from "react-router-dom";
import {
  DiffOutlined,
  PieChartOutlined,
  LineChartOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { RiNodeTree } from "react-icons/ri";
import moment from "dayjs";

class ImportMenu extends React.Component {
  render() {
    // const { current } = this.state;
    const { datasetKey, attempt, location, dataset, isFinished } = this.props;
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
      <>
        {dataset && (
          <Row style={{ padding: "10px" }} type="flex">
            {attempt && (
              <>
            <Col>
              <h3>
                {["xrelease", "release", "project"].includes(origin)
                  ? "Release "
                  : "Import "}
                  #{attempt}
              </h3>
            </Col>
            <Col style={{ marginLeft: "10px", marginTop: "2px" }}>
              - {moment(dataset?.imported).format("lll")}
            </Col>
              </>
            )}
            <Col flex="auto"></Col>
            <Col>
              {dataset?.lastImportAttempt &&
                dataset?.origin !== "project" && (
                  <span>
                    Last import attempt:{" "}
                    {moment(dataset?.lastImportAttempt).format("lll")}
                  </span>
                )}
            </Col>
          </Row>
        )}
      <Menu
        onClick={this.handleClick}
        selectedKeys={[current]}
        mode="horizontal"
        style={{ marginBottom: "8px" }}
        items={[
          {
            key: "imports",
            icon: <PieChartOutlined />,
            label: (
              <NavLink
                to={{
                  pathname: attempt
                    ? `/dataset/${datasetKey}/imports/${attempt}`
                    : `/dataset/${datasetKey}/imports`,
                }}
              >
                Metrics
              </NavLink>
            ),
          },
          ...(!isProject &&
          attempt &&
          isFinished &&
          dataset.attempt != attempt
            ? [
                {
                  key: "metadata",
                  icon: <FileTextOutlined />,
                  label: (
                    <NavLink
                      to={{
                        pathname: `/dataset/${datasetKey}/imports/${attempt}/metadata`,
                      }}
                    >
                      Metadata
                    </NavLink>
                  ),
                },
                {
                  key: "tree",
                  icon: <RiNodeTree />,
                  label: (
                    <NavLink
                      to={{
                        pathname: `/dataset/${datasetKey}/imports/${attempt}/tree`,
                      }}
                    >
                      Archived tree
                    </NavLink>
                  ),
                },
              ]
            : []),
          ...(isProject && attempt && isFinished
            ? [
                {
                  key: "tree",
                  icon: <RiNodeTree />,
                  label: (
                    <NavLink
                      to={{
                        pathname: `/dataset/${datasetKey}R${attempt}/classification`,
                      }}
                    >
                      Browse tree
                    </NavLink>
                  ),
                },
              ]
            : []),
          {
            key: "import-timeline",
            icon: <LineChartOutlined />,
            label: (
              <NavLink
                to={{ pathname: `/dataset/${datasetKey}/import-timeline` }}
              >
                Timeline
              </NavLink>
            ),
          },
          {
            key: "diff",
            icon: <DiffOutlined />,
            label: (
              <NavLink to={{ pathname: `/dataset/${datasetKey}/diff` }}>
                Diff
              </NavLink>
            ),
          },
        ]}
      />
      </>
    );
  }
}

export default withRouter(ImportMenu);
