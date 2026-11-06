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

const TaxonBreakdown = ({ taxon, datasetKey, dataset, onTaxonClick }) => {
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

  // The breakdown endpoint decides the chart: what the nodes count (species,
  // or genera where they outnumber species more than twofold, #1584), which
  // one or two ranks form the rings and the total. A node without an id is the
  // remainder of its parent - e.g. families placed directly in Arthropoda
  // incertae sedis - which initChart shows as an Other / Unknown slice.
  const getData = async () => {
    setLoading(true);
    try {
      const res = await axios(
        `${config.dataApi}dataset/${datasetKey}/taxon/${encodeURIComponent(
          taxon.id
        )}/breakdown?level=2`
      );
      const bd = res.data || {};
      const toNode = (node) => ({
        ...node,
        species: node.count || 0,
        children: (node.children || []).filter((n) => n.id).map(toNode),
      });
      const children = (bd.children || []).filter((n) => n.id).map(toNode);
      if (!bd.countRank || !bd.total || children.length === 0) {
        setInvalid(true);
        setLoading(false);
        return;
      }
      const total = bd.total;
      let root;
      if (bd.ranks.length < 2) {
        // Single root: a centre node (the taxon) ringed only by its child rank,
        // when the backend decided a second ring is not worth drawing.
        root = [
          {
            name: _.get(taxon, "name.scientificName"),
            id: taxon.id,
            // initChart adds the Other / Unknown slice for whatever the children miss
            species: total,
            children,
          },
        ];
      } else {
        root = processChildren(children);
        const sum = root.reduce((acc, cur) => acc + cur.species, 0);
        if (total > sum) {
          root.push({
            name: `Other / Unknown ${bd.ranks[0]}`,
            species: total - sum,
            children: [],
          });
        }
      }
      setLoading(false);
      initChart(root, bd.countRank);
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
        // sum the clipped children, so the slices cut off by processChildren
        // land in Other / Unknown and the outer ring stays aligned
        const sum = children.reduce((acc, cur) => acc + cur.species, 0);
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
              // a ring of the counted rank has a count of 1 per slice
              return this.y > 0
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

const mapContextToProps = ({ dataset }) => ({
  dataset,
});

export default withContext(mapContextToProps)(TaxonBreakdown);
