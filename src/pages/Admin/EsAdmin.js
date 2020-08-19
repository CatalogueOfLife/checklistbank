import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Row, Col, Form } from "antd";
import config from "../../config";
import qs from "query-string";
import Layout from "../../components/LayoutNew";
import history from "../../history";

import SearchBox from "../DatasetList/SearchBox";
import ImportButton from "../../pages/Imports/importTabs/ImportButton";
import withContext from "../../components/hoc/withContext";


const _ = require("lodash");

const PAGE_SIZE = 1000;


const getWarningHighlightedNumber = (a, b) => {
    const numA = isNaN(a) ? 0 : Number(a);
    const numB = isNaN(b) ? 0 : Number(b);
    if((numA - numB) === 0){
        return numA;
    } else return <span style={{color: '#ff4d4f'}}>{numA}</span>
}


class DatasetList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      columns: [
/*         {
          title: "Short name",
          dataIndex: "alias",
          width: 150,
          key: "alias",
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
         // sorter: true
        }, */
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
          title: "Origin",
          dataIndex: "origin",
          key: "origin"
         
        },
       
        {
          title: "Size",
          dataIndex: "size",
          key: "size",
          sorter: true,
          render: (text, record) => record.origin !== "managed" ? getWarningHighlightedNumber(record.size, record.nameUsageTotal) : record.size
        },
        {
            title: "NameUsages",
            dataIndex: "nameUsageTotal",
            key: "nameUsageTotal",
            sorter: false,
            render: (text, record) => record.origin !== "managed" ? getWarningHighlightedNumber(record.nameUsageTotal, record.size) : record.nameUsageTotal
          },
        {
            title: "Action",
            dataIndex: "",
            width: 60,
            key: "__actions__",
            render: (text, record) =>
              record.origin === "external" ? (
                <ImportButton
                  key={record.key}
                  record={{ datasetKey: record.key }}
                />
              ) : (
                ""
              )
          }
      ],
      search: _.get(this.props, "location.search.q") || "",
      params: {},
      pagination: {
        pageSize: PAGE_SIZE,
        showSizeChanger: false,
        current: 1,
        showQuickJumper: true
      },
     
      loading: false
    };
  }

  componentDidMount() {
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = { limit: PAGE_SIZE, offset: 0 };
      history.push({
        pathname: "/admin/es",
        search: `?limit=${PAGE_SIZE}&offset=0`
      });
    }
   
    this.setState({ params, pagination: {
      pageSize: params.limit,
      current: (Number(params.offset) / Number(params.limit)) +1
      
    } }, this.getData);
   
  }


  getData = () => {
    const { params } = this.state;

    this.setState({ loading: true });
    if (!params.q) {
      delete params.q;
    }
    history.push({
      pathname: "/admin/es",
      search: `?${qs.stringify(params)}`
    });
    axios(`${config.dataApi}dataset?${qs.stringify(params)}`)
      .then(res => {
        return Promise.all(
         !res.data.result ? [] : res.data.result.map(r => 
            axios(`${config.dataApi}dataset/${r.key}/nameusage/search?limit=0`)
                .then(nameusages => r.nameUsageTotal = nameusages.data.total)
          )
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
        query.sortBy = sorter.field
      }
    if (sorter && sorter.order === "descend") {
      query.reverse = true;
    } else {
      query.reverse = false;
    }
    this.setState({ params: query }, this.getData);
  };


  render() {
    const { data, loading, error, columns} = this.state;
    const { datasetOrigin } = this.props
    columns[1].filters = datasetOrigin.map(i => ({text: _.startCase(i), value: i}))

    return (
      <Layout
      openKeys={["admin"]} selectedKeys={["esAdmin"]}
        title="Admin"
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
            <Row style={{ marginBottom: "10px"}}>
              <Col md={12} sm={24}>
                <SearchBox
                  defaultValue={_.get(this.state, "params.q")}
                  style={{ marginBottom: "10px", width: "50%" }}
                  onSearch={value =>
                    this.updateSearch({ q: value })
                  }
                />
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

const mapContextToProps = ({ user,datasetOrigin }) => ({ user, datasetOrigin });

export default withContext(mapContextToProps)(DatasetList);
