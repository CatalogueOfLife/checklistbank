import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { SearchOutlined, EditOutlined } from "@ant-design/icons";
import Auth from "../../../components/Auth"
import {
  Form,
  Alert,
  Select,
  Input,
  Button,
  Switch,
  Row,
  Col,
  DatePicker,
  Popconfirm,
  notification,
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
import RematchResult from "./RematchResult";
import SyncAllSectorsButton from "../../Admin/SyncAllSectorsButton";
import SectorForm from "../Assembly/SectorForm"
const FormItem = Form.Item;
const { Option } = Select;
const { Search } = Input;
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));

const PAGE_SIZE = 100;

class CatalogueSectors extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      searchText: "",
      loading: false,
      rematchSectorsLoading: false,
      deleteSectorsLoading: false,
      rematchInfo: null,
      defaultTaxonKey: null,
      pagination: {
        pageSize: PAGE_SIZE,
        current: 1,
        showQuickJumper: true,
      },
    };
  }

  nameRef = React.createRef();

  componentDidMount() {
    // this.getData();
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = { limit: PAGE_SIZE, offset: 0 };
      history.push({
        pathname: _.get(this.props, "location.pathname"),
        search: `?limit=${PAGE_SIZE}&offset=0`,
      });
    }
    params = { limit: PAGE_SIZE, offset: 0, ...params };
    this.setState(
      {
        params,
        pagination: {
          pageSize: params.limit,
          current: Number(params.offset) / Number(params.limit) + 1,
          pageSize: PAGE_SIZE,
        },
      },
      this.getData
    );
  }

  componentDidUpdate = (prevProps) => {
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
            pageSize: PAGE_SIZE,
          },
        },
        this.getData
      );
    }
  };

  getData = () => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    this.setState({ loading: true });
    const params = {
      ...qs.parse(_.get(this.props, "location.search")),
      datasetKey: catalogueKey,
    };
    axios(
      `${config.dataApi}dataset/${catalogueKey}/sector?${qs.stringify(params)}`
    )
      .then(this.decorateWithDataset)
      .then((res) =>
        this.setState({
          loading: false,
          error: null,
          data: _.get(res, "data.result") || [],
          pagination: {
            ...this.state.pagination,
            total: _.get(res, "data.total"),
          },
        })
      )
      .catch((err) => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  decorateWithDataset = (res) => {
    if (!res.data.result) return res;
    return Promise.all(
      res.data.result.map((sector) =>
        datasetLoader
          .load(sector.subjectDatasetKey)
          .then((dataset) => (sector.dataset = dataset))
      )
    ).then(() => res);
  };

  getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={(node) => {
            this.searchInput = node;
          }}
          placeholder={`Search ${dataIndex.split(".")[0]}`}
          value={selectedKeys[0]}
          onChange={(e) =>
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
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      _.get(record, dataIndex)
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    },
  });
  handleSearch = (selectedKeys, confirm) => {
    confirm();
    this.setState({ searchText: selectedKeys[0] });
  };

  handleReset = (clearFilters) => {
    clearFilters();
    this.setState({ searchText: "" });
  };
  onChange = (pagination, filters, sorter, extra) => {
    this.setState({ currentDataSourceLength: extra.currentDataSource.length });
  };

  onDeleteSector = (sector) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    axios
      .delete(`${config.dataApi}dataset/${catalogueKey}/sector/${sector.id}`)
      .then(() => {
        notification.open({
          message: "Deletion triggered",
          description: `Delete job for ${sector.id} placed on the sync queue`,
        });
        this.setState({
          data: this.state.data.filter((d) => d.id !== sector.id),
        });
      })
      .catch((err) => {
        this.setState({ error: err });
      });
  };

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;

    const params = {
      ...qs.parse(_.get(this.props, "location.search")),
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
    };

    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(params),
    });
  };

  updateSearch = (params) => {
    let newParams = {
      ...qs.parse(_.get(this.props, "location.search")),
      ...params,
      offset: 0,
    };
    Object.keys(params).forEach((param) => {
      if (!params[param]) {
        delete newParams[param];
      }
    });
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(newParams),
    });
  };
  onSelectDataset = (dataset) => {
    this.updateSearch({ subjectDatasetKey: dataset.key });
  };
  onResetDataset = () => {
    let newParams = qs.parse(_.get(this.props, "location.search"));
    delete newParams.subjectDatasetKey;
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(newParams),
    });
  };

  resetAllFilters = () => {
    this.nameRef.current.input.state.value = "";
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: `?limit=${PAGE_SIZE}&offset=0`,
    });
  };

  rematchSectors = (subjectDatasetKey) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;

    this.setState({ rematchSectorsLoading: true });
    const body = subjectDatasetKey ? { subjectDatasetKey } : {};
    axios
      .post(`${config.dataApi}dataset/${catalogueKey}/sector/rematch`, body)
      .then((res) => {
        this.setState({
          rematchSectorsLoading: false,
          rematchInfo: { sectors: res.data },
          error: null,
        });
      })
      .catch((err) =>
        this.setState({
          error: err,
          rematchSectorsLoading: false,
          rematchInfo: null,
        })
      );
  };

  deleteAllSectorsFromSource = (subjectDatasetKey) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    this.setState({ deleteSectorsLoading: true });
    axios
      .delete(
        `${config.dataApi}dataset/${catalogueKey}/sector?datasetKey=${subjectDatasetKey}`
      )
      .then((res) => {
        this.setState(
          {
            deleteSectorsLoading: false,
            error: null,
          },
          this.getData
        );
      })
      .catch((err) =>
        this.setState({
          error: err,
          deleteSectorsLoading: false,
        })
      );
  };

  render() {
    const {
      data,
      loading,
      pagination,
      error,
      rematchSectorsLoading,
      deleteSectorsLoading,
      rematchInfo,
      defaultTaxonKey,
    } = this.state;
    const {
      match: {
        params: { catalogueKey },
      },
      user,
      rank,
    } = this.props;

    const params = qs.parse(_.get(this.props, "location.search"));

    return (
      <Layout
        selectedKeys={["catalogueSectors"]}
        openKeys={["assembly"]}
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
              description={<RematchResult rematchInfo={rematchInfo} />}
              type="success"
              style={{ marginBottom: "10px" }}
            />
          )}

          <Form layout="inline">
            <FormItem>
              <div style={{ marginBottom: "8px", marginRight: "8px" }}>
                <DatasetAutocomplete
                  defaultDatasetKey={_.get(params, "subjectDatasetKey") || null}
                  onResetSearch={this.onResetDataset}
                  onSelectDataset={this.onSelectDataset}
                  contributesTo={this.props.catalogueKey}
                  placeHolder="Source dataset"
                />
              </div>
            </FormItem>

            <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
              <Search
                placeholder="Taxon name"
                ref={this.nameRef}
                defaultValue={params.name}
                allowClear
                onSearch={(name) => {
                  this.setState({ name }, () => this.updateSearch({ name }));
                }}
                style={{ width: 200 }}
              />
            </FormItem>
            <FormItem
              label="Only broken"
              style={{ marginBottom: "8px", marginRight: "8px" }}
            >
              <Switch
                checked={params.broken === true || params.broken === "true"}
                onChange={(value) => this.updateSearch({ broken: value })}
              />
            </FormItem>
            <FormItem
              label="Without data"
              style={{ marginBottom: "8px", marginRight: "8px" }}
            >
              <Switch
                checked={params.withoutData === true || params.withoutData === "true"}
                onChange={(value) => this.updateSearch({ withoutData: value })}
              />
            </FormItem>
            <FormItem
              label="Created by me"
              style={{ marginBottom: "8px", marginRight: "8px" }}
            >
              <Switch
                checked={user && Number(params.modifiedBy) === user.key}
                onChange={(value) =>
                  this.updateSearch({ modifiedBy: value ? user.key : null })
                }
              />
            </FormItem>

            <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
              <Select
                placeholder="Subject rank"
                style={{ width: 160 }}
                value={params.rank}
                showSearch
                allowClear
                onChange={(value) => this.updateSearch({ rank: value })}
              >
                {rank.map((r) => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
              <Select
                placeholder="Sector mode"
                style={{ width: 160 }}
                value={params.mode}
                showSearch
                allowClear
                onChange={(value) => this.updateSearch({ mode: value })}
              >
                {["attach", "union", "merge"].map((r) => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
              <DatePicker
                placeholder="Last sync"
                defaultValue={params.lastSync ? moment(params.lastSync) : null}
                onChange={(date, dateString) =>
                  this.updateSearch({ lastSync: dateString })
                }
              />
            </FormItem>
          </Form>
          <Row style={{ marginTop: "10px" }}>
            <Col span={3} style={{ textAlign: "left", marginBottom: "8px" }}>
              <Button type="danger" onClick={this.resetAllFilters}>
                Reset all
              </Button>
            </Col>
            <Col span={21} style={{ textAlign: "right" }}>
              <SyncAllSectorsButton
                dataset={
                  params.subjectDatasetKey
                    ? { key: params.subjectDatasetKey }
                    : null
                }
                catalogueKey={catalogueKey}
                onError={(err) => this.setState({ error: err })}
                text={
                  params.subjectDatasetKey
                    ? `Sync all sectors from dataset ${params.subjectDatasetKey}`
                    : null
                }
              ></SyncAllSectorsButton>
              <Popconfirm
                placement="rightTop"
                title="Do you want to rematch all sectors?"
                onConfirm={() => this.rematchSectors(params.subjectDatasetKey)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="primary"
                  loading={rematchSectorsLoading}
                  style={{ marginBottom: "10px", marginRight: "10px" }}
                >
                  Rematch all sectors{" "}
                  {params.subjectDatasetKey
                    ? ` from dataset ${params.subjectDatasetKey}`
                    : ""}
                </Button>
              </Popconfirm>
              {params.subjectDatasetKey && (
                <Popconfirm
                  placement="rightTop"
                  title={`Do you want to delete all sectors from dataset ${params.subjectDatasetKey}?`}
                  onConfirm={() =>
                    this.deleteAllSectorsFromSource(params.subjectDatasetKey)
                  }
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="danger"
                    loading={deleteSectorsLoading}
                    style={{ marginBottom: "10px" }}
                  >
                    {`Delete all sectors from dataset ${params.subjectDatasetKey}`}
                  </Button>
                </Popconfirm>
              )}
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
              expandedRowRender={ !Auth.isAuthorised(user, ["editor"]) ? null :  record => 
           <React.Fragment> 
             <SectorForm sector={record} onError={err => this.setState({ error: err })}/>
           
             {/* <pre>{JSON.stringify(_.omit(record, ['dataset']),  null, 4)}</pre>  */}
             </React.Fragment>
            }
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
  catalogueKey,
});

export default withContext(mapContextToProps)(CatalogueSectors);
