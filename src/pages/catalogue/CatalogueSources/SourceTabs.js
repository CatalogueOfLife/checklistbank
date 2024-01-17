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
import { withRouter } from "react-router-dom";
import withContext from "../../../components/hoc/withContext";

import { NavLink } from "react-router-dom";

const SourceTabs = ({
  match: {
    params: { catalogueKey },
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
  }, [catalogueKey, location?.pathname]);
  const items = [
    {
      label: (
        <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sources` }}>
          Metrics
        </NavLink>
      ),
      key: `/catalogue/${catalogueKey}/sources`,
      icon: <LineChartOutlined />,
    },
    {
      label: (
        <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sources/issues` }}>
          Issues
        </NavLink>
      ),
      key: `/catalogue/${catalogueKey}/sources/issues`,
      icon: <WarningOutlined />,
    },
    {
      label: (
        <NavLink
          to={{
            pathname: `/dataset`,
            search: `?contributesTo=${catalogueKey}`,
          }}
          exact={true}
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

const mapContextToProps = ({ catalogueKey }) => ({
  catalogueKey,
});

export default withContext(mapContextToProps)(withRouter(SourceTabs));
