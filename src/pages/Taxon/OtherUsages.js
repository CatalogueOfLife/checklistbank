import React from "react";
import { NavLink } from "react-router-dom";
import PresentationItem from "../../components/PresentationItem";
import { Row } from "antd";

const OtherUsages = ({ otherUsages }) => {
  return (
    <>
      {otherUsages.map((u) => (
        <>
          <Row>
            <NavLink
              to={{
                pathname: `/dataset/${
                  u?.usage?.datasetKey
                }/nameusage/${encodeURIComponent(_.get(u, "id"))}`,
              }}
              exact={true}
            >
              <span
                dangerouslySetInnerHTML={{
                  __html: _.get(
                    u,
                    "usage.labelHtml",
                    `${_.get(u, "usage.name.scientificName")} ${_.get(
                      u,
                      "usage.name.authorship",
                      ""
                    )}`
                  ),
                }}
              />
            </NavLink>
          </Row>
          <Row style={{ paddingLeft: "10px" }}>
            <span
              style={{
                color: "rgba(0, 0, 0, 0.45)",
                marginRight: "6px",
              }}
            >{` ${u?.usage?.status} of `}</span>
            <NavLink
              to={{
                pathname: `/dataset/${
                  u?.usage?.datasetKey
                }/nameusage/${encodeURIComponent(
                  _.get(u, "usage.accepted.id")
                )}`,
              }}
              exact={true}
            >
              <span
                dangerouslySetInnerHTML={{
                  __html: _.get(
                    u,
                    "usage.accepted.labelHtml",
                    `${_.get(u, "usage.accepted.name.scientificName")} ${_.get(
                      u,
                      "usage.accepted.name.authorship",
                      ""
                    )}`
                  ),
                }}
              />
            </NavLink>
          </Row>
        </>
      ))}
    </>
  );
};

export default OtherUsages;
