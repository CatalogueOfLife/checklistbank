import React, { useState, useEffect } from "react";
import config from "../../../config";
import { withRouter } from "react-router-dom";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import { Table, Row, Col, Tag, Button, notification } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import history from "../../../history";
import axios from "axios";
import qs from "query-string";
import SearchBox from "../../DatasetList/SearchBox";

const PAGE_SIZE = 10;
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const UserAdmin = ({
  user,
  catalogueKey,
  location,
  addError,
  countryAlpha2,
}) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    pageSize: PAGE_SIZE,
    current: 1,
  });
  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Firstname",
      dataIndex: "firstname",
      key: "firstname",
    },
    {
      title: "Lastname",
      dataIndex: "lastname",
      key: "lastname",
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "Country",
      render: (text, record) =>
        record?.country ? capitalize(countryAlpha2[record.country].name) : "",
    },
    {
      title: "Orcid",
      dataIndex: "orcid",
      key: "orcid",
      render: (text, record) =>
        record.orcid ? (
          <a
            style={{ display: "block" }}
            href={`https://orcid.org/${record.orcid}`}
          >
            <img
              src="/images/orcid_16x16.png"
              style={{ flex: "0 0 auto" }}
              alt=""
            ></img>{" "}
            {record.orcid}
          </a>
        ) : null,
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      render: (text, record) => {
        return record.roles ? record.roles.toString() : "";
      },
    },
  ];

  const getData = async () => {
    let params = location?.search ? qs.parse(location?.search) : {};
    const { q } = params;
    const limit = params?.limit || PAGE_SIZE;
    const offset = params?.offset || 0;
    setLoading(true);
    const res = await axios(
      `${config.dataApi}user?${
        q ? "q=" + encodeURIComponent(q) : ""
      }&offset=${offset}&limit=${limit}`
    );

    setData(res.data);
    setPagination({ ...pagination, total: res.data.total });
    setLoading(false);
  };

  const addEditors = async () => {
    for (const usr of users) {
      try {
        await axios.post(
          `${config.dataApi}dataset/${catalogueKey}/editor`,
          usr.key,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        notification.success({
          message: "Added editor",
          description: usr.title,
        });
      } catch (err) {
        addError(err);
      }
    }
    setUsers([]);
    getData();
  };

  useEffect(() => {
    getData();
  }, [location]);

  const handleTableChange = (paging, filters, sorter) => {
    let params = location?.search ? qs.parse(location?.search) : {};
    const { current } = paging;
    const { q } = params;
    const offset = (paging.current - 1) * params.limit || 0;
    const limit = params?.limit || PAGE_SIZE;
    setPagination({ ...pagination, current });
    history.push({
      pathname: location.pathname,
      search: `?${q ? "q=" + q : ""}offset=${offset}&limit=${limit}`,
    });

    console.log(params);
    console.log(paging);
  };

  const updateSearch = (params) => {
    let newParams = location?.search ? qs.parse(location?.search) : {};

    _.forEach(params, (v, k) => {
      newParams[k] = v;
    });

    Object.keys(params).forEach((param) => {
      if (!params[param]) {
        delete newParams[param];
      }
    });
    setPagination({ ...pagination, current: 1 });
    history.push({
      pathname: location.pathname,
      search: `?${qs.stringify({ ...newParams, offset: 0 })}`,
    });
  };

  return (
    <Layout
      selectedKeys={["userAdmin"]}
      openKeys={["admin"]}
      title={"Users & Roles"}
    >
      <PageContent>
        <Row>
          <Col span={12}>
            <SearchBox
              defaultValue={location?.search?.q || null}
              style={{ marginBottom: "10px", width: "50%" }}
              onSearch={(value) => updateSearch({ q: value })}
            />
          </Col>
          <Col></Col>
        </Row>

        <Table
          style={{ marginTop: "10px" }}
          size="middle"
          columns={columns}
          dataSource={data?.result || []}
          loading={loading}
          onChange={handleTableChange}
          pagination={pagination}
        />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({
  user,
  catalogueKey,
  catalogue,
  addError,
  countryAlpha2,
}) => ({
  user,
  catalogueKey,
  catalogue,
  addError,
  countryAlpha2,
});

export default withContext(mapContextToProps)(withRouter(UserAdmin));
