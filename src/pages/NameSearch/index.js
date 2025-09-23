import React from "react";
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
import _ from "lodash";
import ErrorMsg from "../../components/ErrorMsg";
import NameAutocomplete from "../catalogue/Assembly/NameAutocomplete";
import DatasetAutocomplete from "../catalogue/Assembly/DatasetAutocomplete";
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
const getBaseUri = (catalogueKey, datasetKey) =>
  catalogueKey === datasetKey
    ? `/catalogue/${catalogueKey}`
    : `/dataset/${datasetKey}`;
/* console.log(
  encodeURIComponent(
    "Limoniidae-Eriopterinae-Rhypholophus-\\\\n-simulans-28a397a9d"
  )
); */

const getColumns = (catalogueKey) => [
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
              catalogueKey,
              _.get(record, "usage.datasetKey")
            )}/name/${encodeURIComponent(_.get(record, "usage.name.id"))}`
          : _.get(record, "usage.accepted")
          ? `${getBaseUri(
              catalogueKey,
              _.get(record, "usage.datasetKey")
            )}/nameusage/${encodeURIComponent(_.get(record, "usage.id"))}`
          : `${getBaseUri(
              catalogueKey,
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
            exact={true}
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
          baseUri={getBaseUri(catalogueKey, _.get(record, "usage.datasetKey"))}
        />
      );
    },
  },
];

class NameSearchPage extends React.Component {
  constructor(props) {
    super(props);
    const isCatalogue = this.props.catalogueKey === this.props.datasetKey;
    const taxGroup = props.taxGroup;
    console.log(props.taxGroup);
    const clms = getColumns(
      isCatalogue ? this.props.catalogueKey : null,
      props.taxGroup
    );
    const columns = this.props.datasetKey
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
                exact={true}
              >
                <span dangerouslySetInnerHTML={{ __html: text }} />
              </NavLink>
            ),

