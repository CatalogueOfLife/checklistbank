import React, { useEffect, useState, useRef } from "react";
import { Tag, Popover } from "antd";
import axios from "axios";
import config from "../config";
import { NavLink } from "react-router-dom";
const createdByAlgorithm = {
  14: "The data was created by the homotypic grouping algorithm",
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
                  <NavLink to={`dataset/${sourceDataset?.key}`}>
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
                  <a
                    href={`https://www.checklistbank.org/dataset/${sourceDatasetKey}/taxon/${sourceId}`}
                    dangerouslySetInnerHTML={{ __html: sourceTaxon?.labelHtml }}
                    onClick={() => {
                      window.location.href = `https://www.checklistbank.org/dataset/${sourceDatasetKey}/taxon/${sourceId}`;
                    }}
                  ></a>
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
                      <a
                        href={`https://www.dev.checklistbank.org/dataset/${
                          verbatimRecord.sourceDatasetKey
                        }/${(verbatimRecord.sourceEntity || "").replace(
                          /\s/g,
                          ""
                        )}/${encodeURIComponent(verbatimRecord.sourceId)}`}
                        dangerouslySetInnerHTML={{
                          __html:
                            sourceDataset?.title ||
                            verbatimRecord?.sourceEntity,
                        }}
                        onClick={() => {
                          window.location.href = `https://www.dev.checklistbank.org/dataset/${
                            verbatimRecord.sourceDatasetKey
                          }/${(verbatimRecord.sourceEntity || "").replace(
                            /\s/g,
                            ""
                          )}/${encodeURIComponent(verbatimRecord.sourceId)}`;
                        }}
                      ></a>
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
