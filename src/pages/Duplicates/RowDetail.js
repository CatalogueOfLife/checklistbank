import React from "react";
import { Table, Col, Tag, Tooltip } from "antd";
import Classification from "../NameSearch/Classification";
import _ from "lodash";
import { NavLink } from "react-router-dom";

import withContext from "../../components/hoc/withContext";

  const expandedRowRender = ({data, selectedRowKeys, onSelectChange, index, catalogueKey}) => {
    const columns = [
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
        width: 60,
        className: "workbench-td",
  
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 90,
        className: "workbench-td",
  
      },
      {
        title: "ScientificName",
        dataIndex: "labelHtml",
        width: 240,
        className: "workbench-td",
        render: (text, record) => {
          return (
            <NavLink
              key={_.get(record, "id")}
              to={{
                pathname: `/dataset/${_.get(record, "name.datasetKey")}/${
                  _.get(record, "bareName") ? "name" : "taxon"
                }/${encodeURIComponent(
                   _.get(record, "accepted.name.id") ? _.get(record, "accepted.name.id") : _.get(record, "name.id")
                )}`
              }}
              exact={true}
            >
              <span dangerouslySetInnerHTML={{__html: text}}></span>
            </NavLink>
          );
        },
      
      },
      {
        title: "Uninomial",
        width: 160,
        dataIndex: ["name", "uninomial"],
        key: "uninomial",
        className: "workbench-td",
      },
      {
        title: "Genus",
        width: 160,
        dataIndex: ["name", "genus"],
        key: "genus",
        className: "workbench-td",
      },
      {
        title: "specificEpithet",
        width: 160,
        dataIndex: ["name", "specificEpithet"],
        key: "specificEpithet",
        className: "workbench-td",
      },
      {
        title: "infraspecificEpithet",
        width: 160,
        dataIndex: ["name", "infraspecificEpithet"],
        key: "infraspecificEpithet",
        className: "workbench-td",
      },
      {
        title: "Authorship",
        width: 240,
        dataIndex: ["name", "authorship"],
        key: "authorship",
        className: "workbench-td",
      },
    
      {
        title: "Rank",
        width: 100,
        dataIndex: ["name", "rank"],
        key: "rank",
        className: "workbench-td",
      }
    ];


    return (
      <Table
        columns={columns}
        dataSource={data ? [_.get(data, 'usage1'), _.get(data, 'usage2')] : []}
        pagination={false}
        rowSelection={{
          selectedRowKeys,
          onChange: (selectedRowKeys)=> onSelectChange(selectedRowKeys, index),
          columnWidth: "30px"
        }}
        rowKey="id"


      />
    );
  };

export default expandedRowRender;
