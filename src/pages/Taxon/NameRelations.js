import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import PresentationItem from "../../components/PresentationItem";

const typeMap = {
  "spelling correction": "of",
  "based on": "",
  "replacement name": "for",
  "later homonym": "of",
  superfluous: "name for",
};

const NameRelations = ({ data, catalogueKey, datasetKey, md }) =>
  data.map((r) => (
    <PresentationItem
      md={md}
      key={r.key}
      label={`${_.capitalize(r.type)} ${
        typeMap[r.type] ? typeMap[r.type] : ""
      }`}
      helpText={r.note}
    >
      <NavLink
        to={{
          pathname:
            datasetKey === catalogueKey
              ? `/catalogue/${catalogueKey}/name/${encodeURIComponent(
                  r.relatedName.id
                )}`
              : `/dataset/${datasetKey}/name/${encodeURIComponent(
                  r.relatedName.id
                )}`,
        }}
        exact={true}
      >
        {/*<span dangerouslySetInnerHTML={{ __html: r.relatedName.labelHtml }}></span> */}
        {`${r.relatedName.scientificName} ${r.relatedName.authorship}`}
      </NavLink>
    </PresentationItem>
  ));

export default NameRelations;
