import React from "react";
import _ from "lodash";
import { formatTime } from "../dateTime";
import { Tag, Row, Col } from "antd";
import ImportChart from "./ImportChart";
import ImportChartNested from "./ImportChartNested";

// Counts shown first, in this order. Any other numeric metric follows
// alphabetically, so new backend metrics show up without a UI change.
const COUNT_ORDER = [
  "nameCount",
  "taxonCount",
  "synonymCount",
  "bareNameCount",
  "usagesCount",
  "verbatimCount",
  "referenceCount",
  "typeMaterialCount",
  "distributionCount",
  "mediaCount",
  "treatmentCount",
  "vernacularCount",
  "sectorCount",
  "nameRelationsCount",
  "taxonConceptRelationsCount",
  "speciesInteractionsCount",
];
// numeric properties of an import that are not metrics
const NOT_COUNTS = [
  "datasetKey",
  "attempt",
  "createdBy",
  "modifiedBy",
  "sectorKey",
  "datasetAttempt",
];

// Breakdowns with a known chart, in display order. nameSearchParam makes a
// slice link to the name search (or verbatim search) filtered by its key.
const CHARTS = [
  {
    key: "taxaByRankCount",
    title: "Accepted Names by Rank",
    nameSearchParam: "rank",
    additionalParams: { status: "accepted" },
  },
  { key: "usagesByStatusCount", title: "Usages by status", nameSearchParam: "status" },
  { key: "namesByRankCount", title: "Names by rank", nameSearchParam: "rank" },
  { key: "namesByTypeCount", title: "Names by type", nameSearchParam: "nameType" },
  { key: "namesByCodeCount", title: "Names by code", nameSearchParam: "nomCode" },
  {
    key: "namesByStatusCount",
    title: "Names by nomenclatural status",
    nameSearchParam: "nomStatus",
  },
  // older imports report origin per name, newer ones per usage
  { key: "namesByOriginCount", title: "Names by origin", nameSearchParam: "origin" },
  { key: "usagesByOriginCount", title: "Usages by origin", nameSearchParam: "origin" },
  {
    key: "synonymsByRankCount",
    title: "Synonyms by rank",
    nameSearchParam: "rank",
    additionalParams: { status: "synonym" },
  },
  {
    key: "verbatimByTermCount",
    title: "Verbatim records by rowtype",
    nameSearchParam: "type",
    verbatim: true,
  },
  { key: "verbatimByRowTypeCount", title: "Verbatim records by term", nested: true },
  {
    key: "extinctTaxaByRankCount",
    title: "Extinct taxa by rank",
    nameSearchParam: "rank",
  },
  { key: "nameRelationsByTypeCount", title: "Name relations" },
  { key: "taxonConceptRelationsByTypeCount", title: "Taxon concept relations" },
  { key: "speciesInteractionsByTypeCount", title: "Species interactions" },
  { key: "typeMaterialByStatusCount", title: "Type material by status" },
  {
    key: "distributionsByGazetteerCount",
    title: "Distribution by Gazetteer",
    verbatim: true,
  },
  {
    key: "vernacularsByLanguageCount",
    title: "Vernacular names by language",
    defaultType: "column",
    wide: true,
  },
];
// shown on the issues page instead
const NOT_CHARTED = ["issuesCount"];
// Unknown breakdowns with more keys than this get a full width column chart
const MAX_PIE_SLICES = 30;

// The page adds non-metric objects to an import, e.g. its user.
const isBreakdown = (data, k) =>
  k.endsWith("Count") && _.isPlainObject(data[k]) && !_.isEmpty(data[k]);

const ImportMetrics = ({ data, subtitle }) => {
  const { datasetKey } = data;
  // every chart carries the same caption unless the caller overrides it
  const chartSubtitle =
    subtitle || `Imported ${formatTime(data.finished, "MMMM Do YYYY, h:mm a")}`;

  const counts = _.sortBy(
    Object.keys(data).filter(
      (k) => _.isNumber(data[k]) && data[k] && !NOT_COUNTS.includes(k)
    ),
    [
      (k) =>
        COUNT_ORDER.includes(k) ? COUNT_ORDER.indexOf(k) : COUNT_ORDER.length,
      (k) => k,
    ]
  );

  const known = CHARTS.map((c) => c.key);
  const charts = [
    ...CHARTS.filter((c) => isBreakdown(data, c.key)),
    ...Object.keys(data)
      .filter(
        (k) =>
          isBreakdown(data, k) && !known.includes(k) && !NOT_CHARTED.includes(k)
      )
      .sort()
      .map((k) => {
        const wide = _.size(data[k]) > MAX_PIE_SLICES;
        return {
          key: k,
          title: _.upperFirst(_.lowerCase(k.replace(/Count$/, ""))),
          defaultType: wide ? "column" : "pie",
          wide,
        };
      }),
  ];

  return (
    <Row>
      <Col span={24} style={{ padding: "10px" }}>
        {_.get(data, `taxaByRankCount.species`) && (
          <Tag
            key="speciesCount"
            color="blue"
            variant="outlined"
            style={{ marginBottom: "8px", marginRight: "8px" }}
          >
            Species Count: {_.get(data, `taxaByRankCount.species`)}
          </Tag>
        )}
        {counts.map((c) => (
          <Tag
            key={c}
            color="blue"
            variant="outlined"
            style={{ marginBottom: "8px", marginRight: "8px" }}
          >
            {_.startCase(c)}: {data[c]}
          </Tag>
        ))}
      </Col>

      {charts.map((c) => (
        <Col
          key={c.key}
          xs={24}
          sm={24}
          md={c.wide ? 24 : 12}
          lg={c.wide ? 24 : 12}
          style={{ padding: "10px" }}
        >
          {c.nested ? (
            <ImportChartNested
              verbatim={true}
              nameSearchParam={["type", "term"]}
              defaultType="donut"
              datasetKey={datasetKey}
              nestedData={data[c.key]}
              title={c.title}
              subtitle={chartSubtitle}
            />
          ) : (
            <ImportChart
              nameSearchParam={c.nameSearchParam}
              additionalParams={c.additionalParams}
              verbatim={c.verbatim}
              defaultType={c.defaultType || "pie"}
              datasetKey={datasetKey}
              data={data[c.key]}
              title={c.title}
              subtitle={chartSubtitle}
            />
          )}
        </Col>
      ))}
    </Row>
  );
};

export default ImportMetrics;
