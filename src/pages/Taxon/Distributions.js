import React, { useState } from "react";
import { Table, Radio } from "antd";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "../project/ProjectReferences/ReferencePopover";
import MergedDataBadge from "../../components/MergedDataBadge";
import ShowMoreToggle from "./ShowMoreToggle";
import DistributionsMap from "./DistributionsMap";

const TOP_N = 10;

const isMappable = (r) =>
  r?.area?.gazetteer !== "text" && !!r?.area?.globalId;

const TableView = ({ datasetKey, data }) => {
  const [showAll, setShowAll] = useState(false);
  const textRecords = data.filter((s) => s.area?.gazetteer === "text");
  const otherRecords = data.filter((s) => s.area?.gazetteer !== "text");
  const total = textRecords.length + otherRecords.length;
  const textVisible = showAll ? textRecords : textRecords.slice(0, TOP_N);
  const remainingSlots = showAll
    ? otherRecords.length
    : Math.max(0, TOP_N - textVisible.length);
  const otherVisible = showAll
    ? otherRecords
    : otherRecords.slice(0, remainingSlots);

  const columns = [
    {
      title: "Area",
      key: "area",
      render: (_text, record) => record?.area?.name || record?.area?.globalId,
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
      title: "ID",
      key: "globalId",
      render: (_text, record) => record?.area?.globalId,
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
    <>
      {textVisible.map((s) => (
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
      {otherVisible.length > 0 && (
        <Table
          className="colplus-taxon-page-list"
          columns={columns}
          dataSource={otherVisible}
          rowKey="verbatimKey"
          pagination={false}
          size="middle"
        />
      )}
      <ShowMoreToggle
        total={total}
        visible={TOP_N}
        showAll={showAll}
        onChange={setShowAll}
      />
    </>
  );
};

const DistributionsTable = ({ datasetKey, data, style, focalTaxon, rankOrder }) => {
  const mappable = data.filter(isMappable);
  const baseUnmappable = data.length - mappable.length;
  const [view, setView] = useState("map");
  const [fetchFailures, setFetchFailures] = useState(0);

  const allMappableFailed =
    mappable.length > 0 && fetchFailures >= mappable.length;

  if (mappable.length === 0 || allMappableFailed) {
    return (
      <div style={style}>
        <TableView datasetKey={datasetKey} data={data} />
      </div>
    );
  }

  const unmappable = baseUnmappable + fetchFailures;

  return (
    <div style={style}>
      <Radio.Group
        size="small"
        value={view}
        onChange={(e) => setView(e.target.value)}
        style={{ marginBottom: 8 }}
      >
        <Radio.Button value="map">Map</Radio.Button>
        <Radio.Button value="table">Table</Radio.Button>
      </Radio.Group>
      {view === "map" ? (
        <>
          <DistributionsMap
            records={mappable}
            onUnmappable={setFetchFailures}
            datasetKey={datasetKey}
            focalTaxon={focalTaxon}
            rankOrder={rankOrder}
          />
          {unmappable > 0 && (
            <div style={{ marginTop: 6 }}>
              <a onClick={() => setView("table")} style={{ cursor: "pointer" }}>
                +{unmappable} distribution{unmappable === 1 ? "" : "s"} not on
                map
              </a>
            </div>
          )}
        </>
      ) : (
        <TableView datasetKey={datasetKey} data={data} />
      )}
    </div>
  );
};

export default DistributionsTable;
