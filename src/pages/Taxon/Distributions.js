import React from "react";
import { Table } from "antd";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover";
import MergedDataBadge from "../../components/MergedDataBadge";

const DistributionsTable = ({ datasetKey, data, style }) => {
  const textRecords = data.filter((s) => s.area?.gazetteer === "text");
  const otherRecords = data.filter((s) => s.area?.gazetteer !== "text");

  const columns = [
    {
      title: "Area",
      dataIndex: ["area", "name"],
      key: "area",
    },
    {
      title: "ID",
      dataIndex: ["area", "globalId"],
      key: "globalId",
    },
    {
      title: "Establishment means",
      dataIndex: "establishmentMeans",
      key: "establishmentMeans",
    },
    {
      title: "Establishment Degree",
      dataIndex: "degreeOfEstablishment",
      key: "degreeOfEstablishment",
    },
    {
      title: "Pathway",
      dataIndex: "pathway",
      key: "pathway",
    },
    {
      title: "Threat status",
      dataIndex: "threatStatus",
      key: "threatStatus",
      width: 90,
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      width: 60,
    },
    {
      title: "Life stage",
      dataIndex: "lifeStage",
      key: "lifeStage",
    },
    {
      title: "",
      dataIndex: "merged",
      key: "merged",
      width: 12,
      render: (_, record) =>
        record?.merged ? (
          <MergedDataBadge
            createdBy={record?.createdBy}
            datasetKey={record?.datasetKey}
            verbatimSourceKey={record?.verbatimSourceKey}
            sourceDatasetKey={record?.sourceDatasetKey}
          />
        ) : (
          ""
        ),
    },
    {
      title: "Ref",
      dataIndex: "referenceId",
      key: "referenceId",
      width: 30,
      render: (text, record) =>
        text ? (
          <ReferencePopover
            referenceId={text}
            datasetKey={datasetKey}
            placement="left"
            remarks={record.remarks}
          />
        ) : (
          ""
        ),
    },
  ];

  return (
    <div style={style}>
      {textRecords.map((s) => (
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
          {s.area?.name || s.area?.globalId}
          {(() => {
            const extras = [
              ["establishmentMeans", s.establishmentMeans],
              ["degreeOfEstablishment", s.degreeOfEstablishment],
              ["pathway", s.pathway],
              ["threatStatus", s.threatStatus],
              ["year", s.year],
              ["lifeStage", s.lifeStage],
            ].filter(([, v]) => v != null && v !== "");
            return extras.length > 0
              ? ` (${extras.map(([k, v]) => `${k}=${v}`).join(", ")})`
              : null;
          })()}{" "}
          {s.referenceId && (
            <ReferencePopover
              datasetKey={datasetKey}
              referenceId={s.referenceId}
              placement="bottom"
              remarks={s.remarks}
            />
          )}
        </BorderedListItem>
      ))}
      {otherRecords.length > 0 && (
        <Table
          className="colplus-taxon-page-list"
          columns={columns}
          dataSource={otherRecords}
          rowKey="verbatimKey"
          pagination={false}
          size="middle"
        />
      )}
    </div>
  );
};

export default DistributionsTable;
