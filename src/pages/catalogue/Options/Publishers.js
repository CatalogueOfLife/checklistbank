import React, { useState, useEffect } from "react";
import Auth from "../../../components/Auth";
import config from "../../../config";
import { withRouter, NavLink } from "react-router-dom";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import PublisherForm from "./PublisherForm";
import OptionTabs from "./OptionTabs";
import {
  Table,
  Row,
  Col,
  Modal,
  Button,
  Popconfirm,
  Typography,
  Tooltip,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import history from "../../../history";
import axios from "axios";
import qs from "query-string";
import { getUsersBatch } from "../../../api/user";

import DataLoader from "dataloader";
import moment from "moment";
import _ from "lodash";
const userLoader = new DataLoader((ids) => getUsersBatch(ids));

const { Title } = Typography;
const PAGE_SIZE = 10;
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const Publishers = ({ user, catalogueKey, location, addError, catalogue }) => {
  const defaltColumns = [
    {
      title: "id",
      dataIndex: "id",
      key: "id",
      width: 200,
      ellipsis: true,
      render: (text, record) => (
        <NavLink
          to={{
            pathname: `/catalogue/${catalogueKey}/publisher/${record?.id}`,
          }}
        >
          {text}
        </NavLink>
      ),
    },
    {
      title: "Alias",
      dataIndex: "alias",
      key: "alias",
      width: 200,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <a
          href={`https://www.gbif.org/publisher/${record?.id}`}
          target="_blank"
        >
          {text}
        </a>
      ),
    },
    {
      title: "Created by",
      dataIndex: ["createdByUser", "username"],
      key: "createdByUser",
      ellipsis: true,
      //    sorter: (a, b) => a.dataset.alias < b.dataset.alias,
      //  ...this.getColumnSearchProps("dataset.alias")
    },
    {
      title: "Created",
      dataIndex: "created",
      key: "created",
      //  sorter: (a, b) => a.created < b.created,
      render: (date) => {
        return date ? moment(date).format("l LT") : "";
      },
    },
    {
      title: "Modified",
      dataIndex: "modified",
      key: "modified",
      //  sorter: (a, b) => a.created < b.created,
      render: (date) => {
        return date ? moment(date).format("l LT") : "";
      },
    },
  ];
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [publisherForEdit, setPublisherForEdit] = useState(null);
  const [columns, setColumns] = useState([...defaltColumns]);
  const [pagination, setPagination] = useState({
    pageSize: PAGE_SIZE,
    current: 1,
  });
  let params = location?.search ? qs.parse(location?.search) : {};

  useEffect(() => {
    getData();
  }, [location]);

  useEffect(() => {
    if (Auth.canEditDataset({ key: catalogueKey }, user)) {
      setColumns([
        ...defaltColumns,
        {
          title: "Action",
          key: "action",
          width: 250,
          render: (text, record) => (
            <React.Fragment>
              <Button
                size="small"
                style={{ display: "inline", marginRight: "8px" }}
                type={"primary"}
                onClick={() => {
                  setPublisherForEdit(record);
                }}
              >
                Edit
              </Button>
              <Popconfirm
                title={`Delete ${record?.alias} ?`}
                onConfirm={() => deletePublisher(record?.id)}
              >
                <Button
                  size="small"
                  style={{ display: "inline" }}
                  type="danger"
                >
                  <DeleteOutlined />
                </Button>
              </Popconfirm>
            </React.Fragment>
          ),
        },
      ]);
    }
  }, [user, catalogueKey]);
  const getData = async () => {
    let params = location?.search ? qs.parse(location?.search) : {};
    const { q } = params;
    let query = {
      limit: params?.limit || PAGE_SIZE,
      offset: params?.offset || 0,
      q,
    };
    if (params.role) {
      query.role = params.role;
    }

    setLoading(true);
    const res = await axios(
      `${config.dataApi}dataset/${catalogueKey}/sector/publisher`
    );

    await Promise.all([
      ...(res?.data?.result || []).map((publisher) =>
        userLoader
          .load(publisher.createdBy)
          .then((user) => (publisher.createdByUser = user))
      ),
    ]);

    setData(res.data);
    setPagination({ ...pagination, total: res.data.total });
    setLoading(false);
    return res.data;
  };

  const deletePublisher = async (id) => {
    try {
      const res = await axios.delete(
        `${config.dataApi}dataset/${catalogueKey}/sector/publisher/${id}`
      );
      getData();
    } catch (error) {
      addError(error);
    }
  };

  const handleTableChange = (paging, filters, sorter) => {
    let params = location?.search ? qs.parse(location?.search) : {};
    const { current } = paging;
    const { q } = params;

    let query = {
      offset: (paging.current - 1) * (params?.limit || PAGE_SIZE) || 0,
      limit: params?.limit || PAGE_SIZE,
      q,
    };
    if (filters.roles && filters.roles.length > 0) {
      query.role = filters.roles;
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
    <>
      <Modal
        destroyOnClose={true}
        width={800}
        title={
          publisherForEdit?.id
            ? `Edit ${publisherForEdit?.title}`
            : `Add publisher`
        }
        open={publisherForEdit}
        onCancel={() => setPublisherForEdit(null)}
        footer={null}
      >
        <PublisherForm
          onSubmit={() => {
            getData();
            setPublisherForEdit(null);
          }}
          publisher={publisherForEdit}
        />
      </Modal>
      <Row>
        <Col flex="auto">
          <Title level={4}>Publishers </Title>
          {/* <SearchBox
              defaultValue={location?.search?.q || null}
              style={{ marginBottom: "10px", width: "50%" }}
              onSearch={(value) => updateSearch({ q: value })}
            /> */}
        </Col>
        <Col>
          {Auth.canEditDataset({ key: catalogueKey }, user) && (
            <Button type="primary" onClick={() => setPublisherForEdit({})}>
              Add publisher
            </Button>
          )}
        </Col>
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
    </>
  );
};

const mapContextToProps = ({
  user,
  catalogueKey,
  catalogue,
  addError,
  countryAlpha2,
  userRole,
}) => ({
  user,
  catalogueKey,
  catalogue,
  addError,
  countryAlpha2,
  userRole,
});

export default withContext(mapContextToProps)(withRouter(Publishers));
