import React from "react";
import { Table, Alert, Tag, Card, Tooltip, Icon , Spin} from "antd";
import axios from "axios";
import config from "../../../config";
import { NavLink } from "react-router-dom";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import MultiValueFilter from "../../NameSearch/MultiValueFilter";
import { getDuplicateOverview } from "../../../api/dataset";

const _ = require("lodash");

class DatasetTasks extends React.Component {
  constructor(props) {
    super(props);
    this.state = { duplicates: [], duplicatesWithdecision: [], loading: false };
  }

  componentWillMount() {
    this.getData();
  }

  getData = async () => {
    const { datasetKey, catalogueKey } = this.props;

    this.setState({ loading: true });
    const duplicatesWithNodecision = await getDuplicateOverview(datasetKey, catalogueKey, false)
    const duplicatesWithdecision = await getDuplicateOverview(datasetKey, catalogueKey, true)
    let completedMap = {};
    duplicatesWithdecision.forEach(c => {
      completedMap[c.id] = c.count;
    })
    const duplicates = duplicatesWithNodecision.map(d => ({
      id: d.id,
      text: d.text,
      count: d.count,
      completed: completedMap[d.id]
    }))
    this.setState({ duplicates: duplicates, loading: false })
    

  };


  render() {
    const { error, duplicates, loading } = this.state;
    const {
      getDuplicateWarningColor,
      datasetKey,
      catalogueKey
    } = this.props;
   

    return (
      <PageContent>
        {error && <Alert message={error.message} type="error" />}
        <Card>
        <h1>Duplicates without decision</h1>
        {loading && <Spin />}
        {duplicates
          .map(d => (
            <NavLink
              to={{ pathname: `/catalogue/${catalogueKey}/dataset/${datasetKey}/duplicates`, search:`?_colCheck=${d.id}` }}
              exact={true}
            >
              <Tag
                key={d.id}
                style={{ marginBottom: "10px" }}
                color={getDuplicateWarningColor(d.count)}
              >
                {d.text} {<strong>{d.count > 0 && `completed ${d.completed} of`} {d.count > 50 ? '> 50' : d.count}</strong>}
              </Tag>{" "}
            </NavLink>
          ))}
        
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
  catalogueKey
}) => ({ user, issue, issueMap, getDuplicateWarningColor, catalogueKey });

export default withContext(mapContextToProps)(DatasetTasks);
