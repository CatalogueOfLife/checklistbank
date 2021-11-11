import React from "react";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover";

const DistributionsTable = ({ datasetKey, data, style }) => (
  <div style={style}>
    {data.map((s) => (
      <BorderedListItem key={s.verbatimKey}>
        {s.area?.name || s.area?.globalId}{" "}
        {s.referenceId && (
          <ReferencePopover
            datasetKey={datasetKey}
            referenceId={s.referenceId}
            placement="bottom"
          />
        )}
      </BorderedListItem>
    ))}
  </div>
);

export default DistributionsTable;
