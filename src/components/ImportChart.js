import withRouter from "../withRouter";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useState, useEffect } from "react";
import _ from "lodash";
import history from "../history";
import qs from "query-string";
import { BarChartOutlined, PieChartOutlined } from "@ant-design/icons";
import { Button, Card } from "antd";
import withContext from "./hoc/withContext";

const ButtonGroup = Button.Group;

const ImportChart = (props) => {
  const { location, datasetKey, data: chartDataProp, title, subtitle, defaultType, nameSearchParam, verbatim, additionalParams, simple = false } = props;

  const [options, setOptions] = useState({});
  const [chartData, setChartData] = useState([]);
  const [logChartData, setLogChartData] = useState([]);
  const [chartType, setChartType] = useState(defaultType || "column");
  const [logarithmic, setLogarithmic] = useState(false);

  const getBasePath = () => {
    if (location.pathname.startsWith("/catalogue")) {
      return (
        location.pathname.split(`dataset/${datasetKey}/`)[0] +
        `dataset/${datasetKey}/workbench`
      );
    } else {
      return `/dataset/${datasetKey}/names`;
    }
  };

  const getVerbatimPath = () => {
    if (location.pathname.startsWith("/catalogue")) {
      return (
        location.pathname.split(`dataset/${datasetKey}/`)[0] +
        `dataset/${datasetKey}/verbatim`
      );
    } else {
      return `/dataset/${datasetKey}/verbatim`;
    }
  };

  const getDataLabelOptions = (type) => {
    if (type === "pie") {
      return {
        enabled: true,
        color: "black",
        format: "{point.name}: {point.y}",
        style: {
          fontSize: "13px",
          fontFamily: "Verdana, sans-serif",
        },
      };
    }
    if (type === "column") {
      return {
        enabled: true,
        rotation: -90,
        color: "#FFFFFF",
        align: "right",
        format: "{point.y}",
        y: 10,
        style: {
          fontSize: "13px",
          fontFamily: "Verdana, sans-serif",
        },
      };
    }
  };

  const initChart = (currentProps) => {
    const {
      data,
      title: t,
      subtitle: st,
      defaultType: dt,
      nameSearchParam: nsp,
      verbatim: v,
      additionalParams: ap,
    } = currentProps;
    var newChartData = [];
    var newLogChartData = [];
    var max;
    var min;
    _.each(data, (val, k) => {
      if (_.isUndefined(min) || val < min) {
        min = val;
      }
      if (_.isUndefined(max) || val > max) {
        max = val;
      }
      newChartData.push([k, val]);
    });
    var logMin = Math.log(min);
    var logStart = Math.max(0, Math.floor(logMin));
    var logMax = Math.log(max);
    newChartData.forEach(function (e) {
      if (e[1] === 0) {
        newLogChartData.push([e[0], 0]);
      } else {
        newLogChartData.push([
          e[0],
          Math.round((100 * (Math.log(e[1]) - logStart)) / (logMax - logStart)),
        ]);
      }
    });

    const type = dt || "column";
    const newOptions = {
      chart: {
        type,
      },
      title: {
        text: t,
      },
      subtitle: {
        text: st,
      },
      credits: false,
      xAxis: {
        type: "category",
        labels: {
          rotation: -65,
          style: {
            fontSize: "13px",
            fontFamily: "Verdana, sans-serif",
          },
        },
      },
      yAxis: {
        min: 0,
        title: {
          text: t,
        },
      },
      legend: {
        enabled: false,
      },
      tooltip: {
        pointFormat: `${t}: <b>{point.y}</b>`,
      },
      series: [
        {
          name: t,
          data: newChartData,
          point: {
            events: {
              click: (e) => {
                history.push(
                  `${v ? getVerbatimPath() : getBasePath()}?${
                    nsp ? nsp + "=" + e.point.name : ""
                  }${ap ? "&" + qs.stringify(ap) : ""}`
                );
              },
            },
          },
          dataLabels: getDataLabelOptions(type),
        },
      ],
    };

    setOptions(newOptions);
    setChartData(newChartData);
    setLogChartData(newLogChartData);
    setChartType(type);
  };

  useEffect(() => {
    initChart(props);
  }, [datasetKey, JSON.stringify(chartDataProp)]);

  const toggleChartType = (type) => {
    setOptions((prev) => {
      const updated = { ...prev };
      updated.chart = { ...updated.chart, type };
      updated.series = updated.series.map((s, i) =>
        i === 0 ? { ...s, dataLabels: getDataLabelOptions(type) } : s
      );
      return updated;
    });
    setChartType(type);
  };

  const handleSetLogarithmic = (checked) => {
    setOptions((prev) => {
      const updated = { ...prev };
      updated.series = updated.series.map((s, i) =>
        i === 0 ? { ...s, data: checked ? logChartData : chartData } : s
      );
      return updated;
    });
    setLogarithmic(checked);
  };

  return (
    simple ? <HighchartsReact highcharts={Highcharts} options={options} /> : <Card>

      <ButtonGroup size="small">
        <Button
          type={!logarithmic ? "primary" : ""}
          onClick={() => {
            handleSetLogarithmic(false);
          }}
        >
          Linear
        </Button>
        <Button
          type={logarithmic ? "primary" : ""}
          onClick={() => {
            handleSetLogarithmic(true);
          }}
        >
          Logarithmic
        </Button>
      </ButtonGroup>
      <ButtonGroup size="small" style={{ float: "right" }}>
        <Button
          type={chartType === "pie" ? "primary" : ""}
          icon={<PieChartOutlined />}
          onClick={() => {
            toggleChartType("pie");
          }}
        />
        <Button
          type={chartType === "column" ? "primary" : ""}
          icon={<BarChartOutlined />}
          onClick={() => {
            toggleChartType("column");
          }}
        />
      </ButtonGroup>

      {chartType === "pie" && (
        <HighchartsReact highcharts={Highcharts} options={options} />
      )}
      {chartType === "column" && (
        <HighchartsReact highcharts={Highcharts} options={options} />
      )}
    </Card>
  );
};

const mapContextToProps = ({ projectKey }) => ({
  projectKey,
});

export default withContext(mapContextToProps)(withRouter(ImportChart));
