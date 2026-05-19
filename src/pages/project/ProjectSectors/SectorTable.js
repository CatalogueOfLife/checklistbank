import { useEffect, useRef, useState } from "react";
import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

import {
  CodeOutlined,
  DeleteOutlined,
  HistoryOutlined,
  SearchOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Table,
  Popconfirm,
  Input,
  Button,
  Row,
  Col,
  Tag,
  App,
} from "antd";
import config from "../../../config";
import moment from "dayjs";
import withContext from "../../../components/hoc/withContext";
import kibanaQuery from "../SectorSync/kibanaQuery";
import Highlighter from "react-highlight-words";
import _ from "lodash";
import SyncButton from "../SectorSync/SyncButton";
import Auth from "../../../components/Auth";
import RematchResult from "./RematchResult";
import getColumns from "./columns";

const SectorTable = ({
  data,
  loading,
  user,
  onDeleteSector,
  pagination,
  projectKey,
  handleTableChange,
  expandedRowRender,
  isRelease,
  expandable,
  releasedFrom,
  addError,
  onSectorRematch,
}) => {
  const { notification } = App.useApp();
  const [currentDataSourceLength, setCurrentDataSourceLength] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const searchInput = useRef(null);

  useEffect(() => {
    if (data && data.length > 0 && data.length !== currentDataSourceLength) {
      setCurrentDataSourceLength(data.length);
    }
  }, [data?.length]);

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex.split(".")[0]}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm)}
          style={{ width: 188, marginBottom: 8, display: "block" }}
        />
        <Button
          type="primary"
          onClick={() => handleSearch(selectedKeys, confirm)}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
        </Button>
        <Button
          onClick={() => handleReset(clearFilters)}
          size="small"
          style={{ width: 90 }}
        >
          Reset
        </Button>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      _.get(record, dataIndex)
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current && searchInput.current.select());
      }
    },
  });

  const handleSearch = (selectedKeys, confirm) => {
    confirm();
    setSearchText(selectedKeys[0]);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const syncSelected = async () => {
    let errors = 0;
    notification.open({
      title: "",
      message: `Triggering sync for ${selectedRows.length} sectors`,
    });
    for (const record of selectedRows) {
      try {
        await axios.post(
          `${config.dataApi}dataset/${_.get(record, "datasetKey")}/sector/sync`,
          {
            sectorKey: _.get(record, "id"),
            datasetKey: _.get(record, "datasetKey"),
          }
        );
      } catch (error) {
        addError(error);
        errors++;
        notification.error({
          message: `Error`,
          description: `It was not possible to sync sector ${record?.id}`,
        });
      }
    }
    notification.open({
      title: "Sync triggered",
      message: `Now syncing ${selectedRows.length - errors} sectors`,
    });
    if (errors.length > 0) {
      notification.error({
        title: "Sync failed",
        message: `It was not possible to start sync for ${errors} sectors`,
      });
    }
    setSelectedRows([]);
    setSelectedRowKeys([]);
  };

  const rematchSelected = async () => {
    let errors = 0,
      rematchInfo = {
        broken: 0,
        unchanged: 0,
        updated: 0,
        total: selectedRows.length,
      };
    notification.open({
      title: "",
      message: `Triggering rematch for ${selectedRows.length} sectors`,
    });
    for (const record of selectedRows) {
      try {
        let res = await axios.post(
          `${config.dataApi}dataset/${projectKey}/sector/rematch`,
          { id: record.id }
        );
        rematchInfo.broken += res?.data?.broken;
        rematchInfo.unchanged += res?.data?.unchanged;
        rematchInfo.updated += res?.data?.updated;
      } catch (error) {
        addError(error);
        errors++;
        notification.error({
          message: `Error`,
          description: `It was not possible to rematch sector ${record?.id}`,
        });
      }
    }
    notification.open({
      title: "",
      message: (
        <>
          <div>{`Rematched ${selectedRows.length - errors} sectors.`}</div>
          {Object.keys(rematchInfo).map((category) => (
            <Tag key={category}>
              {_.startCase(category)}:{" "}
              {_.get(rematchInfo, `[${category}]`) || 0}
            </Tag>
          ))}
        </>
      ),
    });
    if (errors.length > 0) {
      notification.error({
        title: "Rematch failed",
        message: `It was not possible to rematch ${errors} sectors`,
      });
    }
    setSelectedRows([]);
    setSelectedRowKeys([]);
  };

  const offset = pagination
    ? (pagination.current - 1) * pagination.pageSize
    : 0;
  const columns = getColumns(
    !!releasedFrom ? releasedFrom : projectKey,
    searchText,
    getColumnSearchProps
  );

  if (!isRelease && Auth.canEditDataset({ key: projectKey }, user)) {
    columns.push({
      title: "Action",
      key: "action",
      width: 250,
      render: (text, record) => (
        <React.Fragment>
          {!_.get(record, "target.broken") &&
            (record?.mode === "merge" || !record?.subject?.broken) && (
              <SyncButton
                size="small"
                style={{ display: "inline", marginRight: "8px" }}
                record={{ sector: record }}
              />
            )}
          <Button
            size="small"
            style={{ display: "inline", marginRight: "8px" }}
            type={"primary"}
            onClick={() => {
              axios
                .post(
                  `${config.dataApi}dataset/${projectKey}/sector/rematch`,
                  { id: record.id }
                )
                .then((rematchInfo) => {
                  const success =
                    (_.get(rematchInfo, "data.updated") === 1 ||
                      _.get(rematchInfo, "data.unchanged") === 1) &&
                    _.get(rematchInfo, "data.broken") === 0;

                  if (success) {
                    notification.success({
                      message: "Rematch success",
                      description: `Broken sectors: 0`,
                    });

                    if (
                      onSectorRematch &&
                      typeof onSectorRematch === "function"
                    ) {
                      onSectorRematch(record);
                    }
                  } else {
                    notification.error({
                      message: "Rematch failed",
                      description: `Broken sectors: 1`,
                    });
                  }
                })
                .catch((err) => {
                  notification.error({
                    message: `Server error ${_.get(err, "response.status")}`,
                    description: _.get(err, "response.data.message"),
                  });
                });
            }}
          >
            Rematch
          </Button>
          {onDeleteSector && typeof onDeleteSector === "function" && (
            <Popconfirm
              placement="left"
              title={
                <p style={{ width: "350px" }}>
                  Do you want a full deletion or a partial deletion? A partial
                  deletion will delete the sector mapping and all species, but
                  keep the higher classification above species
                </p>
              }
              onConfirm={() => onDeleteSector(record, false)}
              onCancel={() => onDeleteSector(record, true)}
              okText="Full"
              cancelText="Partial"
            >
              <Button
                size="small"
                style={{ display: "inline" }}
                danger
              >
                <DeleteOutlined />
              </Button>
            </Popconfirm>
          )}
        </React.Fragment>
      ),
    });
  }

  return (
    <React.Fragment>
      {/*  <Row>
        {!loading && !isNaN(offset) && pagination?.total && data && (
          <Col style={{ textAlign: "right" }}>
            Results: {offset} - {offset + data.length} of {pagination.total}
          </Col>
        )}
      </Row> */}
      <Row>
        <Col flex="auto"></Col>
        <Col>
          {pagination &&
            !isNaN(pagination.total) &&
            `${(
              (pagination.current - 1) * pagination.pageSize +
              1
            ).toLocaleString("en-GB")} - ${(
              pagination.current * pagination.pageSize
            ).toLocaleString("en-GB")} of ${pagination.total.toLocaleString(
              "en-GB"
            )}`}
        </Col>
      </Row>
      <Table
        size="small"
        onChange={handleTableChange}
        columns={[...columns]}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        rowKey="id"
        expandable={expandable}
        rowSelection={
          !Auth.canEditDataset({ key: projectKey }, user) || isRelease
            ? null
            : {
                selectedRowKeys: selectedRowKeys,
                onChange: (newSelectedRowKeys, newSelectedRows) => {
                  setSelectedRowKeys(newSelectedRowKeys);
                  setSelectedRows(newSelectedRows);
                },
                selections: [
                  {
                    key: "sync",
                    text: (
                      <Button
                        style={{ width: "100%" }}
                        onClick={(e) => syncSelected()}
                        type="primary"
                      >
                        Sync {selectedRowKeys.length} sectors
                      </Button>
                    ),
                  },
                  {
                    key: "rematch",
                    text: (
                      <Button
                        style={{ width: "100%" }}
                        onClick={(e) => rematchSelected()}
                        type="primary"
                      >
                        Rematch {selectedRowKeys.length} sectors
                      </Button>
                    ),
                  },
                ],
              }
        }
      />
    </React.Fragment>
  );
};

const mapContextToProps = ({ user, projectKey, addError }) => ({
  user,
  projectKey,
  addError,
});

export default withContext(mapContextToProps)(SectorTable);
