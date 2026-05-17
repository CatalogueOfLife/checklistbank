import { Menu } from "antd";
import React, { useEffect, useState } from "react";
import qs from "query-string";
import { SettingOutlined, TeamOutlined } from "@ant-design/icons";
import { withRouter } from "react-router-dom";
import withContext from "../../../components/hoc/withContext";

import { NavLink } from "react-router-dom";

const SectorTabs = ({ location, projectKey }) => {
  const [subjectDatasetKey, setSubjectDatasetKey] = useState(null);
  useEffect(() => {
    const params = qs.parse(location?.search);
    // On sectors its subjectDatasetKey, on syncs its datasetKey
    if (params.subjectDatasetKey || params.datasetKey) {
      setSubjectDatasetKey(params.subjectDatasetKey || params.datasetKey);
    } else {
      setSubjectDatasetKey(null);
    }
  }, [projectKey, location]);
  const items = [
    {
      label: (
        <NavLink to={{ pathname: `/project/${projectKey}/options` }}>
          Options
        </NavLink>
      ),
      key: `/project/${projectKey}/options`,
      icon: <SettingOutlined />,
    },
    /* {
      label: (
        <NavLink to={{ pathname: `/project/${projectKey}/publishers` }}>
          Publishers
        </NavLink>
      ),
      key: `/project/${projectKey}/publishers`,
      icon: <TeamOutlined />,
    }, */
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

const mapContextToProps = ({ projectKey }) => ({
  projectKey,
});

export default withContext(mapContextToProps)(withRouter(SectorTabs));
