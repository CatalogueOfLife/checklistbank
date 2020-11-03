import React from "react";
import { Alert, Tag, Card, Spin } from "antd";
import axios from "axios";
import config from "../../../config";
import { NavLink } from "react-router-dom";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import { getDuplicateOverview } from "../../../api/dataset";
import ErrorMsg from "../../../components/ErrorMsg";

class DatasetTasks extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      duplicates: [],
      duplicatesWithdecision: [],
      manuscriptNames: null,
      loading: false,
    };
  }

  componentDidMount() {
    this.getData();
    this.getManusciptNames();
  }

  getData = async () => {
    const { datasetKey, catalogueKey } = this.props;

    this.setState({ loading: true });
    const duplicatesWithNodecision = await getDuplicateOverview(
      datasetKey,
      catalogueKey,
      false
    );
    const duplicatesWithdecision = await getDuplicateOverview(
      datasetKey,
      catalogueKey,
      true
    );
    let completedMap = {};
    duplicatesWithdecision.forEach((c) => {
      completedMap[c.id] = { count: c.count, error: c.error };
    });
    const duplicates = duplicatesWithNodecision.map((d) => ({
      id: d.id,
      text: d.text,
      count: d.count,
      completed: completedMap[d.id].count,
      error: d.error || completedMap[d.id].error,
    }));
    this.setState({ duplicates: duplicates, loading: false });
  };

  getManusciptNames = () => {
    const { datasetKey, catalogueKey } = this.props;
    Promise.all([
      axios(
        `${config.dataApi}dataset/${datasetKey}/nameusage/search?catalogueKey=${catalogueKey}&nomstatus=manuscript&limit=0`
      ).then((res) => {
        return res.data.total;
      }),
      axios(
        `${config.dataApi}dataset/${datasetKey}/nameusage/search?catalogueKey=${catalogueKey}&nomstatus=manuscript&limit=0&decisionMode=_NOT_NULL`
      ).then((res) => {
        return res.data.total;
      }),
    ]).then((values) =>
      this.setState({
        manuscriptNames: { count: values[0], completed: values[1] },
      })
    );
  };

  render() {
    const { error, duplicates, manuscriptNames, loading } = this.state;
    const { getDuplicateWarningColor, datasetKey, catalogueKey } = this.props;

    return (
      <PageContent>
        {error && <Alert message={<ErrorMsg error={error} />} type="error" />}
        {duplicates
          .filter((d) => d.error)
          .map((d) => (
            <Alert
              style={{ marginTop: "8px" }}
              message={<ErrorMsg error={d.error} />}
              type="error"
            />
          ))}
        <Card>
          <h1>Duplicates without decision</h1>
          {loading && <Spin />}
          {duplicates
            .filter((d) => !d.error)
            .map((d) => (
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/dataset/${datasetKey}/duplicates`,
                  search: `?_colCheck=${d.id}`,
                }}
                exact={true}
              >
                <Tag
                  key={d.id}
                  style={{ marginBottom: "10px" }}
                  color={getDuplicateWarningColor(d.count)}
                >
                  {d.text}{" "}
                  {
                    <strong>{`${d.completed} of ${
                      d.completed + d.count > 50
                        ? "> 50"
                        : d.completed + d.count
                    }`}</strong>
                  }
                </Tag>{" "}
              </NavLink>
            ))}
          <h1>Manuscript names without decision</h1>
          {manuscriptNames && (
            <NavLink
              to={{
                pathname: `/catalogue/${catalogueKey}/dataset/${datasetKey}/workbench`,
                search: `?nomstatus=manuscript&limit=50`,
              }}
              exact={true}
            >
              <Tag
                style={{ marginBottom: "10px" }}
                color={getDuplicateWarningColor(manuscriptNames.count)}
              >
                Manuscript names{" "}
                {
                  <strong>{`${manuscriptNames.completed} of ${manuscriptNames.count}`}</strong>
                }
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
