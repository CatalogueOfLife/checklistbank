import React from 'react';
import axios from 'axios';
import config from '../../config'
import {  AutoComplete, Icon, Input } from 'antd'
import _ from 'lodash'
import debounce from 'lodash.debounce';

const Option = AutoComplete.Option;

class NameSearchAutocomplete extends React.Component {

    constructor(props) {
        super(props);

        this.getNames = debounce(this.getNames, 500);
        this.state = {
            names: [],
            value: ''
        }
    }

    componentWillUnmount() {
        this.getNames.cancel();
    }

    getNames = (q) => {
        const {sortBy, datasetKey} = this.props;
        const url = datasetKey ? `${config.dataApi}dataset/${datasetKey}/name/search` : `${config.dataApi}name/search`;
        
        axios(`${url}?&sortBy=${sortBy || "TAXONOMIC"}&status=accepted&limit=25&offset=0&q=${q}`)
            .then((res) => {
                this.setState(
                    { names: res.data.result.map(name => ({key: name.usage.id || name.usage.name.id, title: name.usage.name.scientificName}))}
                    )
            })
            .catch((err) => {
                this.setState({ names: [], err })
            })
    }
    onSelectName = (val, obj) => {
        this.setState({value: val})
        this.props.onSelectName({key: val, title: obj.props.children})
    }
    onReset = () => {
        this.setState({value: '', names: []})
        this.props.onResetSearch()
    }
    render = () => {
        const {placeHolder, autoFocus} = this.props;
        const {value} = this.state;
        const options= this.state.names.map((o) => {
            return <Option key={o.key}>{o.title}</Option>
        })
        const suffix = (value) ?
            <Icon
              type="close-circle"
              key="suffix"
              onClick={this.onReset}
              style={{ marginRight: "6px" }}

            /> : ''
          ;
        return <AutoComplete
            dataSource={this.state.names}
            style={{ width: '100%' }}
            onSelect={this.onSelectName}
            onSearch={this.getNames}
            placeholder={placeHolder || "Find taxon" }
            dataSource={options}
            onChange={(value) => this.setState({value})}
            value={value}
            autoFocus={autoFocus === false ? false : true}
      
        >
        <Input.Search 
                    suffix={suffix}

        />
            
        </AutoComplete>




    }

}

export default NameSearchAutocomplete;