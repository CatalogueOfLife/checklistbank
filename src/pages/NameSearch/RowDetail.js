import React from "react";
import {Row, Col, Tag} from 'antd'
import Classification from './Classification'
import _ from 'lodash'
import withContext from "../../components/hoc/withContext"

const RowDetail =  ({issues, usage, classification, issueMap}) => (
    <React.Fragment>
        {_.get(usage, 'id') &&   <Row style={{marginBottom: '10px'}}>
            <Col span={3} style={{textAlign: 'right', paddingRight: '16px', fontWeight: 'bold'}}>ID:</Col>
        <Col  span={18}>{_.get(usage, 'id')}</Col>
        </Row> }
        {classification &&   <Row style={{marginBottom: '10px'}}>
            <Col span={3} style={{textAlign: 'right', paddingRight: '16px', fontWeight: 'bold'}}>Classification:</Col>
       <Col  span={18}><Classification
          classification={_.initial(classification)}
          datasetKey={_.get(usage, "name.datasetKey")}
        /></Col>
        </Row>}
     {issues &&   <Row >
            <Col span={3} style={{textAlign: 'right', paddingRight: '16px', fontWeight: 'bold'}}>Issues:</Col>
        <Col  span={18}>{issues.map(i => (
            <Tag key={i} color={_.get(issueMap, `[${i}].color`)}>
              {i}
            </Tag>
          ))
        }</Col>
        </Row> }
    </React.Fragment>
)

const mapContextToProps = ({ issueMap }) => ({ issueMap });
export default withContext(mapContextToProps)(RowDetail)