import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"

const DistributionsTable = ({ data, style }) => (
  
  <div style={style}>{data.map(s => (
  <BorderedListItem key={s.verbatimKey}  >
    {s.area}
  </BorderedListItem>
))}</div>
)


export default DistributionsTable;
