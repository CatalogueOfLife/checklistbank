import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Switch, Row, Col, Button } from "antd";
import config from "../../config";
import qs from "query-string";
import history from "../../history";
import Classification from "./Classification";
import SearchBox from "../DatasetList/SearchBox";
import MultiValueFilter from "./MultiValueFilter";
import RowDetail from './RowDetail'
import _ from "lodash";
import withContext from '../../components/hoc/withContext'
const columns = [
  {
    title: "Scientific Name",
    dataIndex: "usage.name.formattedName",
    key: "scientificName",
    render: (text, record) => {
      return (
        <NavLink
          to={{
            pathname: `/dataset/${_.get(record, "usage.name.datasetKey")}/${
              _.get(record, "classification") ? "taxon" : "name"
            }/${encodeURIComponent(
              _.get(record, "classification")
                ? _.get(record, "usage.id")
                : _.get(record, "usage.name.id")
            )}`
          }}
          exact={true}
        >
          <span dangerouslySetInnerHTML={{__html: text}}></span>
        </NavLink>
      );
    },
    width: 200,
    sorter: true
  },
  {
    title: "Status",
    dataIndex: "usage.status",
    key: "status",
    width: 200,
    render: (text, record) => {
      return !['synonym', 'ambiguous synonym', 'misapplied'].includes(text) ? text :
      <React.Fragment>
       {text} {text === 'misapplied' ? 'to ': 'of '}<span dangerouslySetInnerHTML={{__html: _.get(record, "usage.accepted.name.formattedName")}}></span>
      </React.Fragment>
    }
  },
  {
    title: "Rank",
    dataIndex: "usage.name.rank",
    key: "rank",
    width: 60,
    sorter: true
  },
  {
    title: "Parents",
    dataIndex: "usage.classification",
    key: "parents",
    width: 180,
    render: (text, record) => {
      return !_.get(record, "classification") ? (
        ""
      ) : (
        <Classification
          classification={_.initial(record.classification)}
          maxParents={2}
          datasetKey={_.get(record, "usage.name.datasetKey")}
        />
      );
    }
  }
];

class NameSearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);

    this.state = {
      data: [],
      advancedFilters: false,
      columns: columns,
      params: {},
      pagination: {
        pageSize: 50,
        current: 1
      },
      loading: false
    };
  }

  componentWillMount() {
    const { datasetKey } = this.props;
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = { limit: 50, offset: 0, facet: ['rank', 'issue', 'status'] };
      history.push({
        pathname: `/dataset/${datasetKey}/names`,
        search: `?limit=50&offset=0`
      });
    }

    this.setState({ params }, this.getData);
  }

  getData = () => {
    const { params } = this.state;
    this.setState({ loading: true });
    const { datasetKey } = this.props;
    if (!params.q) {
      delete params.q;
    }
    history.push({
      pathname: `/dataset/${datasetKey}/names`,
      search: `?${qs.stringify(params)}`
    });
    axios(
      `${config.dataApi}dataset/${datasetKey}/name/search?${qs.stringify(
        params
      )}`
    )
      .then(res => {
        const pagination = { ...this.state.pagination };
        pagination.total = res.data.total;

        this.setState({
          loading: false,
          data: res.data,
          err: null,
          pagination
        });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };
  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;

    this.setState({
      pagination: pager
    });
    let query = _.merge(this.state.params, {
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ...filters
    });

    if (sorter && sorter.field) {
      let split = sorter.field.split(".");

      if (split[split.length - 1] === "scientificName") {
        query.sortBy = "name";
      } else if (split[split.length - 1] === "rank") {
        query.sortBy = "taxonomic";
      } else {
        query.sortBy = split[split.length - 1];
      }
    }
    if (sorter && sorter.order === "descend") {
      query.reverse = true;
    } else {
      query.reverse = false;
    }
    this.setState({ params: query }, this.getData);
  };

  updateSearch = params => {
    _.forEach(params, (v, k) => {
      this.state.params[k] = v;
    });
    this.setState({ ...this.state.params }, this.getData);
  };

  resetSearch = () => {
    this.setState({ params: { limit: 50, offset: 0 } }, this.getData);
  };

  toggleAdvancedFilters = () => {
    this.setState({advancedFilters: !this.state.advancedFilters})
  };

  render() {
    const { data : {result, facets}, loading, error, params, pagination, advancedFilters } = this.state;
    const { rank, taxonomicstatus, issue, nomstatus, nametype, namefield } = this.props;
    const facetRanks = _.get(facets, 'rank') ? facets.rank.map((r)=> ({ value: r.value, label: `${_.startCase(r.value)} (${r.count})`})) : null;
    const facetIssues =  _.get(facets, 'issue') ? facets.issue.map((i)=> ({ value: i.value, label: `${_.startCase(i.value)} (${i.count})`})) : null;
    const facetTaxonomicStatus = _.get(facets, 'status') ? facets.status.map((s)=> ({ value: s.value, label: `${_.startCase(s.value)} (${s.count})`})) : null;
    return (
      <div
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0"
        }}
      >
        <Row>
          <Col
            span={12}
            style={{ display: "flex", flexFlow: "column", height: "165px" }}
          >
            <SearchBox
              defaultValue={_.get(params, "q")}
              onSearch={value => this.updateSearch({ q: value })}
              style={{ marginBottom: "10px", width: "100%" }}
            />
           
          </Col>
          <Col span={12}>
            <MultiValueFilter
              defaultValue={_.get(params, "issue")}
              onChange={value => this.updateSearch({ issue: value })}
              vocab={facetIssues || issue}
              label="Issues"
            />

            <MultiValueFilter
              defaultValue={ _.get(params, "rank")}
              onChange={value => this.updateSearch({ rank: value })}
              vocab={facetRanks || rank}
              label="Ranks"
            />
            <MultiValueFilter
              defaultValue={_.get(params, "status")}
              onChange={value => this.updateSearch({ status: value })}
              vocab={facetTaxonomicStatus || taxonomicstatus}
              label="Status"
            />
           <div style={{ textAlign: "right", marginBottom: "8px" }}> <Switch checkedChildren="Advanced" unCheckedChildren="Advanced" onChange={this.toggleAdvancedFilters} /></div>
         { advancedFilters && <React.Fragment>
             <MultiValueFilter
              defaultValue={_.get(params, "nomstatus")}
              onChange={value => this.updateSearch({ nomstatus: value })}
              vocab={nomstatus}
              label="Nomenclatural status"
            />
            <MultiValueFilter
              defaultValue={_.get(params, "type")}
              onChange={value => this.updateSearch({ type: value })}
              vocab={nametype}
              label="Name type"
            />
            <MultiValueFilter
              defaultValue={_.get(params, "field")}
              onChange={value => this.updateSearch({ field: value })}
              vocab={namefield}
              label="Name field"
      />
        </React.Fragment>}
            
          </Col>
          {error && <Alert message={error.message} type="error" />}
        </Row>
        <Row><Col span={12} style={{ textAlign: "left", marginBottom: "8px" }}>
              <Button type="danger" onClick={this.resetSearch}>
                Reset all
              </Button>
            </Col><Col span={12} style={{ textAlign: "right", marginBottom: "8px" }}>
          { pagination && !isNaN(pagination.total) && `results: ${pagination.total}` }</Col></Row>
        {!error && (
          <Table
            size="middle"
            columns={this.state.columns}
            dataSource={result}
            loading={loading}
            pagination={this.state.pagination}
            onChange={this.handleTableChange}
            rowKey="usage.name.id"
            expandedRowRender={record => <RowDetail {...record}></RowDetail>}
          />
        )}
      </div>
    );
  }
}

const mapContextToProps = ({ rank, taxonomicstatus, issue, nomstatus, nametype, namefield }) => ({ rank, taxonomicstatus, issue, nomstatus, nametype, namefield });


export default withContext(mapContextToProps)(NameSearchPage);
