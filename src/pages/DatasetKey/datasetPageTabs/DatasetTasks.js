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
    const { datasetKey} = this.props;

    this.setState({ loading: true });
    const duplicatesWithNodecision = await getDuplicateOverview(
      datasetKey
    );
  
   
    const duplicates = duplicatesWithNodecision.map((d) => ({
      id: d.id,
      text: d.text,
      count: d.count,
      error: d.error ,
    }));
    this.setState({ duplicates: duplicates, loading: false });
  };

  getManusciptNames = () => {
    const { datasetKey } = this.props;
    axios(
      `${config.dataApi}dataset/${datasetKey}/nameusage/search?nomstatus=manuscript&limit=0`
    ).then((res) => {
      this.setState({
        manuscriptNames: { count: res.data.total },
      })
    });
  };

  render() {
    const { error, duplicates, manuscriptNames, loading } = this.state;
    const { getDuplicateWarningColor, datasetKey, assembly } =
      this.props;

    return (
      <PageContent>
        {error && <Alert description={<ErrorMsg error={error} />} type="error" />}
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
        <h1>Duplicates</h1>

          {loading && <Spin />}
          {duplicates
            .filter((d) => !d.error)
            .map((d) => (
              <NavLink
                to={{
                  pathname:  `/dataset/${datasetKey}/duplicates`,
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
                  
                    <strong>{d.count}</strong>
                  
                </Tag>{" "}
              </NavLink>
            ))}
          <h1>Manuscript names</h1>
          {manuscriptNames && (
            <NavLink
              to={{
                pathname:  `/dataset/${datasetKey}/workbench`,
                search: `?nomstatus=manuscript&limit=50`,
              }}
              exact={true}
            >
              <Tag
                style={{ marginBottom: "10px" }}
                color={getDuplicateWarningColor(manuscriptNames.count)}
              >
                Manuscript names{" "}
                {!assembly ? (
                  <strong>{`${manuscriptNames.count}`}</strong>
                ) : (
                  <strong>{`${manuscriptNames.completed} of ${manuscriptNames.count}`}</strong>
                )}
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
