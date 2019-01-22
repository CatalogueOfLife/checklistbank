import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";

const SynonymsTable = ({ datasetKey, data }) => {
  return (
    <ul style={{ listStyleType: "none", marginLeft: "-40px" }}>
      {data
        .map(s => {
          return s[0] ? s[0] : s;
        })
        .map(s => (
          <li key={s.id}>
            <NavLink
              to={{
                pathname: `/dataset/${datasetKey}/name/${encodeURIComponent(
                  s.id
                )}`
              }}
              exact={true}
            >
              {s.scientificName} {s.authorship}
            </NavLink>
          </li>
        ))}
    </ul>
  );
};

export default SynonymsTable;
