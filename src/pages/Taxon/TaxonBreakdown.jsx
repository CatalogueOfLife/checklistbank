import React, { useState, useEffect } from "react";
import config from "../../config";
import axios from "axios";
import Highcharts from "highcharts";
import HC_exporting from "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import _ from "lodash";
import history from "../../history";
import { Spin, Row, Col } from "antd";
import withContext from "../../components/hoc/withContext";

HC_exporting(Highcharts);

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
    if (taxon?.id !== taxonID) {
      getData();
      setTaxonID(taxon?.id);
    }
  }, [taxon, datasetKey]);

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
      /* let countBy;
      if (_.get(counts, "species.count", 0) > 0) {
        countBy = "species";
      } else {
        let i = ranks.length - 1;
        while (i > 0 && !countBy) {
          if (_.get(counts, `${ranks[i]}.count`, 0) > 0) {
            countBy = ranks[i];
            break;
          }
          i--;
        }
      } */
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
      let root;
      if (
        !grandChildRank ||
        grandChildRank === "species" ||
        _.get(counts, `${grandChildRank}.count`) > MAX_GRAND_CHILDREN
      ) {
        root = [{ name: _.get(taxon, "name.scientificName"), id: taxon.id }];
      }
      if (!childRank) {
        setInvalid(true);
        setLoading(false);
      } else {
        /* const res = await axios(
          `${
            config.dataApi
          }dataset/${datasetKey}/export.json?rank=${childRank}${
            !root ? "&rank=" + grandChildRank : ""
          }&countBy=${countBy}&taxonID=${taxon.id}`
        ); */
        const res = await axios(
          `${config.dataApi}dataset/${datasetKey}/taxon/${taxon.id}/breakdown`
        );
        //Api returns both ranks in the root array
        const childRankData = res.data; //.filter((t) => t.rank === childRank);
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
        initChart(root);
      }
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

  const initChart = (root) => {
    const DOI = dataset.doi ? "https://doi.org/" + dataset.doi : null;
    const totalCount = root.reduce((acc, cur) => acc + cur.species, 0);
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
      plotOptions: {
        pie: {
          shadow: false,
          center: ["50%", "50%"],
        },
      },
      tooltip: {},
      series: [
        {
          name: "Species", //_.startCase(countBy),
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
          name: "Species", // _.startCase(countBy),
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
    <HighchartsReact highcharts={Highcharts} options={options} />
  );
};

const mapContextToProps = ({ dataset, rank }) => ({
  dataset,
  rank,
});

export default withContext(mapContextToProps)(TaxonBreakdown);
