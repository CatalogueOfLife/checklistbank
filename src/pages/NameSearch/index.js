import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Radio, Row, Col, Button, Form, Switch } from "antd";
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

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const PAGE_SIZE = 50;
const getColumns = (baseUri) => [
  {
    title: "Scientific Name",
    dataIndex: ["usage", "labelHtml"],
    key: "scientificName",
    render: (text, record) => {
      const uri =
        !_.get(record, "usage.id") ||
        record.usage.bareName ||
        !_.get(record, "usage.status")
          ? `${baseUri}/name/${encodeURIComponent(
              _.get(record, "usage.name.id")
            )}`
          : `${baseUri}/taxon/${encodeURIComponent(
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
          baseUri={baseUri}
        />
      );
    },
  },
];

class NameSearchPage extends React.Component {
  constructor(props) {
    super(props);
    const baseUri =
      this.props.catalogueKey === this.props.datasetKey
        ? `/catalogue/${this.props.catalogueKey}`
        : `/dataset/${this.props.datasetKey}`;
    this.state = {
      data: [],
      advancedFilters: false,
      columns: getColumns(baseUri),
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

  componentDidMount() {
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = {
        limit: PAGE_SIZE,
        offset: 0,
        facet: ["rank", "issue", "status", "nomStatus", "nameType", "field"],
        sortBy: "taxonomic",
      };
      history.push({
        pathname: _.get(this.props, "location.path"),
        search: `?limit=${PAGE_SIZE}&offset=0`,
      });
    }
    if (!params.facet) {
      params.facet = [
        "rank",
        "issue",
        "status",
        "nomStatus",
        "nameType",
        "field",
      ];
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
      this.getData
    );
  }

  getData = () => {
    const { datasetKey } = this.props;

    const {
      params,
      pagination: { pageSize: limit, current },
    } = this.state;

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
      : `${config.dataApi}name/search`;
    axios(`${url}?${qs.stringify(newParamsWithPaging)}`)
      .then((res) => {
        this.setState({
          loading: false,
          data: res.data,
          err: null,
          pagination: { ...this.state.pagination, total: res.data.total },
        });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: [] });
      });
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
          facet: ["rank", "issue", "status", "nomStatus", "nameType", "field"],
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

    const baseUri =
      catalogueKey === datasetKey
        ? `/catalogue/${this.props.catalogueKey}`
        : `/dataset/${this.props.datasetKey}`;

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
              message={<ErrorMsg error={error} />}
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
            <div style={{ marginTop: "10px" }}>
              {" "}
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
                placeHolder="Search by higher taxon"
                autoFocus={false}
              />{" "}
            </div>
            {catalogueKey === datasetKey ||
              (Number(datasetKey) === _.get(dataset, "key") &&
                ["managed", "released"].includes(dataset.origin) && (
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
                      placeHolder="Search by source dataset"
                      autoFocus={false}
                    />
                  </div>
                ))}
            <div style={{ marginTop: "10px" }}>
              <Form layout="inline">
                <FormItem label="Fuzzy matching">
                  <Switch
                    checked={params.fuzzy === true}
                    onChange={(value) => this.updateSearch({ fuzzy: value })}
                  />
                </FormItem>
                <FormItem>
                  <RadioGroup
                    onChange={(evt) => {
                      this.updateSearch({ extinct: evt.target.value });
                    }}
                    value={
                      typeof params.extinct === "undefined"
                        ? null
                        : params.extinct === "true"
                        ? true
                        : null
                    }
                  >
                    <Radio value={null}>Living and extinct</Radio>
                    <Radio value={true}>Extinct</Radio>
                  </RadioGroup>
                </FormItem>
                <FormItem>
                  {/*                   <Switch
                    checked={params.prefix === true}
                    onChange={(value) => this.updateSearch({ prefix: value })}
                  /> */}
                  <RadioGroup
                    onChange={(evt) => {
                      this.updateSearch({ type: evt.target.value });
                    }}
                    value={params.type || "WHOLE_WORDS"}
                  >
                    <Radio value="WHOLE_WORDS">Match whole words</Radio>
                    <Radio value="PREFIX">Partial words</Radio>

                    <Radio value="EXACT">Exact</Radio>
                  </RadioGroup>
                </FormItem>

                <FormItem
                  style={{
                    marginBottom: "10px",
                  }}
                >
                  <RadioGroup
                    onChange={(evt) => {
                      if (typeof evt.target.value === "undefined") {
                        this.setState(
                          {
                            params: _.omit(this.state.params, ["status"]),
                          },
                          this.getData
                        );
                      } else {
                        this.updateSearch({ status: evt.target.value });
                      }
                    }}
                    value={params.status}
                  >
                    <Radio value="_NOT_NULL">Exclude bare names</Radio>
                    <Radio value="_NULL">Only bare names</Radio>
                    <Radio value={undefined}>All</Radio>
                  </RadioGroup>
                </FormItem>
              </Form>
            </div>
          </Col>
          <Col span={12}>
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
                  vocab={facetNomStatus || nomstatus}
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

              {/* <Switch checkedChildren="Advanced" unCheckedChildren="Advanced" onChange={this.toggleAdvancedFilters} /> */}
            </div>
          </Col>
        </Row>
        <Row>
          <Col span={12} style={{ marginBottom: "8px" }}>
            <Button type="danger" onClick={this.resetSearch}>
              Reset all
            </Button>
          </Col>
          <Col span={12} style={{ textAlign: "right", marginBottom: "8px" }}>
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
            rowKey={(record) => record.usage.id || record.usage.name.id}
            expandable={{
              expandedRowRender: (record) => (
                <RowDetail
                  {...record}
                  catalogueKey={catalogueKey}
                  baseUri={baseUri}
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
