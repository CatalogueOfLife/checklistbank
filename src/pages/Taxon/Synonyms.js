import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import BorderedListItem from "./BorderedListItem"

const SynonymsTable = ({ datasetKey, data }) => {
  return (
    <React.Fragment>
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
              <span dangerouslySetInnerHTML={{ __html: s.formattedName }} />
            </NavLink>
          </BorderedListItem>
        ))}
    </React.Fragment>
  );
};

export default SynonymsTable;
