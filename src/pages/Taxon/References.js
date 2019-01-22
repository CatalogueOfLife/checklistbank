import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";

const ReferencesTable = ({ data }) => {
  return (
    <ul style={{ listStyleType: "none", marginLeft: "-40px" }}>
      {_.values(data)
        
        .map(s => (
          <li key={s.id}>
            {s.citation}
          </li>
        ))}
    </ul>
  );
};

export default ReferencesTable;
