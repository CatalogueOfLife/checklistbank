import React from "react";
import config from "../config";
import { withRouter } from "react-router-dom";
import _ from "lodash";
import axios from "axios";
import { LinkOutlined, UpOutlined, DownOutlined } from "@ant-design/icons";
import { Alert, Tag, Spin, Tooltip, Row, Col } from "antd";
import ErrorMsg from "./ErrorMsg";
import PresentationItem from "./PresentationItem";
import { NavLink } from "react-router-dom";

import withContext from "./hoc/withContext";

const md = 5;

/* const parentRelations = [
  "dwc:Taxon.dwc:parentNameUsageID",
  "col:Taxon.col:parentID"
]; */
const isValidURL = (string) => {
  if (typeof string !== "string") return false;
  var res = string.match(
    /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
  );
  if (res == null) return false;
  else return true;
};

class VerbatimPresentation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      verbatimLoading: true,
      verbatim: null,
      verbatimError: null,
      expanded: props.expanded !== false,
    };
  }
  componentDidMount() {
    const { verbatimKey, datasetKey } = this.props;
    this.setState({ verbatimLoading: true });
    axios(
      `${config.dataApi}dataset/${datasetKey}/verbatim/${encodeURIComponent(
        verbatimKey
      )}`
    )
      .then((res) => {
        this.setState({
          verbatimLoading: false,
          verbatim: res.data,
          verbatimError: null,
        });
      })
      .catch((err) => {
        this.setState({
          verbatimLoading: false,
          verbatimError: err,
          verbatim: null,
        });
      });
  }

  renderTerm = (key, value, type) => {
    const { termsMap, termsMapReversed, datasetKey, catalogueKey, location } =
      this.props;
    const taxonPath = {
      pathname:
        location.pathname.split(`dataset/${datasetKey}`)[0] +
        `dataset/${datasetKey}/taxon/${value}`,
    };

    const namePath = {
      pathname:
        location.pathname.split(`dataset/${datasetKey}`)[0] +
        `dataset/${datasetKey}/name/${value}`,
    };

    const referencePath = {
      pathname:
        location.pathname.split(`dataset/${datasetKey}`)[0] +
        `dataset/${datasetKey}/references/`,
      search: `?limit=50&offset=0&q=${value}`,
    };

    const isTaxonId =
      key === "acef:AcceptedTaxonID" ||
      ((key === "dwc:taxonID" || key === "dwc:acceptedNameUsageID") &&
        type === "dwc:Taxon") ||
      (key === "col:ID" && type === "col:Taxon");

    const isNameId =
      ((key === "col:ID" || key === "col:basionymID") && type === "col:Name") ||
      key === "col:nameID" ||
      key === "dwc:originalNameUsageID";

    const isReferenceId =
      key === "col:referenceID" ||
      (key === "dwca:id" && type === "dwc:Reference") ||
      key === "acef:ReferenceID" ||
      (key === "col:ID" && type === "col:Reference");

    if (_.get(termsMap, `${type}.${key}`)) {
      const primaryKeys = _.get(termsMap, `${type}.${key}`);

      const types = [
        ...new Set(
          primaryKeys.map((p) => `type=${encodeURIComponent(p.split(".")[0])}`)
        ),
      ];
      const terms = primaryKeys.map(
        (p) => `${p.split(".")[1]}=${encodeURIComponent(value)}`
      );
      return (
        <React.Fragment>
          <NavLink
            key={key}
            to={{
              pathname:
                location.pathname.indexOf(`catalogue/${catalogueKey}`) > -1
                  ? `/catalogue/${catalogueKey}/dataset/${datasetKey}/verbatim`
                  : `/dataset/${datasetKey}/verbatim`,
              search: `?${types.join("&")}&${terms.join("&")}&termOp=OR`,
            }}
          >
            {value}
          </NavLink>{" "}
          {isTaxonId && (
            <NavLink key={`taxonLink:${key}`} to={taxonPath}>
              taxon page
            </NavLink>
          )}
          {isNameId && (
            <NavLink key={`nameLink:${key}`} to={namePath}>
              name page
            </NavLink>
          )}
          {isReferenceId && (
            <NavLink key={`nameLink:${key}`} to={referencePath}>
              reference page
            </NavLink>
          )}
        </React.Fragment>
      );
    } else if (_.get(termsMapReversed, `${type}.${key}`)) {
      const foreignKeys = _.get(termsMapReversed, `${type}.${key}`);
      /*  .filter(
        k => !parentRelations.includes(k)
      ); */

      const types = [
        ...new Set(
          foreignKeys.map((p) => `type=${encodeURIComponent(p.split(".")[0])}`)
        ),
      ];
      const terms = foreignKeys.map(
        (p) => `${p.split(".")[1]}=${encodeURIComponent(value)}`
      );
      return (
        <React.Fragment>
          {value}{" "}
          <NavLink
            key={key}
            to={{
              pathname:
                location.pathname.indexOf(`catalogue/${catalogueKey}`) > -1
                  ? `/catalogue/${catalogueKey}/dataset/${datasetKey}/verbatim`
                  : `/dataset/${datasetKey}/verbatim`,
              search: `?${types.join("&")}&${terms.join("&")}&termOp=OR`,
            }}
          >
            {" "}
            <LinkOutlined></LinkOutlined>
          </NavLink>{" "}
          {isTaxonId && (
            <NavLink key={`taxonLink:${key}`} to={taxonPath}>
              taxon page
            </NavLink>
          )}
          {isNameId && (
            <NavLink key={`nameLink:${key}`} to={namePath}>
              name page
            </NavLink>
          )}
          {isReferenceId && (
            <NavLink key={`nameLink:${key}`} to={referencePath}>
              reference page
            </NavLink>
          )}
        </React.Fragment>
      );
    } else {
      return isValidURL(value) ? (
        <a
          href={
            value.startsWith("urn:lsid:")
              ? `http://www.lsid.info/resolver/?lsid=${value}`
              : value
          }
          target="_blank"
        >
          {value}
        </a>
      ) : (
        value
      );
    }
  };
  render = () => {
    const { verbatimLoading, verbatimError, verbatim, expanded } = this.state;
    const { issueMap, basicHeader, terms } = this.props;
    const title =
      _.get(verbatim, "type") && _.get(verbatim, "key")
        ? `${basicHeader ? "" : "Verbatim"} ${_.get(
            verbatim,
            "type"
          )} - ${_.get(verbatim, "key")}`
        : "Verbatim";
    return (
      <React.Fragment>
        <Row
          style={{
            background: "#f7f7f7",
            border: "1px solid #eee",
            borderWidth: "1px 0",
            paddingTop: "10px",
          }}
        >
          <Col span={12}>
            <h3 style={{ paddingLeft: 6 }}>
              {title}{" "}
              <a
                style={{ fontSize: 10 }}
                onClick={() => this.setState({ expanded: !expanded })}
              >
                {expanded ? <UpOutlined /> : <DownOutlined />}
              </a>
            </h3>
          </Col>
          <Col span={12}>
            {_.get(verbatim, "file") && (
              <p style={{ textAlign: "right", paddingRight: 6 }}>
                {`${_.get(verbatim, "file")}${
                  _.get(verbatim, "line")
                    ? `, line ${_.get(verbatim, "line")}`
                    : ""
                }`}
              </p>
            )}
          </Col>
        </Row>
        {expanded && (
          <React.Fragment>
            {verbatimLoading && <Spin />}
            {verbatimError && (
              <Alert
                message={<ErrorMsg error={verbatimError} />}
                type="error"
              />
            )}
            {_.get(verbatim, "file") && (
              <PresentationItem md={md} key="file" label="File">
                {`${_.get(verbatim, "file")}${
                  _.get(verbatim, "line")
                    ? `, line ${_.get(verbatim, "line")}`
                    : ""
                }`}
              </PresentationItem>
            )}
            {_.get(verbatim, "issues") && verbatim.issues.length > 0 && (
              <PresentationItem md={md} label="Issues and flags">
                <div>
                  {verbatim.issues.map((i) => (
                    <Tooltip
                      key={i}
                      title={_.get(issueMap, `[${i}].description`)}
                    >
                      <Tag key={i} color={_.get(issueMap, `[${i}].color`)}>
                        {i}
                      </Tag>
                    </Tooltip>
                  ))}
                </div>
              </PresentationItem>
            )}

            {_.get(verbatim, "terms") &&
              terms.map((t) =>
                verbatim.terms[t] ? (
                  <PresentationItem md={md} label={t} key={t}>
                    {this.renderTerm(
                      t,
                      verbatim.terms[t],
                      _.get(verbatim, "type")
                    )}
                  </PresentationItem>
                ) : (
                  ""
                )
              )}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };
}

const mapContextToProps = ({
  issueMap,
  termsMap,
  termsMapReversed,
  terms,
  catalogueKey,
}) => ({ issueMap, termsMap, termsMapReversed, terms, catalogueKey });

export default withContext(mapContextToProps)(withRouter(VerbatimPresentation));
