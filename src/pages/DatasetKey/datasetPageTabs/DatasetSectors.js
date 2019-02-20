
import React from "react";
import axios from "axios";
import _ from 'lodash'
import { List, Breadcrumb, Button, Alert, notification } from "antd";
import ErrorMsg from '../../../components/ErrorMsg';
import { NavLink } from "react-router-dom";
import PageContent from '../../../components/PageContent'
import chai from 'chai'
import config from "../../../config";

const {expect} = chai;

class DatasetSectors extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            data: [],
            loading: false,
        };
    }

    componentWillMount() {
        this.getData();
    }

    getData = () => {
        this.setState({ loading: true });
        const { datasetKey } = this.props;
        axios(`${config.dataApi}sector?datasetKey=${datasetKey}`)
            .then(res => {
                const promises = [];
                _.each(res.data, (t) => {
                    expect(t, 'Sector subject must have an id').to.have.nested.property('subject.id')
                    promises.push(axios(`${config.dataApi}dataset/${datasetKey}/tree/${_.get(t, 'subject.id')}`)
                        .then((path) => {
                            t.path = path.data
                        }))

                })
                return Promise.all(promises).then(() => {
                    return res
                })
            })
            .then(res => {
                console.log(res[0])
                this.setState({ loading: false, data: res.data, err: null });
            })
            .catch(err => {
                this.setState({ loading: false, error: err, data: [] });
            });
    };

    deleteSector = (sector) => {
        axios.delete(`${config.dataApi}sector/${sector.key}`)
            .then(() => {
                _.remove(this.state.data, {
                    key: sector.key
                });
                this.setState({ ...this.state.data }, () => {
                    notification.open({
                        message: 'Sector deleted',
                        description: <React.Fragment><span dangerouslySetInnerHTML={{__html: _.get(sector, `path[${sector.path.length -1}].name`)}}></span> was deleted from the CoL assembly </React.Fragment>
                    });
                });
            })
            .catch(err => {
                this.setState({ error: err });
            });

    }

    render = () => {
        const { data, error } = this.state;
        const { datasetKey } = this.props
        return (<PageContent>
                    {error && <Alert message={<ErrorMsg error={error}></ErrorMsg>} type="error" />}

            <List
                bordered
                dataSource={data}
                renderItem={item => (<List.Item actions={[<Button type="danger" onClick={() => this.deleteSector(item)}>Delete</Button>]}><Breadcrumb separator=">">
                    {item.path.reverse().map((taxon) => {
                        return (<Breadcrumb.Item key={taxon.id} >
                            <NavLink
                                to={{
                                    pathname: `/dataset/${datasetKey}/classification`,
                                    search: `?taxonKey=${taxon.id}`
                                }}
                            >
                              <span dangerouslySetInnerHTML={{__html: taxon.name}}></span>  
                            </NavLink>
                        </Breadcrumb.Item>)
                    })}

                </Breadcrumb>
                </List.Item>)}
            />

        </PageContent>)
    }
}

export default DatasetSectors;