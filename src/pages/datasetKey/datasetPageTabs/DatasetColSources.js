import React from 'react';
import axios from "axios";

import { Table, Alert, List, Switch, Button, Row, Col } from 'antd';
import config from '../../../config';
import ColSourceMetaDataForm from '../../../components/ColSourceMetaDataForm'
import _ from 'lodash';




const columns = [{
    title: 'Title',
    dataIndex: 'title',
    key: 'title',
    width: 250,
}, {
    title: 'Alias',
    dataIndex: 'alias',
    key: 'alias',
},

{
    title: 'Version',
    dataIndex: 'version',
    key: 'version',
},

{
    title: 'Coverage',
    dataIndex: 'coverage',
    key: 'coverage',
},
{
    title: 'Created',
    dataIndex: 'created',
    key: 'created',
}
];





class ColSourceList extends React.Component {
    constructor(props) {
        super(props);
        this.getData = this.getData.bind(this);
        this.state = {
            data: [],
            dataset: null,
            loading: false,
            editSource: null
        };
    }


    componentWillMount() {
        this.getData()
        this.getDataset()
    }

    getData = () => {

        this.setState({ loading: true });
        const { datasetKey } = this.props;
        axios(`${config.dataApi}colsource?datasetKey=${datasetKey}`)
            .then((res) => {

                this.setState({ loading: false, data: res.data, err: null })
            })
            .catch((err) => {
                this.setState({ loading: false, error: err, data: [] })
            })
    }

    getDataset = () => {
        const { datasetKey } = this.props;

        axios(`${config.dataApi}dataset/${datasetKey}`)
            .then((res) => {

                this.setState({ dataset: res.data, err: null })
            })
            .catch((err) => {
                this.setState({ error: err, dataset: null })
            })
    }

    setEditSource = (checked, source) => {
        if (checked) {
            this.setState({ editSource: source })
        } else {
            this.setState({ editSource: null })
        }
    }

    render() {

        const { data, dataset, editSource, loading, error } = this.state;
        const { datasetKey } = this.props;

        return <div>

            {error && <Alert message={error.message} type="error" />}

            {!editSource && <Button type='primary' size="large" style={{ marginBottom: '20px' }} onClick={() => this.setEditSource(true, { datasetKey: datasetKey, title: _.get(dataset, 'title') || '', description: _.get(dataset, 'description') || '' })}>New Col Source</Button>}
            {editSource && <Button type='primary' size="large" style={{ marginBottom: '20px' }} onClick={() => this.setEditSource(false)}>Cancel</Button>}

            {editSource && editSource.key === undefined && <ColSourceMetaDataForm data={editSource} onSaveSuccess={()=> {this.setEditSource(false); this.getData()}}></ColSourceMetaDataForm>}

            {!error && <Table
                expandedRowRender={record =>
                    <div>
                        <Switch checked={_.get(this.state, 'editSource.key') === record.key} onChange={(checked) => this.setEditSource(checked, record)} checkedChildren="Cancel" unCheckedChildren="Edit" />

                        {_.get(this.state, 'editSource.key') === record.key && <ColSourceMetaDataForm data={record}></ColSourceMetaDataForm>}
                        {_.get(this.state, 'editSource.key') !== record.key &&
                            <Row>
                                <Col span={4}></Col>
                                <Col span={16}>
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={_.map(record, function (value, key) {
                                            return { key: key, value: value };
                                        })}
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
                            </Row>

                        }
                    </div>
                }
                columns={columns} dataSource={data}
                loading={loading} pagination={false} />}
        </div>


    }
}



export default ColSourceList;