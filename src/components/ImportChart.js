import { render } from 'react-dom'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import React from "react";
import _ from 'lodash';
import history from '../history'
import { Row, Col, Button, Card } from 'antd'

const ButtonGroup = Button.Group

class ImportChart extends React.Component {

  constructor(props) {
    super(props);
    this.setLogarithmic = this.setLogarithmic.bind(this)
    this.state = { options: {} };
  }

  componentWillMount = () => {
    const { datasetKey, data, title, subtitle, defaultType, nameSearchParam } = this.props;
    var chartData = [];
    var logChartData = [];
    var max;
    var min;
    _.each(data, (v, k) => {
      if (_.isUndefined(min) || v < min) {
        min = v
      }
      if (_.isUndefined(max) || v > max) {
        max = v
      }
      chartData.push([k, v])
    });
    var logMin = Math.log(min);
    var logStart = Math.max(0, Math.floor(logMin));
    var logMax = Math.log(max);
    chartData.forEach(function (e) {
      if (e[1] === 0) {
        logChartData.push([e[0], 0]);
      } else {
        logChartData.push([e[0], Math.round(100 * (Math.log(e[1]) - logStart) / (logMax - logStart))]);
      }
    });

    let options = {
      chart: {
        type: defaultType || 'column'
      },
      title: {
        text: title
      },
      subtitle: {
        text: subtitle
      },
      credits: false,
      xAxis: {
        type: 'category',
        labels: {
          rotation: -65,
          style: {
            fontSize: '13px',
            fontFamily: 'Verdana, sans-serif'
          }
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: title
        }
      },
      legend: {
        enabled: false
      },
      tooltip: {
        pointFormat: `${title}: <b>{point.y}</b>`
      },
      series: [{
        name: title,
        data: chartData,
        point: {
          events: {
            click: (e) => {
              history.push(`/dataset/${datasetKey}/names?${nameSearchParam}=${e.point.name}`)
            }
          }
        },
        dataLabels: this.getDataLabelOptions(defaultType || 'column')
      }]
    };

    this.setState({ options, chartData, logChartData, chartType: defaultType || 'column' })

  }

  getDataLabelOptions = (type) => {
    if (type === 'pie') {
      return {
        enabled: true,
        color: 'black',
        format: '{point.name}: {point.y}',
        style: {
          fontSize: '13px',
          fontFamily: 'Verdana, sans-serif'
        }
      }


    }
    if (type === 'column') {
      return {
        enabled: true,
        rotation: -90,
        color: '#FFFFFF',
        align: 'right',
        format: '{point.y}',
        y: 10, // 10 pixels down from the top
        style: {
          fontSize: '13px',
          fontFamily: 'Verdana, sans-serif'
        }
      }


    }
  }

  toggleChartType = (type) => {
    let { options } = this.state;
    const { title } = this.props
    options.chart.type = type;
  
    options.series[0].dataLabels = this.getDataLabelOptions(type)


    
   
    this.setState({ chartType: type, options });
  }

  setLogarithmic(checked) {
    let { options } = this.state;
    if (checked) {
      options.series[0].data = this.state.logChartData;
    } else {
      options.series[0].data = this.state.chartData;
    }
    this.setState({ logarithmic: checked, options });
  }

  render = () => {
    const { options, logarithmic, chartType } = this.state;
    console.log(options.series[0].dataLabels)
    return <Card>
      <ButtonGroup size='small'>
        <Button type={!logarithmic ? 'primary' : ''} onClick={() => { this.setLogarithmic(false) }}>Linear</Button>
        <Button type={logarithmic ? 'primary' : ''} onClick={() => { this.setLogarithmic(true) }}>Logarithmic</Button>
      </ButtonGroup>
      <ButtonGroup size='small' style={{ float: 'right' }}>
        <Button type={chartType === 'pie' ? 'primary' : ''} icon="pie-chart" onClick={() => { this.toggleChartType('pie') }} />
        <Button type={chartType === 'column' ? 'primary' : ''} icon="bar-chart" onClick={() => { this.toggleChartType('column') }} />
      </ButtonGroup>
      {chartType === 'pie' && <HighchartsReact
        highcharts={Highcharts}
        options={options}
      />}
      {chartType === 'column' && <HighchartsReact
        highcharts={Highcharts}
        options={options}
      />}
    </Card>
  }
}

export default ImportChart;
