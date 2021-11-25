import React from "react";
import config from "../../config";
import { NavLink } from "react-router-dom";

import axios from "axios";
import { Alert, Spin, Row, Col, Tag } from "antd";
import ErrorMsg from "../../components/ErrorMsg";

import _ from "lodash";
import PresentationItem from "../../components/PresentationItem";
import NameRelations from "../Taxon/NameRelations";
import SynonymTable from "../Taxon/Synonyms";

import VerbatimPresentation from "../../components/VerbatimPresentation";
import BooleanValue from "../../components/BooleanValue";
import withContext from "../../components/hoc/withContext";
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
    this.getName(datasetKey, nameKey);
    this.getUsages(datasetKey, nameKey);
    this.getRelations(datasetKey, nameKey);
    this.getSynonyms(datasetKey, nameKey);
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
      this.getName(datasetKey, nameKey);
      this.getUsages(datasetKey, nameKey);
      this.getRelations(datasetKey, nameKey);
      this.getSynonyms(datasetKey, nameKey);
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
          name: null,
        });
      });
  };

  getRelations = (key, nameKey) => {
    axios(`${config.dataApi}dataset/${key}/name/${nameKey}/relations`).then(
      (relations) => {
        return Promise.all(
          relations.data.map((r) => {
            return axios(
              `${config.dataApi}dataset/${key}/name/${r.relatedNameId}`
            ).then((n) => {
              r.relatedName = n.data;
            });
          })
        ).then(() => {
          this.setState({ relations: relations.data });
        });
      }
    );
  };

  getSynonyms = (key, nameKey) => {
    axios(`${config.dataApi}dataset/${key}/name/${nameKey}/synonyms`).then(
      (synonyms) => {
        this.setState({ synonyms: synonyms.data });
      }
    );
  };

  getUsages = (key, nameKey) => {
    this.setState({ usageLoading: true });
    axios(`${config.dataApi}dataset/${key}/nameusage/search?NAME_ID=${nameKey}`)
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
    axios(`${config.dataApi}dataset/${key}/name/${nameKey}`)
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
          <Col span={18}>
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
          <Col span={6}>
            {!usages && <Tag color="warning">No usages</Tag>}
            {usages && usages.length > 0 && (
              <PresentationItem
                md={md}
                label={usages.length > 1 ? "Usages" : "Usage"}
              >
                {usages &&
                  usages.map((u) => (
                    <NavLink
                      to={{
                        pathname: `${taxonUri}${encodeURIComponent(
                          _.get(u, "usage.accepted.id") || _.get(u, "usage.id")
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
              </PresentationItem>
            )}
          </Col>
        </Row>

        {nameLoading && <Spin />}
        {nameError && (
          <Alert message={<ErrorMsg error={nameError} />} type="error" />
        )}
        {name && (
          <React.Fragment>
            <PresentationItem md={md} label="Scientific Name">
              {name.scientificName}
            </PresentationItem>
            <PresentationItem md={md} label="Rank">
              {name.rank}
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
            <PresentationItem md={md} label="Authorship">
              {name.authorship}
            </PresentationItem>
            {name.combinationAuthorship && (
              <PresentationItem md={md} label="Combination Authorship">
                {`${
                  name.combinationAuthorship.authors
                    ? name.combinationAuthorship.authors.join(", ")
                    : ""
                } ${
                  name.combinationAuthorship.exAuthors
                    ? `ex ${name.combinationAuthorship.exAuthors.join(", ")}`
                    : ""
                } ${
                  name.combinationAuthorship.year
                    ? name.combinationAuthorship.year
                    : ""
                }`}
              </PresentationItem>
            )}
            {name.basionymAuthorship && (
              <PresentationItem md={md} label="Basionym Authorship">
                {`${name.basionymAuthorship.authors.join(", ")} ${
                  name.basionymAuthorship.exAuthors
                    ? `ex ${name.basionymAuthorship.exAuthors.join(", ")}`
                    : ""
                } ${
                  name.basionymAuthorship.year
                    ? name.basionymAuthorship.year
                    : ""
                }`}
              </PresentationItem>
            )}
            {name.sanctioningAuthor && (
              <PresentationItem md={md} label="Sanctioning Author">
                {`${name.sanctioningAuthor.authors.join(", ")} ${
                  name.sanctioningAuthor.exAuthors
                    ? `ex ${name.sanctioningAuthor.exAuthors.join(", ")}`
                    : ""
                } ${
                  name.sanctioningAuthor.year ? name.sanctioningAuthor.year : ""
                }`}
              </PresentationItem>
            )}
            {publishedIn && publishedIn.citation && (
              <PresentationItem md={md} label="Published in">
                {publishedIn.citation}
              </PresentationItem>
            )}
            {relations && relations.length > 0 && (
              <PresentationItem
                md={md}
                label="Relations"
                helpText={
                  <a href="https://github.com/Sp2000/colplus/blob/master/docs/NAMES.md#name-relations">
                    Name relations are explained here
                  </a>
                }
              >
                <NameRelations style={{ marginTop: "-3px" }} data={relations} />
              </PresentationItem>
            )}
            {filteredSynonyms && filteredSynonyms.length > 0 && (
              <PresentationItem md={md} label="Homotypic names">
                <SynonymTable
                  data={filteredSynonyms.map((s) => ({ name: s }))}
                  style={{ marginTop: "-3px" }}
                  datasetKey={datasetKey}
                  catalogueKey={catalogueKey}
                />
              </PresentationItem>
            )}
            <PresentationItem md={md} label="Nomenclatural Note">
              {name.nomenclaturalNote}
            </PresentationItem>

            <PresentationItem md={md} label="ID">
              {name.id}
            </PresentationItem>
            <PresentationItem md={md} label="Homotypic Name Id">
              {name.homotypicNameId}
            </PresentationItem>
            <PresentationItem md={md} label="Name Index Id">
              {name.nameIndexId}
            </PresentationItem>
            <PresentationItem md={md} label="Candidatus">
              <BooleanValue value={name.candidatus} />
            </PresentationItem>
            <PresentationItem md={md} label="Notho">
              {name.notho}
            </PresentationItem>
            <PresentationItem md={md} label="Code">
              {name.code}
            </PresentationItem>
            <PresentationItem md={md} label="Nomenclatural Status">
              {getNomStatus(name)}
            </PresentationItem>
            <PresentationItem md={md} label="Origin">
              {name.origin}
            </PresentationItem>
            <PresentationItem md={md} label="Type">
              {name.type}
            </PresentationItem>
            <PresentationItem md={md} label="Fossil">
              <BooleanValue value={name.fossil} />
            </PresentationItem>
            {/* <PresentationItem md={md} label="Source Url">
              {name.sourceUrl && (
                <a href={name.sourceUrl} target="_blank">
                  {name.sourceUrl}
                </a>
              )}
            </PresentationItem> */}
            <PresentationItem md={md} label="Link">
              {name.Link && (
                <a href={name.Link} target="_blank">
                  {name.Link}
                </a>
              )}
            </PresentationItem>
            <PresentationItem md={md} label="Remarks">
              {name.remarks}
            </PresentationItem>
            {reference && (
              <PresentationItem md={md} label="Published In">
                {reference.citation}
              </PresentationItem>
            )}
            <PresentationItem md={md} label="Published In ID">
              {name.publishedInId}
            </PresentationItem>
            <PresentationItem md={md} label="Published In Page">
              {name.publishedInPage}
            </PresentationItem>
          </React.Fragment>
        )}

        {_.get(name, "verbatimKey") && (
          <VerbatimPresentation
            verbatimKey={name.verbatimKey}
            datasetKey={name.datasetKey}
            expanded={false}
          />
        )}
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
