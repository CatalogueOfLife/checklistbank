import { Menu } from 'antd';
import React, {useEffect, useState} from 'react';
import qs from 'query-string'
import {
  PartitionOutlined,
  SyncOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";import { withRouter } from "react-router-dom";
import withContext from "../../../components/hoc/withContext";

import { NavLink } from 'react-router-dom';


const SectorTabs = ({location, catalogueKey}) => {
  const [subjectDatasetKey, setSubjectDatasetKey] = useState(null)
  useEffect(()=>{
    const params = qs.parse(location?.search)
    // On sectors its subjectDatasetKey, on syncs its datasetKey
    if(params.subjectDatasetKey || params.datasetKey){
      setSubjectDatasetKey(params.subjectDatasetKey || params.datasetKey)
    } else {
      setSubjectDatasetKey(null)
    }
  }, [catalogueKey, location])
  const items = [
    {
      label: <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sector`, search: subjectDatasetKey ? `?subjectDatasetKey=${subjectDatasetKey}`: null}}>
      Sectors
    </NavLink>,
      key: `/catalogue/${catalogueKey}/sector`,
      icon: <PartitionOutlined />,
    },
    {
      label:  <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sector/priority`}}>
      Priority
    </NavLink>,
      key: `/catalogue/${catalogueKey}/sector/priority`,
      icon: <OrderedListOutlined />,
    },
    {
      label:  <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sector/sync`, search: subjectDatasetKey ? `?datasetKey=${subjectDatasetKey}`: null}}>
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
