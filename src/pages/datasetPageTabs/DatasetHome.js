import React from 'react';
import PropTypes from 'prop-types';
import config from '../../config';
import _ from 'lodash'
import axios from "axios";
import { Switch, List, Row, Col } from 'antd'
import MetaDataForm from '../../components/MetaDataForm'
class DatasetHome extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
    this.setEditMode = this.setEditMode.bind(this);
    this.state = { data: null, editMode: false }
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
    this.setState({ editMode: checked })
  }

  render() {

    const { data, editMode } = this.state;
    const listData = _.map(data, function (value, key) {
      return { key: key, value: value };
    });
    return (
      <div>
        <Row>
          <Col span={4}></Col>
          <Col span={16}>
            <Switch onChange={this.setEditMode} checkedChildren="Cancel" unCheckedChildren="Edit" />

          </Col>
          <Col span={4}></Col>
        </Row>


        {editMode && <MetaDataForm data={data}></MetaDataForm>}
        {!editMode &&
          <Row>
            <Col span={4}></Col>
            <Col span={16}>
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
            </Col>
            <Col span={4}></Col>
          </Row>}



      </div>
    );
  }
}



export default DatasetHome;