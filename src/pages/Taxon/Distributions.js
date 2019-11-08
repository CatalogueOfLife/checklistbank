import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"
import ReferencePopover from "../Reference/ReferencePopover"

const DistributionsTable = ({datasetKey, data, style }) => (
  
  <div style={style}>{data.map(s => (
  <BorderedListItem key={s.verbatimKey}  >
    {s.area} {" "}
              <ReferencePopover datasetKey={datasetKey} referenceId={s.referenceId} placement="bottom"/>
  </BorderedListItem>
))}</div>
)


export default DistributionsTable;
