import React from "react";
import { NavLink } from "react-router-dom";
import PresentationItem from "../../components/PresentationItem";
import _ from "lodash";
const typeMap = {
  "spelling correction": "of",
  "based on": "",
  "replacement name": "for",
  "later homonym": "of",
  superfluous: "name for",
};

const reverseTypeMap = {
  "spelling correction": "of",
  "based on": "",
  "replacement name": "for",
  "later homonym": "of",
  superfluous: "name for",
};

const getLabel = (r, reverse) => {
  if (!reverse) {
    // return `${_.capitalize(r.type)} ${typeMap[r.type] ? typeMap[r.type] : ""}`;
    switch (r.type) {
      case "spelling correction":
        return "Spelling correction of";
      case "based on":
        return "Based on";
      case "replacement name":
        return "Replacement name of";
      case "later homonym":
        return "Later homonym of";
      case "superfluous":
        return "Superfluous name for";
      case "basionym":
        return "Basionym";
      case "type":
        return "Type";
      default:
        return _.capitalize(r.type);
    }
  } else {
    switch (r.type) {
      case "spelling correction":
        return "Has spelling correction";
      case "based on":
        return "Other name based on this";
      case "replacement name":
        return "Replaced by";
      case "later homonym":
        return "Has later homonym";
      case "superfluous":
        return "Has superfluous name";
      case "basionym":
        return "Basionym of";
      case "type":
        return "Type of";
      default:
        return _.capitalize(r.type);
    }
  }
};

const getLinkEntity = (r, reverse) => {
  if (!reverse) {
    return !!r?.relatedUsageId ? "nameusage" : "name";
  } else {
    return !!r?.usageId ? "nameusage" : "name";
  }
};

const getId = (r, reverse) => {
  if (!reverse) {
    return r?.relatedUsageId || r?.relatedNameId;
  } else {
    return r?.usageId || r?.nameId;
  }
};

const NameRelations = ({ data, catalogueKey, datasetKey, md, reverse }) =>
  data.map((r) => {
    const linkEntity = getLinkEntity(r, reverse); //!!r?.relatedUsageId ? "nameusage" : "name";
    const id = getId(r, reverse); // r?.relatedUsageId || r?.relatedNameId;
    return (
      <PresentationItem
        md={md}
        key={r.key}
        label={getLabel(r, reverse)}
        helpText={r.note}
      >
        <NavLink
          to={{
            pathname:
              datasetKey === catalogueKey
                ? `/catalogue/${catalogueKey}/${linkEntity}/${encodeURIComponent(
                    id
                  )}`
                : `/dataset/${datasetKey}/${linkEntity}/${encodeURIComponent(
                    id
                  )}`,
          }}
          exact={true}
        >
          {/*<span dangerouslySetInnerHTML={{ __html: r.relatedName.labelHtml }}></span> */}
          {!reverse && (
            <span
              dangerouslySetInnerHTML={{
                __html: r.relatedName.labelHtml,
              }}
            />
          )}
          {reverse && (
            <span
              dangerouslySetInnerHTML={{
                __html: r.name.labelHtml,
              }}
            />
          )}
        </NavLink>
      </PresentationItem>
    );
  });

export default NameRelations;