            width: 200,
            sorter: false,
          },
          ...clms,
        ];
    if (this.props.showSourceDataset) {
      columns.push({
        title: "Source Dataset",
        dataIndex: ["sectorDatasetKey"],
        key: "sourceDatasetLabel",
        render: (text, record) => (
          <NavLink
            key={_.get(record, "usage.id")}
            to={{
              pathname: `/dataset/${_.get(record, "sectorDatasetKey")}`,
            }}
            exact={true}
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
    this.state = {
      data: [],
      sectorDatasetKeyMap: {},
      secondarySourceMap: {},
      advancedFilters: false,
      columns: columns,
      params: {},
      pagination: {
        pageSize: PAGE_SIZE,
        current: 1,
        showQuickJumper: true,
        pageSizeOptions: [50, 100, 500, 1000],
      },
      loading: false,
    };
  }

  componentWillUnmount() {
    if (this.cancel && typeof this.cancel === "function") {
      this.cancel();
    }
  }
  componentDidMount() {
    const { datasetKey } = this.props;
    this.FACETS = datasetKey ? FACETS : ["datasetKey", ...FACETS];
    let params = qs.parse(_.get(this.props, "location.search"));
    const isEmpty = _.isEmpty(params);
    if (isEmpty) {
      params = {
        limit: PAGE_SIZE,
        offset: 0,
        facet: this.FACETS,
        sortBy: "taxonomic",
      };
      history.push({
        pathname: _.get(this.props, "location.path"),
        search: `?limit=${PAGE_SIZE}&offset=0`,
      });
    }
    if (!params.facet) {
      params.facet = this.FACETS;
    }
    if (!params.limit) {
      params.limit = PAGE_SIZE;
    }
    if (!params.offset) {
      params.offset = 0;
    }

    this.setState(
      {
        params,
        pagination: {
          pageSize: params.limit || PAGE_SIZE,
          current:
            Number(params.offset || 0) / Number(params.limit || PAGE_SIZE) + 1,
          showQuickJumper: true,
          pageSizeOptions: [50, 100, 500, 1000],
        },
      },
      () => {
        if (datasetKey || !isEmpty) {
          this.getData();
        }
      }
    );
  }
  componentDidUpdate(prevProps) {
    if (this.props.taxGroup !== prevProps.taxGroup) {
      const { taxGroup } = this.props;
      const clms = this.state.columns.toSpliced(3, 0, {
        title: "Group",
        dataIndex: ["group"],
        key: "group",
        width: 40,
        render: (text, record) => {
          return !_.get(record, "group") ? (
            ""
          ) : (
            <img
              style={{ width: "32px", height: "32px" }}
              src={_.get(taxGroup[_.get(record, "group")], "icon")}
              alt={_.get(record, "group")}
            />
          );
        },
      });
      this.setState({ columns: clms });
    }
  }
  get = (url, options) => {
    let cancel;
    options = options || {};
    options.cancelToken = new axios.CancelToken(function executor(c) {
      cancel = c;
    });
    let p = axios.get(url, options);
    this.cancel = cancel;
    return p;
  };
  getData = async () => {
    const { datasetKey } = this.props;

    const {
      params,
      loading,
      pagination: { pageSize: limit, current },
    } = this.state;

    if (loading && this.cancel) {
      this.cancel("cancelled by user");
    } else {
      this.setState({ loading: true });
      if (!params.q) {
        delete params.q;
      }
      const newParamsWithPaging = {
        ...params,
        limit,
        offset: (current - 1) * limit,
      };

      history.push({
        pathname: _.get(this.props, "location.path"),
        search: `?${qs.stringify(newParamsWithPaging)}`,
      });
      const url = datasetKey
        ? `${config.dataApi}dataset/${datasetKey}/nameusage/search`
        : `${config.dataApi}nameusage/search`;
      try {
        const res = await this.get(
          `${url}?${qs.stringify(newParamsWithPaging)}`
        );
        if (!datasetKey) {
          // only do this if it is a cross dataset search
          await this.datasetLabelsFromFacets(res.data);
        }

        const sectorDatasetKeyMap = await this.sectorDatasetLabelsFromFacets(
          res.data
        );

        const secondarySourceMap = await this.sectorDatasetLabelsFromFacets(
          res.data,
          "secondarySource"
        );

        this.setState({
          sectorDatasetKeyMap,
          secondarySourceMap,
          loading: false,
          data: res.data,
          err: null,
          pagination: { ...this.state.pagination, total: res.data.total },
        });
      } catch (err) {
        if (axios.isCancel(err)) {
          this.setState({ loading: false, data: [] }, this.getData);
        } else {
          this.setState({ loading: false, error: err, data: [] });
        }
      }
    }
  };

  datasetLabelsFromFacets = async (data) => {
    if (_.get(data, "facets.datasetKey") && _.get(data, "result[0]")) {
      const keyMap = _.keyBy(data.facets.datasetKey, "value");
      console.log("DS facet length " + data?.facets?.datasetKey?.length);
      for await (const d of data.result) {
        if (keyMap[d?.usage?.datasetKey]) {
          d.datasetLabel = keyMap[d?.usage?.datasetKey].label;
        } else {
          const dataset = await datasetLoader.load(d?.usage?.datasetKey);
          d.datasetLabel = dataset?.title;
        }
      }
    }
  };

  sectorDatasetLabelsFromFacets = async (data, key = "sectorDatasetKey") => {
    if (_.get(data, `facets.${key}`) && _.get(data, "result[0]")) {
      console.log(`${key} facet length ` + data?.facets?.[key]?.length);
      try {
        const sectorDatasets = await Promise.all(
          data.facets?.[key].map((elm) => datasetLoader.load(elm?.value))
        );
        const keyMap = _.keyBy(sectorDatasets, "key");
        //this.setState({sectorDatasetKeyMap: keyMap})
        for await (const d of data.result) {
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

  handleTableChange = (pagination, filters, sorter) => {
    let query = _.merge(this.state.params, {
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
    this.setState({ params: query, pagination }, this.getData);
  };

  updateSearch = (params) => {
    let newParams = { ...this.state.params };
    _.forEach(params, (v, k) => {
      newParams[k] = v;
    });
    this.setState(
      {
        params: Object.keys(newParams).reduce(
          (acc, cur) => (
            newParams[cur] !== null && (acc[cur] = newParams[cur]), acc
          ),
          {}
        ),
        pagination: { ...this.state.pagination, current: 1 },
      },
      this.getData
    );
  };

  resetSearch = () => {
    this.setState(
      {
        params: {
          limit: 50,
          offset: 0,
          facet: this.FACETS,
        },
      },
      this.getData
    );
  };

  toggleAdvancedFilters = () => {
    this.setState({ advancedFilters: !this.state.advancedFilters });
  };

  getMerge = () => {
    const sectorModeParam = this.state.params.sectorMode;
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

  render() {
    const {
      data: { result, facets },
      loading,
      error,
      params,
      pagination,
      advancedFilters,
    } = this.state;
    const {
      rank,
      taxonomicstatus,
      infoGroup,
      taxGroup,
      issue,
      nomstatus,
      nomCode,
      nametype,
      namefield,
      datasetKey,
      catalogueKey,
      dataset,
    } = this.props;
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
            this.state.sectorDatasetKeyMap?.[s.value]?.title ||
            s.alias ||
            s.value
          } (${s.count.toLocaleString("en-GB")})`, //`${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetSecondarySource = _.get(facets, "secondarySource")
      ? facets.secondarySource.map((s) => ({
          value: s.value,
          label: `${
            this.state.secondarySourceMap?.[s.value]?.title || s.value
          } (${s.count.toLocaleString("en-GB")})`, //`${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
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
    const merge = this.getMerge();
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
              onSearch={(value) => this.updateSearch({ q: value })}
              onResetSearch={(value) => this.updateSearch({ q: null })}
              style={{ marginBottom: "10px", width: "100%" }}
            />
            {datasetKey && (
              <div style={{ marginTop: "10px" }}>
                <NameAutocomplete
                  datasetKey={datasetKey}
                  defaultTaxonKey={_.get(params, "TAXON_ID") || null}
                  minRank="GENUS"
                  onSelectName={(value) => {
                    this.updateSearch({ TAXON_ID: value.key });
                  }}
                  onResetSearch={(value) => {
                    this.updateSearch({ TAXON_ID: null });
                  }}
                  placeHolder="Filter by higher taxon"
                  autoFocus={false}
                />
              </div>
            )}
            {(catalogueKey === datasetKey ||
              Number(datasetKey) === catalogueKey ||
              (dataset &&
                ["project", "release", "xrelease"].includes(
                  dataset.origin
                ))) && (
              <div style={{ marginTop: "10px" }}>
                <DatasetAutocomplete
                  merge={merge}
                  contributesTo={Number(datasetKey)}
                  onSelectDataset={(value) => {
                    this.updateSearch({ sectorDatasetKey: value.key });
                  }}
                  defaultDatasetKey={_.get(params, "sectorDatasetKey") || null}
                  onResetSearch={(value) => {
                    this.updateSearch({ sectorDatasetKey: null });
                  }}
                  placeHolder="Filter by source dataset"
                  autoFocus={false}
                />
              </div>
            )}
            <div style={{ marginTop: "10px" }}>
              <Form layout="inline">
                <FormItem label="Fuzzy">
                  <Switch
                    checked={params.fuzzy === true}
                    onChange={(value) => this.updateSearch({ fuzzy: value })}
                  />
                </FormItem>
                <FormItem label="Extinct">
                  <Switch
                    checked={params.extinct}
                    onChange={(value) =>
                      this.updateSearch({ extinct: value || null })
                    }
                  />
                </FormItem>
                <FormItem label="Matching">
                  <RadioGroup
                    onChange={(evt) => {
                      this.updateSearch({ type: evt.target.value });
                    }}
                    value={params.type || "WHOLE_WORDS"}
                  >
                    <Radio value="EXACT">Exact</Radio>
                    <Radio value="WHOLE_WORDS">Words</Radio>
                    <Radio value="PREFIX">Partial</Radio>
                  </RadioGroup>
                </FormItem>

                <FormItem label="Restrict to">
                  <RadioGroup
                    onChange={(evt) => {
                      this.updateSearch({ content: evt.target.value });
                    }}
                    value={params.content || null}
                  >
                    <Radio value="SCIENTIFIC_NAME">Scientific name</Radio>
                    <Radio value="AUTHORSHIP">Authorship</Radio>
                    <Radio value={null}>Any</Radio>
                  </RadioGroup>
                </FormItem>
              </Form>
            </div>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12}>
            {!datasetKey && (
              <MultiValueFilter
                defaultValue={_.get(params, "datasetKey")}
                onChange={(value) => this.updateSearch({ datasetKey: value })}
                vocab={facetDataset}
                label="Dataset"
              />
            )}
            <MultiValueFilter
              defaultValue={_.get(params, "issue")}
              onChange={(value) => this.updateSearch({ issue: value })}
              vocab={facetIssues || issue.map((i) => i.name)}
              label="Issues"
            />
            <MultiValueFilter
              defaultValue={_.get(params, "rank")}
              onChange={(value) => this.updateSearch({ rank: value })}
              vocab={facetRanks || rank}
              label="Ranks"
            />
            <MultiValueFilter
              defaultValue={_.get(params, "status")}
              onChange={(value) => this.updateSearch({ status: value })}
              vocab={facetTaxonomicStatus || taxonomicstatus}
              label="Status"
            />
            {dataset?.origin !== "external" && (
              <MultiValueFilter
                defaultValue={_.get(params, "sectorMode")}
                onChange={(value) => this.updateSearch({ sectorMode: value })}
                vocab={facetSectorMode || ["attach", "union", "merge"]}
                label="Sector Mode"
              />
            )}
            {dataset?.origin !== "external" && (
              <MultiValueFilter
                defaultValue={_.get(params, "sectorDatasetKey")}
                onChange={(value) =>
                  this.updateSearch({ sectorDatasetKey: value })
                }
                vocab={facetSectorDatasetKey || []}
                label="Source dataset"
              />
            )}
            {dataset?.origin !== "external" && (
              <MultiValueFilter
                defaultValue={_.get(params, "secondarySource")}
                onChange={(value) =>
                  this.updateSearch({ secondarySource: value })
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
                      this.updateSearch({ secondarySourceGroup: value })
                    }
                    vocab={facetSecondarySourceGroup || infoGroup}
                    label="Secondary information"
                  />
                )}

                <MultiValueFilter
                  defaultValue={_.get(params, "nomStatus")}
                  onChange={(value) => this.updateSearch({ nomStatus: value })}
                  vocab={facetNomStatus || nomstatus.map((n) => n.name)}
                  label="Nomenclatural status"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "nameType")}
                  onChange={(value) => this.updateSearch({ nameType: value })}
                  vocab={facetNomType || nametype}
                  label="Name type"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "nomCode")}
                  onChange={(value) => this.updateSearch({ nomCode: value })}
                  vocab={facetNomCode || nomCode}
                  label="Nomenclatural code"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "field")}
                  onChange={(value) => this.updateSearch({ field: value })}
                  vocab={facetNomField || namefield}
                  label="Name field"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "authorship")}
                  onChange={(value) => this.updateSearch({ authorship: value })}
                  vocab={facetAuthorship}
                  label="Authorship"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "authorshipYear")}
                  onChange={(value) =>
                    this.updateSearch({ authorshipYear: value })
                  }
                  vocab={facetAuthorshipYear}
                  label="Authorship Year"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "environment")}
                  onChange={(value) =>
                    this.updateSearch({ environment: value })
                  }
                  vocab={facetEnvironment}
                  label="Environment"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "extinct")}
                  onChange={(value) => this.updateSearch({ extinct: value })}
                  vocab={facetExtinct}
                  label="Extinct"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "group")}
                  onChange={(value) => this.updateSearch({ group: value })}
                  vocab={facetTaxGroup || []}
                  label="Taxonomic group"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "origin")}
                  onChange={(value) => this.updateSearch({ origin: value })}
                  vocab={facetOrigin}
                  label="Origin"
                />
              </React.Fragment>
            )}
            <div style={{ textAlign: "right", marginBottom: "8px" }}>
              <a
                style={{ marginLeft: 8, fontSize: 12 }}
                onClick={this.toggleAdvancedFilters}
              >
                Advanced{" "}
                {this.state.advancedFilters ? <UpOutlined /> : <DownOutlined />}
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
            columns={this.state.columns}
            scroll={{ x: `${this.state.columns.length * 120}px` }}
            dataSource={result}
            loading={loading}
            pagination={this.state.pagination}
            onChange={this.handleTableChange}
            rowKey={(record) =>
              record.usage.id
                ? `${record?.usage?.datasetKey}_${record?.usage?.id}`
                : `${record?.usage?.name?.datasetKey}_${record?.usage?.name?.id}`
            }
            expandable={{
              expandedRowRender: (record) => (
                <RowDetail
                  {...record}
                  catalogueKey={catalogueKey || dataset?.sourceKey}
                  baseUri={getBaseUri(
                    catalogueKey === datasetKey ? catalogueKey : null,
                    _.get(record, "usage.datasetKey")
                  )}
                />
              ),
              rowExpandable: (record) => !record.usage.bareName,
            }}
          />
        )}
      </div>
    );
  }
}

const mapContextToProps = ({
  rank,
  taxonomicstatus,
  infoGroup,
  taxGroup,
  issue,
  nomstatus,
  nametype,
  namefield,
  catalogueKey,
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
  catalogueKey,
  dataset,
  nomCode,
});

export default withContext(mapContextToProps)(NameSearchPage);
