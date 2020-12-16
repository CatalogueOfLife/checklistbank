import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover";
import withContext from "../../components/hoc/withContext";

const SynonymsTable = ({
  datasetKey,
  data,
  style,
  catalogueKey,
  getNomStatus,
  references,
}) => {
  const uri = `/dataset/${datasetKey}/name/`;

  return (
    <div style={style}>
      {data
        .map((s) => {
          return s[0] ? s[0] : s;
        })
        .map((s) => (
          <BorderedListItem key={_.get(s, "name.id")}>
            <NavLink
              to={{
                pathname: `${uri}${encodeURIComponent(_.get(s, "name.id"))}`,
              }}
              exact={true}
            >
              {_.get(s, "name.homotypicNameId") &&
              _.get(s, "accepted.name.homotypicNameId") &&
              _.get(s, "accepted.name.homotypicNameId") ===
                _.get(s, "name.homotypicNameId")
                ? "≡ "
                : "= "}{" "}
              <span
                dangerouslySetInnerHTML={{
                  __html: _.get(
                    s,
                    "labelHtml",
                    `${_.get(s, "name.scientificName")} ${_.get(
                      s,
                      "name.authorship",
                      ""
                    )}`
                  ),
                }}
              />{" "}
              {_.get(s, "name.nomStatus") && `(${getNomStatus(s.name)})`}{" "}
              {_.get(s, "status") === "misapplied" && _.get(s, "accordingTo")
                ? _.get(s, "accordingTo")
                : ""}
            </NavLink>{" "}
            <ReferencePopover
              datasetKey={datasetKey}
              references={references}
              referenceId={
                _.get(s, "name.publishedInId")
                  ? [_.get(s, "name.publishedInId"), ...(s.referenceIds || [])]
                  : s.referenceIds
              }
              placement="bottom"
            />
          </BorderedListItem>
        ))}
    </div>
  );
};

const mapContextToProps = ({ getNomStatus }) => ({ getNomStatus });
export default withContext(mapContextToProps)(SynonymsTable);
