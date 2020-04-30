import React from 'react';
import axios from 'axios';
import config from '../../../config'
import {  AutoComplete, Input, Button, Icon } from 'antd'
import _ from 'lodash'
import debounce from 'lodash.debounce';
import Highlighter from "react-highlight-words";

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

    

    componentDidMount = () => {
        const {defaultDatasetKey} = this.props;
        if(defaultDatasetKey){
            this.setDefaultValue(defaultDatasetKey)
        }
    }

    componentDidUpdate = (prevProps) => {
        const { defaultDatasetKey} = this.props;
        if(defaultDatasetKey && defaultDatasetKey !== prevProps.defaultDatasetKey){
            this.setDefaultValue(defaultDatasetKey)
        }
    }

    componentWillUnmount() {
        this.getDatasets.cancel();
    }

    setDefaultValue = (defaultDatasetKey) => {
        axios(`${config.dataApi}dataset/${defaultDatasetKey}`)
            .then(res => {
                this.setState({value: _.get(res, 'data.title') || ''})
            })
    }

    getDatasets = (q) => {
        const {contributesTo} = this.props;
        axios(`${config.dataApi}dataset?q=${q}&limit=30${contributesTo ? '&contributesTo='+contributesTo : ''}`)
            .then((res) => {
                this.setState({ datasets: res.data.result})
            })
            .catch((err) => {
                this.setState({ datasets: [], err })
            })
    }
    onSelectDataset = (val, obj) => {
        this.setState({value: val})

        this.props.onSelectDataset({key: obj.key, title: val})
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

          const options = this.state.datasets ? this.state.datasets.map((o) => {
              const text = `${o.alias || o.title} [${o.key}]`;
            return (
              <Option key={o.key} value={text}>
                <Highlighter
                  highlightStyle={{ fontWeight: "bold", padding: 0 }}
                  searchWords={value.split(" ")}
                  autoEscape
                  textToHighlight={text}
                />
              </Option>
            );
          }) : [];

        return <AutoComplete
            dataSource={this.state.datasets}
            onSelect={this.onSelectDataset}
            onSearch={this.getDatasets}
            dataSource={options}
            placeholder={this.props.placeHolder || "Find dataset"}
            style={{ width: '100%' }}
            onChange={(value) => this.setState({value})}
            value={value}
            optionLabelProp="value"
        >
            <Input.Search

            suffix={suffix}
          />
        </AutoComplete>
    }

}

export default DatasetAutocomplete;