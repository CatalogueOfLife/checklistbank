import React, { useState, useEffect } from "react";
import config from "../../../config";
import { withRouter } from "react-router-dom";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import UserRoles from "./UserRoles";
import { Table, Row, Col, Modal, Button, Space, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined , MinusCircleOutlined} from "@ant-design/icons";
import history from "../../../history";
import axios from "axios";
import qs from "query-string";
import SearchBox from "../../DatasetList/SearchBox";
import { NavLink } from "react-router-dom";
import moment from "moment";
import _ from "lodash"
const PAGE_SIZE = 10;
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const UserAdmin = ({
  user,
  catalogueKey,
  location,
  addError,
  countryAlpha2,
  userRole
}) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [userForEdit, setUserForEdit] = useState(null);
  const [pagination, setPagination] = useState({
    pageSize: PAGE_SIZE,
    current: 1,
  });
  let params = location?.search ? qs.parse(location?.search) : {};

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
      filters: userRole.map((i) => ({
        text: _.startCase(i),
        value: i,
      })),
      filteredValue: params.role ? _.isArray(params.role)
      ? params.role
      : [params.role] : null,
      render: (text, record) => ( 
        <>
          <Space>
            <Button
              style={{ padding: 0 }}
              type="link"
              onClick={() => setUserForEdit(record)}
            >
              <EditOutlined />
            </Button>
<>{record.blocked ? <Tooltip title={`The user was blocked ${moment(record.blocked).format(
                  "MMMM Do YYYY, h:mm a"
                )}`}><MinusCircleOutlined style={{color: 'red'}}/> </Tooltip>: <>
            {record?.roles?.indexOf("admin") > -1 && <span>{"Admin"}</span>}
            {record?.roles?.indexOf("editor") > -1 && (
              <NavLink
                to={{
                  pathname: "/dataset",
                  search: `?editor=${record.key}`,
                }}
              >
                {`Editor (${record?.editor?.length || 0})`}
              </NavLink>
            )}
            {record?.roles?.indexOf("reviewer") > -1 && (
              <NavLink
                to={{
                  pathname: "/dataset",
                  search: `?reviewer=${record.key}`,
                }}
              >
                {`Reviewer (${record?.reviewer?.length || 0})`}
              </NavLink>
            )}
            </>}
            </>
          </Space>
        </>
      ),
    },
  ];

  const getData = async () => {
    let params = location?.search ? qs.parse(location?.search) : {};
    const { q } = params;
    let query = {
      limit: params?.limit || PAGE_SIZE,
      offset: params?.offset || 0,
      q
    }
    if (params.role) {
    query.role = params.role;
    
    } 
   
    setLoading(true);
    const res = await axios(
      `${config.dataApi}user?${qs.stringify(query)}`
    );

    setData(res.data);
    setPagination({ ...pagination, total: res.data.total });
    setLoading(false);
    return res.data
  };

  useEffect(() => {
    getData();
  }, [location]);

  const handleTableChange = (paging, filters, sorter) => {
    let params = location?.search ? qs.parse(location?.search) : {};
    const { current } = paging;
    const { q } = params;
    
    let query = {
      offset: (paging.current - 1) * (params?.limit || PAGE_SIZE) || 0,
      limit: params?.limit || PAGE_SIZE,
      q
    }
    if(filters.roles && filters.roles.length > 0){
      query.role = filters.roles 
    }
    setPagination({ ...pagination, current });
    history.push({
      pathname: location.pathname,
      search: `?${qs.stringify(query)}`,
    });
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
        <Modal
          width={800}
          title={<>{`Roles and scopes for ${userForEdit?.username}`}{userForEdit?.blocked && <> <Tooltip title={`The user was blocked ${moment(userForEdit.blocked).format(
            "MMMM Do YYYY, h:mm a"
          )}`}><MinusCircleOutlined style={{color: 'red'}}/> </Tooltip></>}</>}
          visible={userForEdit}
          onCancel={() => setUserForEdit(null)}
          footer={null}
        >
          <UserRoles 
            user={userForEdit} 
            onChangeCallback={async () => { 
                let newData = await getData(); 
                let usr = newData?.result.find(u => u.key === userForEdit.key);
                if(usr){
                  setUserForEdit(usr)
                }
              }
                } />
        </Modal>
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
  userRole
}) => ({
  user,
  catalogueKey,
  catalogue,
  addError,
  countryAlpha2,
  userRole
});

export default withContext(mapContextToProps)(withRouter(UserAdmin));
