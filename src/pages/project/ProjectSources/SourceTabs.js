import { Menu } from "antd";
import React, { useEffect, useState } from "react";
import qs from "query-string";
import {
  PartitionOutlined,
  SyncOutlined,
  OrderedListOutlined,
  BarChartOutlined,
  LineChartOutlined,
  WarningOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import withRouter from "../../../withRouter";
import withContext from "../../../components/hoc/withContext";

import { NavLink } from "react-router-dom";

const SourceTabs = ({
  match: {
    params: { projectKey },
  },
  location,
}) => {
  const [subjectDatasetKey, setSubjectDatasetKey] = useState(null);
  useEffect(() => {
    const params = qs.parse(location?.search);
    // On sectors its subjectDatasetKey, on syncs its datasetKey
    if (params.subjectDatasetKey || params.datasetKey) {
      setSubjectDatasetKey(params.subjectDatasetKey || params.datasetKey);
    } else {
      setSubjectDatasetKey(null);
    }
  }, [projectKey, location?.pathname]);
  const items = [
    {
      label: (
        <NavLink to={{ pathname: `/project/${projectKey}/sources` }}>
          Metrics
        </NavLink>
      ),
      key: `/project/${projectKey}/sources`,
      icon: <LineChartOutlined />,
    },
    {
      label: (
        <NavLink to={{ pathname: `/project/${projectKey}/sources/issues` }}>
          Issues
        </NavLink>
      ),
      key: `/project/${projectKey}/sources/issues`,
      icon: <WarningOutlined />,
    },
    {
      label: (
        <NavLink
          to={{
            pathname: `/dataset`,
            search: `?contributesTo=${projectKey}`,
          }}
          end
        >
          Metadata
        </NavLink>
      ),
      key: `metadata`,
      icon: <UnorderedListOutlined />,
    },
  ];

  return (
    <Menu
      style={{ marginBottom: "8px" }}
      selectedKeys={[location?.pathname]}
      mode="horizontal"
      items={items}
    />
  );
};

const mapContextToProps = ({ projectKey }) => ({
  projectKey,
});

export default withContext(mapContextToProps)(withRouter(SourceTabs));
