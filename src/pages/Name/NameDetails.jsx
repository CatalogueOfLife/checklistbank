import React, { useEffect, useState } from "react";
import config from "../../config";
import { NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import { Row, Col, Tag, Collapse } from "antd";
import _ from "lodash";
import PresentationItem from "../../components/PresentationItem";
import NameRelations from "../Taxon/NameRelations";
import TypeDesignations from "./TypeDesignations";
import PublishedInPagePreview from "../Taxon/PublishedInPagePreview";
import Verbatim from "../Taxon/Verbatim";
import withContext from "../../components/hoc/withContext";
import { IdentifierList } from "../../components/CurieIdentifier";
import { formatAuthorship } from "./authorship";
import { parseUsagePath } from "../Taxon/usagePath";

const md = 5;

const hasValue = (v) =>
  !(v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0));

// A PresentationItem that is left out when it has nothing to show, instead of reading "No information"
const Item = ({ label, children }) =>
  hasValue(children) ? (
    <PresentationItem md={md} label={label}>
      {children}
    </PresentationItem>
  ) : null;

// The parsed parts of a name, rendered inline as field: value pairs
const PARSED_FIELDS = [
  "uninomial",
  "genus",
  "infragenericEpithet",
  "specificEpithet",
  "infraspecificEpithet",
  "cultivarEpithet",
  "strain",
];

