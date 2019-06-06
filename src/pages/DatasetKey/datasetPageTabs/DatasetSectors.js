
import React from "react";
import axios from "axios";
import _ from 'lodash'
import { List, Breadcrumb, Button, Alert, Icon, Tooltip, notification } from "antd";
import ErrorMsg from '../../../components/ErrorMsg';
import { NavLink } from "react-router-dom";
import PageContent from '../../../components/PageContent'
import chai from 'chai'
import config from "../../../config";
import SectorTable from "../../BrokenSectors/SectorTable";
import SyncAllSectorsButton from "../../Admin/SyncAllSectorsButton"
const {expect} = chai;

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
        const {data} = this.state;
        if (this.props.dataset && data.length === 0){
            this.getData(this.props.dataset)
        }
    }
    
    componentWillReceiveProps = (nextProps) => {
        const {data} = this.state;
        if (nextProps.dataset && data.length === 0){
            this.getData(nextProps.dataset)
        }
    }
    getData = (dataset) => {
        this.setState({ loading: true });
        axios(`${config.dataApi}sector?datasetKey=${dataset.key}`)
            
            .then(res => {
                this.setState({ loading: false, data: res.data.map(d => ({...d, dataset: dataset})), err: null });
            })
            .catch(err => {
                this.setState({ loading: false, error: err, data: [] });
            });
    };

    deleteSector = (sector) => {
        axios.delete(`${config.dataApi}sector/${sector.key}`)
            .then(() => {
                _.remove(this.state.data, {
                    key: sector.key
                });
                this.setState({ ...this.state.data }, () => {
                    notification.open({
                        message: 'Sector deleted',
                        description: <React.Fragment><span dangerouslySetInnerHTML={{__html: _.get(sector, `path[${sector.path.length -1}].name`)}}></span> was deleted from the CoL assembly </React.Fragment>
                    });
                });
            })
            .catch(err => {
                this.setState({ error: err });
            });

    }


    render = () => {
        const { data, error, syncAllError, loading } = this.state;
        return (<PageContent>
                    {error && <Alert message={<ErrorMsg error={error}></ErrorMsg>} type="error" />}
                    {syncAllError && <Alert message={<ErrorMsg error={syncAllError} />} type="error" />}

<SyncAllSectorsButton 
  onError={err => this.setState({syncAllError: err})}
  onSuccess={() => this.setState({syncAllError: null})}
  dataset={this.props.dataset}
  text="Sync all sectors in this dataset"
/>
          {!error && 
        <SectorTable data={data} loading={loading} deleteSectorFromTable={()=> true}></SectorTable>}

        </PageContent>)
    }
}

export default DatasetSectors;