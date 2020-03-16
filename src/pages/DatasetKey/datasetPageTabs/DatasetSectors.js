import React from "react";
import axios from "axios";
import _ from "lodash";
import {
  List,
  Breadcrumb,
  Button,
  Alert,
  Icon,
  Tooltip,
  notification
} from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import { NavLink } from "react-router-dom";
import PageContent from "../../../components/PageContent";
import config from "../../../config";
import SectorTable from "../../catalogue/CatalogueSectors/SectorTable";
import SyncAllSectorsButton from "../../Admin/SyncAllSectorsButton";
import withContext from "../../../components/hoc/withContext";
import qs from "query-string";
import history from "../../../history"
const PAGE_SIZE = 500;
class DatasetSectors extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      pagination: {
        pageSize: PAGE_SIZE,
        current: 1,
        showQuickJumper: true
      },
      loading: false,
      syncAllError: null
    };
  }


  componentDidMount() {
    // this.getData();
    const { data } = this.state;
    if (this.props.dataset && data.length === 0) {
      this.init()
    }
   }
 
   componentDidUpdate = (prevProps) => {
     if((_.get(prevProps, "location.search") !== _.get(this.props, "location.search")) || (_.get(this.props, 'dataset.key') !== _.get(prevProps, 'dataset.key'))){
       this.init()
     }
   }

init = () => {
  let params = qs.parse(_.get(this.props, "location.search"));
  if (_.isEmpty(params)) {
    params = { limit: PAGE_SIZE, offset: 0 };
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: `?limit=${PAGE_SIZE}&offset=0`
    });
  }
 
  this.setState({  pagination: {
    pageSize: params.limit,
    current: (Number(params.offset) / Number(params.limit)) +1,
    pageSize: PAGE_SIZE

  } }, () => this.getData(this.props.dataset));
}


  getData = dataset => {
    this.setState({ loading: true });
    const {catalogueKey} = this.props;
    const params = {...qs.parse(_.get(this.props, "location.search")), datasetKey: catalogueKey, subjectDatasetKey: dataset.key};

    axios(`${config.dataApi}sector?${qs.stringify(params)}`)
      .then(res => {
        if(_.get(res, 'data.result')){
          res.data.result.forEach(d => { d.dataset = dataset })
        }
        this.setState({
          loading: false,
          data: res.data.result || [],
          pagination: {...this.state.pagination, total: _.get(res, 'data.total')},
          err: null
        });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };


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

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
   
    const params = {
      ...qs.parse(_.get(this.props, "location.search")), 
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize
    }


    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(params)
    });

    
  };

  render = () => {
    const { data, error, syncAllError, loading, pagination } = this.state;
    const {catalogueKey} = this.props;
    return (
      <PageContent>
        {error && <Alert message={<ErrorMsg error={error} />} type="error" />}
        {syncAllError && (
          <Alert message={<ErrorMsg error={syncAllError} />} type="error" />
        )}
        {!loading && data.length === 0 ? (
          <h4>No sectors configured</h4>
        ) : (
          <React.Fragment>
            <SyncAllSectorsButton
              onError={err => this.setState({ syncAllError: err })}
              onSuccess={() => this.setState({ syncAllError: null })}
              dataset={this.props.dataset}
              catalogueKey={catalogueKey}
              text="Sync all sectors in this dataset"
            />
            {!error && (
              <SectorTable
                data={data}
                loading={loading}
                onDeleteSector={this.onDeleteSector}
                handleTableChange={this.handleTableChange}
                pagination={pagination}
              />
            )}
          </React.Fragment>
        )}
      </PageContent>
    );
  };
}


 const mapContextToProps = ({
  catalogueKey
}) => ({ catalogueKey });

export default withContext(mapContextToProps)(DatasetSectors);
 