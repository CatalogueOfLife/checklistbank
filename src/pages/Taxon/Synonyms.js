import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import BorderedListItem from "./BorderedListItem"

const SynonymsTable = ({ datasetKey, data, style }) => {
  return (
    <div style={style}>
      {data
        .map(s => {
          return s[0] ? s[0] : s;
        })
        .map(s => (
          <BorderedListItem key={s.id}>
            <NavLink
              to={{
                pathname: `/dataset/${datasetKey}/name/${encodeURIComponent(
                  s.id
                )}`
              }}
              exact={true}
            >
              <span dangerouslySetInnerHTML={{ __html: s.formattedName }} /> {s.nomStatus && `(${s.nomStatus})`}
            </NavLink> 
          </BorderedListItem>
        ))}
    </div>
  );
};

export default SynonymsTable;
