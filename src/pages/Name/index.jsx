import React, { useEffect, useState } from "react";
import config from "../../config";
import { NavLink } from "react-router-dom";
import withRouter from "../../withRouter";

import axios from "axios";
import { Alert, Spin, Row, Col, Tag } from "antd";
import Tabs from "../../components/Tabs";
import ErrorMsg from "../../components/ErrorMsg";
import { LinkOutlined } from "@ant-design/icons";
import _ from "lodash";
import PresentationItem from "../../components/PresentationItem";
import NameRelations from "../Taxon/NameRelations";
import SynonymTable from "../Taxon/Synonyms";
import TypeMaterial from "../Taxon/TypeMaterial";
import PublishedInPagePreview from "../Taxon/PublishedInPagePreview";
import Linkify from "../../components/Linkify";
import Verbatim from "../Taxon/Verbatim";
import BooleanValue from "../../components/BooleanValue";
import withContext from "../../components/hoc/withContext";
import CurieIdentifier from "../../components/CurieIdentifier";

const md = 5;

const NamePage = ({
  match,
  datasetKey,
  projectKey,
  getTaxonomicStatusColor,
  getNomStatus,
  identifierScope,
}) => {
  const nameKeyRaw = _.get(match, "params.taxonOrNameKey");

  const [name, setName] = useState(null);
  const [usages, setUsages] = useState([]);
  const [relations, setRelations] = useState([]);
  const [synonyms, setSynonyms] = useState([]);
  const [typeMaterial, setTypeMaterial] = useState([]);
  const [publishedIn, setPublishedIn] = useState(null);
  const [reference, setReference] = useState(null);
  const [nameLoading, setNameLoading] = useState(true);
  const [nameError, setNameError] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState(null);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [referenceError, setReferenceError] = useState(null);

  const getReference = (referenceKey) => {
    axios(`${config.dataApi}dataset/${datasetKey}/reference/${referenceKey}`)
      .then((res) => {
        setReferenceLoading(false);
        setReference(res.data);
        setReferenceError(null);
      })
      .catch((err) => {
        setReferenceLoading(false);
        setReferenceError(err);
        setReference(null);
      });
  };

  const getRelations = (key, nameKey) => {
    axios(
      `${config.dataApi}dataset/${key}/name/${encodeURIComponent(
        nameKey
      )}/relations`
    ).then((relationsRes) => {
      return Promise.all(
        relationsRes.data.map((r) => {
          return axios(
            `${config.dataApi}dataset/${key}/name/${encodeURIComponent(
              r.relatedNameId
            )}`
          ).then((n) => {
            r.relatedName = n.data;
          });
        })
      ).then(() => {
        setRelations(relationsRes.data);
      });
    });
  };

  const getTypeMaterial = (key, nameKey) => {
    axios(
      `${config.dataApi}dataset/${key}/name/${encodeURIComponent(
        nameKey
      )}/types`
    ).then((types) => {
      setTypeMaterial(types.data);
    });
  };

  const getSynonyms = (key, nameKey) => {
    axios(
      `${config.dataApi}dataset/${key}/name/${encodeURIComponent(nameKey)}/synonyms`
    ).then((syns) => {
      setSynonyms(syns.data);
    });
  };

  const getUsages = (key, nameKey) => {
    setUsageLoading(true);
    axios(
      `${config.dataApi}dataset/${key}/nameusage?nid=${encodeURIComponent(nameKey)}`
    )
      .then((res) => {
        setUsageLoading(false);
        setUsages(res.data.result);
        setUsageError(null);
      })
      .catch((err) => {
        setUsageLoading(false);
        setUsageError(err);
        setUsages([]);
      });
  };

  const getName = (key, nameKey) => {
    setNameLoading(true);
    axios(`${config.dataApi}dataset/${key}/name/${encodeURIComponent(nameKey)}`)
      .then((res) => {
        setNameLoading(false);
        setName(res.data);
        setNameError(null);
        if (res.data.publishedInId) {
          getReference(res.data.publishedInId);
        }
      })
      .catch((err) => {
        setNameLoading(false);
        setNameError(err);
        setName(null);
      });
  };

  useEffect(() => {
    const nameKey_ = decodeURIComponent(nameKeyRaw);
    getName(datasetKey, nameKey_);
    getUsages(datasetKey, nameKey_);
    getRelations(datasetKey, nameKey_);
    getSynonyms(datasetKey, nameKey_);
    getTypeMaterial(datasetKey, nameKey_);
  }, [nameKeyRaw, datasetKey]);

  const filteredUsages = (usages || []).filter((u) => u.usage?.id && u.usage?.status != 'bare name');
  const filteredSynonyms = (synonyms || []).filter((s) => s?.id !== name?.id);

  const taxonUri =
    datasetKey === projectKey
      ? `/project/${projectKey}/taxon/`
      : `/dataset/${datasetKey}/taxon/`;

  return (
    <div
      style={{
        background: "#fff",
        padding: 24,
        minHeight: 280,
        margin: "16px 0",
      }}
    >
      <Row>
        <Col span={20}>
          {name && (
            <h1
              style={{
                fontSize: "30px",
                fontWeight: "400",
                paddingLeft: "10px",
                display: "inline-block",
              }}
            >
              Name details: {name.scientificName} {name.authorship}
            </h1>
          )}
        </Col>
        <Col flex="auto"></Col>
        <Col>
          {(!filteredUsages || filteredUsages.length === 0) && <Tag color="warning">No usages</Tag>}
          {filteredUsages && filteredUsages.length > 0 && (
            <>
              <span>{filteredUsages.length > 1 ? "Usages " : "Usage "}</span>
              {filteredUsages &&
                filteredUsages.map((u, i) => (
                  <NavLink
                    key={i}
                    to={{
                      pathname: `${taxonUri}${encodeURIComponent(
                        _.get(u, "usage.id")
                      )}`,
                    }}
                    end
                  >
                    <Tag
                      color={getTaxonomicStatusColor(u.usage?.status)}
                      style={{ marginRight: "6px", cursor: "pointer" }}
                    >
                      {u.usage?.status}
                    </Tag>
                  </NavLink>
                ))}
            </>
          )}
        </Col>
      </Row>

      {nameLoading && <Spin />}
      {nameError && (
        <Alert description={<ErrorMsg error={nameError} />} type="error" />
      )}
      <Tabs
        defaultActiveKey="1"
        tabBarExtraContent={null}
        items={[
          {
            key: "1",
            label: "About",
            children: name && (
              <React.Fragment>
              <PresentationItem md={md} label="ID">
                {name.id}
              </PresentationItem>
              <PresentationItem md={md} label="Scientific Name">
                {name.scientificName}
              </PresentationItem>
              <PresentationItem md={md} label="Authorship">
                {name.authorship}
              </PresentationItem>
              {publishedIn && publishedIn.citation && (
                <PresentationItem md={md} label="Published in">
                  <Linkify>{publishedIn.citation}</Linkify>
                </PresentationItem>
              )}
              {reference && (
                <PresentationItem md={md} label="Published In">
                  {reference.citation}
                </PresentationItem>
              )}
              <PresentationItem md={md} label="Rank">
                {name.rank}
              </PresentationItem>
              <PresentationItem md={md} label="Code">
                {name.code}
              </PresentationItem>

              <PresentationItem md={md} label="Uninomial">
                {name.uninomial}
              </PresentationItem>
              <PresentationItem md={md} label="Genus">
                {name.genus}
              </PresentationItem>
              <PresentationItem md={md} label="Infrageneric Epithet">
                {name.infragenericEpithet}
              </PresentationItem>
              <PresentationItem md={md} label="Specific Epithet">
                {name.specificEpithet}
              </PresentationItem>
              <PresentationItem md={md} label="Infraspecific Epithet">
                {name.infraspecificEpithet}
              </PresentationItem>
              <PresentationItem md={md} label="Cultivar Epithet">
                {name.cultivarEpithet}
              </PresentationItem>
              <PresentationItem md={md} label="Strain">
                {name.strain}
              </PresentationItem>
              <PresentationItem md={md} label="Candidatus">
                <BooleanValue value={name.candidatus} />
              </PresentationItem>
              <PresentationItem md={md} label="Notho">
                {name.notho}
              </PresentationItem>

              {name.combinationAuthorship && (
                <PresentationItem md={md} label="Combination Authorship">
                  {`${name.combinationAuthorship.authors
                    ? name.combinationAuthorship.authors.join(", ")
                    : ""
                    } ${name.combinationAuthorship.exAuthors
                      ? `ex ${name.combinationAuthorship.exAuthors.join(
                        ", "
                      )}`
                      : ""
                    } ${name.combinationAuthorship.year
                      ? name.combinationAuthorship.year
                      : ""
                    }`}
                </PresentationItem>
              )}
              {name.basionymAuthorship && (
                <PresentationItem md={md} label="Basionym Authorship">
                  {`${name.basionymAuthorship.authors.join(", ")} ${name.basionymAuthorship.exAuthors
                    ? `ex ${name.basionymAuthorship.exAuthors.join(", ")}`
                    : ""
                    } ${name.basionymAuthorship.year
                      ? name.basionymAuthorship.year
                      : ""
                    }`}
                </PresentationItem>
              )}
              {name.sanctioningAuthor && (
                <PresentationItem md={md} label="Sanctioning Author">
                  {`${name.sanctioningAuthor.authors.join(", ")} ${name.sanctioningAuthor.exAuthors
                    ? `ex ${name.sanctioningAuthor.exAuthors.join(", ")}`
                    : ""
                    } ${name.sanctioningAuthor.year
                      ? name.sanctioningAuthor.year
                      : ""
                    }`}
                </PresentationItem>
              )}
              <PresentationItem md={md} label="Published In ID">
                  <NavLink to={{pathname: `/dataset/${datasetKey}/reference/${name.publishedInId}`,}}>
                      {name.publishedInId}
                  </NavLink>
              </PresentationItem>
              <PresentationItem md={md} label="Published In Page">
                {name.publishedInPage}
              </PresentationItem>
              <PresentationItem md={md} label="Published In Page Link">
                {name.publishedInPageLink && (
                  <Row>
                    <Col>
                      <a href={name.publishedInPageLink} target="_blank">
                        {name.publishedInPageLink}
                      </a>
                    </Col>
                    <Col>
                      <PublishedInPagePreview
                        publishedInPageLink={name.publishedInPageLink}
                        style={{
                          boxShadow: "6px 6px 6px lightgrey",
                          marginLeft: "10px",
                        }}
                      />
                    </Col>
                    <Col flex="auto"></Col>
                  </Row>
                )}
              </PresentationItem>

              <PresentationItem md={md} label="Gender">
                {name.gender}
              </PresentationItem>
              <PresentationItem md={md} label="Gender Agreement">
                <BooleanValue value={name.genderAgreement} />
              </PresentationItem>
              <PresentationItem md={md} label="Original Spelling">
                <BooleanValue value={name.originaSpelling} />
              </PresentationItem>

              <PresentationItem md={md} label="Etymology">
                {name.etymology}
              </PresentationItem>
              <PresentationItem md={md} label="Nomenclatural Status">
                {getNomStatus(name)}
              </PresentationItem>
              <PresentationItem md={md} label="Nomenclatural Note">
                {name.nomenclaturalNote}
              </PresentationItem>
              <PresentationItem md={md} label="Remarks">
                {name.remarks}
              </PresentationItem>

              {typeMaterial && typeMaterial.length > 0 && (
                <PresentationItem md={md} label="Type material">
                  <TypeMaterial
                    data={{ [name.id]: typeMaterial }}
                    nameID={_.get(name, "id")}
                  />
                </PresentationItem>
              )}

              {relations && relations.length > 0 && (
                <NameRelations
                  md={md}
                  style={{ marginTop: "-3px" }}
                  data={relations}
                  datasetKey={datasetKey}
                  projectKey={projectKey}
                />
              )}
              {filteredSynonyms && filteredSynonyms.length > 0 && (
                <PresentationItem md={md} label="Homotypic names">
                  <SynonymTable
                    data={filteredSynonyms.map((s) => ({
                      name: s,
                      __homotypic: true,
                    }))}
                    style={{ marginTop: "-3px" }}
                    datasetKey={datasetKey}
                    projectKey={projectKey}
                  />
                </PresentationItem>
              )}
              {name.homotypicNameId && (
                <PresentationItem md={md} label="Homotypic Name Id">
                  {name.homotypicNameId}
                </PresentationItem>
              )}

              <PresentationItem md={md} label="Origin">
                {name.origin}
              </PresentationItem>
              <PresentationItem md={md} label="Type">
                {name.type}
              </PresentationItem>


              <PresentationItem md={md} label="Link">
                {name.link && (
                  <a href={name.link} target="_blank">
                    {name.link}
                  </a>
                )}
              </PresentationItem>

              {_.isArray(name.identifier) && name.identifier.length > 0 && (
                <PresentationItem md={md} label="Identifiers">
                  {name.identifier.map((id, i) => (
                    <React.Fragment key={id}>
                      {i > 0 && ", "}
                      <CurieIdentifier identifier={id} identifierScope={identifierScope} />
                    </React.Fragment>
                  ))}
                </PresentationItem>
              )}

              <PresentationItem md={md} label="Names Index Match">
                <Row>
                  <Col>{name.namesIndexType}</Col>
                  {name.namesIndexId && (
                    <Col>
                      : &nbsp;
                      <NavLink
                        to={{
                          pathname: `/namesindex/${name.namesIndexId}`,
                        }}
                      >
                        {name.namesIndexId}
                      </NavLink>
                    </Col>
                  )}
                </Row>
              </PresentationItem>
              </React.Fragment>
            ),
          },
          _.get(name, "verbatimKey") && {
            key: "2",
            label: "Verbatim",
            children: <Verbatim verbatimKey={name.verbatimKey} />,
          },
        ].filter(Boolean)}
      />
    </div>
  );
};

const mapContextToProps = ({
  getTaxonomicStatusColor,
  projectKey,
  getNomStatus,
  identifierScope,
}) => ({ getTaxonomicStatusColor, projectKey, getNomStatus, identifierScope });

export default withRouter(withContext(mapContextToProps)(NamePage));
