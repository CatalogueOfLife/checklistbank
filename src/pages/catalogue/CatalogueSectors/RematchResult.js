import React from "react";
import { Tag, Row, Col } from "antd";
import _ from "lodash";
const RematchResult = ({ rematchInfo }) => {
  
   return <React.Fragment>
      <Row>
        {["broken", "updated", "unchanged", "total"].map(category => (
          <Tag style={{width: '120px'}} key={category}>
            {_.startCase(category)}: {_.get(rematchInfo, `[${category}]`)}
          </Tag>
        ))}
      </Row>
    </React.Fragment>;
  };
export default RematchResult;
