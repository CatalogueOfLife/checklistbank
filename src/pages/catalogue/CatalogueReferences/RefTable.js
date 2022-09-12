import React from "react";
import axios from "axios";
import {SearchOutlined} from "@ant-design/icons"
import { Table, Row, Col, Input, Space, Button } from "antd";
import config from "../../../config";
import moment from "moment";
import qs from "query-string";
import history from "../../../history";
import SearchBox from "../../DatasetList/SearchBox";
import withContext from "../../../components/hoc/withContext";

import _ from "lodash";
import { NavLink } from "react-router-dom";


class RefTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      params: {},
      pagination: {
        pageSize: 50,
        current: 1,
        showQuickJumper: true,
      },
      loading: false,
      columns: [
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
          ...this.getColumnSearchProps('year')
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

        /* {
          title: "Action",
          key: "action",
          width: 50,
          render: (text, record) => <Button type={"primary"}>Edit</Button>
        }  */
      ],
    };
  }

  searchInput = React.createRef()

  componentDidMount() {
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = {
        limit: 50,
        offset: 0,
      };
      history.push({
        pathname: _.get(this.props, "location.pathname"), //
        search: `?limit=50&offset=0`,
      });
    }

    this.setState({ params }, this.getData);
  }

  componentDidUpdate = (prevProps) => {
    if (_.get(prevProps, "datasetKey") !== _.get(this.props, "datasetKey")) {
      this.getData();
    }
  };
  handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
  //  setSearchText(selectedKeys[0]);
   // setSearchedColumn(dataIndex);
  };
  
  handleReset = (clearFilters, confirm) => {
    clearFilters();
    confirm()
    this.setState({params: {
      limit: 50,
      offset: 0,
    }},  this.getData)
   // setSearchText('');
  };
  getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div
        style={{
          padding: 8,
        }}
      >
        <Input
          defaultValue={this.state?.params?.year}
          ref={this.searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block',
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && this.handleReset(clearFilters, confirm)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Reset
          </Button>
          {/* <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({
                closeDropdown: false,
              });
              //setSearchText(selectedKeys[0]);
            }}
          >
            Filter
          </Button> */}
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

  getData = () => {
    const { params } = this.state;
    this.setState({ loading: true });
    const { datasetKey, addError } = this.props;
    if (!params.q) {
      delete params.q;
    }
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: `?${qs.stringify(params)}`,
    });
    axios(
      `${config.dataApi}dataset/${datasetKey}/reference?${qs.stringify(params)}`
    )
      .then((res) => {
        const pagination = { ...this.state.pagination };
        pagination.total = res.data.total;

        this.setState({
          loading: false,
          data: _.get(res, "data.result") || [],
          err: null,
          pagination,
        });
      })
      .catch((err) => {
        addError(err)
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination, ...pagination };
    // pager.current = pagination.current;

    this.setState({
      pagination: pager,
    });
    let query = _.merge(this.state.params, {
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ...Object.keys(filters).reduce(
        (acc, cur) => (filters[cur] !== null && (acc[cur] = filters[cur]), acc),
        {}
      )
    });
    if (sorter) {
      query.sortBy = sorter.field;
      if (sorter.order === "descend") {
        query.reverse = true;
      } else {
        query.reverse = false;
      }
    }

    this.setState({ params: query }, this.getData);
  };

  updateSearch = (params) => {
    let newParams = { ...this.state.params, offset: 0, limit: 50 };
    _.forEach(params, (v, k) => {
      newParams[k] = v;
    });
    this.setState({ params: newParams }, this.getData);
  };

  render() {
    const { data, columns, loading, pagination } = this.state;

    return (
      <React.Fragment>
        <Row style={{ marginBottom: "10px" }}>
          <Col xs={24} sm={24} md={12} lg={12}>
            <SearchBox
              defaultValue={_.get(this.state, "params.q")}
              style={{ width: "50%" }}
              onSearch={(value) => this.updateSearch({ q: value })}
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
          onChange={this.handleTableChange}
          rowKey="key"
        />
      </React.Fragment>
    );
  }
}

const mapContextToProps = ({ addError }) => ({
  addError
});
export default withContext(mapContextToProps)(RefTable);