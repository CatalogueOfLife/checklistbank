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
import SectorTable from "../../catalogue/BrokenSectors/SectorTable";
import SyncAllSectorsButton from "../../Admin/SyncAllSectorsButton";
import withContext from "../../../components/hoc/withContext";

class DatasetSectors extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      loading: false,
      syncAllError: null
    };
  }
  componentWillMount = () => {
    const { data } = this.state;
    if (this.props.dataset && data.length === 0) {
      this.getData(this.props.dataset);
    }
  };

  componentWillReceiveProps = nextProps => {
    const { data } = this.state;
    if (nextProps.dataset && data.length === 0) {
      this.getData(nextProps.dataset);
    }
  };
  getData = dataset => {
    this.setState({ loading: true });
    const {catalogueKey} = this.props;
    axios(`${config.dataApi}sector?subjectDatasetKey=${dataset.key}&datasetKey=${catalogueKey}`)
      .then(res => {
        this.setState({
          loading: false,
          data: _.get(res, 'data.result') ? res.data.result.map(d => ({ ...d, dataset: dataset })) : [],
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

  render = () => {
    const { data, error, syncAllError, loading } = this.state;
    return (
      <PageContent>
        {error && <Alert message={<ErrorMsg error={error} />} type="error" />}
        {syncAllError && (
          <Alert message={<ErrorMsg error={syncAllError} />} type="error" />
        )}
        {data.length === 0 ? (
          <h4>No sectors configured</h4>
        ) : (
          <React.Fragment>
            <SyncAllSectorsButton
              onError={err => this.setState({ syncAllError: err })}
              onSuccess={() => this.setState({ syncAllError: null })}
              dataset={this.props.dataset}
              text="Sync all sectors in this dataset"
            />
            {!error && (
              <SectorTable
                data={data}
                loading={loading}
                onDeleteSector={this.onDeleteSector}
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
 