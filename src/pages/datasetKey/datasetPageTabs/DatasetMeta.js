import React from "react";
import PropTypes from "prop-types";
import config from "../../../config";
import _ from "lodash";
import axios from "axios";
import { Switch, List, Row, Col } from "antd";
import MetaDataForm from "../../../components/MetaDataForm";
import LogoUpload from "../../../components/LogoUpload"
import ArchiveUpload from "../../../components/ArchiveUpload"
class DatasetMeta extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
    this.setEditMode = this.setEditMode.bind(this);
    this.state = { data: null, editMode: false };
  }

  componentWillMount() {
    this.getData();
  }

  getData = () => {
    const { id } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${id}`)
      .then(res => {
        this.setState({ loading: false, data: res.data, err: null });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: {} });
      });
  };

  setEditMode(checked) {
    this.setState({ editMode: checked });
  }

  render() {
    const { data, editMode } = this.state;
    const listData = _.map(data, function(value, key) {
      return { key: _.startCase(key), value: value };
    });
    return (
      <div>
        <Row>
          <Col span={4} />
          <Col span={8}><LogoUpload datasetKey={this.props.id}></LogoUpload></Col>
          <Col span={8}><ArchiveUpload datasetKey={this.props.id}></ArchiveUpload></Col>
          <Col span={4} />
          </Row>
        <Row>
          <Col span={4} />
          <Col span={16}>
          {data && data.origin !== 'external' &&  <Switch
              checked={editMode}
              onChange={this.setEditMode}
              checkedChildren="Cancel"
              unCheckedChildren="Edit"
            /> }
          </Col>
          <Col span={4} />
        </Row>

        {editMode && (
          <MetaDataForm
            data={data}
            onSaveSuccess={() => {
              this.setEditMode(false);
            }}
          />
        )}
        {!editMode && (
          <Row>
            <Col span={4} />
            <Col span={16}>
              <List
                itemLayout="horizontal"
                dataSource={listData}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta title={item.key} description={item.value} />
                  </List.Item>
                )}
              />
            </Col>
            <Col span={4} />
          </Row>
        )}
      </div>
    );
  }
}

export default DatasetMeta;
