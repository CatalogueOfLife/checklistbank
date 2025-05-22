import React from "react";
import axios from "axios";
import { SearchOutlined } from "@ant-design/icons";
import Auth from "../../../components/Auth";
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
  Modal,
  Typography,
  notification,
  Checkbox,
} from "antd";
import { withRouter } from "react-router-dom";
import SectorForm from "../Assembly/SectorForm";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";
import { getDatasetsBatch } from "../../../api/dataset";
import { getUsersBatch } from "../../../api/user";

import DataLoader from "dataloader";
import SectorTable from "./SectorTable";
import _ from "lodash";
import qs from "query-string";
import history from "../../../history";
import DatasetAutocomplete from "../Assembly/DatasetAutocomplete";
import moment from "moment";
import RematchResult from "./RematchResult";
import SyncAllSectorsButton from "../../Admin/SyncAllSectorsButton";

// import SectorForm from "../Assembly/SectorForm";
const { Text } = Typography;
const FormItem = Form.Item;
const { Option } = Select;
const { Search } = Input;
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
const userLoader = new DataLoader((ids) => getUsersBatch(ids));

const PAGE_SIZE = 100;

class CatalogueSectors extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      merge: false,
      nested: false,
      searchText: "",
      loading: false,
      rematchSectorsLoading: false,
      deleteSectorsLoading: false,
      rematchInfo: null,
      defaultTaxonKey: null,
      publishers: [],
      pagination: {
        pageSize: PAGE_SIZE,
        current: 1,
        showQuickJumper: true,
      },
      showSectorForm: false,
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
          pageSize: params.limit || PAGE_SIZE,
          current: Number(params.offset) / Number(params.limit) + 1,
        },
      },
      this.getData
    );
    this.getPublishers();
  }

  componentDidUpdate = (prevProps) => {
    const params = qs.parse(_.get(this.props, "location.search"));
    const prevParams = qs.parse(_.get(prevProps, "location.search"));
    if (
      _.get(prevProps, "location.search") !==
        _.get(this.props, "location.search") ||
      _.get(prevProps, "match.params.catalogueKey") !==
        _.get(this.props, "match.params.catalogueKey") ||
      _.get(params, "subjectDatasetKey") !==
        _.get(prevParams, "subjectDatasetKey")
    ) {
      this.setState(
        {
          pagination: {
            pageSize: params.limit || PAGE_SIZE,
            current:
              Number(params.offset) / Number(params.limit || PAGE_SIZE) + 1,
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
      datasetKey,
    } = this.props;
    const key = catalogueKey || datasetKey;
    this.setState({ loading: true });
    const params = {
      ...qs.parse(_.get(this.props, "location.search")),
      datasetKey: key,
    };
    axios(`${config.dataApi}dataset/${key}/sector?${qs.stringify(params)}`)
      .then(this.decorateWithDataset)
      .then((res) =>
        this.setState({
          loading: false,
          error: null,
          data: [..._.get(res, "data.result", [])],
          pagination: {
            ...this.state.pagination,
            total: _.get(res, "data.total"),
          },
        })
      )
      .catch((err) => {
        this.props.addError(err);
        this.setState({ loading: false, data: [] });
      });
  };

  getPublishers = async () => {
    const {
      match: {
        params: { catalogueKey },
      },
      datasetKey,
    } = this.props;
    const key = catalogueKey || datasetKey;
    try {
      const res = await axios(
        `${config.dataApi}dataset/${key}/sector/publisher`
      );
      this.setState({ publishers: res?.data?.result });
    } catch (error) {}
  };
  /*   decorateWithDataset = (res) => {
    if (!res.data.result) return res;
    return Promise.all(
      res.data.result.map((sector) =>
        datasetLoader
          .load(sector.subjectDatasetKey)
          .then((dataset) => (sector.dataset = dataset))
      )
    ).then(() => res);
  }; */

  decorateWithDataset = (res) => {
    if (!res.data.result) return res;
    return Promise.all([
      ...res.data.result.map((sector) =>
        datasetLoader
          .load(sector.subjectDatasetKey)
          .then((dataset) => (sector.dataset = dataset))
      ),
      ...res.data.result.map((sector) =>
        userLoader.load(sector.createdBy).then((user) => (sector.user = user))
      ),
    ]).then(() => res);
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

  onDeleteSector = (sector, partial = false) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    axios
      .delete(
        `${config.dataApi}dataset/${catalogueKey}/sector/${sector.id}?partial=${partial}`
      )
      .then(() => {
        notification.open({
          message: "Deletion triggered",
          description: `${partial ? "Partial" : "Full"} delete job for ${
            sector.id
          } placed on the sync queue`,
        });
        this.setState({
          data: this.state.data.filter((d) => d.id !== sector.id),
        });
      })
      .catch((err) => {
        this.props.addError(err);
      });
  };

  handleTableChange = (pagination) => {
    const pager = { ...this.state.pagination, ...pagination };
    // pager.current = pagination.current;

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
    if (this.nameRef?.current?.input?.state?.value) {
      this.nameRef.current.input.state.value = "";
    }

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
      .catch((err) => {
        this.props.addError(err);
        this.setState({
          rematchSectorsLoading: false,
          rematchInfo: null,
        });
      });
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
      .catch((err) => {
        this.props.addError(err);
        this.setState({
          deleteSectorsLoading: false,
        });
      });
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
      showSectorForm,
    } = this.state;
    const {
      match: {
        params: { catalogueKey },
      },
      datasetKey,
      dataset,
      user,
      rank,
    } = this.props;

    const isRelease = !!datasetKey && !catalogueKey;
    const params = qs.parse(_.get(this.props, "location.search"));

    return (
      <>
        <Modal
          title="Create sector"
          visible={showSectorForm}
          onOk={this.finishEditForm}
          onCancel={() => this.setState({ showSectorForm: false })}
          // style={{ top: 150, marginRight:20 }}
          destroyOnClose={true}
          maskClosable={false}
          footer={null}
        >
          <SectorForm
            onSubmit={() =>
              this.setState({ showSectorForm: false }, this.getData)
            }
            // sectorDatasetRanks={sectorDatasetRanks}
            sector={null}
            // onError={(err) => this.setState({ error: err })}
          />
        </Modal>
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

        <Row style={{ marginTop: "10px" }}>
        <FormItem>
            <div style={{ marginBottom: "8px", marginRight: "8px" }}>
              <DatasetAutocomplete
                defaultDatasetKey={_.get(params, "subjectDatasetKey") || null}
                onResetSearch={this.onResetDataset}
                onSelectDataset={this.onSelectDataset}
                contributesTo={this.props.catalogueKey}
                merge={this.state.merge}
                placeHolder="Source dataset"
              />{" "}
              <Checkbox
                checked={this.state.merge}
                onClick={(e) => this.setState({ merge: e.target.checked })}
              >
                Include merged sources
              </Checkbox>
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
              mode="multiple"
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
          {this?.state?.publishers?.length > 0 && (
            <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
              <Select
                placeholder="Publisher"
                style={{ width: 160 }}
                value={params.publisherKey}
                showSearch
                allowClear
                onChange={(value) => this.updateSearch({ publisherKey: value })}
              >
                {this.state.publishers.map((p) => (
                  <Option key={p?.id} value={p?.id}>
                    {p?.alias}
                  </Option>
                ))}
              </Select>
            </FormItem>
          )}          
        </Row>

        <Row style={{ marginTop: "10px" }}>
          <FormItem
            label="Nested"
            style={{ marginBottom: "8px", marginRight: "8px" }}
          >
            <Switch
              checked={params.nested === true || params.nested === "true"}
              onChange={(value) => this.updateSearch({ nested: value })}
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
            label="Wrong subject"
            style={{ marginBottom: "8px", marginRight: "8px" }}
          >
            <Switch
              checked={params.wrongSubject === true || params.wrongSubject === "true"}
              onChange={(value) => this.updateSearch({ wrongSubject: value })}
            />
          </FormItem>
          <FormItem
            label="Without data"
            style={{ marginBottom: "8px", marginRight: "8px" }}
          >
            <Switch
              checked={
                params.withoutData === true || params.withoutData === "true"
              }
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
        </Row>
        </Form>

        <Row style={{ marginTop: "10px" }}>
          <Col span={3} style={{ textAlign: "left", marginBottom: "8px" }}>
            <Button type="danger" onClick={this.resetAllFilters}>
              Reset all
            </Button>
          </Col>
          {!isRelease && Auth.canEditDataset({ key: catalogueKey }, user) && (
            <Col span={21} style={{ textAlign: "right" }}>
              <Button
                type="primary"
                style={{ marginRight: "10px" }}
                onClick={() => this.setState({ showSectorForm: true })}
              >
                Add sector
              </Button>
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
          )}
        </Row>
        {!error && (
          <SectorTable
            isRelease={isRelease}
            releasedFrom={dataset?.sourceKey}
            data={data}
            loading={loading}
            onSectorRematch={this.getData}
            onDeleteSector={this.onDeleteSector}
            pagination={pagination}
            handleTableChange={this.handleTableChange}
            expandable={{
              expandedRowRender: (record) => (
                <>
                  <Row>
                    <Col flex="auto"></Col>
                    <Col>
                      <Text style={{ marginRight: "10px", marginTop: "10px" }}>
                        Created by {record?.user?.username}
                      </Text>
                    </Col>
                  </Row>

                  <Row>
                    <Col flex="auto"></Col>
                    <Col style={{ width: "500px" }}>
                      <SectorForm
                        sector={record}
                        // onError={(err) => this.setState({ error: err })}
                      />
                    </Col>
                    <Col flex="auto"></Col>
                  </Row>
                </>
              ),
              rowExpandable: () => !isRelease, //() => Auth.canEditDataset({key: catalogueKey}, user)
            }}
          ></SectorTable>
        )}
      </>
    );
  }
}

const mapContextToProps = ({
  user,
  rank,
  catalogueKey,
  dataset,
  addError,
}) => ({
  addError,
  user,
  rank,
  catalogueKey,
  dataset,
});

export default withContext(mapContextToProps)(withRouter(CatalogueSectors));
