import { useEffect, useState, useRef } from "react";
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
  App,
  Checkbox,
} from "antd";
import withRouter from "../../../withRouter";
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
import moment from "dayjs";
import RematchResult from "./RematchResult";
import SyncAllSectorsButton from "../../Admin/SyncAllSectorsButton";

// import SectorForm from "../Assembly/SectorForm";
const { Text } = Typography;
const FormItem = Form.Item;
const { Search } = Input;
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
const userLoader = new DataLoader((ids) => getUsersBatch(ids));

const PAGE_SIZE = 100;

const ProjectSectors = ({
  location,
  match,
  datasetKey,
  dataset,
  user,
  rank,
  projectKey: contextProjectKey,
  addError,
}) => {
  const { notification } = App.useApp();
  const [data, setData] = useState([]);
  const [merge, setMerge] = useState(false);
  const [nested, setNested] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [rematchSectorsLoading, setRematchSectorsLoading] = useState(false);
  const [deleteSectorsLoading, setDeleteSectorsLoading] = useState(false);
  const [rematchInfo, setRematchInfo] = useState(null);
  const [defaultTaxonKey, setDefaultTaxonKey] = useState(null);
  const [publishers, setPublishers] = useState([]);
  const [pagination, setPagination] = useState({
    pageSize: PAGE_SIZE,
    current: 1,
    showQuickJumper: true,
  });
  const [showSectorForm, setShowSectorForm] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState({});
  const [currentDataSourceLength, setCurrentDataSourceLength] = useState(null);

  const nameRef = useRef(null);

  const projectKey = _.get(match, "params.projectKey");

  const decorateWithDataset = (res) => {
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

  const getData = () => {
    const key = projectKey || datasetKey;
    setLoading(true);
    const queryParams = {
      ...qs.parse(_.get(location, "search")),
      datasetKey: key,
    };
    axios(`${config.dataApi}dataset/${key}/sector?${qs.stringify(queryParams)}`)
      .then(decorateWithDataset)
      .then((res) => {
        setPagination((prev) => ({
          ...prev,
          total: _.get(res, "data.total"),
        }));
        setLoading(false);
        setError(null);
        setData([..._.get(res, "data.result", [])]);
      })
      .catch((err) => {
        addError(err);
        setLoading(false);
        setData([]);
      });
  };

  const getPublishers = async () => {
    const key = projectKey || datasetKey;
    try {
      const res = await axios(
        `${config.dataApi}dataset/${key}/sector/publisher`
      );
      setPublishers(res?.data?.result);
    } catch (error) {}
  };

  useEffect(() => {
    let initParams = qs.parse(_.get(location, "search"));
    if (_.isEmpty(initParams)) {
      initParams = { limit: PAGE_SIZE, offset: 0 };
      history.push({
        pathname: _.get(location, "pathname"),
        search: `?limit=${PAGE_SIZE}&offset=0`,
      });
    }
    initParams = { limit: PAGE_SIZE, offset: 0, ...initParams };
    setParams(initParams);
    setPagination({
      pageSize: initParams.limit || PAGE_SIZE,
      current: Number(initParams.offset) / Number(initParams.limit) + 1,
    });
    // getData is called via the location.search effect below on first render
    getPublishers();
  }, []);

  const locationSearch = _.get(location, "search");
  const matchProjectKey = _.get(match, "params.projectKey");
  const locationSubjectDatasetKey = _.get(qs.parse(locationSearch), "subjectDatasetKey");

  useEffect(() => {
    const currentParams = qs.parse(locationSearch);
    setPagination((prev) => ({
      ...prev,
      pageSize: currentParams.limit || PAGE_SIZE,
      current:
        Number(currentParams.offset) /
          Number(currentParams.limit || PAGE_SIZE) +
        1,
    }));
    getData();
  }, [locationSearch, matchProjectKey, locationSubjectDatasetKey]);

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={(node) => {
            nameRef.current = node;
          }}
          placeholder={`Search ${dataIndex.split(".")[0]}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm)}
          style={{ width: 188, marginBottom: 8, display: "block" }}
        />
        <Button
          type="primary"
          onClick={() => handleSearch(selectedKeys, confirm)}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
        </Button>
        <Button
          onClick={() => handleReset(clearFilters)}
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
        setTimeout(() => nameRef.current && nameRef.current.select());
      }
    },
  });

  const handleSearch = (selectedKeys, confirm) => {
    confirm();
    setSearchText(selectedKeys[0]);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const onChange = (pagination, filters, sorter, extra) => {
    setCurrentDataSourceLength(extra.currentDataSource.length);
  };

  const onDeleteSector = (sector, partial = false) => {
    axios
      .delete(
        `${config.dataApi}dataset/${projectKey}/sector/${sector.id}?partial=${partial}`
      )
      .then(() => {
        notification.open({
          message: "Deletion triggered",
          description: `${partial ? "Partial" : "Full"} delete job for ${
            sector.id
          } placed on the sync queue`,
        });
        setData((prev) => prev.filter((d) => d.id !== sector.id));
      })
      .catch((err) => {
        addError(err);
      });
  };

  const handleTableChange = (newPagination) => {
    const pager = { ...pagination, ...newPagination };

    const newParams = {
      ...qs.parse(_.get(location, "search")),
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
    };

    history.push({
      pathname: _.get(location, "pathname"),
      search: qs.stringify(newParams),
    });
  };

  const updateSearch = (newParams) => {
    let updatedParams = {
      ...qs.parse(_.get(location, "search")),
      ...newParams,
      offset: 0,
    };
    Object.keys(newParams).forEach((param) => {
      if (!newParams[param]) {
        delete updatedParams[param];
      }
    });
    history.push({
      pathname: _.get(location, "pathname"),
      search: qs.stringify(updatedParams),
    });
  };

  const onSelectDataset = (dataset) => {
    updateSearch({ subjectDatasetKey: dataset.key });
  };

  const onResetDataset = () => {
    let newParams = qs.parse(_.get(location, "search"));
    delete newParams.subjectDatasetKey;
    history.push({
      pathname: _.get(location, "pathname"),
      search: qs.stringify(newParams),
    });
  };

  const resetAllFilters = () => {
    if (nameRef?.current?.input?.state?.value) {
      nameRef.current.input.state.value = "";
    }

    history.push({
      pathname: _.get(location, "pathname"),
      search: `?limit=${PAGE_SIZE}&offset=0`,
    });
  };

  const rematchSectors = (subjectDatasetKey) => {
    setRematchSectorsLoading(true);
    const body = subjectDatasetKey ? { subjectDatasetKey } : {};
    axios
      .post(`${config.dataApi}dataset/${projectKey}/sector/rematch`, body)
      .then((res) => {
        setRematchSectorsLoading(false);
        setRematchInfo({ sectors: res.data });
        setError(null);
      })
      .catch((err) => {
        addError(err);
        setRematchSectorsLoading(false);
        setRematchInfo(null);
      });
  };

  const deleteAllSectorsFromSource = (subjectDatasetKey) => {
    setDeleteSectorsLoading(true);
    axios
      .delete(
        `${config.dataApi}dataset/${projectKey}/sector?datasetKey=${subjectDatasetKey}`
      )
      .then((res) => {
        setDeleteSectorsLoading(false);
        setError(null);
        getData();
      })
      .catch((err) => {
        addError(err);
        setDeleteSectorsLoading(false);
      });
  };

  const isRelease = !!datasetKey && !projectKey;
  const locationParams = qs.parse(_.get(location, "search"));

  return (
    <>
      <Modal
        title="Create sector"
        open={showSectorForm}
        onOk={() => {}} // finishEditForm not needed here
        onCancel={() => setShowSectorForm(false)}
        // style={{ top: 150, marginRight:20 }}
        destroyOnHidden={true}
        mask={{ closable: false }}
        footer={null}
      >
        <SectorForm
          onSubmit={() => {
            setShowSectorForm(false);
            getData();
          }}
          // sectorDatasetRanks={sectorDatasetRanks}
          sector={null}
          // onError={(err) => setError(err)}
        />
      </Modal>
      {error && (
        <Alert
          closable={{ onClose: () => setError(null) }}
          title={error.message}
          type="error"
        />
      )}
      {rematchInfo && (
        <Alert
          closable={{ onClose: () => setRematchInfo(null) }}
          title="Rematch succeded"
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
              defaultDatasetKey={_.get(locationParams, "subjectDatasetKey") || null}
              onResetSearch={onResetDataset}
              onSelectDataset={onSelectDataset}
              contributesTo={contextProjectKey}
              merge={merge}
              placeHolder="Source dataset"
            />{" "}
            <Checkbox
              checked={merge}
              onClick={(e) => setMerge(e.target.checked)}
            >
              Include merged sources
            </Checkbox>
          </div>
        </FormItem>

        <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
          <Search
            placeholder="Taxon name"
            ref={nameRef}
            defaultValue={locationParams.name}
            allowClear
            onSearch={(name) => {
              updateSearch({ name });
            }}
            style={{ width: 200 }}
          />
        </FormItem>

        <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
          <Select
            placeholder="Subject rank"
            style={{ width: 160 }}
            value={locationParams.rank}
            showSearch
            allowClear
            onChange={(value) => updateSearch({ rank: value })}
            options={rank.map((r) => ({ value: r, label: r }))}
          />
        </FormItem>
        <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
          <Select
            placeholder="Sector mode"
            style={{ width: 160 }}
            value={locationParams.mode}
            mode="multiple"
            showSearch
            allowClear
            onChange={(value) => updateSearch({ mode: value })}
            options={["attach", "union", "merge", "hierarchy"].map((r) => ({ value: r, label: r }))}
          />
        </FormItem>
        <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
          <DatePicker
            placeholder="Last sync"
            defaultValue={locationParams.lastSync ? moment(locationParams.lastSync) : null}
            onChange={(date, dateString) =>
              updateSearch({ lastSync: dateString })
            }
          />
        </FormItem>
        {publishers?.length > 0 && (
          <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
            <Select
              placeholder="Publisher"
              style={{ width: 160 }}
              value={locationParams.publisherKey}
              showSearch
              allowClear
              onChange={(value) => updateSearch({ publisherKey: value })}
              options={publishers.map((p) => ({ value: p?.id, label: p?.alias }))}
            />
          </FormItem>
        )}
      </Row>

      <Row style={{ marginTop: "10px" }}>
        <FormItem
          label="Nested"
          style={{ marginBottom: "8px", marginRight: "8px" }}
        >
          <Switch
            checked={locationParams.nested === true || locationParams.nested === "true"}
            onChange={(value) => updateSearch({ nested: value })}
          />
        </FormItem>
        <FormItem
          label="Only broken"
          style={{ marginBottom: "8px", marginRight: "8px" }}
        >
          <Switch
            checked={locationParams.broken === true || locationParams.broken === "true"}
            onChange={(value) => updateSearch({ broken: value })}
          />
        </FormItem>
        <FormItem
          label="Wrong subject"
          style={{ marginBottom: "8px", marginRight: "8px" }}
        >
          <Switch
            checked={locationParams.wrongSubject === true || locationParams.wrongSubject === "true"}
            onChange={(value) => updateSearch({ wrongSubject: value })}
          />
        </FormItem>
        <FormItem
          label="Without data"
          style={{ marginBottom: "8px", marginRight: "8px" }}
        >
          <Switch
            checked={
              locationParams.withoutData === true || locationParams.withoutData === "true"
            }
            onChange={(value) => updateSearch({ withoutData: value })}
          />
        </FormItem>
        <FormItem
          label="Created by me"
          style={{ marginBottom: "8px", marginRight: "8px" }}
        >
          <Switch
            checked={user && Number(locationParams.modifiedBy) === user.key}
            onChange={(value) =>
              updateSearch({ modifiedBy: value ? user.key : null })
            }
          />
        </FormItem>
      </Row>
      </Form>

      <Row style={{ marginTop: "10px" }}>
        <Col span={3} style={{ textAlign: "left", marginBottom: "8px" }}>
          <Button type="primary" danger onClick={resetAllFilters}>
            Reset all
          </Button>
        </Col>
        {!isRelease && Auth.canEditDataset({ key: projectKey }, user) && (
          <Col span={21} style={{ textAlign: "right" }}>
            <Button
              type="primary"
              style={{ marginRight: "10px" }}
              onClick={() => setShowSectorForm(true)}
            >
              Add sector
            </Button>
            <SyncAllSectorsButton
              dataset={
                locationParams.subjectDatasetKey
                  ? { key: locationParams.subjectDatasetKey }
                  : null
              }
              projectKey={projectKey}
              onError={(err) => setError(err)}
              text={
                locationParams.subjectDatasetKey
                  ? `Sync all sectors from dataset ${locationParams.subjectDatasetKey}`
                  : null
              }
            ></SyncAllSectorsButton>
            <Popconfirm
              placement="rightTop"
              title="Do you want to rematch all sectors?"
              onConfirm={() => rematchSectors(locationParams.subjectDatasetKey)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={rematchSectorsLoading}
                style={{ marginBottom: "10px", marginRight: "10px" }}
              >
                Rematch all sectors{" "}
                {locationParams.subjectDatasetKey
                  ? ` from dataset ${locationParams.subjectDatasetKey}`
                  : ""}
              </Button>
            </Popconfirm>
            {locationParams.subjectDatasetKey && (
              <Popconfirm
                placement="rightTop"
                title={`Do you want to delete all sectors from dataset ${locationParams.subjectDatasetKey}?`}
                onConfirm={() =>
                  deleteAllSectorsFromSource(locationParams.subjectDatasetKey)
                }
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="primary"
                  danger
                  loading={deleteSectorsLoading}
                  style={{ marginBottom: "10px" }}
                >
                  {`Delete all sectors from dataset ${locationParams.subjectDatasetKey}`}
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
          onSectorRematch={getData}
          onDeleteSector={onDeleteSector}
          pagination={pagination}
          handleTableChange={handleTableChange}
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
                      // onError={(err) => setError(err)}
                    />
                  </Col>
                  <Col flex="auto"></Col>
                </Row>
              </>
            ),
            rowExpandable: () => !isRelease, //() => Auth.canEditDataset({key: projectKey}, user)
          }}
        ></SectorTable>
      )}
    </>
  );
};

const mapContextToProps = ({
  user,
  rank,
  projectKey,
  dataset,
  addError,
}) => ({
  addError,
  user,
  rank,
  projectKey,
  dataset,
});

export default withContext(mapContextToProps)(withRouter(ProjectSectors));
