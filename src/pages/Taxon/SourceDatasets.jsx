import React from "react";
import { NavLink } from "react-router-dom";
import { Row, Col } from "antd";

const SourceDatasets = ({
  datasetKey,
  sourceDatasetKeyMap,
  primarySourceDatasetKey,
  style,
}) => {
  return (
    <div style={style}>
      {Object.keys(sourceDatasetKeyMap)
        .filter((s) => Number(s) !== Number(primarySourceDatasetKey))
        .map((s) => (
          <Row key={s}>
            <Col style={{ paddingRight: "5px" }}>
              <NavLink
                to={{
                  pathname: `/dataset/${datasetKey}/source/${s}`,
                }}
              >
                {`[${s}]`}
              </NavLink>
            </Col>
            <Col span={20} flex="auto">
              <span id={`col-sourcedataset-${s}`}>
                {sourceDatasetKeyMap[s]?.title}
              </span>
            </Col>
          </Row>
        ))}
    </div>
  );
};

export default SourceDatasets;
