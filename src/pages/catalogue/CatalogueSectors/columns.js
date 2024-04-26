import React from "react";
import {
  Table,
  Tooltip,
  Input,
  Button,
  Row,
  Col,
  Tag,
  notification,
} from "antd";

import {
  CodeOutlined,
  DeleteOutlined,
  HistoryOutlined,
  SearchOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { NavLink } from "react-router-dom";
import Highlighter from "react-highlight-words";
import kibanaQuery from "../SectorSync/kibanaQuery";

import moment from "moment";

export default (
  catalogueKey,
  searchText,
  getColumnSearchProps = () => ({})
) => {
  const columns = [
    {
      title: "Dataset",
      dataIndex: ["dataset", "alias"],
      key: "alias",
      ellipsis: true,
      render: (text, record) => {
        return (
          <NavLink
            to={{ pathname: `/catalogue/${catalogueKey}/dataset/${record?.dataset?.key}/metadata` }}
            exact={true}
          >
            {text ? text.toString() : record?.dataset?.title}
          </NavLink>
        );
      },
      //    sorter: (a, b) => a.dataset.alias < b.dataset.alias,
      width: 250,
      //  ...this.getColumnSearchProps("dataset.alias")
    },

    {
      title: "Mode",
      dataIndex: "mode",
      key: "mode",
      width: 75,
      /*   filters: [
      {
        text: "Attach",
        value: "attach",
      },
      {
        text: "Union",
        value: "union",
      },
      {
        text: "Merge",
        value: "merge",
      },
    ],
    onFilter: (value, record) => record.mode === value, */
    },
    {
      title: "Subject",
      dataIndex: ["subject", "name"],
      key: "subject",
      width: 150,
      render: (text, record) => {
        return (
          <React.Fragment>
            {record?.subject?.rank && (
              <div style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                {record?.subject?.rank}:{" "}
              </div>
            )}
            {!record?.subject?.id && (
              <NavLink
                to={{
                  pathname: `/dataset/${record.subjectDatasetKey}/names`,
                  search: `?q=${record?.subject?.name}`,
                }}
                exact={true}
              >
                <Highlighter
                  highlightStyle={{ fontWeight: "bold", padding: 0 }}
                  searchWords={[searchText]}
                  autoEscape
                  textToHighlight={record?.subject?.name?.toString() || ""}
                />
              </NavLink>
            )}
            {record?.subject?.id && (
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/assembly`,
                  search: `?sourceTaxonKey=${
                    record.placeholderRank
                      ? record?.subject?.id +
                        "--incertae-sedis--" +
                        record.placeholderRank.toUpperCase()
                      : record?.subject?.id
                  }&datasetKey=${record.subjectDatasetKey}`,
                }}
                exact={true}
              >
                <Highlighter
                  highlightStyle={{ fontWeight: "bold", padding: 0 }}
                  searchWords={[searchText]}
                  autoEscape
                  textToHighlight={
                    _.get(record, "subject.name")
                      ? record?.subject?.name?.toString()
                      : ""
                  }
                />
              </NavLink>
            )}
            {record?.subject?.broken && (
              <WarningOutlined style={{ color: "red", marginLeft: "10px" }} />
            )}
          </React.Fragment>
        );
      },
    },
    {
      title: "Target",
      dataIndex: ["target", "name"],
      key: "target",
      width: 150,
      ...getColumnSearchProps("target.name"),

      //   sorter: (a, b) => a.target.name < b.target.name,

      render: (text, record) => {
        return (
          <React.Fragment>
            {record?.target && (
              <div style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                {record?.target?.rank}:{" "}
              </div>
            )}
            {!_.get(record, "target.broken") && (
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/assembly`,
                  search: `?assemblyTaxonKey=${record?.target?.id}`,
                }}
                exact={true}
              >
                <Highlighter
                  highlightStyle={{ fontWeight: "bold", padding: 0 }}
                  searchWords={[searchText]}
                  autoEscape
                  textToHighlight={
                    _.get(record, "target.name")
                      ? record.target.name.toString()
                      : ""
                  }
                />
              </NavLink>
            )}
            {_.get(record, "target.broken") && (
              <React.Fragment>
                <Highlighter
                  highlightStyle={{ fontWeight: "bold", padding: 0 }}
                  searchWords={[searchText]}
                  autoEscape
                  textToHighlight={
                    _.get(record, "target.name")
                      ? record.target.name.toString()
                      : ""
                  }
                />
                <WarningOutlined style={{ color: "red", marginLeft: "10px" }} />
              </React.Fragment>
            )}
          </React.Fragment>
        );
      },
    },

    {
      title: "Created",
      dataIndex: "created",
      key: "created",
      width: 100,
      //  sorter: (a, b) => a.created < b.created,
      render: (date) => {
        return date ? moment(date).format("YYYY-MM-DD") : "";
      },
    },
    {
      title: "Created by",
      dataIndex: ["user", "username"],
      key: "user",
      ellipsis: true,
      width: 100,
    },

    {
      title: "Links",
      key: "links",
      width: 75,
      render: (text, record) => (
        <>
        <Tooltip title="Sync History">
          <NavLink
            to={{
              pathname: `/catalogue/${catalogueKey}/sector/sync`,
              search: `?sectorKey=${record.id}`,
            }}
            exact={true}
          >
            <HistoryOutlined style={{ fontSize: "20px" }} />{"  "}
          </NavLink>
        </Tooltip>

        <Tooltip title="Kibana Logs">
          <a href={kibanaQuery(record.id)} target="_blank">
            <CodeOutlined style={{ fontSize: "20px" }} />{" "}
          </a>
        </Tooltip>
        </>
      ),
    }
  ];

  return !!catalogueKey
    ? columns
    : [
        {
          title: "Priority",
          dataIndex: "priority",
          key: "priority",
          width: 75,
        },
        ...columns.filter((c) => !["logs", "history"].includes(c.key)),
      ];
};
