import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"
import linkify from 'linkify-html';
import { NavLink } from "react-router-dom";
import { LinkOutlined } from "@ant-design/icons";
import { Row, Col } from "antd"

const ReferencesTable = ({ data, referenceIndexMap, style }) => {
  return (
    <div style={style}>
      {_.values(data)

        .map(s => (
          <Row>
            <Col style={{ paddingRight: "5px" }}>
              <NavLink to={{ pathname: `/dataset/${s?.datasetKey}/reference/${encodeURIComponent(s?.id)}` }}>
                {_.get(referenceIndexMap, s.id) ? `[${_.get(referenceIndexMap, s.id)}]` : <LinkOutlined />}
              </NavLink>
            </Col>
            <Col span={20} flex="auto">
              <span id={`col-refererence-${s.id}`}
                dangerouslySetInnerHTML={{ __html: s?.citation ? linkify(s?.citation) : "" }}
              ></span>
            </Col>



          </Row>

        ))}
    </div>
  );
};

export default ReferencesTable;
