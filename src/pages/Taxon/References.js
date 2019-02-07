import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"

const ReferencesTable = ({ data, style }) => {
  return (
    <div style={style}>
      {_.values(data)
        
        .map(s => (
          <BorderedListItem key={s.id}>
            {s.citation}
          </BorderedListItem>
        ))}
    </div>
  );
};

export default ReferencesTable;
