import { Menu } from "antd";
import React, { useEffect, useState } from "react";
import qs from "query-string";
import { SettingOutlined, TeamOutlined } from "@ant-design/icons";
import { withRouter } from "react-router-dom";
import withContext from "../../../components/hoc/withContext";

import { NavLink } from "react-router-dom";

const SectorTabs = ({ location, catalogueKey }) => {
  const [subjectDatasetKey, setSubjectDatasetKey] = useState(null);
  useEffect(() => {
    const params = qs.parse(location?.search);
    // On sectors its subjectDatasetKey, on syncs its datasetKey
    if (params.subjectDatasetKey || params.datasetKey) {
      setSubjectDatasetKey(params.subjectDatasetKey || params.datasetKey);
    } else {
      setSubjectDatasetKey(null);
    }
  }, [catalogueKey, location]);
  const items = [
    {
      label: (
        <NavLink to={{ pathname: `/catalogue/${catalogueKey}/options` }}>
          Options
        </NavLink>
      ),
      key: `/catalogue/${catalogueKey}/options`,
      icon: <SettingOutlined />,
    },
    {
      label: (
        <NavLink to={{ pathname: `/catalogue/${catalogueKey}/publishers` }}>
          Publishers
        </NavLink>
      ),
      key: `/catalogue/${catalogueKey}/publishers`,
      icon: <TeamOutlined />,
    },
  ];

  return (
    <Menu
      style={{ marginBottom: "8px" }}
      selectedKeys={[location.pathname]}
      mode="horizontal"
      items={items}
    />
  );
};

const mapContextToProps = ({ catalogueKey }) => ({
  catalogueKey,
});

export default withContext(mapContextToProps)(withRouter(SectorTabs));
