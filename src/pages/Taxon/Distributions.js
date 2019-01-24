import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"

const DistributionsTable = ({ datasetKey, data }) => data.map(s => (
  <BorderedListItem key={s.verbatimKey} >
    {s.area}
  </BorderedListItem>
))


export default DistributionsTable;
