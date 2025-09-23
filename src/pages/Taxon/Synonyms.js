import React, { useState, useEffect } from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover";
import withContext from "../../components/hoc/withContext";
import EditTaxonModal from "../catalogue/Assembly/EditTaxonModal";
import { Button } from "antd";
import { EditOutlined } from "@ant-design/icons";
import TypeMaterialPopover from "./TypeMaterialPopover";
import MergedDataBadge from "../../components/MergedDataBadge";
import DecisionBadge from "../../components/DecisionBadge";
const SynonymsTable = ({
  datasetKey,
  data,
  decisions,
  style,
  onEditSuccess,
  getNomStatus,
  references,
  typeMaterial,
  canEdit,
  referenceIndexMap,
  primarySource,
}) => {
  const uri = `/dataset/${datasetKey}/nameusage/`;
  const [taxonForEdit, setTaxonForEdit] = useState(null);
  useEffect(() => {}, [data, canEdit, primarySource]);

  const sorter = (a, b) => {
    if (
      _.get(a, "name.combinationAuthorship.year") &&
      _.get(b, "name.combinationAuthorship.year")
    ) {
      return (
        _.get(b, "name.combinationAuthorship.year") -
        _.get(a, "name.combinationAuthorship.year")
      );
    } else {
      if (_.get(a, "name.scientificName") < _.get(b, "name.scientificName")) {
        return -1;
      } else {
        return 1;
      }
    }
  };

  const renderSynonym = (syn, homotypic, indent) => {
    const s = _.isArray(syn) ? syn[0] : syn;
    const isGroup = _.isArray(syn);
    return (
      <>
        <BorderedListItem key={_.get(s, "name.id")}>
          <NavLink
            to={{
              pathname: `${uri}${encodeURIComponent(_.get(s, "id"))}`,
            }}
            exact={true}
          >
            <span style={indent ? { marginLeft: "10px" } : null}>
              {homotypic === true ? "≡ " : "= "}{" "}
              <span
                dangerouslySetInnerHTML={{
                  __html: _.get(
                    s,
                    "labelHtml",
                    `${_.get(s, "name.scientificName")} ${_.get(
                      s,
                      "name.authorship",
                      ""
                    )}`
                  ),
                }}
              />
            </span>
          </NavLink>{" "}
          <>
            {s?.sourceDatasetKey &&
              _.get(primarySource, "key") !== s?.sourceDatasetKey && (
                <MergedDataBadge
                  createdBy={s?.createdBy}
                  datasetKey={s.datasetKey}
                  sourceDatasetKey={s?.sourceDatasetKey}
                  verbatimSourceKey={s.verbatimSourceKey}
                />
              )}
            {decisions?.[s?.id] && (
              <DecisionBadge decision={decisions?.[s?.id]} />
            )}
            <TypeMaterialPopover
              datasetKey={datasetKey}
              typeMaterial={typeMaterial}
              nameId={_.get(s, "name.id")}
              placement="top"
            />{" "}
            {_.get(s, "name.nomStatus") ? `(${getNomStatus(s.name)})` : ""}{" "}
            {_.get(s, "status") === "misapplied" && _.get(s, "accordingTo")
              ? _.get(s, "accordingTo")
              : ""}
            {_.get(s, "status") === "ambiguous synonym" && "(Ambiguous)"}
          </>
          {typeof canEdit == "function" && canEdit() && (
            <Button type="link" onClick={() => setTaxonForEdit(s)}>
              <EditOutlined />{" "}
            </Button>
          )}
          <ReferencePopover
            datasetKey={datasetKey}
            references={references}
            referenceIndexMap={referenceIndexMap}
            referenceId={
              _.get(s, "name.publishedInId")
                ? [_.get(s, "name.publishedInId"), ...(s.referenceIds || [])]
                : s.referenceIds
            }
            placement="top"
          />
          {/* {s?.sourceDatasetKey &&
            _.get(primarySource, "key") !== s?.sourceDatasetKey && (
              <>
                {" "}
                <a
                  className="col-reference-link"
                  href={`#col-sourcedataset-${s?.sourceDatasetKey}`}
                >{`[source: ${s?.sourceDatasetKey}]`}</a>
              </>
            )} */}
        </BorderedListItem>
        {isGroup &&
          syn.length > 1 &&
          syn.slice(1).map((sg) => renderSynonym(sg, true, true))}
      </>
    );
  };

  return (
    <div style={style}>
      {taxonForEdit && (
        <EditTaxonModal
          synonym={true}
          onCancel={() => setTaxonForEdit(null)}
          onSuccess={() => {
            setTaxonForEdit(null);
            if (typeof onEditSuccess === "function") {
              onEditSuccess();
            }
          }}
          taxon={taxonForEdit}
        />
      )}
      {data.homotypic &&
        data.homotypic.sort(sorter).map((s) => renderSynonym(s, true))}
      {data.heterotypicGroups &&
        data.heterotypicGroups
          .sort((a, b) => sorter(a[0], b[0]))
          .map((s) => renderSynonym(s, false))}
    </div>
  );
};

const mapContextToProps = ({ getNomStatus }) => ({ getNomStatus });
export default withContext(mapContextToProps)(SynonymsTable);
