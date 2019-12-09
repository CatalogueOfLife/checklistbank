import React from 'react';
import axios from 'axios';
import config from '../../../config'
import {  AutoComplete, Input, Button, Icon } from 'antd'
import _ from 'lodash'
import debounce from 'lodash.debounce';

const Option = AutoComplete.Option;

class ReferenceAutocomplete extends React.Component {

    constructor(props) {
        super(props);

        this.getReferences = debounce(this.getReferences, 500);

        this.state = {
            references: [],
            value: ''
        }
    }

    componentWillUnmount() {
        this.getReferences.cancel();
    }

    getReferences = (q) => {
        const {datasetKey} = this.props;
        axios(`${config.dataApi}dataset/${datasetKey}/reference/search?q=${q}&limit=30`) // ?q=${q}&limit=30
            .then((res) => {
                this.setState({ references: res.data.result})
            })
            .catch((err) => {
                this.setState({ references: [], err })
            })
    }
    onSelectReference = (val, obj) => {
        this.setState({value: val})

        this.props.onSelectReference({key: val, title: obj.props.children})
       // this.setState({ datasetKey: val, datasetName: obj.props.children, selectedDataset: {key: val, title: obj.props.children}})
    }
    onReset = () => {
        this.setState({value: '', references: []})
        this.props.onResetSearch()
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
            dataSource={this.state.references}
            onSelect={this.onSelectReference}
            onSearch={this.getReferences}
            dataSource={this.state.references ? this.state.references.map((o) => ({value: o.id, text: o.citation})) : []}
            placeholder="Find reference"
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

export default ReferenceAutocomplete;