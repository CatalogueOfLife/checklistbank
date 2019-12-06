import React from 'react';
import axios from 'axios';
import config from '../../../config'
import {  AutoComplete, Input, Button, Icon } from 'antd'
import _ from 'lodash'
import debounce from 'lodash.debounce';

const Option = AutoComplete.Option;

class DatasetAutocomplete extends React.Component {

    constructor(props) {
        super(props);

        this.getDatasets = debounce(this.getDatasets, 500);

        this.state = {
            datasets: [],
            value: ''
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
        this.setState({value: val})

        this.props.onSelectDataset({key: val, title: obj.props.children})
       // this.setState({ datasetKey: val, datasetName: obj.props.children, selectedDataset: {key: val, title: obj.props.children}})
    }
    onReset = () => {
        this.setState({value: '', datasets: []})
        if(this.props.onResetSearch && typeof this.props.onResetSearch === 'function') {
            this.props.onResetSearch()
        } 
    }
    render = () => {
        const {value} = this.state;

        const suffix = (value) ?
            <Icon
              type="close-circle"
              key="suffix"
              onClick={this.onReset}
              style={{ marginRight: "6px" }}

            /> : ''
          ;
        return <AutoComplete
            dataSource={this.state.datasets}
            onSelect={this.onSelectDataset}
            onSearch={this.getDatasets}
            dataSource={this.state.datasets ? this.state.datasets.map((o) => ({value: o.key, text: `${o.alias || o.title} [${o.key}]`})) : []}
            placeholder="Find dataset"
            style={{ width: '100%' }}
            onChange={(value) => this.setState({value})}
            value={value}
        >
            <Input.Search

            suffix={suffix}
          />
        </AutoComplete>
    }

}

export default DatasetAutocomplete;