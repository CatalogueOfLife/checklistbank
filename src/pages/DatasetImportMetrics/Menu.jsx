import { useEffect, useState } from "react";
import axios from "axios";
import withRouter from "../../withRouter";
import { Typography } from 'antd';
const { Title } = Typography;
import { Menu, Row, Col } from "antd";
import { NavLink } from "react-router-dom";
import { DiffOutlined, PieChartOutlined, LineChartOutlined, FileTextOutlined } from "@ant-design/icons";
import { RiNodeTree } from "react-icons/ri";
import { formatTime } from "../../dateTime";
import config from "../../config";

const ImportMenu = ({ datasetKey, attempt, location, dataset, isFinished }) => {
    // const { current } = this.state;
    const isProject = dataset?.origin === "project";
    // Timeline and Diff both need something to compare: a chart over a single
    // point, or a diff against nothing, says nothing. Only two successful
    // imports are asked for - all that matters is whether there is more than
    // one. Refetched when the dataset's last successful attempt changes, so
    // the tabs appear as soon as a second import finishes.
    const [finishedImports, setFinishedImports] = useState(null);
    useEffect(() => {
      if (!datasetKey) return;
      let canceled = false;
      axios(
        `${config.dataApi}dataset/${datasetKey}/import?status=finished&limit=2`
      )
        .then((res) => {
          if (!canceled) setFinishedImports(res.data.length);
        })
        .catch(() => {
          if (!canceled) setFinishedImports(0);
        });
      return () => {
        canceled = true;
      };
    }, [datasetKey, dataset?.attempt]);
    const isComparable = finishedImports > 1;
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
                {["xrelease", "release", "project"].includes(dataset?.origin)
                  ? "Release "
                  : "Import "}
                  #{attempt}
              </h3>
            </Col>
            <Col style={{ marginLeft: "10px", marginTop: "2px" }}>
              - {formatTime(dataset?.imported, "lll")}
            </Col>
              </>
            )}
            <Col flex="auto"></Col>
            <Col>
              {dataset?.lastImportAttempt &&
                dataset?.origin !== "project" && (
                  <span>
                    Last import attempt:{" "}
                    {formatTime(dataset?.lastImportAttempt, "lll")}
                  </span>
                )}
            </Col>
          </Row>
        )}
      <Menu
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
          dataset?.attempt != attempt
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
          ...(isComparable
            ? [
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
              ]
            : []),
        ]}
      />
      </>
    );
};

export default withRouter(ImportMenu);
