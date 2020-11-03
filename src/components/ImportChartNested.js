import { withRouter } from "react-router-dom";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import React from "react";
import history from "../history";
import qs from "query-string";
import { Card } from "antd";
import withContext from "./hoc/withContext";

class ImportChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = { options: {} };
  }

  componentDidMount = () => {
    this.initChart(this.props);
  };

  componentDidUpdate = (prevProps) => {
    if (prevProps.datasetKey !== this.props.datasetKey) {
      this.initChart(this.props);
    }
  };

  getBasePath = () => {
    const { location, datasetKey } = this.props;
    if (location.pathname.startsWith("/catalogue")) {
      return (
        location.pathname.split(`dataset/${datasetKey}/`)[0] +
        `dataset/${datasetKey}/workbench`
      );
    } else {
      return `/dataset/${datasetKey}/names`;
    }
  };

  getVerbatimPath = () => {
    const { location, datasetKey } = this.props;

    if (location.pathname.startsWith("/catalogue")) {
      return (
        location.pathname.split(`dataset/${datasetKey}/`)[0] +
        `dataset/${datasetKey}/verbatim`
      );
    } else {
      return `/dataset/${datasetKey}/verbatim`;
    }
  };

  initChart = (props) => {
    const {
      nestedData,
      title,
      subtitle,
      nameSearchParam,
      verbatim,
      additionalParams,
    } = props;

    var colors = Highcharts.getOptions().colors,
      categories = Object.keys(nestedData),
      data = Object.keys(nestedData).map((k, idx) => {
        return {
          color: colors[idx],
          y: Object.keys(nestedData[k]).reduce(
            (acc, cur) => acc + nestedData[k][cur],
            0
          ),
          drilldown: {
            name: k,
            categories: Object.keys(nestedData[k]),
            data: Object.keys(nestedData[k]).map((i) => nestedData[k][i]),
          },
        };
      }),
      rowData = [],
      termData = [],
      i,
      j,
      dataLen = data.length,
      drillDataLen,
      brightness;

    // Build the data arrays
    for (i = 0; i < dataLen; i += 1) {
      // add browser data
      rowData.push({
        name: categories[i],
        y: data[i].y,
        color: data[i].color,
      });

      // add version data
      drillDataLen = data[i].drilldown.data.length;
      for (j = 0; j < drillDataLen; j += 1) {
        brightness = 0.2 - j / drillDataLen / 5;
        termData.push({
          name: data[i].drilldown.categories[j],
          y: data[i].drilldown.data[j],
          color: Highcharts.color(data[i].color).brighten(brightness).get(),
        });
      }
    }
    let options = {
      chart: {
        type: "pie",
      },
      credits: false,

      title: {
        text: title,
      },
      subtitle: {
        text: subtitle,
      },
      plotOptions: {
        pie: {
          shadow: false,
          center: ["50%", "50%"],
        },
      },
      tooltip: {
        formatter: function (tooltip) {
          if (this.point.series.name === "Row type") {
            return this.point.name;
          }
          // If not null, use the default formatter
          return tooltip.defaultFormatter.call(this, tooltip);
        },
      },
      series: [
        {
          name: "Row type",
          data: rowData,
          size: "60%",
          dataLabels: {
            enabled: true,
            color: "black",
            format: "{point.name}",
          },
          point: {
            events: {
              click: (e) => {
                history.push(
                  `${verbatim ? this.getVerbatimPath() : this.getBasePath()}?${
                    nameSearchParam[0]
                  }=${e.point.name}${
                    additionalParams ? "&" + qs.stringify(additionalParams) : ""
                  }`
                );
              },
            },
          },
        },
        {
          name: title,
          data: termData,
          size: "80%",
          innerSize: "60%",
          point: {
            events: {
              click: (e) => {
                history.push(
                  `${verbatim ? this.getVerbatimPath() : this.getBasePath()}?${
                    nameSearchParam[1]
                  }=${e.point.name}${
                    additionalParams ? "&" + qs.stringify(additionalParams) : ""
                  }`
                );
              },
            },
          },
          dataLabels: { enabled: false },
          id: "terms",
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
                  id: "terms",
                  dataLabels: {
                    enabled: false,
                  },
                },
              ],
            },
          },
        ],
      },
    };

    this.setState({ options });
  };

  getDataLabelOptions = (type) => {
    return {
      enabled: true,
      color: "black",
      format: "{point.name}: {point.y}",
      style: {
        fontSize: "13px",
        fontFamily: "Verdana, sans-serif",
      },
    };
  };

  render = () => {
    const { options } = this.state;
    return (
      <Card>
        <HighchartsReact highcharts={Highcharts} options={options} />
      </Card>
    );
  };
}

const mapContextToProps = ({ catalogueKey }) => ({
  catalogueKey,
});

export default withContext(mapContextToProps)(withRouter(ImportChart));
