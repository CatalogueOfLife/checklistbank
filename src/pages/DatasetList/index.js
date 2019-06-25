import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Form, Row, Col } from "antd";
import config from "../../config";
import qs from "query-string";
import Layout from "../../components/LayoutNew";
import moment from "moment";
import history from "../../history";

import SearchBox from "./SearchBox";
import ColumnFilter from "./ColumnFilter";
import DatasetLogo from "./DatasetLogo";
import ImportButton from "../../pages/Imports/importTabs/ImportButton";
import withContext from "../../components/hoc/withContext";
import { getDatasetsBatch } from "../../api/dataset";
import DataLoader from "dataloader";

const FormItem = Form.Item;

const _ = require("lodash");

const PAGE_SIZE = 20;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 }
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 }
  }
};

const defaultColumns = [
  {
    title: "Title",
    dataIndex: "title",
    width: 250,
    key: "title",
    render: (text, record) => {
      return (
        <NavLink
          to={{ pathname: `/dataset/${record.key}/names` }}
          exact={true}
        >
          {text}
        </NavLink>
      );
    },
    sorter: true
  },
  {
    title: "Logo",
    dataIndex: "key",
    width: 100,
    key: "logo",
    render: (text, record) => <DatasetLogo datasetKey={record.key} />
  },
  {
    title: "Authors and Editors",
    dataIndex: "authorsAndEditors",
    key: "authorsAndEditors",
    sorter: true
  },
  {
    title: "Version",
    dataIndex: "version",
    key: "version"
  },
  {
    title: "Origin",
    dataIndex: "origin",
    key: "origin"
  },
  {
    title: "Code",
    dataIndex: "code",
    key: "code"
  },
  {
    title: "Contributes To",
    dataIndex: "contributesTo",
    key: "contributesTo",
    render: (text, record) => {
      return record.contributesToDatasets
        ? record.contributesToDatasets.map(d => d.alias).join(", ")
        : "";
    }
  },
  {
    title: "Size",
    dataIndex: "size",
    key: "size",
    sorter: true
  },
  {
    title: "Data Format",
    dataIndex: "format",
    key: "format",
    render: (text, record) => record.dataFormat
  },
  {
    title: "Import Frequency",
    dataIndex: "importFrequency",
    key: "importFrequency"
  },
  {
    title: "Created",
    dataIndex: "created",
    key: "created",
    sorter: true,
    render: date => {
      return moment(date).format("MMM Do YYYY");
    }
  },
  {
    title: "Modified",
    dataIndex: "modified",
    key: "modified",
    sorter: true,
    render: date => {
      return moment(date).format("MMM Do YYYY");
    }
  }
];

class DatasetList extends React.Component {
  constructor(props) {
    super(props);
    // const excludeColumns = JSON.parse(localStorage.getItem('colplus_datasetlist_hide_columns')) || [];

    this.state = {
      data: [],
      excludeColumns:
        JSON.parse(localStorage.getItem("colplus_datasetlist_hide_columns")) ||
        [],
      columns: [],
      search: _.get(this.props, "location.search.q") || "",
      params: {},
      pagination: {
        pageSize: PAGE_SIZE,
        current: 1,
        showQuickJumper: true
      },
     
      loading: false
    };
  }

  componentWillMount() {
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = { limit: PAGE_SIZE, offset: 0 };
      history.push({
        pathname: "/dataset",
        search: `?limit=${PAGE_SIZE}&offset=0`
      });
    }
   
    this.setState({ params }, this.getData);

  }


  getData = () => {
    const { params } = this.state;

    this.setState({ loading: true });
    if (!params.q) {
      delete params.q;
    }
    history.push({
      pathname: "/dataset",
      search: `?${qs.stringify(params)}`
    });
    axios(`${config.dataApi}dataset?${qs.stringify(params)}`)
      .then(res => {

        const contributesToLoader = new DataLoader(ids =>
          getDatasetsBatch(ids)
        );
        return Promise.all(
         !res.data.result ? [] : res.data.result.map(r => {
            if (r.contributesTo) {
              const promise = Promise.all(
                r.contributesTo.map(i => contributesToLoader.load(i))
              ).then(datasets => {
                r.contributesToDatasets = datasets;
              });
              return promise;
            } else {
              return Promise.resolve();
            }
          })
        ).then(() => res);
      })
      .then(res => {
        const pagination = { ...this.state.pagination };
        pagination.total = res.data.total;

        this.setState({
          loading: false,
          data: res.data.result,
          err: null,
          pagination
        });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };


  updateSearch = params => {

    let newParams = {...this.state.params, offset: 0, limit: 50};
    _.forEach(params, (v, k) => {
      newParams[k] = v;
    });
    this.setState({ params: newParams}, this.getData);
  };



  
  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;

    this.setState({
      pagination: pager
    });
    let query = {... this.state.params, 
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ...filters,
      code: filters.code,
      format: filters.format,
    };

    if (sorter) {
      query.sortBy =
        sorter.field === "authorsAndEditors" ? "authors" : sorter.field;
    }
    if (sorter && sorter.order === "descend") {
      query.reverse = true;
    } else {
      query.reverse = false;
    }
    this.setState({ params: query }, this.getData);
  };

  handleColumns = excludeColumns => {
    this.setState({ excludeColumns });
  };

  render() {
    const { data, loading, error, excludeColumns} = this.state;
    const { dataFormatType, nomCode } = this.props

    defaultColumns[5].filters = nomCode.map(i => ({text: _.startCase(i.name), value: i.name}))
    defaultColumns[8].filters = dataFormatType.map(i => ({text: _.startCase(i), value: i}))

    const filteredColumns =
      this.props.user && _.includes(this.props.user.roles, "admin")
        ? [
            ...defaultColumns,
            {
              title: "Action",
              dataIndex: "",
              width: 60,
              key: "__actions__",
              render: record =>
                record.origin === "external" ? (
                  <ImportButton
                    key={record.key}
                    record={{ datasetKey: record.key }}
                  />
                ) : (
                  ""
                )
            }
          ]
        : defaultColumns;

    const columns = _.filter(
      filteredColumns,
      v => !_.includes(excludeColumns, v.key)
    );

    return (
      <Layout
        openKeys={["dataset"]}
        selectedKeys={["/dataset"]}
        title="Datasets"
      >
        <div
          style={{
            background: "#fff",
            padding: 24,
            minHeight: 280,
            margin: "16px 0"
          }}
        >
          <div>
            <Row>
              <Col md={12} sm={24}>
                <SearchBox
                  defaultValue={_.get(this.state, "params.q")}
                  style={{ marginBottom: "10px", width: "50%" }}
                  onSearch={value =>
                    this.updateSearch({ q: value })
                  }
                />
              </Col>
              <Col md={12} sm={24}>
                <FormItem
                  style={{ width: "100%" }}
                  {...formItemLayout}
                  label="Omit columns"
                >
                  <ColumnFilter
                    columns={columns}
                    onChange={this.handleColumns}
                  />
                </FormItem>
              </Col>
            </Row>
            {error && <Alert message={error.message} type="error" />}
          </div>
          {!error && (
            <Table
              size="middle"
              columns={columns}
              dataSource={data}
              loading={loading}
              pagination={this.state.pagination}
              onChange={this.handleTableChange}
            />
          )}
        </div>
      </Layout>
    );
  }
}

const mapContextToProps = ({ user, dataFormatType, nomCode }) => ({ user, dataFormatType, nomCode });

export default withContext(mapContextToProps)(DatasetList);
