import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";

const NameRelations = ({ data }) => {
  return (
    <ul style={{ listStyleType: "none", marginLeft: "-40px" }}>
      {data
        .map(r => (
          <li key={r.key}>
           {r.type}: <NavLink
              to={{
                pathname: `/dataset/${r.datasetKey}/name/${encodeURIComponent(
                  r.relatedName.id
                )}`
              }}
              exact={true}
            >
            <span dangerouslySetInnerHTML={{__html: r.relatedName.formattedName}}></span>
            </NavLink>
          </li>
        ))}
    </ul>
  );
};

export default NameRelations;
