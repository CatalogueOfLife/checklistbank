import React from "react";
import { Tag, Row, Col } from "antd";
import _ from "lodash";
const RematchResult = ({ rematchInfo }) => {
  
   return <React.Fragment>{["sectors", "decisions", "estimates"].filter(type => !_.isUndefined(rematchInfo[type]) ).map(type => (
      <Row key={type}>
        <Col span={4} key={type}>{_.startCase(type)}</Col>
        {["broken", "updated", "unchanged", "total"].map(category => (
          <Tag style={{width: '120px'}} key={category}>
            {_.startCase(category)}: {_.get(rematchInfo, `[${category}]`)}
          </Tag>
        ))}
      </Row>
    )
    
    )}

  {_.get(rematchInfo, 'datasets') &&  <Row>
    <Col span={4}>Datasets</Col>
    <Col>{_.get(rematchInfo, 'datasets')}</Col>
    </Row>}
    
    
    </React.Fragment>;
  };
export default RematchResult;
