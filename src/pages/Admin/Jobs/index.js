import React, { useState, useEffect } from "react";

import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import { Table, Tooltip, Button, Spin } from "antd";
import moment from "moment";
import axios from "axios";
import config from "../../../config";
import DataLoader from "dataloader";
import { getUsersBatch } from "../../../api/user";
import { getDatasetsBatch } from "../../../api/dataset";
import kibanaQuery from "./kibanaQuery";
import { CodeOutlined } from "@ant-design/icons";
import ExpandedRow from "./ExpandedRow";
import { CanEditDataset } from "../../../components/Auth/hasAccess";
import Auth from "../../../components/Auth";
import { NavLink } from "react-router-dom";

import MockData from "./mockData.json";
const userLoader = new DataLoader((ids) => getUsersBatch(ids));
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));

const _ = require("lodash");

const Jobs = ({ user, addError }) => {
  const [jobs, setJobs] = useState([]);
  const [killedJobs, setKilledJobs] = useState(new Set());
  const [userFilter, setUserFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [jobFilter, setJobFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  const getJobs = async () => {
    try {
      const res = await axios(`${config.dataApi}job`);
      // const data = MockData  //
      const data = res.data || [];
      for (let d of data) {
        await userLoader.load(d.userKey).then((user) => {
          d.user = user;
          return d;
        });
      }
      for (let d of data.filter((dt) => !!dt.datasetKey)) {
        await datasetLoader.load(d.datasetKey).then((dataset) => {
          d.dataset = dataset;
          return d;
        });
      }
      const userSet = new Set();
      const prioritySet = new Set();
      const jobSet = new Set();
      const statusSet = new Set();
      for (let d of data) {
        if (d?.user?.username) {
          userSet.add(d?.user?.username);
        }
        if (d?.job) {
          jobSet.add(d?.job);
        }
        if (d?.priority) {
          prioritySet.add(d?.priority);
        }
        if (d?.status) {
          statusSet.add(d?.status);
        }
      }
      if (userSet.size > 1) {
        setUserFilter(
          [...userSet].map((i) => ({
            text: _.startCase(i),
            value: i,
          }))
        );
      }
      if (jobSet.size > 1) {
        setJobFilter(
          [...jobSet].map((i) => ({
            text: _.startCase(i),
            value: i,
          }))
        );
      }
      if (prioritySet.size > 1) {
        setPriorityFilter(
          [...prioritySet].map((i) => ({
            text: _.startCase(i),
            value: i,
          }))
        );
      }
      if (statusSet.size > 1) {
        setStatusFilter(
          [...statusSet].map((i) => ({
            text: _.startCase(i),
            value: i,
          }))
        );
      }
      setJobs(data);
    } catch (error) {
      addError(error);
    }
  };

  const killJob = async (key) => {
    killedJobs.add(key);
    try {
      await axios.delete(`${config.dataApi}job/${key}`);
      killedJobs.delete(key);
      getJobs();
    } catch (error) {
      killedJobs.delete(key);
      addError(error);
    }
  };
  useEffect(() => {
    getJobs();
    const hdl = setInterval(getJobs, 3000);
    // setTimerhandle(hdl)

    return () => {
      if (hdl) {
        clearInterval(hdl);
      }
    };
  }, []);
  const columns = [
    {
      title: "Dataset",
      dataIndex: ["dataset", "title"],
      key: "dataset",
      width: 50,
      ellipsis: true,
      render: (text, record) => (
        <NavLink to={{ pathname: `/dataset/${record.key}/about` }} exact={true}>
          {text}
        </NavLink>
      ),
    },
    {
      title: "Job",
      dataIndex: "job",
      key: "job",
      width: 50,
      filters: jobFilter,
      onFilter: (value, record) => record.job === value,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 50,
      filters: priorityFilter,
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 50,
      filters: statusFilter,
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "User",
      dataIndex: ["user", "username"],
      key: "user",
      width: 50,
      filters: userFilter,
      onFilter: (value, record) => record?.user?.username === value,
    },
    {
      title: "Created",
      dataIndex: "created",
      key: "created",
      width: 50,
      render: (date) => {
        return date ? moment(date).format("MMMM Do, h:mm a") : "";
      },
    },
    {
      title: "Started",
      dataIndex: "started",
      key: "started",
      width: 50,
      render: (date) => {
        return date ? moment(date).format("MMMM Do, h:mm a") : "";
      },
    },
    {
      title: "Finished",
      dataIndex: "finished",
      key: "finished",
      width: 50,
      render: (date) => {
        return date ? moment(date).format("MMMM Do, h:mm a") : "";
      },
    },
    {
      title: "Logs",
      key: "logs",
      render: (text, record) => (
        <Tooltip title="Logs">
          <a href={kibanaQuery(record.key)} target="_blank">
            <CodeOutlined style={{ fontSize: "20px" }} />
          </a>
        </Tooltip>
      ),
      width: 50,
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <>
          {record?.dataset && (
            <CanEditDataset>
              <Button
                loading={killedJobs.has(record.key)}
                onClick={() => killJob(record.key)}
              >
                Stop
              </Button>
            </CanEditDataset>
          )}
          {!record?.dataset && Auth.isAuthorised(user, "admin") && (
            <Button
              loading={killedJobs.has(record.key)}
              onClick={() => killJob(record.key)}
            >
              Stop
            </Button>
          )}
        </>
      ),
      width: 50,
    },
  ];

  return (
    <Layout
      openKeys={["admin"]}
      selectedKeys={["backgroundJobs"]}
      title={`Background jobs`}
    >
      <PageContent>
        <Table
          columns={columns}
          dataSource={jobs}
          expandable={{
            expandedRowRender: (record) => <ExpandedRow uuid={record?.key} />,
          }}
        />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ user, addError }) => ({ user, addError });
export default withContext(mapContextToProps)(Jobs);
