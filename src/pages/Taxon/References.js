import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"

const ReferencesTable = ({ data }) => {
  return (
    <React.Fragment>
      {_.values(data)
        
        .map(s => (
          <BorderedListItem key={s.id}>
            {s.citation}
          </BorderedListItem>
        ))}
    </React.Fragment>
  );
};

export default ReferencesTable;
