import React from 'react';
import PropTypes from 'prop-types';
import config from '../../config';
import _ from 'lodash'
import axios from "axios";
import { List } from 'antd'
import { Switch } from 'antd';

class MetaDataForm extends React.Component {
  constructor(props) {
    super(props);
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

setEditMode(checked) {
  this.setState({editMode: checked})
}

  render() {
    
    const {data} = this.props;
    
    return (
      <div>
      <Switch  onChange={this.setEditMode} checkedChildren="Cancel" unCheckedChildren="Edit"/>
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
    </div>
    );
  }
}



export default MetaDataForm;