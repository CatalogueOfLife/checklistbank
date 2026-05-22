import React, { useEffect, useState } from "react";
import config from "../config";
import withRouter from "../withRouter";
import _ from "lodash";
import axios from "axios";
import { LinkOutlined, UpOutlined, DownOutlined } from "@ant-design/icons";
import { Alert, Tag, Skeleton, Tooltip, Row, Col, Card } from "antd";
import ErrorMsg from "./ErrorMsg";
import PresentationItem from "./PresentationItem";
import { NavLink } from "react-router-dom";
import Highlighter from "react-highlight-words";
import withContext from "./hoc/withContext";
const md = 5;

/* const parentRelations = [
  "dwc:Taxon.dwc:parentNameUsageID",
  "col:Taxon.col:parentID"
]; */
const isValidURL = (string) => {
  if (typeof string !== "string") return false;
  const exp =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
  // const exp = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
  var res = string.match(exp);
  if (res === null) return false;
  else return string.trim().startsWith(res);
};

const VerbatimPresentation = ({
  verbatimKey,
  datasetKey,
  record,
  expanded: expandedProp,
  issueMap,
  termsMap,
  termsMapReversed,
  terms,
  projectKey,
  location,
  basicHeader,
  style = {},
}) => {
  const [verbatimLoading, setVerbatimLoading] = useState(false);
  const [verbatim, setVerbatim] = useState(null);
  const [verbatimError, setVerbatimError] = useState(null);
  const [expanded, setExpanded] = useState(expandedProp !== false);
  const [homoglyphs, setHomoglyphs] = useState({});

  useEffect(() => {
    let cancelled = false;
    if (record) {
      setVerbatimLoading(false);
      setVerbatim(record);
      setVerbatimError(null);
    } else {
      setVerbatimLoading(true);
      axios(
        `${config.dataApi}dataset/${datasetKey}/verbatim/${encodeURIComponent(
          verbatimKey
        )}`
      )
        .then((res) => {
          if (!cancelled) {
            setVerbatimLoading(false);
            setVerbatim(res.data);
            setVerbatimError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setVerbatimLoading(false);
            setVerbatimError(err);
            setVerbatim(null);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [verbatimKey, datasetKey, record]);

  const getHomoglyphs = async () => {
    const { terms: verbatimTerms } = verbatim;
    let termsMap = {};
    for (const key of Object.keys(verbatimTerms)) {
      try {
        let { data: homoglyphData } = await axios.post(
          `${config.dataApi}parser/homoglyph`,
          verbatimTerms[key],
          { headers: { "content-type": "text/plain" } }
        );
        if (homoglyphData.hasHomoglyphs) {
          termsMap[key] = homoglyphData.positions.map((p) =>
            verbatimTerms[key].charAt(p - 1)
          );
        }
      } catch (err) {
        alert(err);
      }
    }
    setHomoglyphs(termsMap);
  };

  const renderTerm = (key, value, type, homoglyphs) => {
    const taxonPath = {
      pathname:
        location.pathname.split(`dataset/${datasetKey}`)[0] +
        `dataset/${datasetKey}/taxon/${encodeURIComponent(value)}`,
    };

    const namePath = {
      pathname:
        location.pathname.split(`dataset/${datasetKey}`)[0] +
        `dataset/${datasetKey}/name/${encodeURIComponent(value)}`,
    };

    const referencePath = {
      pathname:
        location.pathname.split(`dataset/${datasetKey}`)[0] +
        `dataset/${datasetKey}/reference/${encodeURIComponent(value)}`,
      //search: `?limit=50&offset=0&q=${value}`,
    };

    const isTaxonId =
      key === "acef:AcceptedTaxonID" ||
      ((key === "dwc:taxonID" || key === "dwc:acceptedNameUsageID") /* && type === "dwc:Taxon" */) ||
      (key === "col:ID" && type === "col:Taxon") ||
      key === "col:taxonID" ||
      key === "col:relatedNameUsageID";

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
                location.pathname.indexOf(`project/${projectKey}`) > -1
                  ? `/project/${projectKey}/dataset/${datasetKey}/verbatim`
                  : `/dataset/${datasetKey}/verbatim`,
              search: `?${types.join("&")}&${terms.join("&")}&termOp=OR`,
            }}
          >
            <Highlighter
              highlightStyle={{
                fontWeight: "bold",
                padding: 0,
                backgroundColor: "yellow",
              }}
              searchWords={homoglyphs[key] || []}
              autoEscape
              textToHighlight={value}
            />
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
          <Highlighter
            highlightStyle={{
              fontWeight: "bold",
              padding: 0,
              backgroundColor: "yellow",
            }}
            searchWords={homoglyphs[key] || []}
            autoEscape
            textToHighlight={value}
          />
          <NavLink
            key={key}
            to={{
              pathname:
                location.pathname.indexOf(`project/${projectKey}`) > -1
                  ? `/project/${projectKey}/dataset/${datasetKey}/verbatim`
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
          <Highlighter
            highlightStyle={{
              fontWeight: "bold",
              padding: 0,
              backgroundColor: "yellow",
            }}
            searchWords={homoglyphs[key] || []}
            autoEscape
            textToHighlight={value}
          />
        </a>
      ) : (
        <Highlighter
          highlightStyle={{
            fontWeight: "bold",
            padding: 4,
            color: "tomato",
            backgroundColor: "wheat",
          }}
          searchWords={homoglyphs[key] || []}
          autoEscape
          textToHighlight={value}
        />
      );
    }
  };

  const title =
    _.get(verbatim, "type") && _.get(verbatim, "key")
      ? `${basicHeader ? "" : "Verbatim"} ${_.get(
          verbatim,
          "type"
        )} - ${_.get(verbatim, "key")}`
      : "Verbatim";
  const verbatimPath =
    location.pathname.split(`dataset/${datasetKey}`)[0] +
    `dataset/${datasetKey}/verbatim/${verbatimKey}`;

  return true ? (
    <Card
      style={style}
      extra={
        _.get(verbatim, "file") ? (
          <NavLink to={{ pathname: verbatimPath }}>
            {`${_.get(verbatim, "file")}${
              _.get(verbatim, "line")
                ? `, line ${_.get(verbatim, "line")}`
                : ""
            }`}
          </NavLink>
        ) : null
      }
    >
      <React.Fragment>
        {verbatimLoading && <Skeleton active />}
        {verbatimError && (
          <Alert
            description={<ErrorMsg error={verbatimError} />}
            type="error"
          />
        )}
        {_.get(verbatim, "file") && (
          <PresentationItem md={md} key="file" label="File">
            <NavLink to={{ pathname: verbatimPath }}>
              {" "}
              {`${_.get(verbatim, "file")}${
                _.get(verbatim, "line")
                  ? `, line ${_.get(verbatim, "line")}`
                  : ""
              }`}
            </NavLink>
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
                  {i !== "homoglyph characters" ? (
                    <Tag key={i} color={_.get(issueMap, `[${i}].color`)}>
                      {i}
                    </Tag>
                  ) : (
                    <Tag
                      key={i}
                      style={{ cursor: "pointer" }}
                      color={_.get(issueMap, `[${i}].color`)}
                      onClick={getHomoglyphs}
                    >
                      {i}
                    </Tag>
                  )}
                </Tooltip>
              ))}
            </div>
          </PresentationItem>
        )}

        {_.get(verbatim, "terms") &&
           Object.keys(verbatim.terms).map((t) =>
             (
              <PresentationItem md={md} label={t} key={t}>
                {renderTerm(
                  t,
                  verbatim.terms[t],
                  _.get(verbatim, "type"),
                  homoglyphs
                )}
              </PresentationItem>
            )
          )}
      </React.Fragment>
    </Card>
  ) : (
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
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <UpOutlined /> : <DownOutlined />}
            </a>
          </h3>
        </Col>
        <Col span={12}>
          {_.get(verbatim, "file") && (
            <NavLink to={{ pathname: verbatimPath }}>
              <p style={{ textAlign: "right", paddingRight: 6 }}>
                {`${_.get(verbatim, "file")}${
                  _.get(verbatim, "line")
                    ? `, line ${_.get(verbatim, "line")}`
                    : ""
                }`}
              </p>
            </NavLink>
          )}
        </Col>
      </Row>
      {expanded && (
        <React.Fragment>
          {verbatimLoading && <Skeleton active />}
          {verbatimError && (
            <Alert
              description={<ErrorMsg error={verbatimError} />}
              type="error"
            />
          )}
          {_.get(verbatim, "file") && (
            <PresentationItem md={md} key="file" label="File">
              <NavLink to={{ pathname: verbatimPath }}>
                {" "}
                {`${_.get(verbatim, "file")}${
                  _.get(verbatim, "line")
                    ? `, line ${_.get(verbatim, "line")}`
                    : ""
                }`}
              </NavLink>
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
                    {i !== "homoglyph characters" ? (
                      <Tag key={i} color={_.get(issueMap, `[${i}].color`)}>
                        {i}
                      </Tag>
                    ) : (
                      <Tag
                        key={i}
                        style={{ cursor: "pointer" }}
                        color={_.get(issueMap, `[${i}].color`)}
                        onClick={getHomoglyphs}
                      >
                        {i}
                      </Tag>
                    )}
                  </Tooltip>
                ))}
              </div>
            </PresentationItem>
          )}

          {_.get(verbatim, "terms") &&
            /* terms.map((t) => */
            Object.keys(verbatim.terms).map((t) =>
               (
                <PresentationItem md={md} label={t} key={t}>
                  {renderTerm(
                    t,
                    verbatim.terms[t],
                    _.get(verbatim, "type"),
                    homoglyphs
                  )}
                </PresentationItem>
              )
            )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

const mapContextToProps = ({
  issueMap,
  termsMap,
  termsMapReversed,
  terms,
  projectKey,
}) => ({ issueMap, termsMap, termsMapReversed, terms, projectKey });

export default withContext(mapContextToProps)(withRouter(VerbatimPresentation));
