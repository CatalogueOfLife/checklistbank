import React from "react";


import PropTypes from "prop-types";
import config from "../../../config";
import _ from "lodash";
import axios from "axios";
import moment from 'moment'
import { Switch, Tag, Row, Col, Alert } from "antd";
import ImportChart from '../../../components/ImportChart'
import PageContent from '../../../components/PageContent'
import ImportButton from '../../Imports/importTabs/ImportButton'

class DatasetImportMetrics extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
    this.state = { data: null };
  }

  componentWillMount() {
    this.getData();
  }

  getData = () => {
    const { datasetKey } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${datasetKey}/import?limit=3&state=finished`)
      .then(res => {
        this.setState({ loading: false, data: res.data, err: null });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: {} });
      });
  };


  render() {
    const { datasetKey } = this.props;

    return (
      <PageContent>
        {!this.state.loading && this.state.data.length === 0 && <Alert type="warning" message="No finished imports yet"></Alert>}
        <Row style={{padding: '10px'}}>
        <Col span={20}>
          {_.map(['taxonCount', 'nameCount', 'verbatimCount', 'referenceCount', 'distributionCount' ], (c)=>{
            return (_.get(this.state, `data[0].${c}`))? <Tag key={c} color="blue">{_.startCase(c)}: {_.get(this.state, `data[0].${c}`)}</Tag> : '';
          })}
          </Col>
          <Col span={4} style={{textAlign: 'right'}}>
          <ImportButton  record={{datasetKey: datasetKey}}></ImportButton>
          </Col>
        </Row>
        <Row>
          <Col span={12} style={{ padding: '10px' }}>
            {_.get(this.state, 'data[0].taxaByRankCount') && <ImportChart nameSearchParam="rank" defaultType="pie" datasetKey={datasetKey} data={_.get(this.state, 'data[0].taxaByRankCount')} title="Accepted Names by Rank" subtitle={`Imported ${moment(this.state.data[0].finished).format('MMMM Do YYYY, h:mm a')}`} />}
          </Col>
          <Col span={12} style={{ padding: '10px' }}>
          {_.get(this.state, 'data[0].usagesByStatusCount') && <ImportChart nameSearchParam="status" defaultType="pie" datasetKey={datasetKey} data={_.get(this.state, 'data[0].usagesByStatusCount')} title="Usages by status" subtitle={`Imported ${moment(this.state.data[0].finished).format('MMMM Do YYYY, h:mm a')}`} />}


          </Col>
        </Row>
        <Row>
          <Col span={12} style={{ padding: '10px' }}>
            {_.get(this.state, 'data[0].namesByRankCount') && <ImportChart nameSearchParam="rank" defaultType="pie" datasetKey={datasetKey} data={_.get(this.state, 'data[0].namesByRankCount')} title="Names by rank" subtitle={`Imported ${moment(this.state.data[0].finished).format('MMMM Do YYYY, h:mm a')}`} />}
          </Col>
          <Col span={12} style={{ padding: '10px' }}>
          {_.get(this.state, 'data[0].namesByTypeCount') && <ImportChart nameSearchParam="type" defaultType="pie" datasetKey={datasetKey} data={_.get(this.state, 'data[0].namesByTypeCount')} title="Names by type" subtitle={`Imported ${moment(this.state.data[0].finished).format('MMMM Do YYYY, h:mm a')}`} />}

          </Col>
          
        </Row>

        <Row>
          <Col span={12} style={{ padding: '10px' }}>
          {_.get(this.state, 'data[0].namesByOriginCount') && <ImportChart nameSearchParam="origin" defaultType="pie" datasetKey={datasetKey} data={_.get(this.state, 'data[0].namesByOriginCount')} title="Names by origin" subtitle={`Imported ${moment(this.state.data[0].finished).format('MMMM Do YYYY, h:mm a')}`} />}
          </Col>
          <Col span={12} style={{ padding: '10px' }}>
          {_.get(this.state, 'data[0].verbatimByTypeCount') && <ImportChart nameSearchParam="verbatimNameType" defaultType="pie" datasetKey={datasetKey} data={_.get(this.state, 'data[0].verbatimByTypeCount')} title="Verbatim records by type" subtitle={`Imported ${moment(this.state.data[0].finished).format('MMMM Do YYYY, h:mm a')}`} />}

          </Col>
          
        </Row>
        <Row>
          <Col span={24} style={{ padding: '10px' }}>
          {_.get(this.state, 'data[0].vernacularsByLanguageCount') && <ImportChart nameSearchParam="vernacularLang" defaultType="column" datasetKey={datasetKey} data={_.get(this.state, 'data[0].vernacularsByLanguageCount')} title="Vernacular names by language" subtitle={`Imported ${moment(this.state.data[0].finished).format('MMMM Do YYYY, h:mm a')}`} />}
          
          </Col>
          
        </Row>

      </PageContent>
    );
  }
}

export default DatasetImportMetrics;
