
import React from "react";
import axios from "axios";
import _ from 'lodash'
import { List, Breadcrumb, Button, Alert, notification } from "antd";
import ErrorMsg from '../../../components/ErrorMsg';
import { NavLink } from "react-router-dom";

import config from "../../../config";



class ColSourceSectorList extends React.Component {
    constructor(props) {
        super(props);
        this.getData = this.getData.bind(this);
        this.deleteSector = this.deleteSector.bind(this);
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
        const { sourceKey, datasetKey } = this.props;
        axios(`${config.dataApi}sector?sourceKey=${sourceKey}`)
            .then(res => {
                const promises = [];
                _.each(res.data, (t) => {
                    promises.push(axios(`${config.dataApi}dataset/${datasetKey}/tree/${t.attachment.id}`)
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
        console.log(sector)
        axios.delete(`${config.dataApi}sector/${sector.key}`)
            .then(() => {
                _.remove(this.state.data, {
                    key: sector.key
                });
                this.setState({ ...this.state.data }, () => {
                    notification.open({
                        message: 'Sector deleted',
                        description: `${sector.attachment.name} was deleted from the Management classification`
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
        return (<div>
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
                                {taxon.name}
                            </NavLink>
                        </Breadcrumb.Item>)
                    })}

                </Breadcrumb>
                </List.Item>)}
            />

        </div>)
    }
}

export default ColSourceSectorList;