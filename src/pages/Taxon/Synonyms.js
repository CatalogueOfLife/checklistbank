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

const SynonymsTable = ({
  datasetKey,
  data,
  style,
  onEditSuccess,
  getNomStatus,
  references,
  typeMaterial,
  canEdit,
  referenceIndexMap,
}) => {
  const uri = `/dataset/${datasetKey}/name/`;
  const [taxonForEdit, setTaxonForEdit] = useState(null);
  useEffect(() => {}, [data, canEdit]);
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
      {data
        .map((s) => {
          return s[0] ? s[0] : s;
        })
        .map((s) => (
          <BorderedListItem key={_.get(s, "name.id")}>
            <NavLink
              to={{
                pathname: `${uri}${encodeURIComponent(_.get(s, "name.id"))}`,
              }}
              exact={true}
            >
              {s.__homotypic === true ? "≡ " : "= "}{" "}
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
            </NavLink>{" "}
            <>
              {" "}
              {_.get(s, "name.nomStatus")
                ? `(${getNomStatus(s.name)})`
                : ""}{" "}
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
            <TypeMaterialPopover
              datasetKey={datasetKey}
              typeMaterial={typeMaterial}
              nameId={_.get(s, "name.id")}
              placement="top"
            />
          </BorderedListItem>
        ))}
    </div>
  );
};

const mapContextToProps = ({ getNomStatus }) => ({ getNomStatus });
export default withContext(mapContextToProps)(SynonymsTable);
