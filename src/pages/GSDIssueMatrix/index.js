import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Form, Row, Col, Tooltip } from "antd";
import config from "../../config";
import Layout from "../../components/LayoutNew";
import MultiValueFilter from "../NameSearch/MultiValueFilter";

import SearchBox from "../DatasetList/SearchBox";
import withContext from "../../components/hoc/withContext";

const { MANAGEMENT_CLASSIFICATION } = config;

const FormItem = Form.Item;

const _ = require("lodash");

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

const getIssuesAbbrev = issue => issue.split(" ").map(s => s.charAt(0).toUpperCase())


class GSDIssuesMatrix extends React.Component {
  constructor(props) {
    super(props);
    // const excludeColumns = JSON.parse(localStorage.getItem('colplus_datasetlist_hide_columns')) || [];

    this.state = {
      data: [],

      columns: [],

      loading: false
    };
  }

  componentWillMount() {
    this.getData();
  }

  getData = () => {
    axios(
      `${config.dataApi}dataset?limit=500&contributesTo=${
        MANAGEMENT_CLASSIFICATION.key
      }`
    )
      .then(res => {
        return Promise.all(
          !res.data.result
            ? []
            : res.data.result.map(r => {
                return axios(
                  `${config.dataApi}dataset/${r.key}/import?limit=1`
                ).then(imp => ({
                  ...r,
                  issues: _.get(imp, "data[0].issuesCount")
                }));
              })
        );
      })
      .then(res => {
        this.setState({
          loading: false,
          data: res,
          err: null
        });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  updateSelectedGroups = (groups) => {
    if(groups && groups.length > 0){
      localStorage.setItem('col_plus_matrix_selected_issue_groups', JSON.stringify(groups))
    } else if(groups && groups.length === 0){
      localStorage.removeItem('col_plus_matrix_selected_issue_groups')
    }
    this.setState({ selectedGroups: groups })
  }

  render() {
    const { data, loading, error } = this.state;
    const { issue, issueMap } = this.props;
    const groups = issue ? issue.filter((e, i) => issue.findIndex(a => a['group'] === e['group']) === i).map((a)=> a.group) : []

    const selectedGroups = localStorage.getItem('col_plus_matrix_selected_issue_groups') ? JSON.parse(localStorage.getItem('col_plus_matrix_selected_issue_groups')) : [...groups];
    let groupMap =  {} ;
    if(issue){
      issue.forEach((i)=> { groupMap[i.name] = i.group})
    }

    const columns = [
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        render: (text, record) => {
          return (
            <NavLink
              to={{ pathname: `/dataset/${record.key}/workbench` }}
              exact={true}
            >
              {record.alias || record.key}
            </NavLink>
          );
        },
        sorter: true
      },
      ...issue.filter((d)=> selectedGroups.includes(groupMap[d.name])).map(i => ({
        title: <Tooltip title={i.name}><span style={{color: issueMap[i.name].color}}>{getIssuesAbbrev(i.name)}</span></Tooltip>,
        dataIndex: `issues.${i.name}`,
        key: i.name,
        render: (text, record) => {
          return (
            <NavLink
              to={{ pathname: `/dataset/${record.key}/workbench` , search: `?issue=${i.name}`}}
              exact={true}
            >
              {text}
            </NavLink>
          );
        },
        sorter: (a, b) => {
            return (_.get(a, `issues.${i.name}`) || 0 ) - (_.get(b, `issues.${i.name}`) || 0 ) ;
        }
      }))
    ];
    
    return (
      <Layout
        openKeys={["dataset"]}
        selectedKeys={["/issues"]}
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
                
              </Col>
              <Col md={12} sm={24}>
              <MultiValueFilter
              defaultValue={selectedGroups && selectedGroups.length > 0 ? selectedGroups : groups}
              onChange={this.updateSelectedGroups}
              vocab={groups}
              label="Issue groups"
            />
              </Col>
            </Row>
            {error && <Alert message={error.message} type="error" />}
          </div>
          {!error && (
            <Table
              size="small"
              columns={columns}
              dataSource={data.filter(d => d.issues)}
              loading={loading}
              scroll={{x: "2000px"}}
            />
          )}
        </div>
      </Layout>
    );
  }
}

const mapContextToProps = ({ user, issue, issueMap }) => ({
  user,
  issue,
  issueMap
});

export default withContext(mapContextToProps)(GSDIssuesMatrix);