// The nomenclatural record of a name: the Name tab of the usage page and the page of a bare name
const NameDetails = ({
  datasetKey,
  projectKey,
  name,
  usageVerbatimKey,
  getNomStatus,
  identifierScope,
}) => {
  const [relations, setRelations] = useState([]);
  const [synonyms, setSynonyms] = useState([]);
  const [typeMaterial, setTypeMaterial] = useState([]);
  const [reference, setReference] = useState(null);
  const { prefix } = parseUsagePath(useLocation().pathname);

  const nameId = name?.id;
  const publishedInId = name?.publishedInId;

  useEffect(() => {
    setRelations([]);
    setSynonyms([]);
    setTypeMaterial([]);
    if (!nameId) return;
    const nameUrl = `${config.dataApi}dataset/${datasetKey}/name/${encodeURIComponent(nameId)}`;
    axios(`${nameUrl}/relations`)
      .then((res) =>
        Promise.allSettled(
          res.data.map((r) =>
            axios(
              `${config.dataApi}dataset/${datasetKey}/name/${encodeURIComponent(
                r.relatedNameId
              )}`
            ).then((n) => {
              r.relatedName = n.data;
            })
          )
        ).then(() => setRelations(res.data))
      )
      .catch(() => setRelations([]));
    axios(`${nameUrl}/synonyms`)
      .then((res) => setSynonyms((res.data || []).filter((s) => s?.id !== nameId)))
      .catch(() => setSynonyms([]));
    axios(`${nameUrl}/types`)
      .then((res) => setTypeMaterial(res.data || []))
      .catch(() => setTypeMaterial([]));
  }, [datasetKey, nameId]);

  useEffect(() => {
    setReference(null);
    if (!publishedInId) return;
    axios(
      `${config.dataApi}dataset/${datasetKey}/reference/${encodeURIComponent(publishedInId)}`
    )
      .then((res) => setReference(res.data))
      .catch(() => setReference(null));
  }, [datasetKey, publishedInId]);

  if (!name) return null;

  // Backends before name-parser-api 5.2 keep the sanctioning author as a string on the name,
  // cited after the combination authorship
  const combinationAuthorship = formatAuthorship(
    name.combinationAuthorship && {
      sanctioningAuthor: name.sanctioningAuthor,
      ...name.combinationAuthorship,
    },
    name.code
  );
  const basionymAuthorship = formatAuthorship(name.basionymAuthorship, name.code);
  // the split is only news when there is a basionym or it reads differently from the authorship
  const showAuthorshipSplit =
    !!basionymAuthorship ||
    (!!combinationAuthorship && combinationAuthorship !== name.authorship);

  // a type relation names the type of this name, e.g. the type species of a genus
  const typeNames = relations.filter((r) => r.type === "type");
  const otherRelations = relations.filter((r) => r.type !== "type");
  const notho = _.isArray(name.notho) ? name.notho.join(", ") : name.notho;
  const parsedParts = PARSED_FIELDS.filter((f) => hasValue(name[f]));
  const flags = [
    name.candidatus && "candidatus",
    name.graftChimaera && "graft-chimaera",
    notho && `notho ${notho}`,
  ].filter(Boolean);

  const referencePath = `/dataset/${datasetKey}/reference/${encodeURIComponent(
    publishedInId
  )}`;

  return (
    <>
      {showAuthorshipSplit && (
        <>
          <Item label="Combination authorship">{combinationAuthorship}</Item>
          <Item label="Basionym authorship">{basionymAuthorship}</Item>
        </>
      )}
      <Item label="Rank">{name.rank}</Item>
      <Item label="Code">{name.code}</Item>
      <Item label="Nomenclatural status">
        {name.nomStatus ? getNomStatus(name) : null}
      </Item>
      <Item label="Name type">{name.type}</Item>
      {(parsedParts.length > 0 || flags.length > 0) && (
        <Item label="Parsed name">
          <span>
            {parsedParts.map((f) => (
              <span key={f} style={{ marginRight: "16px" }}>
                <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{f}</span> {name[f]}
              </span>
            ))}
            {flags.map((f) => (
              <Tag key={f}>{f}</Tag>
            ))}
          </span>
        </Item>
      )}
      {(publishedInId || name.publishedInPage) && (
        <Item label="Published in">
          <span>
            {publishedInId && (
              <NavLink to={{ pathname: referencePath }}>
                {reference?.citation || publishedInId}
              </NavLink>
            )}
            {name.publishedInPage && ` page ${name.publishedInPage}`}
          </span>
        </Item>
      )}
      {name.publishedInPageLink && (
        <Item label="Published in page link">
          <Row>
            <Col>
              <a href={name.publishedInPageLink} target="_blank" rel="noreferrer">
                {name.publishedInPageLink}
              </a>
            </Col>
            <Col>
              <PublishedInPagePreview
                publishedInPageLink={name.publishedInPageLink}
                style={{ boxShadow: "6px 6px 6px lightgrey", marginLeft: "10px" }}
              />
            </Col>
            <Col flex="auto"></Col>
          </Row>
        </Item>
      )}
      <Item label="Gender">
        {name.gender &&
          `${name.gender}${name.genderAgreement === false ? " (no gender agreement)" : ""}`}
      </Item>
      <Item label="Original spelling">
        {_.isBoolean(name.originalSpelling) ? (name.originalSpelling ? "yes" : "no") : null}
      </Item>
      <Item label="Nomenclatural note">{name.nomenclaturalNote}</Item>
      <Item label="Etymology">{name.etymology}</Item>
      <Item label="Remarks">{name.remarks}</Item>
      {typeNames.length > 0 && (
        <Item label="Type name">
          {typeNames.map((r) => (
            <div key={r.key || r.relatedNameId}>
              <NavLink
                to={{ pathname: `${prefix}/name/${encodeURIComponent(r.relatedNameId)}` }}
              >
                <span dangerouslySetInnerHTML={{ __html: r.relatedName?.labelHtml || r.relatedNameId }} />
              </NavLink>
              {r.note && <span style={{ color: "rgba(0, 0, 0, 0.45)" }}> {r.note}</span>}
            </div>
          ))}
        </Item>
      )}
      {typeMaterial.length > 0 && (
        <Item label="Type material">
          <TypeDesignations designations={typeMaterial} datasetKey={datasetKey} />
        </Item>
      )}
      {otherRelations.length > 0 && (
        <NameRelations
          md={md}
          style={{ marginTop: "-3px" }}
          data={otherRelations}
          datasetKey={datasetKey}
          projectKey={projectKey}
        />
      )}
      {synonyms.length > 0 && (
        <Item label="Homotypic names">
          {synonyms.map((s) => (
            <div key={s.id}>
              <NavLink to={{ pathname: `${prefix}/name/${encodeURIComponent(s.id)}` }}>
                <span
                  dangerouslySetInnerHTML={{
                    __html: s.labelHtml || [s.scientificName, s.authorship].filter(Boolean).join(" "),
                  }}
                />
              </NavLink>
            </div>
          ))}
        </Item>
      )}
      {name.link && (
        <Item label="Online resource">
          <a href={name.link} target="_blank" rel="noreferrer">
            {name.link}
          </a>
        </Item>
      )}
      {_.isArray(name.identifier) && name.identifier.length > 0 && (
        <Item label="Identifiers">
          <IdentifierList identifiers={name.identifier} identifierScope={identifierScope} />
        </Item>
      )}
      {(name.namesIndexType || name.namesIndexId) && (
        <Item label="Names index">
          <span>
            {name.namesIndexId ? (
              <NavLink to={{ pathname: `/namesindex/${name.namesIndexId}` }}>
                {name.namesIndexId}
              </NavLink>
            ) : null}
            {name.namesIndexType && ` ${name.namesIndexType} match`}
          </span>
        </Item>
      )}
      <Item label="Name ID">{name.id}</Item>
      <Item label="Origin">{name.origin}</Item>
      {name.verbatimKey && usageVerbatimKey && name.verbatimKey !== usageVerbatimKey && (
        <Collapse
          ghost
          style={{ marginTop: "12px" }}
          items={[
            {
              key: "verbatim",
              label: "Verbatim name record",
              children: (
                <Verbatim sourceDatasetKey={datasetKey} verbatimKey={name.verbatimKey} />
              ),
            },
          ]}
        />
      )}
    </>
  );
};

const mapContextToProps = ({ getNomStatus, identifierScope }) => ({
  getNomStatus,
  identifierScope,
});

export default withContext(mapContextToProps)(NameDetails);
