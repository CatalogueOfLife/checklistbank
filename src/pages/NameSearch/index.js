import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Radio, Row, Col, Form, Switch } from "antd";
import { UpOutlined, DownOutlined } from "@ant-design/icons";

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
  "nameType",
  "field",
  "authorship",
  "authorshipYear",
  "extinct",
  "environment",
  "origin",
];
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const PAGE_SIZE = 50;
const getBaseUri = (catalogueKey, datasetKey) =>
  catalogueKey === datasetKey
    ? `/catalogue/${catalogueKey}`
    : `/dataset/${datasetKey}`;

const getColumns = (catalogueKey) => [
  {
    title: "Scientific Name",
    dataIndex: ["usage", "labelHtml"],
    key: "scientificName",
    render: (text, record) => {
      const uri =
        !_.get(record, "usage.id") ||
        record.usage.bareName ||
        !_.get(record, "usage.status")
          ? `${getBaseUri(
              catalogueKey,
              _.get(record, "usage.datasetKey")
            )}/name/${encodeURIComponent(_.get(record, "usage.name.id"))}`
          : `${getBaseUri(
              catalogueKey,
              _.get(record, "usage.datasetKey")
            )}/taxon/${encodeURIComponent(
              _.get(record, "usage.accepted.id")
                ? _.get(record, "usage.accepted.id")
                : _.get(record, "usage.id")
            )}`;

      return (
        <NavLink
          key={_.get(record, "usage.id")}
          to={{
            pathname: uri,
          }}
          exact={true}
        >
          <span dangerouslySetInnerHTML={{ __html: text }} />
        </NavLink>
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
    const clms = getColumns(isCatalogue ? this.props.catalogueKey : null);
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
            sorter: true,
          },
          ...clms,
        ];
    this.state = {
      data: [],
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
        this.setState({
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
      console.log("DS facet length "+ data?.facets?.datasetKey?.length)
      for await (const d of data.result) {
        if (keyMap[d?.usage?.datasetKey]) {
          d.datasetLabel = keyMap[d?.usage?.datasetKey].label;
        } else {
        const dataset = await datasetLoader.load(d?.usage?.datasetKey);
        d.datasetLabel = dataset?.title
       
        }
      }

     /*  return data.result.forEach(async (d) => {
        if (keyMap[d?.usage?.datasetKey]) {
          d.datasetLabel = keyMap[d?.usage?.datasetKey].label;
        } else {
        const dataset = await datasetLoader.load(d?.usage?.datasetKey);
        d.datasetLabel = dataset?.title
       // .then((dataset) => (d.datasetLabel = dataset?.title))
         // console.log(d)
        }
      }); */
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
      issue,
      nomstatus,
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
          <Col span={12} style={{ display: "flex", flexFlow: "column" }}>
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
                ["managed", "released"].includes(dataset.origin))) && (
              <div style={{ marginTop: "10px" }}>
                <DatasetAutocomplete
                  contributesTo={Number(datasetKey)}
                  onSelectDataset={(value) => {
                    this.updateSearch({ SECTOR_DATASET_KEY: value.key });
                  }}
                  defaultDatasetKey={
                    _.get(params, "SECTOR_DATASET_KEY") || null
                  }
                  onResetSearch={(value) => {
                    this.updateSearch({ SECTOR_DATASET_KEY: null });
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
          <Col span={12}>
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
            {advancedFilters && (
              <React.Fragment>
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
                  catalogueKey={catalogueKey}
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
  issue,
  nomstatus,
  nametype,
  namefield,
  catalogueKey,
  dataset,
}) => ({
  rank,
  taxonomicstatus,
  issue,
  nomstatus,
  nametype,
  namefield,
  catalogueKey,
  dataset,
});

export default withContext(mapContextToProps)(NameSearchPage);
