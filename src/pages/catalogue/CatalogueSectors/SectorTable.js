import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

import {
  CodeOutlined,
  DeleteOutlined,
  HistoryOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';

import { Table, Alert, Tooltip, Input, Button, Row, Col, notification } from "antd";
import config from "../../../config";
import moment from "moment";

import withContext from "../../../components/hoc/withContext";
import kibanaQuery from "../SectorSync/kibanaQuery";
import Highlighter from "react-highlight-words";
import _ from "lodash";
import SyncButton from "../SectorSync/SyncButton";
import Auth from "../../../components/Auth"

class SectorTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentDataSourceLength: 0,
      searchText: ""
    };
  }


  componentDidUpdate = (prevProps) => {
    if(this.props.data && this.props.data.length > 0 && this.props.data.length !== prevProps.data.length){
      this.setState({currentDataSourceLength: this.props.data.length})
  }
  }

  getColumnSearchProps = dataIndex => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          placeholder={`Search ${dataIndex.split(".")[0]}`}
          value={selectedKeys[0]}
          onChange={e =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => this.handleSearch(selectedKeys, confirm)}
          style={{ width: 188, marginBottom: 8, display: "block" }}
        />
        <Button
          type="primary"
          onClick={() => this.handleSearch(selectedKeys, confirm)}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
        </Button>
        <Button
          onClick={() => this.handleReset(clearFilters)}
          size="small"
          style={{ width: 90 }}
        >
          Reset
        </Button>
      </div>
    ),
    filterIcon: filtered => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      _.get(record, dataIndex)
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    }
  });
  handleSearch = (selectedKeys, confirm) => {
    confirm();
    this.setState({ searchText: selectedKeys[0] });
  };

  handleReset = clearFilters => {
    clearFilters();
    this.setState({ searchText: "" });
  };

 
  render() {
    const {data, loading, user, onDeleteSector, pagination, catalogueKey, handleTableChange, expandedRowRender} = this.props;  
    const offset = pagination ? (pagination.current - 1) * pagination.pageSize : 0; 

    const columns = [
      {
        title: "Dataset",
        dataIndex: ["dataset", "alias"],
        key: "alias",
        render: (text, record) => {
          return (
            <NavLink
              to={{ pathname: `/dataset/${record.dataset.key}/meta` }}
              exact={true}
            >
              <Highlighter
                highlightStyle={{ fontWeight: "bold", padding: 0 }}
                searchWords={[this.state.searchText]}
                autoEscape
                textToHighlight={text ? text.toString() : record.dataset.title}
              />
            </NavLink>
          );
        },
    //    sorter: (a, b) => a.dataset.alias < b.dataset.alias,
        width: 250
      //  ...this.getColumnSearchProps("dataset.alias")
      },

      {
        title: "Mode",
        dataIndex: "mode",
        key: "mode",
        width: 50,  
        filters : [{
            text: 'Attach',
            value: 'attach',
          }, {
            text: 'Merge',
            value: 'merge',
          }],
          onFilter: (value, record) => record.mode === value,

      },
      {
        title: "Subject",
        dataIndex: ["subject", "name"],
        key: "subject",
        width: 150,
        render: (text, record) => {
          return (
            <React.Fragment>
              <div style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                {record.subject.rank}:{" "}
              </div>
              {!record.subject.id  && <NavLink
                to={{
                  pathname: `/dataset/${record.subjectDatasetKey}/names`,
                  search: `?q=${record.subject.name}`
                  
                }}
                exact={true}
              >
                <Highlighter
                  highlightStyle={{ fontWeight: "bold", padding: 0 }}
                  searchWords={[this.state.searchText]}
                  autoEscape
                  textToHighlight={record.subject.name.toString()}
                />
              </NavLink> }
              {record.subject.id && <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/assembly`,
                  search: `?sourceTaxonKey=${record.placeholderRank ? record.subject.id+'--incertae-sedis--'+record.placeholderRank.toUpperCase() : record.subject.id}&datasetKey=${record.subjectDatasetKey}`
                }}
                exact={true}
              >
                <Highlighter
                  highlightStyle={{ fontWeight: "bold", padding: 0 }}
                  searchWords={[this.state.searchText]}
                  autoEscape
                  textToHighlight={_.get(record, "subject.name") ? record.subject.name.toString() : ""}
                />
               
              </NavLink>}{!record.subject.id && (
                <WarningOutlined style={{ color: "red", marginLeft: "10px" }} />
              )}
            </React.Fragment>
          );
        }
      },
      {
        title: "Target",
        dataIndex: ["target", "name"],
        key: "target",
        width: 150,
        ...this.getColumnSearchProps("target.name"),

     //   sorter: (a, b) => a.target.name < b.target.name,

        render: (text, record) => {
          return (
            <React.Fragment>
              <div style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                {record.target.rank}:{" "}
              </div>
           { _.get(record, 'target.id') &&  <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/assembly`,
                  search: `?assemblyTaxonKey=${record.target.id}`
                }}
                exact={true}
              >
                <Highlighter
                  highlightStyle={{ fontWeight: "bold", padding: 0 }}
                  searchWords={[this.state.searchText]}
                  autoEscape
                  textToHighlight={_.get(record, "target.name") ? record.target.name.toString() : ""}
                />
               
              </NavLink> }
              { !_.get(record, 'target.id') && <React.Fragment> 
              <Highlighter
                  highlightStyle={{ fontWeight: "bold", padding: 0 }}
                  searchWords={[this.state.searchText]}
                  autoEscape
                  textToHighlight={_.get(record, "target.name") ? record.target.name.toString() : ""}
                /><WarningOutlined style={{ color: "red", marginLeft: "10px" }} /></React.Fragment>}
            </React.Fragment>
          );
        }
      },

      {
        title: "Created",
        dataIndex: "created",
        key: "created",
        width: 50,
      //  sorter: (a, b) => a.created < b.created,
        render: date => {
          return date ? moment(date).format("lll") : "";
        }
      },

      {
        title: "History",
        key: "history",
        render: (text, record) => (
          <Tooltip title="Synchronization history">
            <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/sector/sync`,
                  search: `?sectorKey=${record.id}`
                }}
                exact={true}
              >
              <HistoryOutlined style={{ fontSize: "20px" }} />
            </NavLink>
          </Tooltip>
        ),
        width: 50
      },
      {
        title: "Logs",
        key: "logs",
        render: (text, record) => (
          <Tooltip title="Kibana logs">
            <a href={kibanaQuery(record.id)} target="_blank" >
              <CodeOutlined style={{ fontSize: "20px" }} />
            </a>
          </Tooltip>
        ),
        width: 50
      }
    ];

    if(Auth.isAuthorised(user, ['admin', 'editor'])){
      columns.push({
        title: "Action",
        key: "action",
        width: 250,
        render: (text, record) => (
          <React.Fragment>
            { _.get(record, 'target.id') && _.get(record, 'subject.id') && <SyncButton style={{display: 'inline', marginRight: '8px'}} record={{sector: record}}/> } 
           { /* (!_.get(record, 'target.id') || !_.get(record, 'subject.id')) &&  */ <Button
           style={{display: 'inline', marginRight: '8px'}}
            type={"primary"}
            onClick={() => {
                axios.post(`${config.dataApi}dataset/${catalogueKey}/sector/rematch`, {id: record.id})
                .then(rematchInfo => {
                    const success = (_.get(rematchInfo, 'data.updated') ===1 ||  _.get(rematchInfo, 'data.unchanged') === 1) && _.get(rematchInfo, 'data.broken')===0;

                   if(success){
                    notification.success({
                        message: "Rematch success",
                        description: `Broken sectors: 0`
                      })

                      if(this.props.onSectorRematch && typeof this.props.onSectorRematch === 'function'){
                        this.props.onSectorRematch(record)

                      }
                   } else {
                    notification.error({
                        message: "Rematch failed",
                        description: `Broken sectors: 1`
                      })
                   }
                })
                .catch(err => {
                    notification.error({
                        message: `Server error ${_.get(err, 'response.status')}`,
                        description: _.get(err, 'response.data.message')
                      })
                })
            }}
          >
            Rematch
          </Button>}
          {onDeleteSector && typeof onDeleteSector === 'function' && <Button style={{display: 'inline'}} type="danger" onClick={() => onDeleteSector(record)}><DeleteOutlined /></Button>}
          
          </React.Fragment>
          
        )
      })
    }
    return (
      <React.Fragment>
         
  <Row>
   {!loading && pagination && <Col style={{textAlign: "right"}}>Results: {offset} - {offset+data.length} of {pagination.total}</Col>
  }
    </Row>
          
            <Table
              size="small"
              onChange={handleTableChange}
              columns={columns}
              dataSource={data}
              loading={loading}
              pagination={pagination}
              rowKey="id"
              expandedRowRender={expandedRowRender}
            />
          
      </React.Fragment>
    );
  }
}

const mapContextToProps = ({ user, catalogueKey }) => ({ user, catalogueKey });

export default withContext(mapContextToProps)(SectorTable);
