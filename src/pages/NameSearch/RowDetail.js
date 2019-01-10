import React from "react";
import {Row, Col, Tag} from 'antd'
import Classification from './Classification'
import _ from 'lodash'
export default   ({issues, usage, classification}) => (
    <React.Fragment>
        {_.get(usage, 'id') &&   <Row style={{marginBottom: '10px'}}>
            <Col span={2} style={{textAlign: 'right', paddingRight: '16px', fontWeight: 'bold'}}>ID:</Col>
        <Col  span={18}>{_.get(usage, 'id')}</Col>
        </Row> }
        <Row style={{marginBottom: '10px'}}>
            <Col span={2} style={{textAlign: 'right', paddingRight: '16px', fontWeight: 'bold'}}>Classification:</Col>
        <Col  span={18}><Classification
          classification={_.initial(classification)}
          datasetKey={_.get(usage, "name.datasetKey")}
        /></Col>
        </Row>
     {issues &&   <Row >
            <Col span={2} style={{textAlign: 'right', paddingRight: '16px', fontWeight: 'bold'}}>Issues:</Col>
        <Col  span={18}>{issues.map(i => (
            <Tag key={i} color="red">
              {i}
            </Tag>
          ))
        }</Col>
        </Row> }
    </React.Fragment>
)