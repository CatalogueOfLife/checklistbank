import { Tooltip } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

// Small icon linking a source dataset as seen through a project or release
// to its current, global dataset page.
const GlobalDatasetLink = ({ datasetKey, style }) => (
  <Tooltip title="Open the current dataset page">
    <Link
      to={`/dataset/${datasetKey}/metadata`}
      aria-label="Open the current dataset page"
      style={{ fontSize: "0.6em", marginLeft: "8px", ...style }}
    >
      <LinkOutlined />
    </Link>
  </Tooltip>
);

export default GlobalDatasetLink;
