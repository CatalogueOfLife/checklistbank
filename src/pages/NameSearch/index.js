import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Radio, Row, Col, Form, Switch, Tag } from "antd";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import MergedDataBadge from "../../components/MergedDataBadge";
import config from "../../config";
import qs from "query-string";
import history from "../../history";
import Classification from "./Classification";
import SearchBox from "../DatasetList/SearchBox";
import MultiValueFilter from "./MultiValueFilter";
import RowDetail from "./RowDetail";
import TaxGroupIcon from "./TaxGroupIcon";
import _ from "lodash";
import ErrorMsg from "../../components/ErrorMsg";
import NameAutocomplete from "../project/Assembly/NameAutocomplete";
import DatasetAutocomplete from "../project/Assembly/DatasetAutocomplete";
import withContext from "../../components/hoc/withContext";
import { getDatasetsBatch } from "../../api/dataset";
import DataLoader from "dataloader";
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
const FACETS = [
  "rank",
  "issue",
  "status",
  "nomStatus",
  "nomCode",
  "nameType",
  "field",
  "authorship",
  "authorshipYear",
  "extinct",
  "environment",
  "origin",
  "sectorMode",
  "secondarySourceGroup",
  "sectorDatasetKey",
  "secondarySource",
  "group",
];
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const PAGE_SIZE = 50;
const getBaseUri = (projectKey, datasetKey) =>
  projectKey === datasetKey
    ? `/project/${projectKey}`
    : `/dataset/${datasetKey}`;
/* console.log(
  encodeURIComponent(
    "Limoniidae-Eriopterinae-Rhypholophus-\\\\n-simulans-28a397a9d"
  )
); */

const getColumns = (projectKey) => [
  {
    title: "",
    dataIndex: ["usage", "merged"],
    key: "merged",
    width: 12,
    render: (text, record) =>
      record?.usage?.merged ? <MergedDataBadge /> : "",
  },
  {
    title: "Scientific Name",
    dataIndex: ["usage", "labelHtml"],
    key: "scientificName",
    render: (text, record) => {
      const uri =
        !_.get(record, "usage.id") ||
        record?.usage?.status === "bare name" ||
        !_.get(record, "usage.status")
          ? `${getBaseUri(
              projectKey,
              _.get(record, "usage.datasetKey")
            )}/name/${encodeURIComponent(_.get(record, "usage.name.id"))}`
          : _.get(record, "usage.accepted")
          ? `${getBaseUri(
              projectKey,
              _.get(record, "usage.datasetKey")
            )}/nameusage/${encodeURIComponent(_.get(record, "usage.id"))}`
          : `${getBaseUri(
              projectKey,
              _.get(record, "usage.datasetKey")
            )}/taxon/${encodeURIComponent(
              _.get(record, "usage.id")
              /* ? _.get(record, "usage.accepted.id")
                : _.get(record, "usage.id") */
            )}`;

      return (
        <>
          <NavLink
            key={_.get(record, "usage.id")}
            to={{
              pathname: uri,
            }}
            end
          >
            <span dangerouslySetInnerHTML={{ __html: text }} />
          </NavLink>
        </>
      );
    },
    width: 200,
    sorter: true,
  },
  {
    title: "Status",
    dataIndex: ["usage", "status"],
    key: "status",
    width: 200,
    render: (text, record) => {
      return !["synonym", "ambiguous synonym", "misapplied"].includes(text) ? (
        text
      ) : (
        <React.Fragment key={_.get(record, "usage.id")}>
          {text} {text === "misapplied" ? "to " : "of "}
          <span
            dangerouslySetInnerHTML={{
              __html: _.get(record, "usage.accepted.labelHtml"),
            }}
          />
        </React.Fragment>
      );
    },
  },
  {
    title: "Rank",
    dataIndex: ["usage", "name", "rank"],
    key: "rank",
    width: 60,
    sorter: true,
  },
  {
    title: "Group",
    dataIndex: ["group"],
    key: "group",
    width: 32,
    render: (group) => group ? <TaxGroupIcon group={group} size={20} /> : null,
  },
  {
    title: "Parents",
    dataIndex: ["usage", "classification"],
    key: "parents",
    width: 180,
    render: (text, record) => {
      return !_.get(record, "classification") ? (
        ""
      ) : (
        <Classification
          key={_.get(record, "usage.id")}
          classification={_.initial(record.classification)}
          maxParents={2}
          datasetKey={_.get(record, "usage.name.datasetKey")}
          baseUri={getBaseUri(projectKey, _.get(record, "usage.datasetKey"))}
        />
      );
    },
  },
];

