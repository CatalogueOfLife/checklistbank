import React from "react";
import { Alert, Empty, Row, Col, Select, notification, Spin } from "antd";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";
import { withRouter } from "react-router-dom";
import PageContent from "../../../components/PageContent";
import { Diff2Html } from "diff2html";
import "diff2html/dist/diff2html.min.css";
import _ from "lodash";
import moment from "moment";
import history from "../../../history";
import qs from "query-string";
import Menu from "../../DatasetImportMetrics/Menu";
import withContext from "../../../components/hoc/withContext";

const { Option } = Select;
class DatasetDiff extends React.Component {
  constructor(props) {
    super(props);
    const {
      location: { search },
    } = this.props;
    const params = qs.parse(search);

    this.state = {
      data: null,
      error: null,
      importHistory: [],
      loading: true,
      attempt1: this.attemptsParamIsSetAndValid(params.attempts)
        ? Number(params.attempts.split("..")[0])
        : 1,
      attempt2: this.attemptsParamIsSetAndValid(params.attempts)
        ? Number(params.attempts.split("..")[1])
        : 2,
    };
  }

  componentDidMount = async () => {
    const {
      datasetKey,
      location: { search },
    } = this.props;
    const params = qs.parse(search);
    if (!params.attempts) {
      const importHistory = await this.getHistory();
      if (importHistory.length > 1) {
        const attempt1 = importHistory[1];
        const attempt2 = importHistory[0];
        history.push({
          pathname: `/dataset/${datasetKey}/diff`,
          search: `?attempts=${attempt1.attempt}..${attempt2.attempt}`,
        });
      }
    } else {
      this.getData();
    }
    this.getHistory();
    //this.getData();
  };

  componentDidUpdate = (prevProps) => {
    if (_.get(this.props, "datasetKey") !== _.get(prevProps, "datasetKey")) {
      this.getHistory();
      this.getData();
    }
    if (
      _.get(this.props, "location.search") !==
      _.get(prevProps, "location.search")
    ) {
      const {
        location: { search },
      } = this.props;
      const params = qs.parse(search);
      if (this.attemptsParamIsSetAndValid(params.attempts)) {
        this.setState({
          attempt1: this.attemptsParamIsSetAndValid(params.attempts)
            ? Number(params.attempts.split("..")[0])
            : 1,
          attempt2: this.attemptsParamIsSetAndValid(params.attempts)
            ? Number(params.attempts.split("..")[1])
            : 2,
        });
      }
      this.getData();
    }
  };
  attemptsParamIsSetAndValid = (attempts) => {
    if (attempts) {
      const splitted = attempts.split("..");
      if (
        splitted.length !== 2 ||
        isNaN(Number(splitted[0])) ||
        isNaN(Number(splitted[1]))
      ) {
        this.setState({
          error: { message: `Invalid attempts param given: ${attempts}` },
        });
        return false;
      } else {
        return true;
      }
    }
    return false;
  };
  getData = () => {
    const {
      datasetKey,
      location: { search },
    } = this.props;
    const params = qs.parse(search);
    this.attemptsParamIsSetAndValid(params.attempts);
    axios(
      `${config.dataApi}dataset/${datasetKey}/diff?attempts=${params.attempts}`
    )
      .then((res) => {
        this.setState({
          loading: false,
          data: res.data,
          error: null,
        });
      })
      .catch((err) => {
        this.setState({
          loading: false,
          error: err,
          data: null,
        });
      });
  };

  getHistory = () => {
    const { datasetKey } = this.props;

    return axios(`${config.dataApi}dataset/${datasetKey}/import?limit=20`)
      .then((res) => {
        const importHistory = res.data.filter((e) => e.state === "finished");
        this.setState({
          importHistory,
          err: null,
        });
        if (importHistory.length === 1) {
          this.setState({ loading: false, onlyOneImport: true });
        }
        return importHistory;
      })
      .catch((err) => {
        this.setState({ historyError: err, importHistory: null });
      });
  };

  attemptsChange = () => {};

  render() {
    const diff = _.get(this.state, "data");
    const { datasetKey, dataset } = this.props;
    const { error, attempt1, attempt2, importHistory, loading, onlyOneImport } =
      this.state;

    let html;
    if (diff) {
      try {
        html = Diff2Html.getPrettyHtml(diff, {
          inputFormat: "diff",
          showFiles: false,
          matching: "lines",
          outputFormat: "side-by-side",
        });
      } catch (error) {
        this.setState({ parsingError: error });
      }
    }

    return (
      <PageContent>
        <Menu dataset={dataset} datasetKey={datasetKey} />
        <Row style={{ marginBottom: "8px" }}>
          <Col span={12}>
            <Select
              value={attempt1}
              style={{ width: "90%" }}
              onChange={(value) => {
                if (value >= attempt2) {
                  notification.error({
                    message: "Invalid attempt",
                    description: "Attempt 1 must be less than Attempt 2",
                    duration: 2,
                  });
                } else {
                  history.push({
                    pathname: `/dataset/${datasetKey}/diff`,
                    search: `?attempts=${value}..${attempt2}`,
                  });
                }
              }}
              showSearch
            >
              {importHistory.map((i) => (
                <Option key={i.attempt} value={i.attempt}>{`Attempt ${
                  i.attempt
                } - ${moment(i.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`}</Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <Select
              style={{ width: "90%" }}
              value={attempt2}
              onChange={(value) => {
                if (value <= attempt1) {
                  notification.error({
                    message: "Invalid attempt",
                    description: "Attempt 2 must be greater tha Attempt 1",
                    duration: 2,
                  });
                } else {
                  history.push({
                    pathname: `/dataset/${datasetKey}/diff`,
                    search: `?attempts=${attempt1}..${value}`,
                  });
                }
              }}
              showSearch
            >
              {importHistory.map((i) => (
                <Option key={i.attempt} value={i.attempt}>{`Attempt ${
                  i.attempt
                } - ${moment(i.finished).format(
                  "MMMM Do YYYY, h:mm a"
                )}`}</Option>
              ))}
            </Select>
          </Col>
        </Row>
        {onlyOneImport && <Empty description="No diff available" />}
        {error && (
          <Row style={{ marginBottom: "8px" }}>
            <Alert type="error" description={<ErrorMsg error={error} />} />
          </Row>
        )}
        {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
        {loading && (
          <Row style={{ marginTop: "40px" }}>
            <Col flex="auto"></Col>
            <Col>
              <Spin size="large" />
            </Col>
            <Col flex="auto"></Col>
          </Row>
        )}
        {_.get(this.state, "data") === "" && (
          <Row style={{ marginTop: "40px" }}>
            <Col flex="auto"></Col>
            <Col>
              <Empty description="No diff between import attempts" />
            </Col>
            <Col flex="auto"></Col>
          </Row>
        )}
      </PageContent>
    );
  }
}

const mapContextToProps = ({ addError, dataset }) => ({ addError, dataset });
export default withContext(mapContextToProps)(withRouter(DatasetDiff));
