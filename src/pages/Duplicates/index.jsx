import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

import {
  SearchOutlined,
  UpOutlined,
  DownOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  Table,
  Alert,
  Select,
  Row,
  Col,
  Button,
  Switch,
  Card,
  AutoComplete,
  Input,
  Radio,
  Pagination,
  Tooltip,
  App,
  Form,
  Checkbox,
} from "antd";
import config from "../../config";
import qs from "query-string";
import history from "../../history";
import _ from "lodash";
import withContext from "../../components/hoc/withContext";
import { Resizable } from "react-resizable";
import ErrorMsg from "../../components/ErrorMsg";
import DatasetAutocomplete from "../project/Assembly/DatasetAutocomplete";
import queryPresets from "./queryPresets";
import columnDefaults from "./columnDefaults";
import Auth from "../../components/Auth";
import { CanEditDataset } from "../../components/Auth/hasAccess";

// import { getSectorsBatch } from "../../api/sector";
import { getDatasetsBatch } from "../../api/dataset";
import DataLoader from "dataloader";
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));

const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const ResizeableTitle = (props) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable width={width} height={0} onResize={onResize}>
      <th {...restProps} />
    </Resizable>
  );
};

const components = {
  header: {
    cell: ResizeableTitle,
  },
};

const DuplicateSearchPage = (props) => {
  const {
    rank,
    taxonomicstatus,
    user,
    assembly,
    projectKey,
    datasetKey,
    dataset,
    location,
  } = props;
  const { notification } = App.useApp();

  const limit = localStorage.getItem("col_plus_duplicates_limit");

  const [data, setData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [filteredSectors, setFilteredSectors] = useState([]);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [columns, setColumns] = useState(
    columnDefaults(projectKey, () => getDataRef.current()).binomial
  );
  const [params, setParams] = useState({
    limit: limit ? Number(limit) : 50,
    offset: 0,
  });
  const [page, setPage] = useState(1);
  const [totalFaked, setTotalFaked] = useState(0);
  const [loading, setLoading] = useState(false);
  const [postingDecisions, setPostingDecisions] = useState(false);
  const [decision, setDecision] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [allButOldestInGroupLoading, setAllButOldestInGroupLoading] =
    useState(false);
  const [synonymsSelectLoading, setSynonymsSelectLoading] = useState(false);
  const [newestInGroupLoading, setNewestInGroupLoading] = useState(false);
  const [showAtomizedNames, setShowAtomizedNames] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(undefined);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Keep a stable ref to getData so columnDefaults callbacks are always current
  const getDataRef = useRef(null);
  // Keep a ref to the latest params to avoid stale closures in getData
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const showSourceFeatures =
    assembly || ["release", "xrelease", "project"].includes(dataset?.origin);

  const getSourceColumn = () => {
    return {
      title: "source",
      dataIndex: ["dataset", "alias"],
      width: 60,
      className: "workbench-td",
      render: (text, record) => {
        return (
          <NavLink
            key={_.get(record, "id")}
            to={{
              pathname: `/dataset/${_.get(
                record,
                "sourceDatasetKey"
              )}/taxon/${_.get(record, "sourceId")}`,
            }}
            end
          >
            {_.get(record, "dataset.alias") || _.get(record, "dataset.title")}
          </NavLink>
        );
      },
    };
  };

  const decorateWithSectorsAndDataset = (res) => {
    if (!res.usages) return res;
    return Promise.all(
      res.usages
        .filter((tx) => _.get(tx, "sourceDatasetKey"))
        .map((tx) => {
          if (tx?.sourceId && tx?.usage) {
            tx.usage.sourceId = tx?.sourceId;
          }
          if (tx?.sourceDatasetKey && tx?.usage) {
            tx.usage.sourceDatasetKey = tx?.sourceDatasetKey;
          }
          return datasetLoader
            .load(tx.sourceDatasetKey)
            .then((dataset) => (tx.usage.dataset = dataset));
        })
    ).then(() => res);
  };

  const getDecisions = (data) => {
    const promises = data.usages.map((d) =>
      d.decision
        ? axios(
            `${config.dataApi}dataset/${projectKey}/decision/${_.get(
              d,
              "decision.id"
            )}`
          ).then((decision) => {
            d.usage.decision = decision.data;
          })
        : Promise.resolve()
    );
    return Promise.all(promises).then(() => data);
  };

  const getData = useCallback(
    async (currentParams) => {
      const prmsToUse = currentParams !== undefined ? currentParams : paramsRef.current;
      const pathname = location?.pathname;
      setLoading(true);
      let prms = {
        ...prmsToUse,
        limit: Number(prmsToUse.limit),
      };
      if (projectKey) {
        prms.projectKey = projectKey;
      } else {
        delete prms.withDecision;
      }
      history.push({
        pathname: pathname,
        search: `?${qs.stringify({ ...prms, limit: Number(prmsToUse.limit) })}`,
      });
      try {
        const res = await axios(
          `${config.dataApi}dataset/${datasetKey}/duplicate?${qs.stringify(prms)}`
        );

        const netxtRes = res.data?.result
          ? await Promise.all(res.data.result.map((e) => getDecisions(e)))
          : [];
        const total = res.data?.total || 0;
        const dataResult = showSourceFeatures
          ? await Promise.all(
              netxtRes.map((e) => decorateWithSectorsAndDataset(e))
            )
          : netxtRes;

        const dataArr = dataResult;
        const clms = prmsToUse.category
          ? columnDefaults(projectKey, () => getDataRef.current())[prmsToUse.category]
          : columnDefaults(projectKey, () => getDataRef.current()).binomial;

        setLoading(false);
        setData(
          dataArr
            .map((e, i) =>
              e.usages.map((u, id) => ({
                ...u.usage,
                dupID: i,
                dubKey: e.key,
                classification: u.classification,
                isFirstInGroup: id === 0,
              }))
            )
            .flat()
        );
        setRawData(dataArr);
        setColumns(assembly ? [getSourceColumn(), ...clms] : clms);
        setDuplicateCount(dataArr.length);
        setTotalFaked(total);
        setError(null);
      } catch (err) {
        setLoading(false);
        setError(err);
        setData([]);
        setDuplicateCount(0);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectKey, datasetKey, assembly, showSourceFeatures, location?.pathname]
  );

  // Keep the ref in sync so column callbacks always call the latest getData
  getDataRef.current = getData;

  const getSectors = useCallback(() => {
    if (projectKey) {
      axios(
        `${config.dataApi}dataset/${projectKey}/sector?subjectDatasetKey=${datasetKey}`
      )
        .then((res) => {
          setSectors(res.data);
          setFilteredSectors(
            res.data.map((o) => ({
              value: o.key,
              text: _.get(o, "subject.name"),
            }))
          );
        })
        .catch(() => {
          setSectors([]);
        });
    }
  }, [projectKey, datasetKey]);

  const initOrUpdate = useCallback(() => {
    let urlParams = qs.parse(_.get(props, "location.search"));

    getSectors();
    let booleans = {};
    [
      "withDecision",
      "acceptedDifferent",
      "authorshipDifferent",
      "rankDifferent",
      "codeDifferent",
      "sourceOnly",
    ].forEach((n) => {
      if (urlParams[n] === "true") {
        booleans[n] = true;
      }
      if (urlParams[n] === "false") {
        booleans[n] = false;
      }
    });

    if (urlParams._colCheck) {
      const preset = queryPresets.filter(
        (qp) => qp.id === urlParams._colCheck
      )[0];
      const option = { params: preset.params };
      onPresetSelectInternal(urlParams._colCheck, option, urlParams);
    } else {
      const newParams = {
        limit: limit ? Number(limit) : 50,
        offset: 0,
        ...urlParams,
        ...booleans,
      };
      setParams(newParams);
      paramsRef.current = newParams;
      getData(newParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.dataset?.key, projectKey]);

  // Internal preset select that can be called without circular dependency
  const onPresetSelectInternal = (value, option, urlParams_) => {
    if (!value) {
      const newParams = { limit: paramsRef.current.limit, offset: 0 };
      setParams(newParams);
      paramsRef.current = newParams;
      setSelectedPreset(undefined);
      setTotalFaked(0);
      setSelectedRowKeys([]);
      getData(newParams);
    } else {
      const { params: presetParams } = option;
      const urlP = urlParams_ || qs.parse(_.get(props, "location.search"));
      const newParams = urlP?.sourceDatasetKey
        ? {
            ...presetParams,
            offset: 0,
            limit: paramsRef.current.limit,
            sourceDatasetKey: urlP?.sourceDatasetKey,
            sourceOnly: !!urlP?.sourceOnly,
          }
        : { ...presetParams, offset: 0, limit: paramsRef.current.limit };
      setParams(newParams);
      paramsRef.current = newParams;
      setSelectedPreset(value);
      setTotalFaked(0);
      setDecision(null);
      setSelectedRowKeys([]);
      if (urlP?.sourceDatasetKey) {
        setAdvancedMode(true);
      }
      getData(newParams);
    }
  };

  useEffect(() => {
    initOrUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.dataset?.key, projectKey]);

  const handleTableChange = (pagination, filters) => {
    const newParams = _.merge({ ...paramsRef.current }, { ...filters });
    setParams(newParams);
    paramsRef.current = newParams;
    getData(newParams);
  };

  const updateSearch = (updates) => {
    const newParams = _.pickBy(
      { ...paramsRef.current, ...updates, offset: 0 },
      (val) => val === false || !!val
    );
    setParams(newParams);
    paramsRef.current = newParams;
    setTotalFaked(0);
    setSelectedPreset(undefined);
    getData(newParams);
  };

  const resetSearch = () => {
    const newParams = { limit: paramsRef.current.limit, offset: 0 };
    setParams(newParams);
    paramsRef.current = newParams;
    setSelectedPreset(undefined);
    setTotalFaked(0);
    setSelectedRowKeys([]);
    getData(newParams);
  };

  const onPresetSelect = (value, option) => {
    onPresetSelectInternal(value, option, undefined);
  };

  const onSectorSearch = (val) => {
    setFilteredSectors(
      sectors
        .filter((s) => s.subject.name.toLowerCase().startsWith(val))
        .map((o) => ({ value: o.key, text: _.get(o, "subject.name") }))
    );
  };

  const onSelectChange = (keys) => {
    setSelectedRowKeys(keys);
  };

  const onDecisionChange = (dec) => {
    setDecision(dec);
  };

  const applyDecision = async () => {
    const currentData = data;
    const currentSelectedRowKeys = selectedRowKeys;
    const currentDecision = decision;
    setPostingDecisions(true);
    const promises = currentData
      .filter((d) => currentSelectedRowKeys.includes(_.get(d, "id")))
      .map(async (d) => {
        const method = d.decision ? "put" : "post";
        const mode = ["block", "ignore", "reviewed"].includes(currentDecision)
          ? currentDecision
          : "update";

        const parent = ["accepted", "provisionally accepted"].includes(
          d?.usage?.status
        )
          ? d.classification && d.classification.length > 1
            ? d.classification[d.classification.length - 2].name
            : ""
          : _.get(d, "usage.accepted.name.scientificName", "");
        const body = {
          datasetKey: projectKey,
          subjectDatasetKey: assembly ? d?.sourceDatasetKey : datasetKey,
          subject: {
            id: d?.sourceId || d?.id,
            parent: parent,
            name: _.get(d, "name.scientificName"),
            authorship: _.get(d, "name.authorship"),
            rank: _.get(d, "name.rank"),
            status: _.get(d, "status"),
          },
          mode: mode,
          status: mode !== "update" ? _.get(d, "status") : currentDecision,
        };

        return axios[method](
          `${config.dataApi}dataset/${projectKey}/decision${
            method === "put" ? `/${d.decision.id}` : ""
          }`,
          body
        )
          .then((decisionId) =>
            axios(
              `${config.dataApi}dataset/${projectKey}/decision/${
                method === "post" ? decisionId.data : d.decision.id
              }`
            )
          )
          .then((res) => {
            d.decision = res.data;
            if (currentSelectedRowKeys.length <= 10) {
              const statusMsg = `Status changed to ${currentDecision} for ${_.get(
                d,
                "name.scientificName"
              )}`;
              const decisionMsg = `${_.get(d, "name.scientificName")} was ${
                currentDecision === "block"
                  ? "blocked from the assembly"
                  : ""
              }${
                currentDecision === "ignore"
                  ? "ignored (Taxon blocked, but children kept and attached to parent)"
                  : ""
              }${currentDecision === "reviewed" ? "marked as reviewed" : ""}`;

              notification.open({
                message: `Decision ${
                  method === "post" ? "applied" : "changed"
                }`,
                description: ["block", "ignore", "reviewed"].includes(
                  currentDecision
                )
                  ? decisionMsg
                  : statusMsg,
              });
            }
          })
          .catch((err) => {
            notification.error({
              message: "Error",
              description: _.get(err, "response.data.message") || err.message,
            });
          });
      });

    return Promise.all(promises)
      .then(() => {
        notification.open({
          message: `${promises.length > 1 ? "Decisions" : "Decision"} applied`,
          description: `${promises.length} ${
            promises.length > 1 ? "names" : "name"
          } affected`,
        });
        setData((prev) => [...prev]);
        setSelectedRowKeys([]);
        setDecision(null);
        setPostingDecisions(false);
      })
      .catch(() => {
        setData((prev) => [...prev]);
        setSelectedRowKeys([]);
        setDecision(null);
        setPostingDecisions(false);
      });
  };

  const toggleAdvanced = () => {
    setAdvancedMode((prev) => !prev);
  };

  const handleResize = (index) => (e, { size }) => {
    setColumns((prevColumns) => {
      const nextColumns = [...prevColumns];
      nextColumns[index] = {
        ...nextColumns[index],
        width: size.width,
      };
      return nextColumns;
    });
  };

  const columnFilter = (c) => {
    if (params.status && params.status.indexOf("synonym") === -1) {
      return c.key !== "accepted";
    } else {
      return true;
    }
  };

  const getLatestYear = (name) => {
    const basionymAuthorshipYear = Number(
      _.get(name, "basionymAuthorship.year", -1000)
    );
    const combinationAuthorshipYear = Number(
      _.get(name, "combinationAuthorship.year", -1000)
    );
    const publishedInYear = Number(_.get(name, "publishedInYear", -1000));
    return Math.max(
      basionymAuthorshipYear,
      combinationAuthorshipYear,
      publishedInYear
    );
  };

  const selectNewestInGroup = () => {
    setNewestInGroupLoading(true);
    let keys = [];
    rawData.forEach((group) => {
      const max = Math.max(
        ...group.usages.map((r) => getLatestYear(r.usage.name))
      );
      keys = [
        ...keys,
        ...group.usages
          .filter((r) => getLatestYear(r.usage.name) === max)
          .map((i) => i.usage.id),
      ];
    });
    setSelectedRowKeys(keys);
    setNewestInGroupLoading(false);
  };

  const selectAllInGroupExceptOldest = () => {
    setAllButOldestInGroupLoading(true);
    let keys = [];
    rawData.forEach((group) => {
      const min = Math.min(
        ...group.usages.map((r) => r.usage.name.publishedInYear)
      );
      keys = [
        ...keys,
        ...group.usages
          .filter((r) => Number(r.usage.name.publishedInYear) > min)
          .map((i) => i.usage.id),
      ];
    });
    setSelectedRowKeys(keys);
    setAllButOldestInGroupLoading(false);
  };

  const selectAllSynonymsInGroup = () => {
    setSynonymsSelectLoading(true);
    let keys = [];
    rawData.forEach((group) => {
      keys = [
        ...keys,
        ...group.usages
          .filter((r) => r.usage.status === "synonym")
          .map((i) => i.usage.id),
      ];
    });
    setSelectedRowKeys(keys);
    setSynonymsSelectLoading(false);
  };

  const exportDuplicates = () => {
    axios(
      `${config.dataApi}dataset/${datasetKey}/duplicate?${qs.stringify({
        ...params,
        projectKey,
        limit: Number(params.limit) + 1,
      })}`
    );
  };

  let queryParams = qs.parse(_.get(props, "location.search"));
  const hasSelected = selectedRowKeys && selectedRowKeys.length > 0 && decision;

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    columnWidth: "30px",
    getCheckboxProps: (record) => ({
      disabled: assembly && !record?.sourceId,
    }),
  };
  const { offset, ...downloadParams } = params;

  return (
    <div
      style={{
        background: "#fff",
        padding: 24,
        minHeight: 280,
        margin: "16px 0",
      }}
    >
      <Row>
        {error && (
          <Alert
            style={{ marginBottom: "10px" }}
            description={<ErrorMsg error={error} />}
            type="error"
          />
        )}
      </Row>

      <Row gutter={16}>
        <Col
          span={
            Auth.canEditDataset({ key: projectKey }, user) && projectKey
              ? 18
              : 24
          }
        >
          <div style={{ marginBottom: "10px" }}>
            <Select
              placeholder="COL Check"
              value={selectedPreset}
              style={{ width: 500, marginRight: 10 }}
              onChange={onPresetSelect}
              optionFilterProp="label"
              showSearch
              allowClear
              options={queryPresets.map((p) => ({
                value: p.id,
                label: p.text,
                params: p.params,
              }))}
            />
            <a style={{ marginLeft: 8, fontSize: 12 }} onClick={toggleAdvanced}>
              Advanced {advancedMode ? <UpOutlined /> : <DownOutlined />}
            </a>
          </div>
          {advancedMode && (
            <Form layout="inline">
              {showSourceFeatures && (
                <>
                  {" "}
                  <DatasetAutocomplete
                    placeHolder="Source dataset"
                    style={{
                      marginBottom: "10px",
                      marginRight: "10px",
                      width: "75%",
                    }}
                    onSelectDataset={(value) =>
                      updateSearch({ sourceDatasetKey: value.key })
                    }
                    onResetSearch={() =>
                      updateSearch({ sourceDatasetKey: null })
                    }
                    defaultDatasetKey={
                      _.get(params, "sourceDatasetKey") || null
                    }
                  />
                  <Checkbox
                    checked={params?.sourceOnly || false}
                    onChange={(e) =>
                      updateSearch({ sourceOnly: e?.target?.checked })
                    }
                  >
                    From this source only
                  </Checkbox>
                </>
              )}
              <Input.Search
                placeholder="Search names"
                defaultValue={queryParams?.q || null}
                style={{ marginBottom: "10px" }}
                onSearch={(value) => updateSearch({ q: value })}
                onReset={() => updateSearch({ q: null })}
                allowClear
              />
              <Select
                placeholder="Name category"
                value={params.category}
                style={{
                  width: 200,
                  marginRight: 10,
                  marginBottom: "10px",
                }}
                onChange={(value) => updateSearch({ category: value })}
                showSearch
                allowClear
                options={[
                  { value: "binomial", label: "binomial" },
                  { value: "trinomial", label: "trinomial" },
                  { value: "uninomial", label: "uninomial" },
                ]}
              />

              <Select
                placeholder="Min size"
                value={params.minSize}
                style={{
                  width: 200,
                  marginRight: 10,
                  marginBottom: "10px",
                }}
                onChange={(value) => updateSearch({ minSize: value })}
                showSearch
                allowClear
                options={[2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
                  value: i,
                  label: i,
                }))}
              />

              <FormItem label="Fuzzy matching">
                <Switch
                  checked={params.mode === "FUZZY"}
                  onChange={(value) =>
                    updateSearch({ mode: value ? "FUZZY" : "STRICT" })
                  }
                />
              </FormItem>
              <Select
                placeholder="Status"
                value={params.status}
                style={{
                  width: 200,
                  marginRight: 10,
                  marginBottom: "10px",
                }}
                mode="multiple"
                showSearch
                allowClear
                onChange={(value) => updateSearch({ status: value })}
                options={taxonomicstatus.map((s) => ({
                  value: s,
                  label: _.startCase(s),
                }))}
              />
              <Select
                placeholder="Rank"
                value={params.rank}
                style={{
                  width: 200,
                  marginRight: 10,
                  marginBottom: "10px",
                }}
                mode="multiple"
                showSearch
                allowClear
                onChange={(value) => updateSearch({ rank: value })}
                options={rank.map((r) => ({ value: r, label: r }))}
              />

              <AutoComplete
                onSelect={(value) => updateSearch({ sectorKey: value })}
                dataSource={filteredSectors}
                onSearch={onSectorSearch}
                placeholder={
                  sectors.length === 0 ? "No sectors" : "Find sector"
                }
                disabled={sectors.length === 0}
                style={{
                  width: 200,
                  marginRight: 10,
                  marginBottom: "10px",
                }}
              >
                <Input suffix={<SearchOutlined />} />
              </AutoComplete>
              <br />
              <FormItem label="Authorship different">
                <RadioGroup
                  onChange={(evt) => {
                    if (
                      evt.target.value === true ||
                      evt.target.value === false
                    ) {
                      updateSearch({
                        authorshipDifferent: evt.target.value,
                      });
                    } else {
                      const newParams = _.omit(paramsRef.current, [
                        "authorshipDifferent",
                      ]);
                      setParams(newParams);
                      paramsRef.current = newParams;
                      getData(newParams);
                    }
                  }}
                  value={params.authorshipDifferent}
                >
                  <Radio value={true}>Yes</Radio>
                  <Radio value={false}>No</Radio>
                  <Radio value={undefined}>Ignore</Radio>
                </RadioGroup>
              </FormItem>
              <FormItem label="Accepted different">
                <RadioGroup
                  onChange={(evt) => {
                    if (typeof evt.target.value === "undefined") {
                      const newParams = _.omit(paramsRef.current, [
                        "acceptedDifferent",
                      ]);
                      setParams(newParams);
                      paramsRef.current = newParams;
                      getData(newParams);
                    } else {
                      updateSearch({
                        acceptedDifferent: evt.target.value,
                      });
                    }
                  }}
                  value={params.acceptedDifferent}
                >
                  <Radio value={true}>Yes</Radio>
                  <Radio value={false}>No</Radio>
                  <Radio value={undefined}>Ignore</Radio>
                </RadioGroup>
              </FormItem>

              <FormItem label="Rank different">
                <RadioGroup
                  onChange={(evt) => {
                    if (typeof evt.target.value === "undefined") {
                      const newParams = _.omit(paramsRef.current, [
                        "rankDifferent",
                      ]);
                      setParams(newParams);
                      paramsRef.current = newParams;
                      getData(newParams);
                    } else {
                      updateSearch({
                        rankDifferent: evt.target.value,
                      });
                    }
                  }}
                  value={params.rankDifferent}
                >
                  <Radio value={true}>Yes</Radio>
                  <Radio value={false}>No</Radio>
                  <Radio value={undefined}>Ignore</Radio>
                </RadioGroup>
              </FormItem>

              <FormItem label="Code different">
                <RadioGroup
                  onChange={(evt) => {
                    if (typeof evt.target.value === "undefined") {
                      const newParams = _.omit(paramsRef.current, [
                        "codeDifferent",
                      ]);
                      setParams(newParams);
                      paramsRef.current = newParams;
                      getData(newParams);
                    } else {
                      updateSearch({
                        codeDifferent: evt.target.value,
                      });
                    }
                  }}
                  value={params.codeDifferent}
                >
                  <Radio value={true}>Yes</Radio>
                  <Radio value={false}>No</Radio>
                  <Radio value={undefined}>Ignore</Radio>
                </RadioGroup>
              </FormItem>

              {projectKey && (
                <FormItem label="With decision">
                  <RadioGroup
                    onChange={(evt) => {
                      if (typeof evt.target.value === "undefined") {
                        const newParams = _.omit(paramsRef.current, [
                          "withDecision",
                        ]);
                        setParams(newParams);
                        paramsRef.current = newParams;
                        getData(newParams);
                      } else {
                        updateSearch({ withDecision: evt.target.value });
                      }
                    }}
                    value={params.withDecision}
                  >
                    <Radio value={true}>Yes</Radio>
                    <Radio value={false}>No</Radio>
                    <Radio value={undefined}>Ignore</Radio>
                  </RadioGroup>
                </FormItem>
              )}

              <FormItem label="Entity">
                <RadioGroup
                  onChange={(evt) => {
                    if (typeof evt.target.value === "undefined") {
                      const newParams = _.omit(paramsRef.current, ["entity"]);
                      setParams(newParams);
                      paramsRef.current = newParams;
                      getData(newParams);
                    } else {
                      updateSearch({ entity: evt.target.value });
                    }
                  }}
                  value={params.entity}
                >
                  <Radio value="NAME">Name</Radio>
                  <Radio value={undefined}>Taxon</Radio>
                </RadioGroup>
              </FormItem>

              <FormItem label="Show atomized names">
                <RadioGroup
                  onChange={(evt) => {
                    setShowAtomizedNames(evt.target.value);
                  }}
                  value={showAtomizedNames}
                >
                  <Radio value={true}>Yes</Radio>
                  <Radio value={false}>No</Radio>
                </RadioGroup>
              </FormItem>

              <FormItem>
                <Button type="primary" danger onClick={resetSearch}>
                  Reset all
                </Button>
              </FormItem>
            </Form>
          )}{" "}
        </Col>
        {projectKey && (
          <CanEditDataset dataset={{ key: projectKey }}>
            <Col flex="auto"></Col>
            <Col>
              <Select
                style={{
                  width: 140,
                  marginRight: 10,
                  marginBottom: "10px",
                }}
                onChange={onDecisionChange}
                value={decision ? decision : undefined}
                placeholder="Pick decision"
                showSearch
                allowClear
                options={[
                  {
                    label: "Status",
                    options: taxonomicstatus.map((s) => ({
                      value: s,
                      label: _.startCase(s),
                    })),
                  },
                  {
                    label: "Other",
                    options: [
                      { value: "block", label: "Block" },
                      { value: "ignore", label: "Ignore" },
                      { value: "reviewed", label: "Reviewed" },
                    ],
                  },
                ]}
              />
              <br />
              <Button
                type="primary"
                onClick={applyDecision}
                disabled={!hasSelected}
                style={{ width: 140 }}
                loading={postingDecisions}
              >
                Apply decision
              </Button>
              {selectedRowKeys && selectedRowKeys.length > 0 && (
                <div>
                  Selected {selectedRowKeys.length}{" "}
                  {selectedRowKeys.length > 1 ? "taxa" : "taxon"}
                </div>
              )}
            </Col>
          </CanEditDataset>
        )}
      </Row>
      <Row style={{ marginBottom: "8px", marginTop: "12px" }}>
        <Col span={12}>
          {Auth.canEditDataset({ key: projectKey }, user) && projectKey && (
            <>
              <Tooltip title="At least two names in a group must have different publishedInYear for a name to be selected">
                <Button
                  type="primary"
                  onClick={selectNewestInGroup}
                  style={{ width: 140, marginRight: "10px" }}
                  loading={newestInGroupLoading}
                >
                  Most recent name
                </Button>
              </Tooltip>
              <Tooltip title="At least two names in a duplicate group must have different publishedInYear for a name to be selected">
                <Button
                  type="primary"
                  onClick={selectAllInGroupExceptOldest}
                  loading={allButOldestInGroupLoading}
                  style={{ width: 140, marginRight: "10px" }}
                >
                  All except oldest
                </Button>
              </Tooltip>
              <Button
                type="primary"
                onClick={selectAllSynonymsInGroup}
                loading={synonymsSelectLoading}
                style={{ width: 140 }}
              >
                All synonyms
              </Button>
            </>
          )}
          <Button
            type="link"
            download="duplicates.csv"
            href={`${
              config.dataApi
            }dataset/${datasetKey}/duplicate.csv?${qs.stringify({
              ...downloadParams,
              projectKey,
            })}`}
          >
            <DownloadOutlined /> CSV
          </Button>
          <Button
            type="link"
            download="duplicates.tsv"
            href={`${
              config.dataApi
            }dataset/${datasetKey}/duplicate.tsv?${qs.stringify({
              ...downloadParams,
              projectKey,
            })}`}
          >
            <DownloadOutlined /> TSV
          </Button>
        </Col>
        <Col
          span={Auth.canEditDataset({ key: projectKey }, user) ? 12 : 24}
          style={{ textAlign: "right" }}
        >
          {data.length + " names on this page"}
          {!error && (
            <Pagination
              style={{ display: "inline" }}
              showSizeChanger
              current={page}
              pageSizeOptions={["50", "100", "250", "500"]}
              onShowSizeChange={(current, size) => {
                localStorage.setItem("col_plus_duplicates_limit", size);
                const newParams = { ...paramsRef.current, limit: size, offset: 0 };
                setParams(newParams);
                paramsRef.current = newParams;
                setPage(1);
                getData(newParams);
              }}
              onChange={(pg, pageSize) => {
                const newParams = {
                  ...paramsRef.current,
                  offset: pg === 0 ? pg : (pg - 1) * pageSize,
                  limit: pageSize,
                };
                setParams(newParams);
                paramsRef.current = newParams;
                setPage(pg);
                getData(newParams);
              }}
              pageSize={Number(params.limit)}
              size="small"
              total={totalFaked}
              locale={{ items_per_page: " duplicates / page" }}
            />
          )}
        </Col>
      </Row>
      {!error && (
        <>
          <Table
            size="small"
            components={components}
            columns={
              showAtomizedNames === true
                ? columns.filter(columnFilter)
                : showSourceFeatures
                ? [
                    getSourceColumn(),
                    ...columnDefaults(projectKey, () => getDataRef.current())
                      .fullScientificName,
                  ]
                : columnDefaults(projectKey, () => getDataRef.current())
                    .fullScientificName
            }
            dataSource={data}
            loading={loading}
            onChange={handleTableChange}
            rowKey="id"
            rowClassName={(record) =>
              record.dupID % 2 ? "duplicate-alternate-row" : ""
            }
            pagination={false}
            rowSelection={
              !Auth.canEditDataset({ key: projectKey }, user) || !projectKey
                ? null
                : rowSelection
            }
          />
        </>
      )}
    </div>
  );
};

const mapContextToProps = ({
  rank,
  taxonomicstatus,
  issue,
  nomstatus,
  nametype,
  namefield,
  user,
}) => ({
  rank,
  taxonomicstatus,
  issue,
  nomstatus,
  nametype,
  namefield,
  user,
});

export default withContext(mapContextToProps)(DuplicateSearchPage);
