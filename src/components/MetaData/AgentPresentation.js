import React from "react";
import withContext from "../hoc/withContext";
import _ from "lodash";

const AgentPresentation = ({
  agent,
  countryAlpha2,
  style,
  noLinks,
  hideEmail,
}) => {
  const country = _.get(agent, "country")
    ? _.get(
        countryAlpha2,
        `[${_.get(agent, "country")}].title`,
        _.get(agent, "country")
      )
    : null;
  return agent ? (
    <span style={style}>
      {(agent.given || agent.family) && (
        <span style={{ display: "block", "text-decoration": "underline" }}>
          {[agent.family, agent.given].filter((a) => !!a).join(", ")}
        </span>
      )}
      {agent.orcid &&
        (noLinks ? (
          <div>
            <img
              src="/images/orcid_16x16.png"
              style={{ flex: "0 0 auto" }}
              alt=""
            ></img>{" "}
            {agent.orcid}
          </div>
        ) : (
          <a
            style={{ display: "block" }}
            href={`https://orcid.org/${agent.orcid}`}
          >
            <img
              src="/images/orcid_16x16.png"
              style={{ flex: "0 0 auto" }}
              alt=""
            ></img>{" "}
            {agent.orcid}
          </a>
        ))}
      {agent.organisation && (
        <span style={{ display: "block" }}>{agent.organisation}</span>
      )}
      {agent.rorid &&
        (noLinks ? (
          <div>
            <img
              src="/images/ror-logo-small.png"
              style={{ flex: "0 0 auto", height: "20px" }}
              alt=""
            ></img>{" "}
            {agent.rorid}
          </div>
        ) : (
          <a
            style={{ display: "block" }}
            href={`https://ror.org/${agent.rorid}`}
          >
            <img
              src="/images/ror-logo-small.png"
              style={{ flex: "0 0 auto", height: "20px" }}
              alt=""
            ></img>{" "}
            {agent.rorid}
          </a>
        ))}

      {agent.department && (
        <span style={{ display: "block" }}>{agent.department}</span>
      )}
      {(agent.city || agent.state || country) && (
        <span style={{ display: "block" }}>
          {[agent.city, agent.state, country].filter((a) => !!a).join(", ")}
        </span>
      )}
      {agent.email &&
        !hideEmail &&
        (noLinks ? (
          <div>{agent.email}</div>
        ) : (
          <a style={{ display: "block" }} href={`mailto:${agent.email}`}>
            {agent.email}
          </a>
        ))}
      {agent.url &&
        (noLinks ? (
          <div>{agent.url}</div>
        ) : (
          <a style={{ display: "block" }} href={agent.url} target="_blank">
            {agent.url}
          </a>
        ))}
      {agent.note && <div><i>{agent.note}</i></div>}
    </span>
  ) : null;
};

const mapContextToProps = ({ countryAlpha2 }) => ({
  countryAlpha2,
});

export default withContext(mapContextToProps)(AgentPresentation);
