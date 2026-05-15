import React, { useEffect, useState, useRef } from "react";
import { Tag, Popover } from "antd";
import axios from "axios";
import config from "../config";
import { NavLink } from "react-router-dom";
const createdByAlgorithm = {
  14: "The data was created by the homotypic grouping algorithm",
};

// Backend currently only emits NameUsage, Name or Reference as sourceEntity.
const ENTITY_SECTION = {
  "name usage": "taxon",
  name: "name",
  reference: "reference",
};

const verbatimSourceUrl = (verbatimRecord) => {
  if (!verbatimRecord?.sourceDatasetKey) return null;
  const section = ENTITY_SECTION[(verbatimRecord.sourceEntity || "").toLowerCase()];
  const base = `/dataset/${verbatimRecord.sourceDatasetKey}`;
  return section && verbatimRecord.sourceId
    ? `${base}/${section}/${encodeURIComponent(verbatimRecord.sourceId)}`
    : base;
};

const MergedDataBadge = ({
  style = {},
  datasetKey,
  sourceDatasetKey,
  sourceId,
  popoverPlacement,
  verbatimSourceKey,
  sectorKey,
  createdBy,
}) => {
  const [sourceDataset, setSourceDataset] = useState(null);
  const [sourceDatasetLoading, setSourceDatasetLoading] = useState(false);
  const [verbatimSourceDataset, setVerbatimSourceDataset] = useState(null);
  const [sourceTaxon, setSourceTaxon] = useState(null);
  const [sourceTaxonLoading, setSourceTaxonLoading] = useState(null);
  const [verbatimRecord, setVerbatimRecord] = useState(null);
  const [verbatimRecordLoading, setVerbatimRecordLoading] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open && sourceDatasetKey && sourceId) {
      getSourceTaxon();
    }
    if (open && sourceDatasetKey) {
      getSourceDataset();
    }
    if (open && verbatimSourceKey && !createdByAlgorithm[createdBy]) {
      getVerbatimRecord();
    }
  }, [sourceDatasetKey, sourceId, verbatimSourceKey, open]);

  useEffect(() => {
    const key = verbatimRecord?.sourceDatasetKey;
    if (!key) {
      setVerbatimSourceDataset(null);
      return;
    }
    if (sourceDataset?.key === key) {
      setVerbatimSourceDataset(sourceDataset);
      return;
    }
    setVerbatimSourceDataset(null);
    axios(`${config.dataApi}dataset/${key}`)
      .then((res) => {
        setVerbatimSourceDataset(res.data);
      })
      .catch((err) => {
        console.error("Error fetching verbatim source dataset:", err);
        setVerbatimSourceDataset(null);
      });
  }, [verbatimRecord, sourceDataset]);

  const getSourceTaxon = () => {
    setSourceTaxonLoading(true);
    setSourceTaxon(null);
    axios(`${config.dataApi}dataset/${sourceDatasetKey}/taxon/${sourceId}`)
      .then((res) => {
        setSourceTaxonLoading(false);
        setSourceTaxon(res.data);
      })
      .catch((err) => {
        console.error("Error fetching source  taxon:", err);
        setSourceTaxonLoading(false);
        setSourceTaxon(null);
      });
  };

  const getSourceDataset = () => {
    setSourceDatasetLoading(true);
    setSourceDataset(null);
    axios(`${config.dataApi}dataset/${sourceDatasetKey}`)
      .then((res) => {
        setSourceDatasetLoading(false);
        setSourceDataset(res.data);
      })
      .catch((err) => {
        console.error("Error fetching source dataset:", err);
        setSourceDatasetLoading(false);
        setSourceDataset(null);
      });
  };

  const getVerbatimRecord = () => {
    setVerbatimRecordLoading(true);
    setVerbatimRecord(null);
    axios(
      `${config.dataApi}dataset/${datasetKey}/verbatimsource/${verbatimSourceKey}`
    )
      .then((res) => {
        setVerbatimRecordLoading(false);
        setVerbatimRecord(res.data);
      })
      .catch((err) => {
        console.error("Error fetching verbatim record:", err);
        setVerbatimRecordLoading(false);
        setVerbatimRecord(null);
      });
  };

  const idRef = useRef(Math.random().toString(36).substring(2, 15));

  return !!sourceDatasetKey || !!verbatimSourceKey ? (
    <div style={{ display: "inline" }} id={idRef.current}>
      <Popover
        getPopupContainer={() => document.getElementById(idRef.current)}
        content={
          <div style={{ minWidth: "300px" }}>
            {!verbatimSourceKey && !sourceId && sourceDatasetKey && (
              <div>
                <strong>Source:</strong>{" "}
                {sourceDatasetLoading ? (
                  "Loading..."
                ) : (
                  <NavLink to={`/dataset/${sourceDataset?.key}`}>
                    {sourceDataset?.title}
                  </NavLink>
                )}
              </div>
            )}
            {sourceDatasetKey && sourceId && (
              <div>
                <strong>Source:</strong>{" "}
                {sourceTaxonLoading ? (
                  "Loading..."
                ) : (
                  <NavLink
                    to={`/dataset/${sourceDatasetKey}/taxon/${encodeURIComponent(
                      sourceId
                    )}`}
                    dangerouslySetInnerHTML={{ __html: sourceTaxon?.labelHtml }}
                  ></NavLink>
                )}
              </div>
            )}
            {!sourceId && verbatimSourceKey && (
              <div>
                <strong>Source:</strong>{" "}
                {!!createdByAlgorithm[createdBy] && (
                  <span>{createdByAlgorithm[createdBy]}</span>
                )}
                {verbatimRecordLoading ? (
                  "Loading..."
                ) : !!verbatimRecord ? (
                  <>
                    {" "}
                    {
                      <NavLink
                        to={verbatimSourceUrl(verbatimRecord)}
                        dangerouslySetInnerHTML={{
                          __html:
                            verbatimSourceDataset?.title ||
                            sourceDataset?.title ||
                            verbatimRecord?.sourceEntity,
                        }}
                      ></NavLink>
                    }
                    {verbatimRecord?.issues &&
                    verbatimRecord?.issues.length > 0 ? (
                      <div>
                        <span>Issues: </span>
                        {verbatimRecord.issues.map((issue, index) => (
                          <Tag key={index} style={{ margin: "2px" }}>
                            {issue}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      ""
                    )}
                  </>
                ) : (
                  ""
                )}
              </div>
            )}
          </div>
        }
        trigger={"click"}
        placement={popoverPlacement || "right"}
        onVisibleChange={setOpen}
      >
        <Tag
          color="purple"
          /*  onClick={(e) => {
            getSourceDataset();
            getSourceTaxon();
            if(!createdByAlgorithm[createdBy]){ getVerbatimRecord(); }
          }}  */
          style={{
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "8px",
            fontWeight: 900,
            padding: "2px",
            lineHeight: "8px",
            verticalAlign: "middle",
            marginRight: "2px",
            ...style,
          }}
        >
          XR
        </Tag>
      </Popover>
    </div>
  ) : (
    <div style={{ display: "inline" }}>
      {" "}
      <Tag
        color="purple"
        style={{
          fontFamily: "monospace",
          fontSize: "8px",
          fontWeight: 900,
          padding: "2px",
          lineHeight: "8px",
          verticalAlign: "middle",
          marginRight: "2px",
          ...style,
        }}
      >
        XR
      </Tag>
    </div>
  );
};

export default MergedDataBadge;
