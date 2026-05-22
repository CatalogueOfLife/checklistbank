import { useState, useEffect } from "react";
import { Alert, Empty, Row, Col, Select, Form, Spin } from "antd";
import axios from "axios";
import config from "../../config";
import ErrorMsg from "../../components/ErrorMsg";
import PageContent from "../../components/PageContent";
import Highcharts from "highcharts";
import HighchartsReact from "../../components/HighchartsReact";
import _ from "lodash";
import withContext from "../../components/hoc/withContext";
import history from "../../history";
import Menu from "./Menu";
const defaultSeries = "taxonCount synonymCount".split(" ");

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const ImportTimeline = ({ datasetKey, addError, dataset }) => {
  const [groups, setGroups] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [timestampToAttemptMap, setTimestampToAttemptMap] = useState({});
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("default");
  const [options, setOptions] = useState(null);

  const initChart = (finishedImports, currentSelectedGroup, currentTimestampMap) => {
    const seriesNames =
      currentSelectedGroup === "default"
        ? Object.keys(finishedImports[finishedImports.length - 1]).filter(
            (k) =>
              typeof finishedImports[finishedImports.length - 1][k] ===
                "number" && !["attempt", "createdBy", "datasetKey"].includes(k)
          )
        : Object.keys(
            finishedImports[finishedImports.length - 1][currentSelectedGroup]
          );

    const series = seriesNames.map((name) => ({
      name: currentSelectedGroup === "default" ? _.startCase(name) : name,
      data: finishedImports.map((i) => [
        Date.parse(i.finished),
        currentSelectedGroup === "default"
          ? _.get(i, `[${name}]`, 0)
          : _.get(i, `[${currentSelectedGroup}][${name}]`, 0),
        i.attempt.toString(),
      ]),
      point: {
        events: {
          click: (e) => {
            // Get attempt no by finished timestamp
            const attempt = currentTimestampMap[e.point.x];
            history.push(`/dataset/${datasetKey}/imports/${attempt}`);
          },
        },
      },
    }));
    const newOptions = {
      chart: {
        zoomType: "x",
      },
      title: {
        text:
          dataset?.origin === "project"
            ? "Release timeline"
            : "Import timeline",
      },
      credits: false,

      yAxis: {
        title: {
          text: "Number of entities",
        },
      },

      xAxis: {
        type: "datetime",
        title: {
          text: "Date",
        },
      },

      legend: {
        layout: "vertical",
        align: "right",
        verticalAlign: "middle",
      },

      plotOptions: {
        series: {
          label: {
            connectorAllowed: false,
          },
        },
      },

      series: series,

      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 500,
            },
            chartOptions: {
              legend: {
                layout: "horizontal",
                align: "center",
                verticalAlign: "bottom",
              },
            },
          },
        ],
      },
    };

    setOptions(newOptions);
  };

  const getHistory = () => {
    return axios(
      `${config.dataApi}dataset/${datasetKey}/import?limit=250&state=finished`
    )
      .then((res) => {
        const newGroups = Object.keys(res.data[0]).filter(
          (key) => typeof res.data[0][key] === "object"
        );
        const reversed = res.data.reverse();
        let newTimestampToAttemptMap = {};
        res.data.forEach((i) => {
          newTimestampToAttemptMap[Date.parse(i.finished)] = i.attempt;
        });

        setImportHistory(reversed);
        setTimestampToAttemptMap(newTimestampToAttemptMap);
        setGroups(newGroups);
        setError(null);
        initChart(reversed, selectedGroup, newTimestampToAttemptMap);
      })
      .catch((err) => {
        setError(err);
        setImportHistory(null);
      });
  };

  useEffect(() => {
    getHistory();
  }, []);

  const selectGroup = (newGroup) => {
    setSelectedGroup(newGroup);
    initChart(importHistory, newGroup, timestampToAttemptMap);
  };

  return (
    <PageContent>
      <Menu datasetKey={datasetKey} dataset={dataset} />
      <Row>
        <Col flex="auto"></Col>
        <Col>
          <Form.Item
            {...formItemLayout}
            label="Select group"
            style={{ marginBottom: "8px", width: "400px" }}
          >
            <Select
              value={selectedGroup}
              onChange={selectGroup}
              options={[
                { value: "default", label: "default" },
                ...groups.map((g) => ({ value: g, label: _.startCase(g) })),
              ]}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          {options && (
            <HighchartsReact highcharts={Highcharts} options={options} />
          )}
        </Col>
      </Row>
    </PageContent>
  );
};

const mapContextToProps = ({ addError, dataset }) => ({
  addError,
  dataset,
});

export default withContext(mapContextToProps)(ImportTimeline);
