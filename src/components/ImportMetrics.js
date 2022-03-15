import React from "react";
import _ from "lodash";
import moment from "moment";
import { Tag, Row, Col } from "antd";
import ImportChart from "./ImportChart";
import ImportChartNested from "./ImportChartNested";

const ImportMetrics = ({ data, subtitle }) => {
  const { datasetKey } = data;
  return (
    <React.Fragment>
      <Row>
        <Col span={24} style={{ padding: "10px" }}>
          <Tag key="speciesCount" color="blue" style={{ marginBottom: "8px" }}>
            Species Count: {_.get(data, `taxaByRankCount.species`)}
          </Tag>
          {_.map(
            "nameCount taxonCount synonymCount bareNameCount verbatimCount referenceCount typeMaterialCount distributionCount mediaCount treatmentCount vernacularCount sectorCount nameRelationsCount taxonConceptRelations speciesInteractionsCount".split(
              " "
            ),
            (c) => {
              return _.get(data, `${c}`) ? (
                <Tag key={c} color="blue" style={{ marginBottom: "8px" }}>
                  {_.startCase(c)}: {_.get(data, `${c}`)}
                </Tag>
              ) : (
                ""
              );
            }
          )}
        </Col>

        {_.get(data, "taxaByRankCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChart
              nameSearchParam="rank"
              additionalParams={{ status: "accepted" }}
              defaultType="pie"
              datasetKey={datasetKey}
              data={_.get(data, "taxaByRankCount")}
              title="Accepted Names by Rank"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}
        {_.get(data, "usagesByStatusCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChart
              nameSearchParam="status"
              defaultType="pie"
              datasetKey={datasetKey}
              data={_.get(data, "usagesByStatusCount")}
              title="Usages by status"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}

        {_.get(data, "namesByRankCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChart
              nameSearchParam="rank"
              defaultType="pie"
              datasetKey={datasetKey}
              data={_.get(data, "namesByRankCount")}
              title="Names by rank"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}
        {_.get(data, "namesByTypeCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChart
              nameSearchParam="nameType"
              defaultType="pie"
              datasetKey={datasetKey}
              data={_.get(data, "namesByTypeCount")}
              title="Names by type"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}

        {_.get(data, "namesByOriginCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChart
              nameSearchParam="origin"
              defaultType="pie"
              datasetKey={datasetKey}
              data={_.get(data, "namesByOriginCount")}
              title="Names by origin"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}
        {_.get(data, "synonymsByRankCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChart
              nameSearchParam="rank"
              additionalParams={{ status: "synonym" }}
              defaultType="pie"
              datasetKey={datasetKey}
              data={_.get(data, "synonymsByRankCount")}
              title="Synonyms by rank"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}

        {_.get(data, "verbatimByTermCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChart
              verbatim={true}
              nameSearchParam="type"
              defaultType="pie"
              datasetKey={datasetKey}
              data={_.get(data, "verbatimByTermCount")}
              title="Verbatim records by rowtype"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}

        {_.get(data, "verbatimByRowTypeCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChartNested
              verbatim={true}
              nameSearchParam={["type", "term"]}
              defaultType="donut"
              datasetKey={datasetKey}
              nestedData={_.get(data, "verbatimByRowTypeCount")}
              title="Verbatim records by term"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}
        {_.get(data, "extinctTaxaByRankCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChart
              defaultType="pie"
              nameSearchParam="rank"
              datasetKey={datasetKey}
              data={_.get(data, "extinctTaxaByRankCount")}
              title="Extinct taxa by rank"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}
        {_.get(data, "nameRelationsByTypeCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChart
              defaultType="pie"
              datasetKey={datasetKey}
              data={_.get(data, "nameRelationsByTypeCount")}
              title="Name relations"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}
        {_.get(data, "taxonConceptRelationsByTypeCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChart
              defaultType="pie"
              datasetKey={datasetKey}
              data={_.get(data, "taxonConceptRelationsByTypeCount")}
              title="Taxon concept relations"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}
        {_.get(data, "speciesInteractionsByTypeCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChart
              defaultType="pie"
              datasetKey={datasetKey}
              data={_.get(data, "speciesInteractionsByTypeCount")}
              title="Species interactions"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}
        {_.get(data, "distributionsByGazetteerCount") && (
          <Col span={12} style={{ padding: "10px" }}>
            <ImportChart
              verbatim={true}
              defaultType="pie"
              datasetKey={datasetKey}
              data={_.get(data, "distributionsByGazetteerCount")}
              title="Distribution by Gazetteer"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        )}
      </Row>
      {_.get(data, "vernacularsByLanguageCount") && (
        <Row>
          <Col span={24} style={{ padding: "10px" }}>
            <ImportChart
              defaultType="column"
              datasetKey={datasetKey}
              data={_.get(data, "vernacularsByLanguageCount")}
              title="Vernacular names by language"
              subtitle={
                subtitle ||
                `Imported ${moment(data.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`
              }
            />
          </Col>
        </Row>
      )}
    </React.Fragment>
  );
};

export default ImportMetrics;
