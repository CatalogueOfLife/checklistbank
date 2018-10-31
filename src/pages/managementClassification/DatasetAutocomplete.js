import React from 'react';
import axios from 'axios';
import config from '../../config'
import {  AutoComplete } from 'antd'
import _ from 'lodash'
import debounce from 'lodash.debounce';

const Option = AutoComplete.Option;

class DatasetAutocomplete extends React.Component {

    constructor(props) {
        super(props);

        this.getDatasets = debounce(this.getDatasets, 500);
        this.onSelectDataset = this.onSelectDataset.bind(this)

        this.state = {
            datasets: []
        }
    }

    componentWillUnmount() {
        this.getDatasets.cancel();
    }

    getDatasets = (q) => {

        axios(`${config.dataApi}dataset?q=${q}&limit=30`)
            .then((res) => {
                this.setState({ datasets: res.data.result})
            })
            .catch((err) => {
                this.setState({ datasets: [], err })
            })
    }
    onSelectDataset = (val, obj) => {
        this.props.onSelectDataset({key: val, title: obj.props.children})
       // this.setState({ datasetKey: val, datasetName: obj.props.children, selectedDataset: {key: val, title: obj.props.children}})
    }
    render = () => {
        return <AutoComplete
            dataSource={this.state.datasets}
            style={{ width: '100%' }}
            onSelect={this.onSelectDataset}
            onSearch={this.getDatasets}
            placeholder="Find dataset"
        >
            {this.state.datasets && this.state.datasets.map((o) => {
                return <Option key={o.key}>{o.title}</Option>
            })}
        </AutoComplete>
    }

}

export default DatasetAutocomplete;