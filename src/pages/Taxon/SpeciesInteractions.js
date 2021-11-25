import React from "react";
import _ from "lodash";
import withContext from "../../components/hoc/withContext";
import PresentationItem from "../../components/PresentationItem";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover";
import { Popover } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const SpeciesInterActions = ({
  speciesInteractions,
  speciesinteractiontype,
  datasetKey,
  style,
}) => {
  const typeMap = _.keyBy(speciesinteractiontype, "name");
  const grouped = _.groupBy(speciesInteractions, "type");

  return (
    <div style={style || { marginLeft: "-6px" }}>
      {Object.keys(grouped).map((t) => (
        <PresentationItem
          key={t}
          label={
            <>
              {t}{" "}
              <Popover
                placement={"bottom"}
                title="Species interaction"
                content={
                  <>
                    {typeMap[t]?.description && (
                      <PresentationItem md={4} label="Description">
                        {typeMap[t]?.description}
                      </PresentationItem>
                    )}
                    {typeMap[t]?.superTypes && (
                      <PresentationItem md={4} label="Super types">
                        {typeMap[t]?.superTypes.join(", ")}
                      </PresentationItem>
                    )}
                    {typeMap[t]?.obo && (
                      <PresentationItem md={4} label="IRI">
                        <a href={typeMap[t].obo}>{typeMap[t].obo}</a>
                      </PresentationItem>
                    )}
                  </>
                }
                trigger="click"
              >
                <InfoCircleOutlined
                  style={{ cursor: "pointer", fontSize: "8px" }}
                />
              </Popover>
            </>
          }
        >
          {grouped[t].map((s, i) => (
            <BorderedListItem key={i}>
              {s.relatedTaxonScientificName}
              {s.referenceId && (
                <>
                  {" "}
                  <ReferencePopover
                    datasetKey={datasetKey}
                    referenceId={s.referenceId}
                    placement="bottom"
                  />
                </>
              )}
            </BorderedListItem>
          ))}
        </PresentationItem>
      ))}
    </div>
  );
};

const mapContextToProps = ({ speciesinteractiontype }) => ({
  speciesinteractiontype,
});

export default withContext(mapContextToProps)(SpeciesInterActions);
