import React from "react";
import { Tag, Row, Col } from "antd";
import _ from "lodash";
const RematchResult = ({ rematchInfo }) => {
  
   return <React.Fragment>
      <Row key={type}>
        <Col span={4} key={type}>{_.startCase(type)}</Col>
        {["broken", "updated", "unchanged", "total"].map(category => (
          <Tag style={{width: '120px'}} key={category}>
            {_.startCase(category)}: {_.get(rematchInfo, `[${type}][${category}]`)}
          </Tag>
        ))}
        <Col></Col>
      </Row>

      <Row>
        <Col span={4}>Datasets</Col>
        <Col>{_.get(rematchInfo, 'datasets')}</Col>
      </Row>
    </React.Fragment>;
  };
export default RematchResult;
