import { Menu } from 'antd';
import React from 'react';
import {
  ApiOutlined,
  SyncOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";import { withRouter } from "react-router-dom";
import withContext from "../../../components/hoc/withContext";

import { NavLink } from 'react-router-dom';


const SectorTabs = ({location, catalogueKey}) => {
  
  const items = [
    {
      label: <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sector`}}>
      Sectors
    </NavLink>,
      key: `/catalogue/${catalogueKey}/sector`,
      icon: <ApiOutlined />,
    },
    {
      label:  <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sector/priority`}}>
      Priority
    </NavLink>,
      key: `/catalogue/${catalogueKey}/sector/priority`,
      icon: <OrderedListOutlined />,
    },
    {
      label:  <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sector/sync`}}>
      Syncs
    </NavLink>,
      key: `/catalogue/${catalogueKey}/sector/sync`,
      icon: <SyncOutlined />,
    }
  ]

  return <Menu style={{marginBottom: "8px"}} selectedKeys={[location.pathname]} mode="horizontal" items={items} />
 
}

const mapContextToProps = ({ catalogueKey }) => ({
  catalogueKey,
});

export default withContext(mapContextToProps)(withRouter(SectorTabs));
