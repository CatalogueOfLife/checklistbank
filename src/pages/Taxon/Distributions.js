import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"

const DistributionsTable = ({ datasetKey, data }) => {
  return (
    <React.Fragment>
      {
        data.map(s => (
          <BorderedListItem key={s.id}>
            {s.area}
          </BorderedListItem>
        ))}
    </React.Fragment>
  );
};


export default DistributionsTable;
