import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import {
  Table,
  Alert,
  Icon,
  Select,
  Input,
  Button,
  Switch,
  Form,
  Row,
  Col,
  DatePicker,
  Popconfirm,
  notification
} from "antd";
import config from "../../../config";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import { getDatasetsBatch } from "../../../api/dataset";
import DataLoader from "dataloader";
import SectorTable from "./SectorTable";
import _ from "lodash";
import qs from "query-string";
import history from "../../../history";
import DatasetAutocomplete from "../Assembly/DatasetAutocomplete";
import NameAutocomplete from "../Assembly/NameAutocomplete";
import moment from "moment";
import RematchResult from "./RematchResult"
import SyncAllSectorsButton from "../../Admin/SyncAllSectorsButton"
const FormItem = Form.Item;
const { Option } = Select;
const datasetLoader = new DataLoader(ids => getDatasetsBatch(ids));

const PAGE_SIZE = 100;

class CatalogueSectors extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      searchText: "",
      loading: false,
      rematchSectorsAndDecisionsLoading: false,
      rematchInfo: null,
      pagination: {
        pageSize: PAGE_SIZE,
        current: 1,
        showQuickJumper: true
      }
    };
  }

  componentDidMount() {
    // this.getData();
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = { limit: PAGE_SIZE, offset: 0 };
      history.push({
        pathname: _.get(this.props, "location.pathname"),
        search: `?limit=${PAGE_SIZE}&offset=0`
      });
    }

    this.setState(
      {
        params,
        pagination: {
          pageSize: params.limit,
          current: Number(params.offset) / Number(params.limit) + 1,
          pageSize: PAGE_SIZE
        }
      },
      this.getData
    );
  }

  componentDidUpdate = prevProps => {
    if (
      _.get(prevProps, "location.search") !==
        _.get(this.props, "location.search") ||
      _.get(prevProps, "match.params.catalogueKey") !==
        _.get(this.props, "match.params.catalogueKey")
    ) {
      const params = qs.parse(_.get(this.props, "location.search"));
      this.setState(
        {
          pagination: {
            pageSize: params.limit,
            current: Number(params.offset) / Number(params.limit) + 1,
            pageSize: PAGE_SIZE
          }
        },
        this.getData
      );
    }
  };


  getData = () => {
    const {
      match: {
        params: { catalogueKey }
      }
    } = this.props;
    this.setState({ loading: true });
    const params = {
      ...qs.parse(_.get(this.props, "location.search")),
      datasetKey: catalogueKey
    };
    axios(`${config.dataApi}dataset/${catalogueKey}/sector?${qs.stringify(params)}`)
      .then(this.decorateWithDataset)
      .then(res =>
        this.setState({
          loading: false,
          error: null,
          data: _.get(res, "data.result") || [],
          pagination: {
            ...this.state.pagination,
            total: _.get(res, "data.total")
          }
        })
      )
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  decorateWithDataset = res => {
    if (!res.data.result) return res;
    return Promise.all(
      res.data.result.map(sector =>
        datasetLoader
          .load(sector.subjectDatasetKey)
          .then(dataset => (sector.dataset = dataset))
      )
    ).then(() => res);
  };

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
          icon="search"
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
      <Icon type="search" style={{ color: filtered ? "#1890ff" : undefined }} />
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
  onChange = (pagination, filters, sorter, extra) => {
    this.setState({ currentDataSourceLength: extra.currentDataSource.length });
  };

  onDeleteSector = sector => {
    const {
      match: {
        params: { catalogueKey }
      }
    } = this.props;
    axios
      .delete(`${config.dataApi}dataset/${catalogueKey}/sector/${sector.id}`)
      .then(() => {
        notification.open({
          message: "Deletion triggered",
          description: `Delete job for ${sector.id} placed on the sync queue`
        });
        this.setState({
          data: this.state.data.filter(d => d.id !== sector.id)
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;

    const params = {
      ...qs.parse(_.get(this.props, "location.search")),
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize
    };

    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(params)
    });
  };

  updateSearch = params => {
    let newParams = {
      ...qs.parse(_.get(this.props, "location.search")),
      ...params,
      offset: 0
    };
    Object.keys(params).forEach(param => {
      if (params[param] === null) {
        delete newParams[param];
      }
    });
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(newParams)
    });
  };
  onSelectDataset = dataset => {
    this.updateSearch({ subjectDatasetKey: dataset.key });
  };
  onResetDataset = () => {
    let newParams = qs.parse(_.get(this.props, "location.search"));
    delete newParams.subjectDatasetKey;
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(newParams)
    });
  };
  onResetName = () => {
    let newParams = qs.parse(_.get(this.props, "location.search"));
    delete newParams.name;
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(newParams)
    });
  };
  resetAllFilters = () => {
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: `?limit=${PAGE_SIZE}&offset=0`
    });
  };

  rematchSectorsAndDecisions = () => {
    const {
      match: {
        params: { catalogueKey }
      }
    } = this.props;

    this.setState({ rematchSectorsAndDecisionsLoading: true });
    axios
      .post(
        `${config.dataApi}dataset/${catalogueKey}/rematch`,
        { all: true }
      )
      .then(res => {
        this.setState(
          {
            rematchSectorsAndDecisionsLoading: false,
            rematchInfo: res.data,
            error: null
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          rematchSectorsAndDecisionsLoading: false,
          rematchInfo: null
        })
      );
  };

  render() {
    const { data, loading, pagination, error, rematchSectorsAndDecisionsLoading, rematchInfo } = this.state;
    const {
      match: {
        params: { catalogueKey }
      },
      user,
      rank
    } = this.props;

    const params = qs.parse(_.get(this.props, "location.search"));

    return (
      <Layout
        selectedKeys={["catalogueSectors"]}
        openKeys={["assembly", "projectDetails"]}
        title="Catalogue sectors"
      >
        <PageContent>
          {error && (
            <Alert
              closable
              onClose={() => this.setState({ error: null })}
              message={error.message}
              type="error"
            />
          )}
          {rematchInfo && (
            <Alert
              closable
              onClose={() => this.setState({ rematchInfo: null })}
              message="Rematch succeded"
              description={ <RematchResult rematchInfo={rematchInfo}/>}
              type="success"
              style={{marginBottom: '10px'}}
            />
          )}

          <Form layout="inline">
            <div style={{ marginBottom: "8px" }}>
              <DatasetAutocomplete
                onResetSearch={this.onResetDataset}
                onSelectDataset={this.onSelectDataset}
                contributesTo={this.props.catalogueKey}
                placeHolder="Source dataset"
              />
            </div>
            <div style={{ marginBottom: "8px" }}>
            <NameAutocomplete
              datasetKey={catalogueKey}
              onSelectName={name => {
                this.updateSearch({ name: name.title });
              }}
              onResetSearch={this.onResetName}
            />
            </div>
            <FormItem label="Only broken">
              <Switch
                checked={params.broken === true || params.broken === "true"}
                onChange={value => this.updateSearch({ broken: value })}
              />
            </FormItem>
            <FormItem label="Created by me">
              <Switch
                checked={user && Number(params.userKey) === user.key}
                onChange={value =>
                  this.updateSearch({ userKey: value ? user.key : null })
                }
              />
            </FormItem>
            <FormItem >
              <Select
                placeholder="Subject rank"
                style={{ width: 160 }}
                value={params.rank}
                showSearch
                onChange={value => this.updateSearch({ rank: value })}
              >
                {rank.map(r => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem >
              <Select
                              placeholder="Sector mode"

                style={{ width: 160 }}
                value={params.mode}
                showSearch
                onChange={value => this.updateSearch({ mode: value })}
              >
                {["attach", "union", "merge"].map(r => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem>
            <DatePicker 
            placeholder="Last sync"
            defaultValue={params.lastSync ? moment(params.lastSync) : null}
            onChange={(date, dateString) => this.updateSearch({ lastSync: dateString })} />
            </FormItem>
          </Form>
          <Row style={{marginTop: "10px"}}>
            <Col span={6} style={{ textAlign: "left", marginBottom: "8px" }}>
              <Button type="danger" onClick={this.resetAllFilters}>
                Reset all
              </Button>


          
            
            </Col>
            <Col span={18} style={{textAlign: "right"}}>
            <SyncAllSectorsButton 
            dataset={params.subjectDatasetKey ? {key: params.subjectDatasetKey} : null} 
            catalogueKey={catalogueKey}
            onError={err => this.setState({error: err})}
            text={params.subjectDatasetKey ? `Sync all sectors from dataset ${params.subjectDatasetKey}` : null}
            >
              
            </SyncAllSectorsButton>
              <Popconfirm
            placement="rightTop"
            title="Do you want to rematch all broken sectors and decisions?"
            onConfirm={this.rematchSectorsAndDecisions}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={rematchSectorsAndDecisionsLoading}
              style={{  marginBottom: "10px" }}
            >
              Rematch all broken sectors and decisions
            </Button>
          </Popconfirm>
            </Col>
          </Row>
          {!error && (
            <SectorTable
              data={data}
              loading={loading}
              onSectorRematch={this.getData}
              onDeleteSector={this.onDeleteSector}
              pagination={pagination}
              handleTableChange={this.handleTableChange}
            ></SectorTable>
          )}
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ user, rank, catalogueKey }) => ({
  user,
  rank,
  catalogueKey
});

export default withContext(mapContextToProps)(CatalogueSectors);
