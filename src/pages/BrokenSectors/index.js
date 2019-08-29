import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Icon, Tooltip, Input, Button, Row, Col, notification } from "antd";
import config from "../../config";
import moment from "moment";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withContext from "../../components/hoc/withContext";
import kibanaQuery from "../SectorSync/kibanaQuery";
import Highlighter from "react-highlight-words";
import SectorTable from "./SectorTable"
import _ from "lodash";

const { MANAGEMENT_CLASSIFICATION } = config;
class SyncTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      currentDataSourceLength: 0,
      searchText: "",
      loading: false
    };
  }

  componentWillMount() {
    this.getDatasets().then(this.getData);
  }

  getDatasets = async () => {
    let last = false;
    let offset = 0;
    let limit = 100;
    let datasets = [];
    while (!last) {
      const d = await axios(
        `${config.dataApi}dataset?offset=${offset}&limit=${limit}`
      );
      datasets = [...datasets, ...d.data.result];
      offset += limit;
      last = d.data.last;
    }
    return datasets;
  };

  getData = datasets => {
    this.setState({ loading: true });

    Promise.all(
      datasets.map(d => {
        return axios(`${config.dataApi}sector/broken?datasetKey=${d.key}`).then(
          sectors => sectors.data.map(s => ({ ...s, dataset: d }))
        );
      })
    )
      .then(arrays => {
        const mergedArrays = arrays.reduce((a, b) => [...a, ...b]);
        this.setState({ loading: false, error: null, data: mergedArrays, currentDataSourceLength: mergedArrays.length });
      })

      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  getColumnSearchProps = dataIndex => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          placeholder={`Search ${dataIndex.split(".")[0]}`}
          value={selectedKeys[0]}
          onChange={e =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => this.handleSearch(selectedKeys, confirm)}
          style={{ width: 188, marginBottom: 8, display: "block" }}
        />
        <Button
          type="primary"
          onClick={() => this.handleSearch(selectedKeys, confirm)}
          icon="search"
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
    filterIcon: filtered => (
      <Icon type="search" style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      _.get(record, dataIndex)
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    }
  });
  handleSearch = (selectedKeys, confirm) => {
    confirm();
    this.setState({ searchText: selectedKeys[0] });
  };

  handleReset = clearFilters => {
    clearFilters();
    this.setState({ searchText: "" });
  };
  onChange = (pagination, filters, sorter, extra) =>{
    
    this.setState({currentDataSourceLength: extra.currentDataSource.length})
  }

  deleteSectorFromTable = (sector) => {
    this.setState({data: this.state.data.filter(d => d.key !== sector.data.key)})
  }

  onDeleteSector = sector => {
    axios
      .delete(
        `${config.dataApi}sector/${
          sector.key
        }`
      ) 
      .then(() => {

        notification.open({
          message: "Deletion triggered",
          description: `Delete job for ${sector.key} placed on the sync queue`
        });
        this.setState({ data: this.state.data.filter(d => d.key !== sector.key) });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };

  render() {
    const { data, loading, error } = this.state;


    return (
      <Layout
        selectedKeys={["sectorBroken"]}
        openKeys={["assembly"]}
        title="Broken sectors"
      >
        <PageContent>
        {error && <Alert 
        closable
        onClose={() => this.setState({ error: null })}
        message={error.message} type="error" />}
          {!error && 
        <SectorTable data={data} loading={loading} onSectorRematch={this.deleteSectorFromTable} onDeleteSector={this.onDeleteSector}></SectorTable>}

        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ user }) => ({ user });

export default withContext(mapContextToProps)(SyncTable);
