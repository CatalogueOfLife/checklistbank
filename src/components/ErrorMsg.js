import React from "react";
import _ from "lodash";
import newGithubIssueUrl from 'new-github-issue-url';
import {Row, Col, Button} from "antd"
import { GithubOutlined} from "@ant-design/icons"
class ErrorMsg extends React.Component {
  render() {
    
    const { error } = this.props;
    return (
      <>
        {error.message && <h3>{error.message}</h3>}
        {_.get(error, "response.data.message") && (
          <p>{_.get(error, "response.data.message")}</p>
        )}
        {_.get(error, "response.data.details") && (
          <p>{_.get(error, "response.data.details")}</p>
        )}
        {_.get(error, "config.method") && (
          <p>
            HTTP method:{" "}
            <strong>{_.get(error, "config.method").toUpperCase()}</strong>
          </p>
        )}
        {_.get(error, "response.request.responseURL") && (
          <p>
            <a
              href={_.get(error, "response.request.responseURL")}
              target="_blank"
            >
              {_.get(error, "response.request.responseURL")}
            </a>
          </p>
        )}
        {_.get(error, "config.data") &&
          typeof _.get(error, "config.data") === "string" && (
            <>
              <h4>Body:</h4>
              <p>{_.get(error, "config.data")}</p>
            </>
          )}

          {_.get(error, "response.status", 0) > 499 && <Row><Col flex="auto"></Col><Col><Button type="link"  target="_blank" href={
            newGithubIssueUrl({
              user: 'CatalogueOfLife',
              repo: 'backend',
              title: error.message,
              body: _.get(error, "response.data.message")
            })

          }><GithubOutlined /></Button></Col></Row>}

      </>
    );
  }
}

export default ErrorMsg;
