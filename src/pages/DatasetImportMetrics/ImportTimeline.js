import React from "react";
import { Alert, Empty, Row, Col, Select, Form, Spin } from "antd";
import axios from "axios";
import config from "../../config";
import ErrorMsg from "../../components/ErrorMsg";
import PageContent from "../../components/PageContent";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import _ from "lodash";
import withContext from "../../components/hoc/withContext";
import history from "../../history";
import Menu from "./Menu";
const defaultSeries = "taxonCount synonymCount".split(" ");

const { Option } = Select;

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

class ImportTimeline extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      groups: [],
      importHistory: [],
      timestampToAttemptMap: {},
      error: null,
      selectedGroup: "default",
    };
  }

  componentDidMount = () => {
    //this.initChart(null);
    this.getHistory();
  };

  componentDidUpdate = (prevProps) => {};

  getHistory = () => {
    const { datasetKey, addError } = this.props;

    return axios(
      `${config.dataApi}dataset/${datasetKey}/import?limit=250&state=finished`
    )
      .then((res) => {
        const groups = Object.keys(res.data[0]).filter(
          (key) => typeof res.data[0][key] === "object"
        );
        const reversed = res.data.reverse();
        let timestampToAttemptMap = {};
        res.data.forEach((i) => {
          timestampToAttemptMap[Date.parse(i.finished)] = i.attempt;
        });

        this.setState(
          {
            importHistory: reversed,
            timestampToAttemptMap,
            groups: groups,
            error: null,
          },
          () => this.initChart(reversed)
        );
      })
      .catch((err) => {
        this.setState({ error: err, importHistory: null });
      });
  };

  initChart = (finishedImports) => {
    const { datasetKey, addError, dataset } = this.props;

    const { selectedGroup, timestampToAttemptMap } = this.state;
    const seriesNames =
      selectedGroup === "default"
        ? Object.keys(finishedImports[finishedImports.length - 1]).filter(
            (k) =>
              typeof finishedImports[finishedImports.length - 1][k] ===
                "number" && !["attempt", "createdBy", "datasetKey"].includes(k)
          )
        : Object.keys(
            finishedImports[finishedImports.length - 1][selectedGroup]
          );

    const series = seriesNames.map((name) => ({
      name: selectedGroup === "default" ? _.startCase(name) : name,
      data: finishedImports.map((i) => [
        Date.parse(i.finished),

        selectedGroup === "default"
          ? _.get(i, `[${name}]`, 0)
          : _.get(i, `[${selectedGroup}][${name}]`, 0),
        i.attempt.toString(),
      ]),
      point: {
        events: {
          click: (e) => {
            // Get attempt no by finished timestamp
            const attempt = timestampToAttemptMap[e.point.x];
            history.push(`/dataset/${datasetKey}/imports/${attempt}`);
          },
        },
      },
    }));
    let options = {
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
      /*  subtitle: {
        text: "Source: thesolarfoundation.com",
      }, */

      yAxis: {
        title: {
          text: "Number of entities",
        },
      },

      xAxis: {
        type: "datetime",
        /* dateTimeLabelFormats: {
          // don't display the dummy year
          month: "%e. %b",
          year: "%b",
        }, */
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
          // pointStart: 2010,
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

    this.setState({
      options,
      //chartData,
    });
  };

  selectGroup = (selectedGroup) => {
    this.setState({ selectedGroup }, () => {
      this.initChart(this.state.importHistory);
    });
  };

  render() {
    const { options, groups, selectedGroup } = this.state;
    const { datasetKey, addError, dataset } = this.props;
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
              <Select value={selectedGroup} onChange={this.selectGroup}>
                <Option key="default" value="default">
                  {"default"}
                </Option>
                {groups.map((g) => (
                  <Option key={g} value={g}>
                    {_.startCase(g)}
                  </Option>
                ))}
              </Select>
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
  }
}

const mapContextToProps = ({ addError, dataset }) => ({
  addError,
  dataset,
});

export default withContext(mapContextToProps)(ImportTimeline);
