import React from "react";
import config from "../../config";
import { NavLink } from "react-router-dom";

import axios from "axios";
import { Alert, Spin, Row, Col, Tag, Tabs } from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import { LinkOutlined } from "@ant-design/icons";
import _ from "lodash";
import PresentationItem from "../../components/PresentationItem";
import NameRelations from "../Taxon/NameRelations";
import SynonymTable from "../Taxon/Synonyms";
import TypeMaterial from "../Taxon/TypeMaterial";
import PublishedInPagePreview from "../Taxon/PublishedInPagePreview";
import Linkify from "react-linkify";
import Verbatim from "../Taxon/Verbatim";
import BooleanValue from "../../components/BooleanValue";
import withContext from "../../components/hoc/withContext";
const { TabPane } = Tabs;

const md = 5;

class NamePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dataset: null,
      name: null,
      usages: [],
      relations: [],
      synonyms: [],
      typeMaterial: [],
      publishedIn: null,
      verbatim: null,
      nameLoading: true,
      datasetLoading: true,
      verbatimLoading: true,
      nameError: null,
      datasetError: null,
      verbatimError: null,
    };
  }

  componentDidMount() {
    const {
      match: {
        params: { taxonOrNameKey: nameKey },
      },
      datasetKey,
    } = this.props;
    const nameKey_ = decodeURIComponent(nameKey);
    this.getName(datasetKey, nameKey_);
    this.getUsages(datasetKey, nameKey_);
    this.getRelations(datasetKey, nameKey_);
    this.getSynonyms(datasetKey, nameKey_);
    this.getTypeMaterial(datasetKey, nameKey_);
  }
  componentDidUpdate = (prevProps) => {
    if (
      prevProps.match.params.taxonOrNameKey !==
      this.props.match.params.taxonOrNameKey
    ) {
      const {
        match: {
          params: { taxonOrNameKey: nameKey },
        },
        datasetKey,
      } = this.props;
      const nameKey_ = decodeURIComponent(nameKey);

      this.getName(datasetKey, nameKey_);
      this.getUsages(datasetKey, nameKey_);
      this.getRelations(datasetKey, nameKey_);
      this.getSynonyms(datasetKey, nameKey_);
      this.getTypeMaterial(datasetKey, nameKey_);
    }
  };
  getReference = (referenceKey) => {
    const { datasetKey } = this.props;

    axios(`${config.dataApi}dataset/${datasetKey}/reference/${referenceKey}`)
      .then((res) => {
        this.setState({
          referenceLoading: false,
          reference: res.data,
          referenceError: null,
        });
      })
      .catch((err) => {
        this.setState({
          referenceLoading: false,
          referenceErrorError: err,
          reference: null,
        });
      });
  };

  getRelations = (key, nameKey) => {
    axios(
      `${config.dataApi}dataset/${key}/name/${encodeURIComponent(
        nameKey
      )}/relations`
    ).then((relations) => {
      return Promise.all(
        relations.data.map((r) => {
          return axios(
            `${config.dataApi}dataset/${key}/name/${encodeURIComponent(
              r.relatedNameId
            )}`
          ).then((n) => {
            r.relatedName = n.data;
          });
        })
      ).then(() => {
        this.setState({ relations: relations.data });
      });
    });
  };

  getTypeMaterial = (key, nameKey) => {
    axios(
      `${config.dataApi}dataset/${key}/name/${encodeURIComponent(
        nameKey
      )}/types`
    ).then((types) => {
      this.setState({ typeMaterial: types.data });
    });
  };

  getSynonyms = (key, nameKey) => {
    axios(
      `${config.dataApi}dataset/${key}/name/${encodeURIComponent(
        nameKey
      )}/synonyms`
    ).then((synonyms) => {
      this.setState({ synonyms: synonyms.data });
    });
  };

  getUsages = (key, nameKey) => {
    this.setState({ usageLoading: true });
    axios(
      `${config.dataApi
      }dataset/${key}/nameusage/search?NAME_ID=${encodeURIComponent(nameKey)}`
    )
      .then((res) => {
        this.setState({
          usageLoading: false,
          usages: res.data.result,
          usageError: null,
        });
      })
      .catch((err) => {
        this.setState({ usageLoading: false, usageError: err, usages: null });
      });
  };
  getName = (key, nameKey) => {
    this.setState({ nameLoading: true });
    axios(`${config.dataApi}dataset/${key}/name/${encodeURIComponent(nameKey)}`)
      .then((res) => {
        this.setState(
          { nameLoading: false, name: res.data, nameError: null },
          () => {
            if (res.data.publishedInId) {
              this.getReference(res.data.publishedInId);
            }
          }
        );
      })
      .catch((err) => {
        this.setState({ nameLoading: false, nameError: err, name: null });
      });
  };

  render() {
    const {
      nameLoading,
      usages,
      name,
      reference,
      typeMaterial,
      nameError,
      relations,
      synonyms,
      publishedIn,
    } = this.state;

    const filteredSynonyms = synonyms.filter((s) => s?.id !== name?.id);
    const { datasetKey, catalogueKey, getTaxonomicStatusColor, getNomStatus } =
      this.props;

    const taxonUri =
      datasetKey === catalogueKey
        ? `/catalogue/${catalogueKey}/taxon/`
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
            {!usages && <Tag color="warning">No usages</Tag>}
            {usages && usages.length > 0 && (
              <>
                <span>{usages.length > 1 ? "Usages " : "Usage "}</span>
                {usages &&
                  usages.map((u, i) => (
                    <NavLink
                      key={i}
                      to={{
                        pathname: `${taxonUri}${encodeURIComponent(
                          _.get(u, "usage.id")
                        )}`,
                      }}
                      exact={true}
                    >
                      <Tag
                        color={getTaxonomicStatusColor(u.usage.status)}
                        style={{ marginRight: "6px", cursor: "pointer" }}
                      >
                        {u.usage.status}
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
        <Tabs defaultActiveKey="1" tabBarExtraContent={null}>
          <TabPane tab="About" key="1">
            {name && (
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
                    catalogueKey={catalogueKey}
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
                      catalogueKey={catalogueKey}
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
            )}
          </TabPane>
          {_.get(name, "verbatimKey") && (
            <TabPane tab="Verbatim" key="2">
              <Verbatim verbatimKey={name.verbatimKey} />
            </TabPane>
          )}
        </Tabs>
      </div>
    );
  }
}
const mapContextToProps = ({
  getTaxonomicStatusColor,
  catalogueKey,
  getNomStatus,
}) => ({ getTaxonomicStatusColor, catalogueKey, getNomStatus });

export default withContext(mapContextToProps)(NamePage);
