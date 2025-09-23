import React from "react";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover";
import MergedDataBadge from "../../components/MergedDataBadge";

const DistributionsTable = ({ datasetKey, data, style }) => (
  <div style={style}>
    {data.map((s) => (
      <BorderedListItem key={s.verbatimKey}>
        {s?.merged && (
          <MergedDataBadge
            createdBy={s?.createdBy}
            datasetKey={s.datasetKey}
            sourceDatasetKey={s?.sourceDatasetKey}
            verbatimSourceKey={s?.verbatimSourceKey}
            style={{ marginRight: "4px" }}
          />
        )}
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
