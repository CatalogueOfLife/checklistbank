import React from "react";
import { Table, Alert } from "antd";
import axios from "axios"
import config from "../../../config";
import { NavLink } from "react-router-dom";


const _ = require("lodash");

const columns = [
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
    render: (text, record) => {
      return _.startCase(text);
    },
    width: 250,
    sorter: (a, b) => a.title.localeCompare(b.title)
  },
  {
    title: "Count",
    dataIndex: "count",
    key: "count",
    render: (text, record) => {
       return (
            <NavLink 
              to={{ pathname: `/dataset/${record.datasetKey}/names?issue=${record.title.split(' ').join('_')}` }}
              exact={true}
            >
              {text}
            </NavLink>
          )
      },
    width: 250,
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.count - b.count
  }
];




class DatasetIssues extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
    this.state = { data: null };
  }

  componentWillMount() {
    this.getData();
  }

  getData = () => {
    const { datasetKey } = this.props;

    this.setState({ loading: true });
    axios(
      `${config.dataApi}dataset/${datasetKey}/import?limit=3&state=finished`
    )
      .then(res => {
        let tableData = [];
        _.each(_.get(res, 'data[0].issuesCount'), (v, k) => {
            
            tableData.push({title: k, count: v, datasetKey: this.props.datasetKey})
          });
        this.setState({ loading: false, data: tableData, err: null });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: {} });
      });
  };
  render() {
    const { error, data, loading } = this.state;

    return (
      <div>
        {error && <Alert message={error.message} type="error" />}

        {!error && (
          <Table
            size="middle"
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={false}
            rowKey="title"
          />
        )}
      </div>
    );
  }
}

export default DatasetIssues;
