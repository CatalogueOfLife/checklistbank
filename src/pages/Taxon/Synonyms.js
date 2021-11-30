import React, { useState, useEffect } from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover";
import withContext from "../../components/hoc/withContext";
import EditTaxonModal from "../catalogue/Assembly/EditTaxonModal";
import { Button } from "antd";
import { EditOutlined } from "@ant-design/icons";

const SynonymsTable = ({
  datasetKey,
  data,
  style,
  onEditSuccess,
  getNomStatus,
  references,
  canEdit,
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
              {_.get(s, "name.homotypicNameId") &&
              _.get(s, "accepted.name.homotypicNameId") &&
              _.get(s, "accepted.name.homotypicNameId") ===
                _.get(s, "name.homotypicNameId")
                ? "≡ "
                : "= "}{" "}
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
              />{" "}
              {_.get(s, "name.nomStatus") && `(${getNomStatus(s.name)})`}{" "}
              {_.get(s, "status") === "misapplied" && _.get(s, "accordingTo")
                ? _.get(s, "accordingTo")
                : ""}
            </NavLink>{" "}
            {typeof canEdit == "function" && canEdit() && (
              <Button type="link" onClick={() => setTaxonForEdit(s)}>
                <EditOutlined />{" "}
              </Button>
            )}
            <ReferencePopover
              datasetKey={datasetKey}
              references={references}
              referenceId={
                _.get(s, "name.publishedInId")
                  ? [_.get(s, "name.publishedInId"), ...(s.referenceIds || [])]
                  : s.referenceIds
              }
              placement="bottom"
            />
          </BorderedListItem>
        ))}
    </div>
  );
};

const mapContextToProps = ({ getNomStatus }) => ({ getNomStatus });
export default withContext(mapContextToProps)(SynonymsTable);
