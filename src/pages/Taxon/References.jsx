import React from "react";
import _ from "lodash";
import linkify from "linkify-html";
import { NavLink } from "react-router-dom";
import { LinkOutlined } from "@ant-design/icons";
import { Row, Col } from "antd";
import MergedDataBadge from "../../components/MergedDataBadge";
import DOMPurify from "dompurify";

const ReferencesTable = ({
  data,
  referenceIndexMap,
  primarySourceDatasetKey,
  style,
}) => {
  return (
    <div style={style}>
      {_.values(data).map((s) => (
        <React.Fragment key={s.id}>
          <Row>
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
              {s?.sourceDataset?.key !== primarySourceDatasetKey && (
                <MergedDataBadge
                  createdBy={s?.createdBy}
                  datasetKey={s.datasetKey}
                  verbatimSourceKey={s?.verbatimSourceKey}
                  sourceDatasetKey={s?.sourceDataset?.key}
                />
              )}
              <span
                id={`col-refererence-${s.id}`}
                dangerouslySetInnerHTML={{
                  __html: s?.citation
                    ? linkify(DOMPurify.sanitize(s?.citation))
                    : "",
                }}
              ></span>{" "}
              {s?.csl?.URL && (
                <a href={s?.csl?.URL} target="_blank">
                  <LinkOutlined />
                </a>
              )}
            </Col>
          </Row>
        </React.Fragment>
      ))}
    </div>
  );
};

export default ReferencesTable;
