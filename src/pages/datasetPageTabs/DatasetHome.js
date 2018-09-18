import React from 'react';
import PropTypes from 'prop-types';
import config from '../../config';
import _ from 'lodash'
import axios from "axios";
import { List } from 'antd'

class DatasetHome extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
    this.state = { data: null}
  }

  componentWillMount() {
    this.getData()
}

  getData = () => {
    const { id } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${id}`)
        .then((res) => {

            this.setState({ loading: false, data: res.data, err: null })
        })
        .catch((err) => {
            this.setState({ loading: false, error: err, data: {} })
        })
}

 

  render() {
    
    const {data} = this.state;
    const listData = _.map(data, function(value, key) {
      return { key: key, value: value };
    });
    console.log(listData)
    return (
        
      <List
      itemLayout="horizontal"
      dataSource={listData}
      renderItem={item => (
        <List.Item>
          <List.Item.Meta
            title={item.key}
            description={item.value}
          />
        </List.Item>
      )}
    />
    );
  }
}



export default DatasetHome;