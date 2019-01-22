import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";

const DistributionsTable = ({ datasetKey, data }) => {
  return (
    <ul style={{ listStyleType: "none", marginLeft: "-40px" }}>
      {
        data.map(s => (
          <li key={s.id}>
            {s.area}
          </li>
        ))}
    </ul>
  );
};


export default DistributionsTable;
