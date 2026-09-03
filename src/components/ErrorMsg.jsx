import _ from "lodash";
import newGithubIssueUrl from "new-github-issue-url";
import { Row, Col, Button } from "antd";
import { GithubOutlined } from "@ant-design/icons";

// Statuses that mean "the API did not answer", not "the app is broken".
// Varnish answers 503 for every path routed to a backend that is down, which during a
// backend redeploy is most of the API.
const UNAVAILABLE_STATUS = [502, 503, 504];

/**
 * True when the request never reached a working API.
 *
 * Two shapes have to be covered. A plain request gets the proxy's real 5xx. A request that
 * needs a CORS preflight gets nothing at all: a preflight must answer 2xx, so a 503 on the
 * preflight fails the CORS check and the browser hands javascript an opaque network error
 * with no response and no status.
 */
export const isApiUnavailable = (error) => {
  const status = _.get(error, "response.status");
  if (status) {
    return UNAVAILABLE_STATUS.includes(status);
  }
  return (
    error?.code === "ERR_NETWORK" ||
    error?.code === "ECONNABORTED" ||
    error?.message === "Network Error" ||
    (!!error?.request && !error?.response)
  );
};

const isAuthenticatedRequest = (error) =>
  !!(
    _.get(error, "config.headers.Authorization") ||
    _.get(error, "config.headers.authorization")
  );

const ErrorMsg = ({ error }) => {
  // An outage is not a bug report: no raw axios string, no HTTP method, no issue button.
  if (isApiUnavailable(error)) {
    return (
      <>
        <h3>The ChecklistBank API is temporarily unavailable</h3>
        <p>
          The server is most likely being restarted or redeployed. Please try again in a
          few minutes — there is nothing wrong with your browser or your connection.
        </p>
        {isAuthenticatedRequest(error) && (
          <p>
            Signed in features such as editing and private datasets stay unavailable until
            the API is back.
          </p>
        )}
      </>
    );
  }

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
          <a href={_.get(error, "response.request.responseURL")} target="_blank">
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

      {_.get(error, "response.status", 0) > 499 && (
        <Row>
          <Col flex="auto"></Col>
          <Col>
            <Button
              type="link"
              target="_blank"
              href={newGithubIssueUrl({
                user: "CatalogueOfLife",
                repo: "backend",
                title: error.message,
                body: _.get(error, "response.data.message"),
              })}
            >
              <GithubOutlined />
            </Button>
          </Col>
        </Row>
      )}
    </>
  );
};

export default ErrorMsg;
