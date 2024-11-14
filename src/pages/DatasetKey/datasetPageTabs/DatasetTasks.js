import React from "react";
import { Alert, Tag, Card, Spin, Row, Col, Checkbox, Button } from "antd";
import axios from "axios";
import config from "../../../config";
import { NavLink } from "react-router-dom";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import { getDuplicateOverview } from "../../../api/dataset";
import ErrorMsg from "../../../components/ErrorMsg";
import DatasetAutocomplete from "../../catalogue/Assembly/DatasetAutocomplete";

class DatasetTasks extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      duplicates: [],
      duplicatesWithdecision: [],
      manuscriptNames: null,
      staleDecisions: null,
      loading: false,
      sourceDatasetKey: null,
      merge: false,
    };
  }

  /*  componentDidMount() {
    this.getData();
    this.getManusciptNames();
    this.getStaleDecisions();
  } */

  getData = async () => {
    const { datasetKey, assembly } = this.props;
    const { sourceDatasetKey } = this.state;
    this.setState({ loading: true });
    const duplicatesWithNodecision = await getDuplicateOverview({
      datasetKey,
      catalogueKey: assembly ? datasetKey : null,
      sourceDatasetKey,
    });

    const duplicates = duplicatesWithNodecision.map((d) => ({
      id: d.id,
      text: d.text,
      count: d.count,
      error: d.error,
    }));
    this.setState({ duplicates: duplicates, loading: false });
  };

  getManusciptNames = () => {
    const { datasetKey } = this.props;
    axios(
      `${
        config.dataApi
      }dataset/${datasetKey}/nameusage/search?nomstatus=manuscript&limit=0${
        this.state.sourceDatasetKey
          ? "&sourceDatasetKey=" + this.state.sourceDatasetKey
          : ""
      }`
    ).then((res) => {
      this.setState({
        manuscriptNames: { count: res.data.total },
      });
    });
  };

  getStaleDecisions = () => {
    const { datasetKey } = this.props;
    axios(
      `${config.dataApi}dataset/${datasetKey}/decision/stale${
        this.state.sourceDatasetKey
          ? "&sourceDatasetKey=" + this.state.sourceDatasetKey
          : ""
      }`
    ).then((res) => {
      this.setState({
        staleDecisions: { count: res.data.total },
      });
    });
  };

  render() {
    const { error, duplicates, manuscriptNames, staleDecisions, loading } =
      this.state;
    const { getDuplicateWarningColor, datasetKey, assembly } = this.props;

    return (
      <PageContent>
        {error && (
          <Alert description={<ErrorMsg error={error} />} type="error" />
        )}
        {duplicates
          .filter((d) => d.error)
          .map((d) => (
            <Alert
              style={{ marginTop: "8px" }}
              description={<ErrorMsg error={d.error} />}
              type="error"
            />
          ))}

        <Card>
          {!!assembly && (
            <Row>
              <Col>
                <Button
                  loading={loading}
                  disabled={loading}
                  type="primary"
                  onClick={() => {
                    this.getData();
                    this.getManusciptNames();
                    this.getStaleDecisions();
                  }}
                >
                  Load tasks{" "}
                  {this.state?.sourceDatasetKey
                    ? `for source ${this.state?.sourceDatasetKey}`
                    : ""}
                </Button>
              </Col>
              <Col flex="auto"></Col>
              <Col>
                <DatasetAutocomplete
                  placeHolder="Filter to source"
                  contributesTo={this.props?.catalogueKey}
                  autoFocus={false}
                  onSelectDataset={(ds) =>
                    this.setState(
                      {
                        sourceDatasetKey: ds?.key,
                        duplicates: [],
                        duplicatesWithdecision: [],
                        manuscriptNames: null,
                        staleDecisions: null,
                      },
                      this.getData
                    )
                  }
                  /*               defaultDatasetKey={match?.params?.sourceKey}
                   */ merge={this.state?.merge}
                />
                <Checkbox
                  value={this.state.merge}
                  onChange={(e) => this.setState({ merge: e.target.checked })}
                >
                  Include merged sources
                </Checkbox>
              </Col>
            </Row>
          )}
          {duplicates?.length > 0 && <h1>Duplicates</h1>}

          {loading && <Spin />}

          {duplicates
            .filter((d) => !d.error)
            .map((d) => (
              <NavLink
                to={{
                  pathname: `/dataset/${datasetKey}/duplicates`,
                  search: `?_colCheck=${d.id}${
                    this.state.sourceDatasetKey
                      ? "&sourceDatasetKey=" + this.state.sourceDatasetKey
                      : ""
                  }`,
                }}
                exact={true}
              >
                <Tag
                  key={d.id}
                  style={{ marginBottom: "10px" }}
                  color={getDuplicateWarningColor(d.count)}
                >
                  {d.text} <strong>{d.count}</strong>
                </Tag>{" "}
              </NavLink>
            ))}
          {!!manuscriptNames?.count && <h1>Manuscript names</h1>}
          {manuscriptNames && (
            <NavLink
              to={{
                pathname: `/dataset/${datasetKey}/workbench`,
                search: `?nomstatus=manuscript&limit=50${
                  this.state.sourceDatasetKey
                    ? "&sourceDatasetKey=" + this.state.sourceDatasetKey
                    : ""
                }`,
              }}
              exact={true}
            >
              <Tag
                style={{ marginBottom: "10px" }}
                color={getDuplicateWarningColor(manuscriptNames.count)}
              >
                Manuscript names <strong>{`${manuscriptNames.count}`}</strong>
              </Tag>
            </NavLink>
          )}
          {staleDecisions && (
            <NavLink
              to={{
                pathname: `/catalogue/${datasetKey}/decision`,
                search: `?stale=true${
                  this.state.sourceDatasetKey
                    ? "&sourceDatasetKey=" + this.state.sourceDatasetKey
                    : ""
                }`,
              }}
              exact={true}
            >
              <Tag
                style={{ marginBottom: "10px" }}
                color={getDuplicateWarningColor(staleDecisions.count)}
              >
                Outdated decisions (<strong>{`${staleDecisions.count}`}</strong>
                )
              </Tag>
            </NavLink>
          )}
        </Card>
      </PageContent>
    );
  }
}

const mapContextToProps = ({
  user,
  issue,
  issueMap,
  getDuplicateWarningColor,
  catalogueKey,
}) => ({ user, issue, issueMap, getDuplicateWarningColor, catalogueKey });

export default withContext(mapContextToProps)(DatasetTasks);