const NameSearchPage = ({
  rank,
  taxonomicstatus,
  infoGroup,
  issue,
  nomstatus,
  nomCode,
  nametype,
  namefield,
  datasetKey,
  projectKey,
  dataset,
  showSourceDataset,
  location,
}) => {
  const effectiveFACETS = datasetKey ? FACETS : ["datasetKey", ...FACETS];

  const isCatalogue = projectKey === datasetKey;
  const clms = getColumns(isCatalogue ? projectKey : null);
  const buildColumns = () => {
    const cols = datasetKey
      ? clms
      : [
          {
            title: "Dataset",
            dataIndex: ["datasetLabel"],
            key: "datasetLabel",
            render: (text, record) => (
              <NavLink
                key={_.get(record, "usage.id")}
                to={{
                  pathname: `/dataset/${_.get(record, "usage.datasetKey")}`,
                }}
                end
              >
                <span dangerouslySetInnerHTML={{ __html: text }} />
              </NavLink>
            ),
            width: 200,
            sorter: false,
          },
          ...clms,
        ];
    if (showSourceDataset) {
      cols.push({
        title: "Source Dataset",
        dataIndex: ["sectorDatasetKey"],
        key: "sourceDatasetLabel",
        render: (text, record) => (
          <NavLink
            key={_.get(record, "usage.id")}
            to={{
              pathname: `/dataset/${_.get(record, "sectorDatasetKey")}`,
            }}
            end
          >
            <span
              dangerouslySetInnerHTML={{ __html: record?.sourceDatasetLabel }}
            />
          </NavLink>
        ),
        width: 200,
        sorter: false,
      });
    }
    return cols;
  };

  const [columns] = useState(() => buildColumns());
  const [data, setData] = useState([]);
  const [sectorDatasetKeyMap, setSectorDatasetKeyMap] = useState({});
  const [secondarySourceMap, setSecondarySourceMap] = useState({});
  const [advancedFilters, setAdvancedFilters] = useState(false);
  const [params, setParams] = useState({});
  const [pagination, setPagination] = useState({
    pageSize: PAGE_SIZE,
    current: 1,
    showQuickJumper: true,
    pageSizeOptions: [50, 100, 500, 1000],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cancelRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cancelRef.current && typeof cancelRef.current === "function") {
        cancelRef.current();
      }
    };
  }, []);

  const get = (url, options) => {
    let cancel;
    options = options || {};
    options.cancelToken = new axios.CancelToken(function executor(c) {
      cancel = c;
    });
    let p = axios.get(url, options);
    cancelRef.current = cancel;
    return p;
  };

  const datasetLabelsFromFacets = async (responseData) => {
    if (_.get(responseData, "facets.datasetKey") && _.get(responseData, "result[0]")) {
      const keyMap = _.keyBy(responseData.facets.datasetKey, "value");
      console.log("DS facet length " + responseData?.facets?.datasetKey?.length);
      for await (const d of responseData.result) {
        if (keyMap[d?.usage?.datasetKey]) {
          d.datasetLabel = keyMap[d?.usage?.datasetKey].label;
        } else {
          const dataset = await datasetLoader.load(d?.usage?.datasetKey);
          d.datasetLabel = dataset?.title;
        }
      }
    }
  };

  const sectorDatasetLabelsFromFacets = async (responseData, key = "sectorDatasetKey") => {
    if (_.get(responseData, `facets.${key}`) && _.get(responseData, "result[0]")) {
      console.log(`${key} facet length ` + responseData?.facets?.[key]?.length);
      try {
        const sectorDatasets = await Promise.all(
          responseData.facets?.[key].map((elm) => datasetLoader.load(elm?.value))
        );
        const keyMap = _.keyBy(sectorDatasets, "key");
        for await (const d of responseData.result) {
          if (d?.[key] && keyMap[d?.[key]]) {
            d.sourceDatasetLabel = keyMap[d?.[key]].label;
          } else if (d?.[key]) {
            const dataset = await datasetLoader.load(d?.[key]);
            d.sourceDatasetLabel = dataset?.title;
          }
        }
        return keyMap;
      } catch (error) {
        console.log(error);
        console.log("Could not load sectorDatasets");
        return {};
      }
    }
  };

  const getData = async (currentParams, currentPagination) => {
    const { pageSize: limit, current } = currentPagination;

    if (loading && cancelRef.current) {
      cancelRef.current("cancelled by user");
    } else {
      setLoading(true);
      const paramsForRequest = { ...currentParams };
      if (!paramsForRequest.q) {
        delete paramsForRequest.q;
      }
      const newParamsWithPaging = {
        ...paramsForRequest,
        limit,
        offset: (current - 1) * limit,
      };

      history.push({
        pathname: _.get({ location }, "location.pathname"),
        search: `?${qs.stringify(newParamsWithPaging)}`,
      });
      const url = datasetKey
        ? `${config.dataApi}dataset/${datasetKey}/nameusage/search`
        : `${config.dataApi}nameusage/search`;
      try {
        const res = await get(
          `${url}?${qs.stringify(newParamsWithPaging)}`
        );
        if (!datasetKey) {
          // only do this if it is a cross dataset search
          await datasetLabelsFromFacets(res.data);
        }

        const newSectorDatasetKeyMap = await sectorDatasetLabelsFromFacets(
          res.data
        );

        const newSecondarySourceMap = await sectorDatasetLabelsFromFacets(
          res.data,
          "secondarySource"
        );

        setSectorDatasetKeyMap(newSectorDatasetKeyMap || {});
        setSecondarySourceMap(newSecondarySourceMap || {});
        setLoading(false);
        setData(res.data);
        setError(null);
        setPagination((prev) => ({ ...prev, total: res.data.total }));
      } catch (err) {
        if (axios.isCancel(err)) {
          setLoading(false);
          setData([]);
          getData(currentParams, currentPagination);
        } else {
          setLoading(false);
          setError(err);
          setData([]);
        }
      }
    }
  };

  // Mount: parse URL params and kick off initial fetch
  useEffect(() => {
    let initialParams = qs.parse(_.get({ location }, "location.search"));
    const isEmpty = _.isEmpty(initialParams);
    if (isEmpty) {
      initialParams = {
        limit: PAGE_SIZE,
        offset: 0,
        facet: effectiveFACETS,
        sortBy: "relevance",
        content: "SCIENTIFIC_NAME",
      };
      history.push({
        pathname: _.get({ location }, "location.pathname"),
        search: `?limit=${PAGE_SIZE}&offset=0`,
      });
    }
    if (!initialParams.facet) {
      initialParams.facet = effectiveFACETS;
    }
    if (!initialParams.limit) {
      initialParams.limit = PAGE_SIZE;
    }
    if (!initialParams.offset) {
      initialParams.offset = 0;
    }

    const initialPagination = {
      pageSize: initialParams.limit || PAGE_SIZE,
      current:
        Number(initialParams.offset || 0) / Number(initialParams.limit || PAGE_SIZE) + 1,
      showQuickJumper: true,
      pageSizeOptions: [50, 100, 500, 1000],
    };

    setParams(initialParams);
    setPagination(initialPagination);

    if (datasetKey || !isEmpty) {
      getData(initialParams, initialPagination);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when location.search changes (URL-driven navigation)
  useEffect(() => {
    const locationSearch = _.get({ location }, "location.search");
    if (!locationSearch) return;
    let newParams = qs.parse(locationSearch);
    if (_.isEmpty(newParams)) return;
    if (!newParams.facet) {
      newParams.facet = effectiveFACETS;
    }
    if (!newParams.limit) {
      newParams.limit = PAGE_SIZE;
    }
    if (!newParams.offset) {
      newParams.offset = 0;
    }
    const newPagination = {
      pageSize: newParams.limit || PAGE_SIZE,
      current:
        Number(newParams.offset || 0) / Number(newParams.limit || PAGE_SIZE) + 1,
      showQuickJumper: true,
      pageSizeOptions: [50, 100, 500, 1000],
    };
    setParams(newParams);
    setPagination(newPagination);
    getData(newParams, newPagination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.search]);

  const handleTableChange = (newPagination, filters, sorter) => {
    let query = _.merge({ ...params }, {
      ...filters,
    });

    if (sorter && sorter.field) {
      if (sorter.field[sorter.field.length - 1] === "labelHtml") {
        query.sortBy = "name";
      } else if (sorter.field[sorter.field.length - 1] === "rank") {
        query.sortBy = "taxonomic";
      } else {
        query.sortBy = sorter.field[sorter.field.length - 1];
      }
    }
    if (sorter && sorter.order === "descend") {
      query.reverse = true;
    } else {
      query.reverse = false;
    }
    setParams(query);
    setPagination(newPagination);
    getData(query, newPagination);
  };

  const updateSearch = (newValues) => {
    let newParams = { ...params };
    _.forEach(newValues, (v, k) => {
      newParams[k] = v;
    });
    const filteredParams = Object.keys(newParams).reduce(
      (acc, cur) => (
        newParams[cur] !== null && (acc[cur] = newParams[cur]), acc
      ),
      {}
    );
    const newPagination = { ...pagination, current: 1 };
    setParams(filteredParams);
    setPagination(newPagination);
    getData(filteredParams, newPagination);
  };

  const resetSearch = () => {
    const newParams = {
      limit: 50,
      offset: 0,
      facet: effectiveFACETS,
    };
    const newPagination = { ...pagination, current: 1 };
    setParams(newParams);
    setPagination(newPagination);
    getData(newParams, newPagination);
  };

  const toggleAdvancedFilters = () => {
    setAdvancedFilters((prev) => !prev);
  };

  const getMerge = () => {
    const sectorModeParam = params.sectorMode;
    if (_.isArray(sectorModeParam) && sectorModeParam.length > 0) {
      return sectorModeParam.includes("merge");
    } else if (_.isArray(sectorModeParam) && sectorModeParam.length === 0) {
      return true;
    } else if (!!sectorModeParam) {
      return sectorModeParam === "merge";
    } else {
      return true;
    }
  };

  const { result, facets } = data || {};

  const facetRanks = _.get(facets, "rank")
    ? facets.rank.map((r) => ({
        value: r.value,
        label: `${_.startCase(r.value)} (${r.count.toLocaleString("en-GB")})`,
      }))
    : null;
  const facetIssues = _.get(facets, "issue")
    ? facets.issue.map((i) => ({
        value: i.value,
        label: `${_.startCase(i.value)} (${i.count.toLocaleString("en-GB")})`,
      }))
    : null;
  const facetSectorMode = _.get(facets, "sectorMode")
    ? facets.sectorMode.map((i) => ({
        value: i.value,
        label: `${_.startCase(i.value)} (${i.count.toLocaleString("en-GB")})`,
      }))
    : null;
  const facetSecondarySourceGroup = _.get(facets, "secondarySourceGroup")
    ? facets.secondarySourceGroup.map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : null;
  const facetSectorDatasetKey = _.get(facets, "sectorDatasetKey")
    ? facets.sectorDatasetKey.map((s) => ({
        value: s.value,
        label: `${
          sectorDatasetKeyMap?.[s.value]?.title ||
          s.alias ||
          s.value
        } (${s.count.toLocaleString("en-GB")})`,
      }))
    : null;
  const facetSecondarySource = _.get(facets, "secondarySource")
    ? facets.secondarySource.map((s) => ({
        value: s.value,
        label: `${
          secondarySourceMap?.[s.value]?.title || s.value
        } (${s.count.toLocaleString("en-GB")})`,
      }))
    : null;
  const facetTaxonomicStatus = _.get(facets, "status")
    ? facets.status.map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : null;
  const facetNomStatus = _.get(facets, "nomStatus")
    ? facets["nomStatus"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : null;
  const facetNomType = _.get(facets, "nameType")
    ? facets["nameType"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : null;
  const facetNomCode = _.get(facets, "nomCode")
    ? facets["nomCode"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : null;
  const facetNomField = _.get(facets, "field")
    ? facets.field.map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : null;
  const facetAuthorship = _.get(facets, "authorship")
    ? facets["authorship"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetAuthorshipYear = _.get(facets, "authorshipYear")
    ? facets["authorshipYear"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetExtinct = _.get(facets, "extinct")
    ? facets["extinct"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetEnvironment = _.get(facets, "environment")
    ? facets["environment"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetOrigin = _.get(facets, "origin")
    ? facets["origin"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetDataset = _.get(facets, "datasetKey")
    ? facets["datasetKey"].map((s) => ({
        value: s.value,
        label: `${s.label || s.value} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetTaxGroup = _.get(facets, "group")
    ? facets["group"].map((s) => ({
        value: s.value,
        label: `${
          s.value.startsWith("other")
            ? _.startCase("Other " + s.value.replace(/^(other)/, ""))
            : _.startCase(s.value)
        } (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const merge = getMerge();

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
      <Row>
        <Col
          xs={24}
          sm={24}
          md={12}
          lg={12}
          style={{ display: "flex", flexFlow: "column" }}
        >
          <SearchBox
            defaultValue={_.get(params, "q") || null}
            onSearch={(value) => updateSearch({ q: value })}
            onResetSearch={(value) => updateSearch({ q: null })}
            style={{ marginBottom: "10px", width: "100%" }}
          />
          {datasetKey && (
            <div style={{ marginTop: "10px" }}>
              <NameAutocomplete
                datasetKey={datasetKey}
                defaultTaxonKey={_.get(params, "TAXON_ID") || null}
                minRank="GENUS"
                onSelectName={(value) => {
                  updateSearch({ TAXON_ID: value.key });
                }}
                onResetSearch={(value) => {
                  updateSearch({ TAXON_ID: null });
                }}
                placeHolder="Filter by higher taxon"
                autoFocus={false}
              />
            </div>
          )}
          {(projectKey === datasetKey ||
            Number(datasetKey) === projectKey ||
            (dataset &&
              ["project", "release", "xrelease"].includes(
                dataset.origin
              ))) && (
            <div style={{ marginTop: "10px" }}>
              <DatasetAutocomplete
                merge={merge}
                contributesTo={Number(datasetKey)}
                onSelectDataset={(value) => {
                  updateSearch({ sectorDatasetKey: value.key });
                }}
                defaultDatasetKey={_.get(params, "sectorDatasetKey") || null}
                onResetSearch={(value) => {
                  updateSearch({ sectorDatasetKey: null });
                }}
                placeHolder="Filter by source dataset"
                autoFocus={false}
              />
            </div>
          )}
          <div style={{ marginTop: "10px" }}>
            <Form layout="inline">
              <FormItem label="Match">
                <RadioGroup
                  onChange={(evt) => {
                    updateSearch({ type: evt.target.value });
                  }}
                  value={params.type || "WHOLE_WORDS"}
                >
                  <Radio value="EXACT">Exact</Radio>
                  <Radio value="WHOLE_WORDS">Words</Radio>
                  <Radio value="FUZZY">Fuzzy</Radio>
                  <Radio value="PREFIX">Prefix</Radio>
                </RadioGroup>
              </FormItem>
              <FormItem label="Search">
                <RadioGroup
                  onChange={(evt) => {
                    updateSearch({ content: evt.target.value });
                  }}
                  value={params.content || null}
                >
                  <Radio value="SCIENTIFIC_NAME">Scientific name</Radio>
                  <Radio value="AUTHORSHIP">Authorship</Radio>
                  <Radio value="VERNACULAR_NAME">Vernacular name</Radio>
                </RadioGroup>
              </FormItem>
            </Form>
          </div>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12}>
          {!datasetKey && (
            <MultiValueFilter
              defaultValue={_.get(params, "datasetKey")}
              onChange={(value) => updateSearch({ datasetKey: value })}
              vocab={facetDataset}
              label="Dataset"
            />
          )}
          <MultiValueFilter
            defaultValue={_.get(params, "issue")}
            onChange={(value) => updateSearch({ issue: value })}
            vocab={facetIssues || issue.map((i) => i.name)}
            label="Issues"
          />
          <MultiValueFilter
            defaultValue={_.get(params, "rank")}
            onChange={(value) => updateSearch({ rank: value })}
            vocab={facetRanks || rank}
            label="Ranks"
          />
          <MultiValueFilter
            defaultValue={_.get(params, "status")}
            onChange={(value) => updateSearch({ status: value })}
            vocab={facetTaxonomicStatus || taxonomicstatus}
            label="Status"
          />
          {dataset?.origin !== "external" && (
            <MultiValueFilter
              defaultValue={_.get(params, "sectorMode")}
              onChange={(value) => updateSearch({ sectorMode: value })}
              vocab={facetSectorMode || ["attach", "union", "merge"]}
              label="Sector Mode"
            />
          )}
          {dataset?.origin !== "external" && (
            <MultiValueFilter
              defaultValue={_.get(params, "sectorDatasetKey")}
              onChange={(value) =>
                updateSearch({ sectorDatasetKey: value })
              }
              vocab={facetSectorDatasetKey || []}
              label="Source dataset"
            />
          )}
          {dataset?.origin !== "external" && (
            <MultiValueFilter
              defaultValue={_.get(params, "secondarySource")}
              onChange={(value) =>
                updateSearch({ secondarySource: value })
              }
              vocab={facetSecondarySource || []}
              label="Secondary source"
            />
          )}

          {advancedFilters && (
            <React.Fragment>
              {dataset?.origin !== "external" && (
                <MultiValueFilter
                  defaultValue={_.get(params, "secondarySourceGroup")}
                  onChange={(value) =>
                    updateSearch({ secondarySourceGroup: value })
                  }
                  vocab={facetSecondarySourceGroup || infoGroup}
                  label="Secondary information"
                />
              )}

              <MultiValueFilter
                defaultValue={_.get(params, "nomStatus")}
                onChange={(value) => updateSearch({ nomStatus: value })}
                vocab={facetNomStatus || nomstatus.map((n) => n.name)}
                label="Nomenclatural status"
              />
              <MultiValueFilter
                defaultValue={_.get(params, "nameType")}
                onChange={(value) => updateSearch({ nameType: value })}
                vocab={facetNomType || nametype}
                label="Name type"
              />
              <MultiValueFilter
                defaultValue={_.get(params, "nomCode")}
                onChange={(value) => updateSearch({ nomCode: value })}
                vocab={facetNomCode || nomCode}
                label="Nomenclatural code"
              />
              <MultiValueFilter
                defaultValue={_.get(params, "field")}
                onChange={(value) => updateSearch({ field: value })}
                vocab={facetNomField || namefield}
                label="Name field"
              />
              <MultiValueFilter
                defaultValue={_.get(params, "authorship")}
                onChange={(value) => updateSearch({ authorship: value })}
                vocab={facetAuthorship}
                label="Authorship"
              />
              <MultiValueFilter
                defaultValue={_.get(params, "authorshipYear")}
                onChange={(value) =>
                  updateSearch({ authorshipYear: value })
                }
                vocab={facetAuthorshipYear}
                label="Authorship Year"
              />
              <MultiValueFilter
                defaultValue={_.get(params, "environment")}
                onChange={(value) =>
                  updateSearch({ environment: value })
                }
                vocab={facetEnvironment}
                label="Environment"
              />
              <MultiValueFilter
                defaultValue={_.get(params, "extinct")}
                onChange={(value) => updateSearch({ extinct: value })}
                vocab={facetExtinct}
                label="Extinct"
              />
              <MultiValueFilter
                defaultValue={_.get(params, "group")}
                onChange={(value) => updateSearch({ group: value })}
                vocab={facetTaxGroup || []}
                label="Taxonomic group"
              />
              <MultiValueFilter
                defaultValue={_.get(params, "origin")}
                onChange={(value) => updateSearch({ origin: value })}
                vocab={facetOrigin}
                label="Origin"
              />
            </React.Fragment>
          )}
          <div style={{ textAlign: "right", marginBottom: "8px" }}>
            <a
              style={{ marginLeft: 8, fontSize: 12 }}
              onClick={toggleAdvancedFilters}
            >
              Advanced{" "}
              {advancedFilters ? <UpOutlined /> : <DownOutlined />}
            </a>
          </div>
          <div style={{ textAlign: "right", marginBottom: "8px" }}>
            {pagination &&
              !isNaN(pagination.total) &&
              `${(
                (pagination.current - 1) * pagination.pageSize +
                1
              ).toLocaleString("en-GB")} - ${(
                pagination.current * pagination.pageSize
              ).toLocaleString("en-GB")} of ${pagination.total.toLocaleString(
                "en-GB"
              )}`}
          </div>
        </Col>
      </Row>
      {!error && (
        <Table
          size="small"
          columns={columns}
          scroll={{ x: `${columns.length * 120}px` }}
          dataSource={result}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey={(record) =>
            record.usage.id
              ? `${record?.usage?.datasetKey}_${record?.usage?.id}`
              : `${record?.usage?.name?.datasetKey}_${record?.usage?.name?.id}`
          }
          expandable={{
            expandedRowRender: (record) => (
              <RowDetail
                {...record}
                projectKey={projectKey || dataset?.sourceKey}
                baseUri={getBaseUri(
                  projectKey === datasetKey ? projectKey : null,
                  _.get(record, "usage.datasetKey")
                )}
              />
            ),
            rowExpandable: (record) => !record.usage.bareName,
            columnWidth: 32,
          }}
        />
      )}
    </div>
  );
};

const mapContextToProps = ({
  rank,
  taxonomicstatus,
  infoGroup,
  taxGroup,
  issue,
  nomstatus,
  nametype,
  namefield,
  projectKey,
  dataset,
  nomCode,
}) => ({
  rank,
  taxonomicstatus,
  infoGroup,
  taxGroup,
  issue,
  nomstatus,
  nametype,
  namefield,
  projectKey,
  dataset,
  nomCode,
});

export default withContext(mapContextToProps)(NameSearchPage);
