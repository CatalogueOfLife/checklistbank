import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover";
import withContext from "../../components/hoc/withContext";

const getNomStatus = (name, nomStatusMap) => {
  if (!nomStatusMap) {
    return name.nomStatus;
  } else {
    return nomStatusMap[name.nomStatus] &&
      nomStatusMap[name.nomStatus][name.code]
      ? nomStatusMap[name.nomStatus][name.code]
      : nomStatusMap[name.nomStatus]["zoological"];
  }
};

const SynonymsTable = ({
  datasetKey,
  data,
  style,
  catalogueKey,
  nomstatus,
}) => {
  const uri = `/dataset/${datasetKey}/name/`;
  const nomStatusMap =
    nomstatus.length > 0
      ? nomstatus.reduce((a, c) => {
          a[c.name] = c;
          return a;
        }, {})
      : null;
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
              {_.get(s, "name.nomStatus") &&
                `(${getNomStatus(s.name, nomStatusMap)})`}{" "}
              {_.get(s, "status") === "misapplied" && _.get(s, "accordingTo")
                ? _.get(s, "accordingTo")
                : ""}
            </NavLink>{" "}
            <ReferencePopover
              datasetKey={datasetKey}
              referenceId={s.referenceIds}
              placement="bottom"
            />
          </BorderedListItem>
        ))}
    </div>
  );
};

const mapContextToProps = ({ nomstatus }) => ({ nomstatus });
export default withContext(mapContextToProps)(SynonymsTable);
