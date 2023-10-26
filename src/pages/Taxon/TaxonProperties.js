import React from "react";
import _ from "lodash";
import withContext from "../../components/hoc/withContext";
import PresentationItem from "../../components/PresentationItem";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover";

const TaxonProperties = ({ references, referenceIndexMap, properties, md }) => {
  return (
    <PresentationItem md={md} label="Properties">
      {properties.map((s, i) => (
        <BorderedListItem key={i}>
          {`${s.property} : ${s.value}`}
          {s.referenceId && (
            <>
              {" "}
              <ReferencePopover
                datasetKey={s.datasetKey}
                references={references}
                referenceIndexMap={referenceIndexMap}
                referenceId={s?.referenceId}
                placement="top"
              />
            </>
          )}
          {s.remarks && ` ${s.remarks}`}
        </BorderedListItem>
      ))}
    </PresentationItem>
  );
};

export default TaxonProperties;
