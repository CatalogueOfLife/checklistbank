import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Form, Tag } from "antd";
import config from "../../../config";
import qs from "query-string";
import moment from "moment";
import history from "../../../history";
import ImportButton from './ImportButton'
import PageContent from '../../../components/PageContent'
import withContext from '../../../components/hoc/withContext'
import Auth from '../../../components/Auth'
import ImportMetrics from '../../../components/ImportMetrics'
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
const tagColors = {
  'processing': 'purple',
  'downloading': 'cyan',
  'inserting': 'blue',
  'finished': 'green',
  'failed': 'red',
  'in queue': 'orange'
}
const defaultColumns = [
  {
    title: "Title",
    dataIndex: "dataset.title",
    key: "title",
    render: (text, record) => {
      return (
        <NavLink
          to={{ pathname: `/dataset/${record.datasetKey}/metrics` }}
          exact={true}
        >
          {text}
        </NavLink>
      );
    },
    width: 250
  },
  {
    title: "State",
    dataIndex: "state",
    key: "state",
    render: (text, record) => {

      return <Tag color={tagColors[record.state]}>{record.state}</Tag>;
    },
    width: 50
  },
  {
    title: "Data Format",
    dataIndex: "dataset.dataFormat",
    key: "dataFormat",
    width: 50
  },
  {
    title: "Attempt No",
    dataIndex: "attempt",
    key: "attempt",
    width: 50
  },
  {
    title: "Import Started",
    dataIndex: "started",
    key: "started",
    width: 150,
    render: date => {
      return (date) ? moment(date).format("MMMM Do YYYY, h:mm:ss a") : '';
    }
  },
  {
    title: "Import Finished",
    dataIndex: "finished",
    key: "finished",
    width: 150,
    render: date => {
      return (date) ?  moment(date).format("MMMM Do YYYY, h:mm:ss a") : '';
    }
  }
  
];

class ImportTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      params: {},
      pagination: {
        pageSize: 25,
        current: 1
      },
      loading: false
    };
  }

  componentWillMount() {
    const { importState } = this.props;
    let query = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(query)) {
      query = { limit: 25, offset: 0, state: importState };
    }
    if(query.state){
      this.updateStatusQuery(query)
     }
    this.getData(query);

    if(this.props.section === 'running'){
     this.timer = setInterval(()=>{
        this.getData(query)
      }, 3000)
    }

  }

  componentWillUnmount(){
    if(this.props.section === 'running'){ clearInterval(this.timer)};

  }

  getData = params => {
    const { section } = this.props;
    this.setState({ loading: true, params });
    history.push({
      pathname: `/imports/${section}`,
      search: `?${qs.stringify(params)}`
    });
    axios(`${config.dataApi}importer?${qs.stringify(params)}`)
      .then(res => {

        const promises = (res.data.result && _.isArray(res.data.result)) ? res.data.result.map( imp => 
         
            axios(`${config.dataApi}dataset/${imp.datasetKey}`).then(
              dataset => {
                imp.dataset = dataset.data;
                imp._id = `${imp.datasetKey}_${imp.attempt}`
              }
            )
          
        ) : []

        return Promise.all(promises).then(() => res);
      })
      .then(res => {
       if(this.props.section === 'running'){
          return this.addDataFromImportQueue(res).then((queued)=>{
            if(!res.data.result){
              res.data.result = []
            }
            res.data.result = res.data.result.concat(queued.data)
            return res
          })
        } else {
          return res
        } 

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

  addDataFromImportQueue = (mainRes) => {

  return  axios(`${config.dataApi}importer/queue`)
    .then(res => {
      let promises = [];

      _.each(res.data, imp => {
        promises.push(
          axios(`${config.dataApi}dataset/${imp.datasetKey}`).then(
            dataset => {
              imp.dataset = dataset.data;
              imp.state = 'in queue'
            }
          )
        );
      });

      return Promise.all(promises).then(() => res);
    })
    .catch(err => {
      console.log(err)
    });
  }

  updateStatusQuery = (query) => {

    let catColumn = _.find(defaultColumns, (c)=>{
      return c.key === 'state'
    });
    let filter = (typeof query.state === 'string') ? [query.state] : query.state;
    catColumn.filteredValue = filter
  }

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
    if(filters.state && _.get(filters, 'state.length')){
      query.state = filters.state
      
    } else {
      query.state = this.props.importState
    }
    this.updateStatusQuery(query)

    this.getData(query);
  };

  render() {
    const { data, loading, error } = this.state;
    const { section, user } = this.props;
    const columns = (Auth.isAuthorised(user, ['editor', 'admin'])) ? [ ...defaultColumns, {
      title: "Action",
      dataIndex: "",
      key: "x",
      width: 150,
      render: record => (
        <ImportButton key={record.datasetKey} record={record} onStartImportSuccess={()=> {history.push('/imports/running')}}></ImportButton>
      )
    }] : defaultColumns;

    if(section === 'finished'){
      columns[1].filters = [{
        text: 'Finished',
        value: 'finished',
      }, {
        text: 'Failed',
        value: 'failed',
      }, {
        text: 'Canceled',
        value: 'canceled',
      }, {
        text: 'Unchanged',
        value: 'unchanged',
      }]
    }

    return (
      <PageContent>
        {error && <Alert message={error.message} type="error" />}
        {!error && (
          <Table
            size="middle"
            columns={columns}
            dataSource={data}
            pagination={this.state.pagination}
            onChange={this.handleTableChange}
            rowKey="_id"
            expandedRowRender={section === "finished" ? record => {
              if(record.state ==='failed'){
                return <Alert message={record.error} type="error" />
              } else if(record.state ==='finished'){
                return <ImportMetrics data={record}></ImportMetrics>
              }
              return null
            } :null     
            } 
          />
        )}
      </PageContent>
    );
  }
}

const mapContextToProps = ({ user }) => ({ user });

export default withContext(mapContextToProps)(ImportTable);
