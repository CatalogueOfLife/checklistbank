import React from 'react';
import PropTypes from 'prop-types';
import config from '../../config';

import axios from "axios";
import { NavLink } from "react-router-dom";
import { Collapse, Alert, Spin, Tag, List } from 'antd';
import ErrorMsg from '../../components/ErrorMsg';

import Layout from '../../components/Layout'
import _ from 'lodash';


const { Panel } = Collapse;


class NamePage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            dataset: null,
            name: null,
            verbatim: null,
            nameLoading: true,
            datasetLoading: true,
            verbatimLoading: true,
            nameError: null,
            datasetError: null,
            verbatimError: null
        }
    }

    componentWillMount() {
        this.getDataset()
        this.getName()

    }

    getDataset = () => {
        const { match: { params: { key } } } = this.props;

        this.setState({ datasetLoading: true });
        axios(`${config.dataApi}dataset/${key}`)
            .then((res) => {

                this.setState({ datasetLoading: false, dataset: res.data, datasetError: null })
            })
            .catch((err) => {
                this.setState({ datasetLoading: false, datasetError: err, dataset: null })
            })
    }
    getReference = (referenceKey) => {
        const { match: { params: { key } } } = this.props;

        axios(`${config.dataApi}dataset/${key}/reference/${encodeURIComponent(referenceKey)}`)
            .then((res) => {
                
                this.setState({ referenceLoading: false, reference: res.data, referenceError: null })
            })
            .catch((err) => {
                this.setState({ referenceLoading: false, referenceErrorError: err, name: null })
            })
    }    
    getName = () => {
        const { match: { params: { key, nameKey } } } = this.props;

        this.setState({ nameLoading: true });
        axios(`${config.dataApi}dataset/${key}/name/${encodeURIComponent(nameKey)}`)
            .then((res) => {
                
                this.setState({ nameLoading: false, name: res.data, nameError: null }, 
                    () => {
                        this.getVerbatim(res.data.verbatimKey)
                        if(res.data.publishedInId){
                            this.getReference(res.data.publishedInId)
                        }
                    })
            })
            .catch((err) => {
                this.setState({ nameLoading: false, nameError: err, name: null })
            })
    }
    getVerbatim = (verbatimKey) => {
        const { match: { params: { key } } } = this.props;

        this.setState({ verbatimLoading: true });
        axios(`${config.dataApi}dataset/${key}/verbatim/${encodeURIComponent(verbatimKey)}`)
            .then((res) => {

                this.setState({ verbatimLoading: false, verbatim: res.data, verbatimError: null })
            })
            .catch((err) => {
                this.setState({ verbatimLoading: false, verbatimError: err, verbatim: null })
            })
    }


    render() {
        const { datasetLoading, nameLoading, verbatimLoading, dataset, name, reference, verbatim, nameError, datasetError, verbatimError } = this.state;
        const verbatimData = (!verbatim) ? [] : _.map(verbatim.terms, function (value, key) {
            return { key: _.startCase(key), value: value };
        });

        const nameListData = (!name) ? [] : _.map(_.pick(name, ['id', 'homotypicNameId', 'scientificName', 'genus', 'specificEpithet', 'authorship']), function (value, key) {
            return { key: _.startCase(key), value: value };
        });
        if (nameListData.length > 0) {
            nameListData.unshift({
                value: <div>
                    {['rank', 'code', 'origin', 'type'].map((i) => (!_.isUndefined(name[i])) ? <Tag key={i} color="blue">{i} : {name[i]}</Tag> : ''
                    )}
                    {['candidatus', 'available', 'legitimate', 'parsed'].map((i) =>
                        (!_.isUndefined(name[i])) ? <Tag key={i} color={(name[i] === true) ? 'green' : 'red'}>{i} : {name[i].toString()}</Tag> : ''
                    )}
                </div>
            })
        }

        return (
            <Layout selectedMenuItem="datasetKey" selectedDataset={dataset} selectedName={name} section="name">
                {name && <h1>Name details: {name.scientificName} {name.authorship}</h1>}

                <Collapse defaultActiveKey={['reference', 'issues', 'name', 'verbatim']} >

                 {reference && reference.citation && <Panel header="Reference" key="reference">
                        
                            <div>
                                {reference.citation}
                            </div>
                        
                    </Panel>}
                    <Panel header="Issues" key="issues">
                        {verbatimLoading && <Spin />}
                        {verbatimError && <Alert message={<ErrorMsg error={verbatimError}></ErrorMsg>} type="error" />}
                        {verbatim && verbatim.issues && verbatim.issues.length > 0 &&
                            <div>
                                {verbatim.issues.map((i) => <Tag key={i} color="red">{i}</Tag>
                                )}
                            </div>
                        }
                    </Panel>

                    <Panel header="Name" key="name">
                        {nameLoading && <Spin />}
                        {nameError && <Alert message={<ErrorMsg error={nameError}></ErrorMsg>} type="error" />}
                        {nameListData && nameListData.length > 1 && <List
                            itemLayout="horizontal"
                            dataSource={nameListData}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta title={item.key} description={item.value} />
                                </List.Item>
                            )}
                        />}




                    </Panel>

                    <Panel header="Verbatim" key="verbatim">
                        {verbatimLoading && <Spin />}
                        {verbatimError && <Alert message={<ErrorMsg error={verbatimError}></ErrorMsg>} type="error" />}
                        {verbatim && verbatim.terms && !_.isEmpty(verbatim.terms) &&
                            <List
                                itemLayout="horizontal"
                                dataSource={verbatimData}
                                renderItem={item => (
                                    <List.Item>
                                        <List.Item.Meta title={item.key} description={item.value} />
                                    </List.Item>
                                )}
                            />
                        }
                    </Panel>

                </Collapse>

            </Layout>
        );
    }
}



export default NamePage;