import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem";
import linkify from "linkify-html";
import { NavLink } from "react-router-dom";
import { LinkOutlined } from "@ant-design/icons";
import { Row, Col } from "antd";
import MergedDataBadge from "../../components/MergedDataBadge";

const ReferencesTable = ({
  data,
  referenceIndexMap,
  primarySourceDatasetKey,
  style,
}) => {
  return (
    <div style={style}>
      {_.values(data).map((s) => (
        <>
          <Row key={s.id}>
            <Col style={{ paddingRight: "5px" }}>
              <NavLink
                to={{
                  pathname: `/dataset/${
                    s?.datasetKey
                  }/reference/${encodeURIComponent(s?.id)}`,
                }}
              >
                {_.get(referenceIndexMap, s.id) ? (
                  `[${_.get(referenceIndexMap, s.id)}]`
                ) : (
                  <LinkOutlined />
                )}
              </NavLink>
            </Col>
            <Col span={20} flex="auto">
              <span
                id={`col-refererence-${s.id}`}
                dangerouslySetInnerHTML={{
                  __html: s?.citation ? linkify(s?.citation) : "",
                }}
              ></span>
            </Col>
          </Row>
          {s?.sourceDataset?.key !== primarySourceDatasetKey && (
            <Row>
              <Col style={{ paddingLeft: "32px" }}>
                <MergedDataBadge />
                Source:{" "}
                <NavLink
                  to={{
                    pathname: `/dataset/${s?.datasetKey}`,
                  }}
                >
                  {s?.sourceDataset?.title}
                </NavLink>
              </Col>
            </Row>
          )}
        </>
      ))}
    </div>
  );
};

export default ReferencesTable;
