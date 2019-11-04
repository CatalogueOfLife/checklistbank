import React from "react";
import { Table, Alert, Tag, Tooltip, Icon } from "antd";
import axios from "axios"
import config from "../../../config";
import { NavLink } from "react-router-dom";
import PageContent from '../../../components/PageContent'
import withContext from '../../../components/hoc/withContext'
import MultiValueFilter from '../../NameSearch/MultiValueFilter'
const _ = require("lodash");

const getColumns = ({issueMap}) => {
return [
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
    render: (text, record) => {
      return <Tooltip key={text} placement="right" title={_.get(issueMap, `[${text}].description`)}>
              
              <Tag key={text} color={_.get(issueMap, `[${text}].color`)}>
                {_.startCase(text)}
              </Tag>
              <NavLink 
              to={{ pathname: `/dataset/${record.datasetKey}/verbatim`, search: `?issue=${text}` }}
              exact={true}
            > verbatim <Icon type="link" />
              </NavLink>
            </Tooltip>
       
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
              to={{ pathname: `/dataset/${record.datasetKey}/workbench`, search: `?issue=${record.title}&limit=100` }}
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
]

}



class DatasetIssues extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: null };
  }

  componentWillMount() {
    this.getData();
    
  }

  getData = () => {
    const { datasetKey, issueMap } = this.props;

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

  updateSelectedGroups = (groups) => {
    if(groups && groups.length > 0){
      localStorage.setItem('col_plus_selected_issue_groups', JSON.stringify(groups))
    } else if(groups && groups.length === 0){
      localStorage.removeItem('col_plus_selected_issue_groups')
    }
    this.setState({ selectedGroups: groups })
  }

  render() {
    const { error, data, loading } = this.state;
    const {issue, issueMap} = this.props;
    const groups = issue ? issue.filter((e, i) => issue.findIndex(a => a['group'] === e['group']) === i).map((a)=> a.group) : []
    const selectedGroups = localStorage.getItem('col_plus_selected_issue_groups') ? JSON.parse(localStorage.getItem('col_plus_selected_issue_groups')) : [...groups];
    let groupMap =  {} ;
    if(issue){
      issue.forEach((i)=> { groupMap[i.name] = i.group})
    }
    const columns = issueMap ? getColumns(this.props) : [];

    return (
      <PageContent>
        {error && <Alert message={error.message} type="error" />}
        <MultiValueFilter
              defaultValue={selectedGroups && selectedGroups.length > 0 ? selectedGroups : groups}
              onChange={this.updateSelectedGroups}
              vocab={groups}
              label="Issue groups"
            />

        {!error && (
          <Table
            size="middle"
            columns={columns}
            dataSource={selectedGroups && data ? data.filter((d)=> selectedGroups.includes(groupMap[d.title])) : data}
            loading={loading}
            pagination={false}
            rowKey="title"
          />
        )}
      </PageContent>
    );
  }
}

const mapContextToProps = ({ user, issue, issueMap }) => ({ user, issue, issueMap });

export default withContext(mapContextToProps)(DatasetIssues);
