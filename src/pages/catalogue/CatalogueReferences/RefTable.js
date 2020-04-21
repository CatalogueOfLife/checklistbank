import React from "react";
import axios from "axios";
import {
  Table,

  Button,
  Row,
  Col
} from "antd";
import config from "../../../config";
import moment from "moment";
import qs from "query-string";
import history from "../../../history";
import SearchBox from "../../DatasetList/SearchBox"

import _ from "lodash";

class RefTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      params: {},
      pagination: {
        pageSize: 50,
        current: 1,
        showQuickJumper: true
      },
      loading: false,
      columns: [
        {
            title: "ID",
            dataIndex: "id",
            key: "id"
          },
        {
          title: "Citation",
          dataIndex: "citation",
          key: "citation"
        },
       
        {
          title: "Created",
          dataIndex: "created",
          key: "created",
          width: 50,
          sorter: (a, b) => a.created < b.created,
          render: date => {
            return date ? moment(date).format("lll") : "";
          }
        },
        {
          title: "Modified",
          dataIndex: "modified",
          key: "modified",
          width: 50,
          sorter: (a, b) => a.modified < b.modified,
          render: date => {
            return date ? moment(date).format("lll") : "";
          }
        }

       /* {
          title: "Action",
          key: "action",
          width: 50,
          render: (text, record) => <Button type={"primary"}>Edit</Button>
        }  */
      ]
    };
  }

  componentDidMount() {
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = {
        limit: 50,
        offset: 0
      };
      history.push({
        pathname: _.get(this.props, "location.pathname"), // 
        search: `?limit=50&offset=0`
      });
    } 

    this.setState({ params }, this.getData);
  }

  componentDidUpdate = (prevProps) => {
    if(_.get(prevProps, 'datasetKey') !== _.get(this.props, 'datasetKey')){
      this.getData()
    }
  }

  getData = () => {
    const { params } = this.state;
    this.setState({ loading: true });
    const { datasetKey } = this.props;
    if (!params.q) {
      delete params.q;
    }
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: `?${qs.stringify(params)}`
    });
    axios(
      `${config.dataApi}dataset/${datasetKey}/reference?${qs.stringify(
        params
      )}`
    )
      .then(res => {
        const pagination = { ...this.state.pagination };
        pagination.total = res.data.total;

        this.setState({
          loading: false,
          data: _.get(res, 'data.result') || [],
          err: null,
          pagination
        });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;

    this.setState({
      pagination: pager
    });
    let query = _.merge(this.state.params, {
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ...filters
    });

    this.setState({ params: query }, this.getData);
  };

  updateSearch = params => {

    let newParams = {...this.state.params, offset: 0, limit: 50};
    _.forEach(params, (v, k) => {
      newParams[k] = v;
    });
    this.setState({ params: newParams}, this.getData);
  };

  render() {
    const { data, columns,loading, pagination, error } = this.state;

    return (
      <React.Fragment>
        <Row style={{ marginBottom: "10px" }}>
              <Col md={12} sm={24}>
                <SearchBox
                  defaultValue={_.get(this.state, "params.q")}
                  style={{ width: "50%" }}
                  onSearch={value =>
                    this.updateSearch({ q: value })
                  }
                />
              </Col>
          <Col md={12} sm={24} style={{ textAlign: "right" }}>

          {pagination &&
              !isNaN(pagination.total) &&
              `results: ${pagination.total}`}
          </Col>
        </Row>

        <Table
          size="small"
          onChange={this.onChange}
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


export default RefTable;
