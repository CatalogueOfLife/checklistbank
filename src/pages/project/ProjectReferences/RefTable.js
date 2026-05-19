import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {SearchOutlined} from "@ant-design/icons"
import { Table, Row, Col, Input, Space, Button } from "antd";
import config from "../../../config";
import moment from "dayjs";
import qs from "query-string";
import history from "../../../history";
import SearchBox from "../../DatasetList/SearchBox";
import withContext from "../../../components/hoc/withContext";

import _ from "lodash";
import { NavLink } from "react-router-dom";


const RefTable = (props) => {
  const { datasetKey, addError, location } = props;

  const searchInput = useRef(null);

  const [data, setData] = useState([]);
  const [params, setParams] = useState({});
  const [pagination, setPagination] = useState({
    pageSize: 50,
    current: 1,
    showQuickJumper: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
  };

  const handleReset = (clearFilters, confirm) => {
    clearFilters();
    confirm();
    const newParams = { limit: 50, offset: 0 };
    setParams(newParams);
    // getData will be triggered by the params update via useEffect below
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div
        style={{
          padding: 8,
        }}
      >
        <Input
          defaultValue={params?.year}
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block',
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters, confirm)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? '#1890ff' : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    }
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render: (text, record) => {
        return <NavLink to={{pathname: `/dataset/${record.datasetKey}/reference/${encodeURIComponent(text)}`}}>{text}</NavLink>;
      }
    },
    {
      title: "Citation",
      dataIndex: "citation",
      key: "citation",
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      sorter: true,
      ...getColumnSearchProps('year')
    },
    {
      title: "Created",
      dataIndex: "created",
      key: "created",
      width: 50,
      sorter: (a, b) => a.created < b.created,
      render: (date) => {
        return date ? moment(date).format("lll") : "";
      },
    },
    {
      title: "Modified",
      dataIndex: "modified",
      key: "modified",
      width: 50,
      sorter: (a, b) => a.modified < b.modified,
      render: (date) => {
        return date ? moment(date).format("lll") : "";
      },
    },
  ];

  const getData = (currentParams) => {
    setLoading(true);
    const p = { ...currentParams };
    if (!p.q) {
      delete p.q;
    }
    history.push({
      pathname: _.get(props, "location.pathname"),
      search: `?${qs.stringify(p)}`,
    });
    axios(
      `${config.dataApi}dataset/${datasetKey}/reference?${qs.stringify(p)}`
    )
      .then((res) => {
        setPagination((prev) => ({ ...prev, total: res.data.total }));
        setLoading(false);
        setData(_.get(res, "data.result") || []);
      })
      .catch((err) => {
        addError(err);
        setLoading(false);
        setData([]);
      });
  };

  useEffect(() => {
    let initParams = qs.parse(_.get(props, "location.search"));
    if (_.isEmpty(initParams)) {
      initParams = { limit: 50, offset: 0 };
      history.push({
        pathname: _.get(props, "location.pathname"),
        search: `?limit=50&offset=0`,
      });
    }
    setParams(initParams);
    getData(initParams);
  }, []);

  useEffect(() => {
    if (datasetKey) {
      getData(params);
    }
  }, [datasetKey]);

  const handleTableChange = (newPagination, filters, sorter) => {
    const pager = { ...pagination, ...newPagination };
    setPagination(pager);

    let query = _.merge({ ...params }, {
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ...Object.keys(filters).reduce(
        (acc, cur) => (filters[cur] !== null && (acc[cur] = filters[cur]), acc),
        {}
      )
    });
    if (sorter) {
      query.sortBy = sorter.field;
      query.reverse = sorter.order === "descend";
    }

    setParams(query);
    getData(query);
  };

  const updateSearch = (newSearchParams) => {
    const newParams = { ...params, offset: 0, limit: 50, ...newSearchParams };
    setParams(newParams);
    getData(newParams);
  };

  return (
    <>
      <Row style={{ marginBottom: "10px" }}>
        <Col xs={24} sm={24} md={12} lg={12}>
          <SearchBox
            defaultValue={_.get(params, "q")}
            style={{ width: "50%" }}
            onSearch={(value) => updateSearch({ q: value })}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} style={{ textAlign: "right" }}>
          {pagination &&
            !isNaN(pagination.total) &&
            `results: ${pagination.total}`}
        </Col>
      </Row>

      <Table
        size="small"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="key"
      />
    </>
  );
};

const mapContextToProps = ({ addError }) => ({
  addError
});
export default withContext(mapContextToProps)(RefTable);
