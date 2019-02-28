import React from "react";
import { Timeline, Icon, Tooltip } from "antd";
import moment from "moment";
import { NavLink } from "react-router-dom";
import kibanaQuery from '../Imports/importTabs/kibanaQuery'
 
const tagColors = {
  processing: "purple",
  downloading: "cyan",
  inserting: "blue",
  finished: "green",
  failed: "red",
  "in queue": "orange"
};
const ImportHistory = ({ importHistory }) => (
  <Timeline>
    {importHistory.map(h => (
      <Timeline.Item color={tagColors[h.state]}>
        {h.state === "finished" && (
          <React.Fragment>
            <NavLink
          to={{
            pathname: `/dataset/${h.datasetKey}/metrics/${h.attempt}`
          }}
          exact={true}
        >
          <strong>{`${h.state}`}</strong>
        </NavLink>
            
            <p>{`${moment(h.started).format("lll")}`}</p>
          </React.Fragment>
        )}
        {h.state === "failed" && (
          <React.Fragment>
            <strong>{`${h.state} `}
            <Tooltip title="Kibana logs" placement="right"><a href={kibanaQuery(h.datasetKey)}><Icon type="code" /></a></Tooltip></strong>
            <p>{`${moment(h.started).format("lll")}`}</p>
            <p>{h.error}</p>
          </React.Fragment>
        )}
      </Timeline.Item>
    ))}
  </Timeline>
);

export default ImportHistory;
