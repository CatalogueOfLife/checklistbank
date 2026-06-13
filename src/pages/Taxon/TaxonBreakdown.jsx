import React, { useState, useEffect } from "react";
import config from "../../config";
import axios from "axios";
import Highcharts from "highcharts";
import "highcharts/modules/exporting";
import { Chart } from "@highcharts/react";
import _ from "lodash";
import history from "../../history";
import { Spin, Row, Col } from "antd";
import withContext from "../../components/hoc/withContext";

const MAX_GRAND_CHILDREN = 1000;
const canonicalRanks = [
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
];

const TaxonBreakdown = ({ taxon, datasetKey, rank, dataset, onTaxonClick }) => {
  const [options, setOptions] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [taxonID, setTaxonID] = useState(null);
  useEffect(() => {
    // dataset arrives via context and may be null on first render; without it
    // initChart throws on dataset.doi and the error is swallowed by the catch,
    // leaving the chart stuck on the loading spinner. Wait for it.
    if (!dataset || !taxon) return;
    if (taxon.id !== taxonID) {
      getData();
      setTaxonID(taxon.id);
    }
  }, [taxon, datasetKey, dataset]);

  const getOverView = async () => {
    const res = await axios(
      `${
        config.dataApi
      }dataset/${datasetKey}/nameusage/search?TAXON_ID=${encodeURIComponent(
        taxon.id
      )}&facet=rank&status=accepted&status=provisionally%20accepted&limit=0`
    );
    return _.keyBy(_.get(res, "data.facets.rank", []), "value");
  };
  const getData = async () => {
    setLoading(true);
    try {
      const counts = await getOverView();

      const ranks = canonicalRanks;
      // What to size the pie by: species normally, but fall back to genus when
      // genera greatly outnumber species (#1584). A species pie is useless for
      // genera-dominated groups - e.g. IRMNG's Arthropoda has 126k genera but
      // only 2 species. Use genus whenever there are more than twice as many
      // genera as species (which also covers genera-only groups).
      const speciesCount = _.get(counts, "species.count", 0);
      const genusCount = _.get(counts, "genus.count", 0);
      const countBy =
        genusCount > 2 * speciesCount
          ? "genus"
          : speciesCount > 0
          ? "species"
          : null;
      // Check if the rank is in the canonical ranks
      let taxonRankIdx = ranks.indexOf(_.get(taxon, "name.rank"));
      // If not, find it in the full rank enum, and place it within canonical ranks.
      // This will produce nice charts for e.g. sub- and superfamilies
      if (taxonRankIdx === -1) {
        let rankIndex = rank.indexOf(_.get(taxon, "name.rank")) + 1;
        while (taxonRankIdx === -1 && rankIndex < rank.length - 1) {
          let canonicalRankIndex = ranks.indexOf(rank[rankIndex]);
          if (canonicalRankIndex > -1) {
            taxonRankIdx = canonicalRankIndex - 1;
          }
          rankIndex++;
        }
      }
      let childRank;
      let childRankIndex = taxonRankIdx + 1;
      while (!childRank && childRankIndex < ranks.length) {
        const nextRank = _.get(ranks, `[${childRankIndex}]`);
        if (nextRank && _.get(counts, `${nextRank}.count`, 0) > 0) {
          childRank = nextRank;
        } else {
          childRankIndex++;
        }
      }
      let grandChildRank;
      let grandChildRankIndex = childRankIndex + 1;
      while (!grandChildRank && grandChildRankIndex < ranks.length) {
        const nextRank = _.get(ranks, `[${grandChildRankIndex}]`);
        if (nextRank && _.get(counts, `${nextRank}.count`, 0) > 0) {
          grandChildRank = nextRank;
        } else {
          grandChildRankIndex++;
        }
      }
      if (!childRank || !countBy) {
        setInvalid(true);
        setLoading(false);
        return;
      }

      let root;
      if (
        !grandChildRank ||
        grandChildRank === "species" ||
        _.get(counts, `${grandChildRank}.count`) > MAX_GRAND_CHILDREN
      ) {
        root = [{ name: _.get(taxon, "name.scientificName"), id: taxon.id }];
      }
      // The breakdown endpoint counts the requested rank for each node and emits
      // it under a property of that name. We size the pie by species normally,
      // but fall back to genus for genera-only groups (e.g. an order in IRMNG
      // with no species, #1584). Normalise the chosen count into `species` so
      // the chart code below stays rank-agnostic.
      const res = await axios(
        `${config.dataApi}dataset/${datasetKey}/taxon/${taxon.id}/breakdown?countRank=${countBy}`
      );
      const childRankData = res.data.map((c) => ({
        ...c,
        species: _.get(c, countBy, 0),
      }));
      if (_.get(root, "[0]")) {
        root[0].children = processChildren(childRankData);
        root[0].species = root[0].children.reduce(
          (acc, cur) => acc + cur.species,
          0
        );
      } else {
        root = processChildren(childRankData);
      }
      setLoading(false);
      initChart(root, countBy);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  const processChildren = (children) => {
    children.sort(function compareFn(a, b) {
      return b.species - a.species;
    });
    if (children.length < 100) {
      return children;
    } else {
      return children.slice(0, 100);
    }
  };

  const initChart = (root, countBy = "species") => {
    const totalCount = root.reduce((acc, cur) => acc + (cur.species || 0), 0);
    if (!totalCount) {
      // Nothing to size the pie by (e.g. a genera-only group with no species and
      // no genus fallback available): an empty pie looks like a bug, so hide the
      // chart entirely (#1584).
      setInvalid(true);
      return;
    }
    // Genera-only groups are sized by genus count rather than species; label the
    // series and add a subtitle so the switch is obvious on the chart (#1584).
    const countLabel = countBy === "genus" ? "Genera" : "Species";
    const DOI = dataset.doi ? "https://doi.org/" + dataset.doi : null;
    var colors = Highcharts.getOptions().colors,
      categories = root.map((t) => t.name),
      data = root.map((k, idx) => {
        const children = processChildren(k.children);
        const sum = k.children.reduce((acc, cur) => acc + cur.species, 0);
        let c =
          sum < k.species
            ? [
                ...children,
                {
                  name: `Other / Unknown ${_.get(children, "[0].rank", "")}`,
                  species: k.species - sum,
                },
              ]
            : children;
        // test
        /*         const c = k.children.reduce((acc, cur) => acc + cur.species, 0);
        if (k.species !== c) {
          console.log(k.name + " Count " + k.species + " Processed " + c);
        } */
        //
        return {
          color: colors[idx],
          y: k.species,
          _id: k.id,
          drilldown: {
            name: k.name,
            categories: c.map((c) => c.name),
            data: c,
          },
        };
      }),
      rootData = [],
      childData = [],
      i,
      j,
      dataLen = data.length,
      drillDataLen,
      brightness;

    // Build the data arrays
    for (i = 0; i < dataLen; i += 1) {
      // add browser data
      rootData.push({
        name: categories[i],
        y: data[i].y,
        _id: data[i]._id,
        color: data[i].color,
      });

      // add version data
      drillDataLen = data[i].drilldown.data.length;
      for (j = 0; j < drillDataLen; j += 1) {
        brightness = 0.2 - j / drillDataLen / 5;
        childData.push({
          name: data[i].drilldown.categories[j],
          y: data[i].drilldown.data[j].species,
          _id: data[i].drilldown.data[j].id,
          color: Highcharts.color(data[i].color).brighten(brightness).get(),
        });
      }
    }
    let options = {
      chart: {
        type: "pie",
      },
      credits: {
        text: `${taxon.name.scientificName} in ${dataset.title}${
          dataset.version ? " (" + dataset.version + ")" : ""
        }. ${(dataset.doi ? "DOI:" + dataset.doi : null) || dataset.url || ""}`,
        href: DOI || dataset.url || "",
      },
      title: {
        text: "",
      },
      subtitle:
        countBy === "genus"
          ? { text: "Genera far outnumber species — showing genus counts" }
          : undefined,
      plotOptions: {
        pie: {
          shadow: false,
          center: ["50%", "50%"],
        },
      },
      tooltip: {},
      series: [
        {
          name: countLabel,
          data: rootData,
          size: "60%",
          dataLabels: {
            formatter: function () {
              return this.y > totalCount / 10 ? this.point.name : null;
            },
            distance: -30,
          },
          point: {
            events: {
              click: (e) => {
                if (e.point._id) {
                  if (typeof onTaxonClick === "function") {
                    onTaxonClick(e.point._id);
                  } else {
                    history.push(
                      `/dataset/${datasetKey}/taxon/${encodeURIComponent(
                        e.point._id
                      )}`
                    );
                  }
                }
              },
            },
          },
        },
        {
          name: countLabel,
          data: childData,
          size: "80%",
          innerSize: "60%",
          point: {
            events: {
              click: (e) => {
                if (e.point._id) {
                  if (typeof onTaxonClick === "function") {
                    onTaxonClick(e.point._id);
                  } else {
                    history.push(
                      `/dataset/${datasetKey}/taxon/${encodeURIComponent(
                        e.point._id
                      )}`
                    );
                  }
                }
              },
            },
          },
          dataLabels: {
            formatter: function () {
              // display only if larger than 1
              return this.y > 1
                ? "<b>" +
                    this.point.name +
                    ":</b> " +
                    this.y.toLocaleString("en-GB")
                : null;
            },
          },
          id: "Species", //countBy,
        },
      ],
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 400,
            },
            chartOptions: {
              series: [
                {},
                {
                  id: "species",
                  dataLabels: {
                    enabled: false,
                  },
                },
              ],
            },
          },
        ],
      },
      exporting: {
        chartOptions: {
          // specific options for the exported image
          plotOptions: {
            series: {
              dataLabels: {
                enabled: true,
              },
            },
          },
        },
        fallbackToExportServer: false,
      },
    };

    setOptions(options);
  };

  return invalid ? null : loading || !options ? (
    <Row style={{ padding: "48px" }}>
      <Col flex="auto"></Col>
      <Col>
        <Spin size="large" />
      </Col>
      <Col flex="auto"></Col>
    </Row>
  ) : (
    <Chart options={options} />
  );
};

const mapContextToProps = ({ dataset, rank }) => ({
  dataset,
  rank,
});

export default withContext(mapContextToProps)(TaxonBreakdown);
