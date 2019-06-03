import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Form, Tag, Icon, Tooltip, Breadcrumb } from "antd";
import config from "../../config";
import qs from "query-string";
import moment from "moment";
import history from "../../history";
import SyncButton from "./SyncButton";
import PageContent from "../../components/PageContent";
import withContext from "../../components/hoc/withContext";
import Auth from "../../components/Auth";
import ImportMetrics from "../../components/ImportMetrics";
import kibanaQuery from "./kibanaQuery";

import SyncAllSectorsButton from "../Admin/SyncAllSectorsButton"
import ErrorMsg from "../../components/ErrorMsg";

const { MANAGEMENT_CLASSIFICATION } = config;

const _ = require("lodash");

const tagColors = {
  processing: "purple",
  downloading: "cyan",
  inserting: "blue",
  finished: "green",
  failed: "red",
  "in queue": "orange"
};
const defaultColumns = [
  {
    title: "Source",
    dataIndex: "sector.dataset.alias",
    key: "alias",
    width: 150,
    render: (text, record) => <NavLink
    to={{
      pathname: `/dataset/${
        record.sector.dataset.key
      }/meta`
    }}
  >
    {_.get(record, "sector.dataset.alias")  || _.get(record, "sector.dataset.title")}
  </NavLink>
  },
  {
    title: "Sector target",
    dataIndex: "sector.path",
    key: "sector",
    render: (text, record) => {
      return record.sector.path ? (
        <Breadcrumb separator=">">
          {record.sector.path.reverse().map(taxon => {
            return (
              <Breadcrumb.Item key={taxon.id}>
                <NavLink
                  to={{
                    pathname: `/assembly`,
                    search: `?assemblyTaxonKey=${taxon.id}`
                  }}
                >
                  <span dangerouslySetInnerHTML={{ __html: taxon.name }} />
                </NavLink>
              </Breadcrumb.Item>
            );
          })}
        </Breadcrumb>
      ) : (
        <React.Fragment>
          <Tooltip title="This sector is not linked to a taxon id">
            <Icon type="warning" theme="twoTone" twoToneColor="#FF6347" />
          </Tooltip>{" "}
        { _.get(record, 'sector.subject.name') && <span
            dangerouslySetInnerHTML={{ __html: record.sector.subject.name }}
          />}
        </React.Fragment>
      );
    },
    width: 100
  },
  {
    title: "State",
    dataIndex: "state",
    key: "state",
    render: (text, record) => {
      return <Tag color={tagColors[record.state]}>{record.state}</Tag>;
    },
    width: 50
  },

  {
    title: "Attempt",
    dataIndex: "attempt",
    key: "attempt",
    width: 50
  },
  {
    title: "Sync Started",
    dataIndex: "started",
    key: "started",
    width: 50,
    render: date => {
      return date ? moment(date).format('MMMM Do, h:mm a') : "";
    }
  },
  {
    title: "Sync Finished",
    dataIndex: "finished",
    key: "finished",
    width: 50,
    render: date => {
      return date ? moment(date).format('MMMM Do, h:mm a') : "";
    }
  },
  {
    title: "Diff",
    key: "diff",
    render: (text, record) => (
      <NavLink
        to={{
          pathname: `/assembly/${MANAGEMENT_CLASSIFICATION.key}/sync/${
            record.sectorKey
          }/diff`,
          search:
            record.attempt > 0
              ? `?attempts=${record.attempt - 1}..${record.attempt}`
              : ""
        }}
      >
        <Tooltip title="Tree diff">
          <Icon type="diff" style={{fontSize: '20px'}}/>
        </Tooltip>
      </NavLink>
    ),
    width: 50
  },
  {
    title: "Logs",
    key: "logs",
    render: (text, record) => (
      <Tooltip title="Kibana logs">
        <a href={kibanaQuery(record.sectorKey, record.attempt)}>
          <Icon type="code" style={{fontSize: '20px'}} />
        </a>
      </Tooltip>
    ),
    width: 50
  }
];

class SyncTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      syncAllError: null,
      data: [],
      params: {},
      pagination: {
        pageSize: 25,
        current: 1
      },
      loading: false
    };
  }

  componentWillMount() {
    const { importState } = this.props;
    let query = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(query)) {
      query = { limit: 25, offset: 0, state: importState };
    }
    if (query.state) {
      this.updateStatusQuery(query);
    }
    this.getData(query);

    if (this.props.section === "running") {
      this.timer = setInterval(() => {
        this.getData(query);
      }, 3000);
    }
  }

  componentWillUnmount() {
    if (this.props.section === "running") {
      clearInterval(this.timer);
    }
  }

  getData = params => {
    const { section } = this.props;
    this.setState({ loading: true, params });
    history.push({
      pathname: `/sector/sync`,
      search: `?${qs.stringify(params)}`
    });
    axios(
      `${config.dataApi}assembly/${
        MANAGEMENT_CLASSIFICATION.key
      }/sync?${qs.stringify(params)}`
    )
      .then(res => {
        const promises =
          res.data.result && _.isArray(res.data.result)
            ? res.data.result.map(sync =>
                axios(`${config.dataApi}sector/${sync.sectorKey}`)
                  .then(sector => {
                    sync.sector = sector.data;
                    sync._id = `${sync.sectorKey}_${sync.attempt}`;
                  })
                  .then(() => 
                    axios(`${config.dataApi}dataset/${sync.sector.datasetKey}`)
                  )
                  .then((res) => {
                    sync.sector.dataset=res.data
                  })
                  .then(() =>
                   { return _.get(sync, 'sector.target.id') ? axios(
                      `${config.dataApi}dataset/${
                        MANAGEMENT_CLASSIFICATION.key
                      }/tree/${sync.sector.target.id}`
                    ) : Promise.resolve({data:null}) }
                  )
                  .then(tx => (sync.sector.path = tx.data))
              )
            : [];

        return Promise.all(promises).then(() => res);
      })
      .then(res => {
        const pagination = { ...this.state.pagination };
        pagination.total = res.data.total;

        this.setState({
          loading: false,
          data: res.data.result,
          err: null,
          pagination
        });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  updateStatusQuery = query => {
    let catColumn = _.find(defaultColumns, c => {
      return c.key === "state";
    });
    let filter = typeof query.state === "string" ? [query.state] : query.state;
    catColumn.filteredValue = filter;
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
    if (filters.state && _.get(filters, "state.length")) {
      query.state = filters.state;
    } else {
      query.state = this.props.importState;
    }
    this.updateStatusQuery(query);

    this.getData(query);
  };

  render() {
    const { data, loading, error, syncAllError } = this.state;
    const { section, user, sectorImportState } = this.props;
    const columns = Auth.isAuthorised(user, ["editor", "admin"])
      ? [
          ...defaultColumns,
          {
            title: "Action",
            dataIndex: "",
            key: "x",
            width: 50,
            render: record => (
              <SyncButton
                key={record.datasetKey}
                record={record}
                onStartImportSuccess={() => {
                  history.push("/imports/running");
                }}
              />
            )
          }
        ]
      : defaultColumns;

      columns[2].filters = sectorImportState.map(i => ({text: _.startCase(i), value: i}))


    return (
      <PageContent>
        {error && <Alert message={error.message} type="error" />}
        {syncAllError && <Alert message={<ErrorMsg error={syncAllError} />} type="error" />}

        <SyncAllSectorsButton 
          onError={err => this.setState({syncAllError: err})}
          onSuccess={() => this.setState({syncAllError: null})}
        />
        {!error && (
          <Table
            scroll={{ x: 1000 }}
            size="small"
            columns={columns}
            dataSource={data}
            pagination={this.state.pagination}
            onChange={this.handleTableChange}
            rowKey="_id"
            expandedRowRender={record => {
              if (record.state === "failed") {
                return <Alert message={record.error} type="error" />;
              } else if (record.state === "finished") {
                return (
                  <React.Fragment>
                    {[
                      "taxonCount",
                      "nameCount",
                      "referenceCount",
                      "distributionCount",
                      "descriptionCount",
                      "vernacularCount",
                      "mediaCount"
                    ].map(c =>
                      !isNaN(_.get(record, `${c}`)) ? (
                        <Tag key={c} color="blue">
                          {_.startCase(c)}: {_.get(record, `${c}`)}
                        </Tag>
                      ) : (
                        ""
                      )
                    )}
                  </React.Fragment>
                );
              } else return null;
            }}
          />
        )}
      </PageContent>
    );
  }
}

const mapContextToProps = ({ user, sectorImportState }) => ({ user, sectorImportState });

export default withContext(mapContextToProps)(SyncTable);
