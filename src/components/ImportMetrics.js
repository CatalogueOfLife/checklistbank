import React from "react";
import _ from "lodash";
import moment from 'moment'
import {  Tag, Row, Col } from "antd";
import ImportChart from './ImportChart'


const ImportMetrics = ({data}) => {
    const { datasetKey} = data;
    return (
      <React.Fragment>
        <Row style={{padding: '10px'}}>
        <Col span={24}>
          {_.map(['taxonCount', 'nameCount', 'verbatimCount', 'referenceCount', 'distributionCount', 'vernacularCount' ], (c)=>{
            return (_.get(data, `${c}`))? <Tag key={c} color="blue">{_.startCase(c)}: {_.get(data, `${c}`)}</Tag> : '';
          })}
          </Col>
        </Row>
        <Row>
          <Col span={12} style={{ padding: '10px' }}>
            {_.get(data, 'taxaByRankCount') && <ImportChart nameSearchParam="rank" defaultType="pie" datasetKey={datasetKey} data={_.get(data, 'taxaByRankCount')} title="Accepted Names by Rank" subtitle={`Imported ${moment(data.finished).format('MMMM Do YYYY, h:mm a')}`} />}
          </Col>
          <Col span={12} style={{ padding: '10px' }}>
          {_.get(data, 'usagesByStatusCount') && <ImportChart nameSearchParam="status" defaultType="pie" datasetKey={datasetKey} data={_.get(data, 'usagesByStatusCount')} title="Usages by status" subtitle={`Imported ${moment(data.finished).format('MMMM Do YYYY, h:mm a')}`} />}


          </Col>
        </Row>
        <Row>
          <Col span={12} style={{ padding: '10px' }}>
            {_.get(data, 'namesByRankCount') && <ImportChart nameSearchParam="rank" defaultType="pie" datasetKey={datasetKey} data={_.get(data, 'namesByRankCount')} title="Names by rank" subtitle={`Imported ${moment(data.finished).format('MMMM Do YYYY, h:mm a')}`} />}
          </Col>
          <Col span={12} style={{ padding: '10px' }}>
          {_.get(data, 'namesByTypeCount') && <ImportChart nameSearchParam="type" defaultType="pie" datasetKey={datasetKey} data={_.get(data, 'namesByTypeCount')} title="Names by type" subtitle={`Imported ${moment(data.finished).format('MMMM Do YYYY, h:mm a')}`} />}

          </Col>
          
        </Row>

        <Row>
          <Col span={12} style={{ padding: '10px' }}>
          {_.get(data, 'namesByOriginCount') && <ImportChart nameSearchParam="origin" defaultType="pie" datasetKey={datasetKey} data={_.get(data, 'namesByOriginCount')} title="Names by origin" subtitle={`Imported ${moment(data.finished).format('MMMM Do YYYY, h:mm a')}`} />}
          </Col>
          <Col span={12} style={{ padding: '10px' }}>
          {_.get(data, 'verbatimByTypeCount') && <ImportChart nameSearchParam="type" verbatim={true} defaultType="pie" datasetKey={datasetKey} data={_.get(data, 'verbatimByTypeCount')} title="Verbatim records by type" subtitle={`Imported ${moment(data.finished).format('MMMM Do YYYY, h:mm a')}`} />}

          </Col>
          
        </Row>
        <Row>
          <Col span={24} style={{ padding: '10px' }}>
          {_.get(data, 'vernacularsByLanguageCount') && <ImportChart nameSearchParam="vernacularLang" defaultType="column" datasetKey={datasetKey} data={_.get(data, 'vernacularsByLanguageCount')} title="Vernacular names by language" subtitle={`Imported ${moment(data.finished).format('MMMM Do YYYY, h:mm a')}`} />}
          
          </Col>
          
        </Row>
        </React.Fragment>
    );
  }


export default ImportMetrics;
