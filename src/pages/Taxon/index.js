import React from "react";
import config from "../../config";

import axios from "axios";
import { NavLink } from "react-router-dom";
import { LinkOutlined, EditOutlined } from "@ant-design/icons";
import {
  Alert,
  Tag,
  Row,
  Col,
  Button,
  Rate,
  Tabs,
  Typography,
  Tooltip,
  message,
} from "antd";
import SynonymTable from "./Synonyms";
import Synonyms from "./Synonyms2";
import VernacularNames from "./VernacularNames";
import Distributions from "./Distributions";
import Classification from "./Classification";
import NameRelations from "./NameRelations";
import SpeciesInterActions from "./SpeciesInteractions";
import ErrorMsg from "../../components/ErrorMsg";
import _ from "lodash";
import PresentationItem from "../../components/PresentationItem";
import VerbatimPresentation from "../../components/VerbatimPresentation";
import Verbatim from "./Verbatim";
import InlineEdit from "../../components/InlineEdit";
import TaxonProperties from "./TaxonProperties";
import SecondarySources from "./SecondarySources";
import moment from "moment";
import history from "../../history";
import withContext from "../../components/hoc/withContext";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover";
import References from "./References";
import TypeMaterial from "./TypeMaterial";
import PublishedInPagePreview from "./PublishedInPagePreview";
import { CopyToClipboard } from "react-copy-to-clipboard";
import IncludesTable from "./Includes";
import TaxonBreakdown from "./TaxonBreakdown";
import TaxonMedia from "./TaxonMedia";
import EditTaxonModal from "../catalogue/Assembly/EditTaxonModal";
import Auth from "../../components/Auth";
import Linkify from "react-linkify";
import SourceDatasets from "./SourceDatasets";
import marked from "marked";
import DOMPurify from "dompurify";
import { getSectorsBatch } from "../../api/sector";
import { getDatasetsBatch } from "../../api/dataset";

import DataLoader from "dataloader";
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
const { Title } = Typography;
const { TabPane } = Tabs;

const { canEditDataset } = Auth;
const md = 5;
const urlSafe = (str) => encodeURIComponent(decodeURIComponent(str));

const initialState = {
  taxon: null,
  info: null,
  referenceIndexMap: {},
  taxonLoading: true,
  datasetLoading: true,
  infoLoading: true,
  classificationLoading: true,
  infoError: null,
  taxonError: null,
  classificationError: null,
  verbatimLoading: true,
  verbatimError: null,
  verbatim: null,
  logoUrl: null,
  sourceDataset: null,
  sourceDatasetKeyMap: null,
  sourceTaxon: null,
  includes: [],
  issues: [],
  edit: false,
};

class TaxonPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ...initialState,
    };
  }

  componentDidMount = () => {
    this.getData();
  };

  componentDidUpdate = (prevProps) => {
    const {
      match: {
        params: { taxonOrNameKey },
      },
      datasetKey,
    } = this.props;
    if (
      prevProps.datasetKey !== datasetKey ||
      _.get(prevProps, "match.params.taxonOrNameKey") !== taxonOrNameKey
    ) {
      this.setState({ ...initialState }, this.getData);
    }
  };

  getData = async () => {
    const {
      match: {
        params: { taxonOrNameKey: taxonKey },
      },
      datasetKey,
      catalogueKey,
    } = this.props;
    try {
      const nameusage = await axios(
        `${config.dataApi}dataset/${datasetKey}/nameusage/${urlSafe(taxonKey)}`
      );

      this.getTaxon();
      this.getInfo();
      this.getClassification();
      this.getIncludesAndIssues();

      /*  if (
        ["accepted", "provisionally accepted"].includes(nameusage?.data?.status)
      ) {
        this.getTaxon();
        this.getInfo();
        this.getClassification();
        this.getIncludesAndIssues();
      } else {
        history.push(
          datasetKey === catalogueKey
            ? `/catalogue/${catalogueKey}/name/${encodeURIComponent(
                nameusage?.data?.name?.id
              )}`
            : `/dataset/${datasetKey}/name/${encodeURIComponent(
                nameusage?.data?.name?.id
              )}`
        );
      } */
      console.log(nameusage.data.status);
    } catch (err) {
      this.setState({ taxonLoading: false, taxonError: err, taxon: null });
    }
  };

  decorateWithSectorsAndDataset = async (synonyms) => {
    const { datasetKey } = this.props;
    const sectorLoader = new DataLoader((ids) =>
      getSectorsBatch(ids, datasetKey)
    );
    const sourceDatasetsMap = {};
    for (const type of ["misapplied", "heterotypic", "homotypic"].filter(
      (t) => !!synonyms[t]
    )) {
      await Promise.allSettled(
        synonyms[type]
          .filter((tx) => !!tx.sectorKey)
          .map((tx) =>
            sectorLoader.load(tx.sectorKey, datasetKey).then((r) => {
              tx.sector = r;
              return datasetLoader.load(r.subjectDatasetKey).then((dataset) => {
                // tx.sector.dataset = dataset
                tx.sourceDatasetKey = dataset.key;
                sourceDatasetsMap[dataset.key] = dataset;
              });
            })
          )
      );
    }
    if (synonyms?.heterotypicGroups) {
      for (const arr of synonyms?.heterotypicGroups) {
        await Promise.allSettled(
          arr
            .filter((tx) => !!tx.sectorKey)
            .map((tx) =>
              sectorLoader.load(tx.sectorKey, datasetKey).then((r) => {
                tx.sector = r;
                return datasetLoader
                  .load(r.subjectDatasetKey)
                  .then((dataset) => {
                    // tx.sector.dataset = dataset
                    tx.sourceDatasetKey = dataset.key;
                    sourceDatasetsMap[dataset.key] = dataset;
                  });
              })
            )
        );
      }
    }

    return Object.keys(sourceDatasetsMap).length > 0 ? sourceDatasetsMap : null;
  };

  getTaxon = () => {
    const {
      match: {
        params: { taxonOrNameKey: taxonKey },
      },
      datasetKey,
    } = this.props;
    this.setState({ loading: true });
    axios(
      `${config.dataApi}dataset/${datasetKey}/nameusage/${urlSafe(taxonKey)}`
    )
      .then((res) => {
        let promises = [res];

        /* promises.push(
          axios(
            `${config.dataApi}dataset/${datasetKey}/nameusage/${urlSafe(
              taxonKey
            )}/source`
          )
            .then((sourceTaxon) => {
              this.setState({ sourceTaxon: sourceTaxon.data });
            })
            .catch((e) => this.setState({ sourceTaxon: null }))
        ); */

        /*   if (_.get(res, "data.name")) {
          promises.push(
            axios(
              `${config.dataApi}dataset/${datasetKey}/name/${encodeURIComponent(
                _.get(res, "data.name.id")
              )}/relations`
            ).then((relations) => {
              res.data.name.relations = relations.data;
              return Promise.all(
                relations.data.map((r) => {
                  return axios(
                    `${
                      config.dataApi
                    }dataset/${datasetKey}/name/${encodeURIComponent(
                      r.relatedNameId
                    )}`
                  ).then((n) => {
                    r.relatedName = n.data;
                  });
                })
              );
            })
          );
        } */
        // sector keys are only present if its a catalogue
        if (_.get(res, "data.sectorKey")) {
          axios(
            `${config.dataApi}dataset/${datasetKey}/sector/${_.get(
              res,
              "data.sectorKey"
            )}`
          ).then((sector) => {
            const logoUrl = `${
              config.dataApi
            }dataset/${datasetKey}/logo/source/${_.get(
              sector,
              "data.subjectDatasetKey"
            )}`;
            axios(logoUrl)
              .then(() => {
                this.setState({
                  logoUrl: logoUrl,
                });
              })
              .catch(() => {
                // ignore, there is no logo
              });

            axios(
              `${config.dataApi}dataset/${_.get(
                sector,
                "data.subjectDatasetKey"
              )}`
            ).then((dataset) => {
              this.setState({ sourceDataset: dataset.data });
            });
          });
        }

        return Promise.all(promises);
      })
      .then((res) => {
        this.setState({
          taxonLoading: false,
          taxon: res[0].data,
          taxonError: null,
        });
      })
      .catch((err) => {
        this.setState({ taxonLoading: false, taxonError: err, taxon: null });
      });
  };

  getInfo = async () => {
    const {
      match: {
        params: { taxonOrNameKey: taxonKey },
      },
      datasetKey,
    } = this.props;
    try {
      const res = await axios(
        `${config.dataApi}dataset/${datasetKey}/taxon/${urlSafe(taxonKey)}/info`
      );

      if (_.get(res, "data.source")) {
        this.setState({ sourceTaxon: _.get(res, "data.source") });
      }

      if (
        _.get(res, "data.taxon.name.publishedInId") &&
        _.get(
          res,
          `data.references[${_.get(res, "data.taxon.name.publishedInId")}]`
        )
      ) {
        res.data.taxon.name.publishedIn = _.get(
          res,
          `data.references[${_.get(res, "data.taxon.name.publishedInId")}]`
        );
      }
      let referenceIndexMap = {};
      if (_.get(res, "data.references")) {
        Object.keys(res.data.references).forEach((k, i) => {
          referenceIndexMap[k] = (i + 1).toString();
        });
      }

      let sourceDatasetKeyMap = _.get(res, "data.synonyms")
        ? await this.decorateWithSectorsAndDataset(_.get(res, "data.synonyms"))
        : null;

      if (res?.data?.nameRelations && res?.data?.names) {
        res?.data?.nameRelations.forEach((rel) => {
          rel.relatedName = res?.data?.names?.[rel?.relatedNameId];
          rel.name = res?.data?.names?.[rel?.nameId];
        });
      }
      this.setState({
        infoLoading: false,
        info: res.data,
        infoError: null,
        referenceIndexMap,
        sourceDatasetKeyMap,
      });
    } catch (err) {
      this.setState({ infoLoading: false, infoError: err, info: null });
    }
  };

  getClassification = () => {
    const {
      match: {
        params: { taxonOrNameKey: taxonKey },
      },
      datasetKey,
    } = this.props;

    axios(
      `${config.dataApi}dataset/${datasetKey}/taxon/${urlSafe(
        taxonKey
      )}/classification`
    )
      .then((res) => {
        this.setState({
          classificationLoading: false,
          classification: res.data,
          classificationError: null,
        });
      })
      .catch((err) => {
        this.setState({
          classificationLoading: false,
          classificationError: err,
          classification: null,
        });
      });
  };

  getIncludesAndIssues = () => {
    const {
      match: {
        params: { taxonOrNameKey: taxonKey },
      },
      datasetKey,
    } = this.props;

    axios(
      `${
        config.dataApi
      }dataset/${datasetKey}/nameusage/search?TAXON_ID=${urlSafe(
        taxonKey
      )}&facet=rank&status=accepted&status=provisionally%20accepted&limit=1`
    )
      .then((res) => {
        this.setState({
          includesLoading: false,
          includes: _.get(res, "data.facets.rank") || [],
          issues: _.get(res, "data.result[0].issues") || [],
        });
      })
      .catch((err) => {
        this.setState({
          includesLoading: false,
          includes: [],
          issues: [],
        });
      });
  };

  canEdit = () => {
    const { dataset, datasetKey, catalogueKey, user } = this.props;
    const { taxon } = this.state;
    if (Number(datasetKey) === catalogueKey) {
      return canEditDataset({ key: datasetKey }, user) && !taxon?.sectorKey;
    } else if (
      dataset?.key === Number(datasetKey) &&
      dataset?.origin === "project"
    ) {
      return (
        canEditDataset({ key: Number(datasetKey) }, user) && !taxon?.sectorKey
      );
    } else {
      return false;
    }
  };

  render() {
    const {
      datasetKey,
      catalogueKey,
      getNomStatus,
      rank,
      issueMap,
      user,
      dataset,
    } = this.props;
    const genusRankIndex = rank.indexOf("genus");
    const {
      taxon,
      //   synonyms,
      info,
      classification,
      sourceDataset,
      sourceTaxon,
      taxonError,
      synonymsError,
      classificationError,
      infoError,
      includes,
      edit,
      referenceIndexMap,
      issues,
    } = this.state;

    /*     const synonyms =
          info && info.synonyms && info.synonyms.length > 0
            ? info.synonyms.filter((s) => s.status !== "misapplied")
            : [];
        const misapplied =
          info && info.synonyms && info.synonyms.length > 0
            ? info.synonyms.filter((s) => s.status === "misapplied")
            : []; */
    /*  const homotypic = _.get(info, "synonyms.homotypic", []);
    const heterotypic = _.get(info, "synonyms.heterotypic", []); */
    const misapplied = _.get(info, "synonyms.misapplied", []);
    /* const synonyms = [
      ...homotypic.map((h) => ({ ...h, __homotypic: true })),
      ...heterotypic,
    ]; */

    return (
      <React.Fragment>
        <div
          style={{
            background: "#fff",
            padding: 24,
            minHeight: 280,
            margin: "16px 0",
            fontSize: "12px",
          }}
        >
          {edit && (
            <EditTaxonModal
              onCancel={() => this.setState({ edit: false })}
              onSuccess={() => this.setState({ edit: false }, this.getData)}
              taxon={taxon}
            />
          )}
          {taxonError && (
            <Alert description={<ErrorMsg error={taxonError} />} type="error" />
          )}
          {taxon && (
            <Row>
              <Col flex="auto">
                <CopyToClipboard
                  text={taxon.label}
                  onCopy={() =>
                    message.info(`Copied "${taxon.label}" to clipboard`)
                  }
                >
                  <Title level={3}>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: taxon.labelHtml,
                      }}
                    />
                  </Title>
                </CopyToClipboard>
                {["synonym", "ambiguous synonym", "misapplied"].includes(
                  taxon?.status
                ) && (
                  <Title level={5} style={{ marginTop: "-12px" }}>
                    {taxon?.status}{" "}
                    {taxon?.status === "misapplied" ? "to " : "of "}{" "}
                    <NavLink
                      to={{
                        pathname: `/dataset/${datasetKey}/taxon/${encodeURIComponent(
                          taxon?.accepted?.id
                        )}`,
                      }}
                    >
                      <span
                        dangerouslySetInnerHTML={{
                          __html: taxon?.accepted?.labelHtml,
                        }}
                      ></span>
                    </NavLink>
                  </Title>
                )}

                {/* {taxon.referenceIds && (
                  <div style={{ display: "inline-block", paddingLeft: "10px" }}>
                    <ReferencePopover
                      datasetKey={datasetKey}
                      referenceId={taxon.referenceIds}
                      placement="bottom"
                    />
                  </div>
                )} */}
              </Col>
              <Col>
                {this.canEdit() && (
                  <Button onClick={() => this.setState({ edit: true })}>
                    <EditOutlined /> Edit taxon
                  </Button>
                )}
                {taxon.provisional && <Tag color="red">Provisional</Tag>}
                <Button
                  onClick={() => {
                    history.push(
                      Number(datasetKey) === catalogueKey
                        ? `/catalogue/${catalogueKey}/name/${encodeURIComponent(
                            taxon.name.id
                          )}`
                        : `/dataset/${
                            taxon.datasetKey
                          }/name/${encodeURIComponent(taxon.name.id)}`
                    );
                  }}
                >
                  Name details
                </Button>
              </Col>
              {this.state.logoUrl && (
                <Col>
                  <img
                    style={{ marginLeft: "8px" }}
                    src={this.state.logoUrl}
                    alt={_.get(taxon, "name.scientificName")}
                  />
                </Col>
              )}
            </Row>
          )}
          {infoError && (
            <Alert description={<ErrorMsg error={infoError} />} type="error" />
          )}

          {synonymsError && (
            <Alert
              description={<ErrorMsg error={synonymsError} />}
              type="error"
            />
          )}

          {classificationError && (
            <Alert
              description={<ErrorMsg error={classificationError} />}
              type="error"
            />
          )}

          <Tabs defaultActiveKey="1" tabBarExtraContent={null}>
            <TabPane tab="About" key="1">
              {_.get(info, "taxon.name.publishedIn.citation") && (
                <PresentationItem md={md} label="Published in">
                  <Linkify>
                    {_.get(info, "taxon.name.publishedIn.citation", "")}
                  </Linkify>
                </PresentationItem>
              )}
              {_.get(info, "taxon.accordingTo") && (
                <PresentationItem md={md} label="According to">
                  {_.get(info, "taxon.accordingToId") ? (
                    <NavLink
                      to={{
                        pathname: `/dataset/${datasetKey}/reference/${_.get(
                          info,
                          "taxon.accordingToId"
                        )}`,
                      }}
                    >
                      {_.get(info, "taxon.accordingTo")}
                    </NavLink>
                  ) : (
                    _.get(info, "taxon.accordingTo")
                  )}
                </PresentationItem>
              )}
              {_.get(info, "taxon.name.publishedInPageLink") && (
                <PresentationItem md={md} label="Published In Page Link">
                  <Row>
                    <Col>
                      <a
                        href={_.get(info, "taxon.name.publishedInPageLink")}
                        target="_blank"
                      >
                        {_.get(info, "taxon.name.publishedInPageLink")}
                      </a>
                    </Col>
                    <Col>
                      <PublishedInPagePreview
                        publishedInPageLink={_.get(
                          info,
                          "taxon.name.publishedInPageLink"
                        )}
                        style={{
                          boxShadow: "6px 6px 6px lightgrey",
                          marginLeft: "10px",
                        }}
                      />
                    </Col>
                    <Col flex="auto"></Col>
                  </Row>
                </PresentationItem>
              )}
              {_.get(info, "typeMaterial") &&
                info.typeMaterial[info?.taxon?.name?.id] && (
                  <PresentationItem md={md} label="Type material">
                    <TypeMaterial
                      data={_.get(info, "typeMaterial")}
                      nameID={_.get(taxon, "name.id")}
                    />
                  </PresentationItem>
                )}
              <Row style={{ borderBottom: "1px solid #eee" }}>
                <Col span={12}>
                  {_.get(taxon, "status") && (
                    <PresentationItem md={md * 2} label="Status">
                      {`${taxon.status} ${_.get(taxon, "name.rank")}`}
                    </PresentationItem>
                  )}
                </Col>
              </Row>
              {_.get(taxon, "name.nomStatus") && (
                <PresentationItem md={md} label="Nomenclatural Status">
                  {getNomStatus(_.get(taxon, "name"))}
                </PresentationItem>
              )}
              {/*           {synonyms && synonyms.length > 0 && (
            <PresentationItem md={md} label="Synonyms and combinations">
              <SynonymTable
                onEditSuccess={this.getData}
                canEdit={this.canEdit}
                data={synonyms}
                references={_.get(info, "references")}
                referenceIndexMap={referenceIndexMap}
                typeMaterial={_.get(info, "typeMaterial")}
                style={{ marginTop: "-3px" }}
                datasetKey={datasetKey}
                catalogueKey={catalogueKey}
              />
            </PresentationItem>
          )} */}
              {_.get(info, "synonyms") && (
                <PresentationItem md={md} label="Synonyms and combinations">
                  <Synonyms
                    primarySource={sourceDataset}
                    onEditSuccess={this.getData}
                    canEdit={this.canEdit}
                    data={_.get(info, "synonyms")}
                    references={_.get(info, "references")}
                    referenceIndexMap={referenceIndexMap}
                    typeMaterial={_.get(info, "typeMaterial")}
                    style={{ marginTop: "-3px" }}
                    datasetKey={datasetKey}
                    catalogueKey={catalogueKey}
                  />
                </PresentationItem>
              )}
              {/* {misapplied && misapplied.length > 0 && (
                <PresentationItem md={md} label="Misapplied names">
                  <SynonymTable
                    data={misapplied}
                    references={_.get(info, "references")}
                    referenceIndexMap={referenceIndexMap}
                    typeMaterial={_.get(info, "typeMaterial")}
                    style={{ marginBottom: 16, marginTop: "-3px" }}
                    datasetKey={datasetKey}
                    catalogueKey={catalogueKey}
                  />
                </PresentationItem>
              )} */}
              {/*  {_.get(taxon, "name.relations") &&
                taxon.name.relations.length > 0 && (
                  <NameRelations
                    md={md}
                    style={{ marginTop: "-3px" }}
                    data={taxon.name.relations}
                    catalogueKey={catalogueKey}
                    datasetKey={datasetKey}
                  />
                )} */}
              {_.get(info, "nameRelations") &&
                info.nameRelations.filter((rel) => rel?.usageId === taxon?.id)
                  .length > 0 && (
                  <NameRelations
                    md={md}
                    style={{ marginTop: "-3px" }}
                    data={info.nameRelations.filter(
                      (rel) => rel?.usageId === taxon?.id
                    )}
                    catalogueKey={catalogueKey}
                    datasetKey={datasetKey}
                  />
                )}
              {_.get(info, "nameRelations") &&
                info.nameRelations.filter((rel) => rel?.usageId !== taxon?.id)
                  .length > 0 && (
                  <NameRelations
                    md={md}
                    reverse={true}
                    style={{ marginTop: "-3px" }}
                    data={info.nameRelations.filter(
                      (rel) => rel?.usageId !== taxon?.id
                    )}
                    catalogueKey={catalogueKey}
                    datasetKey={datasetKey}
                  />
                )}
              {classification && (
                <PresentationItem md={md} label="Classification">
                  <Classification
                    style={{ marginTop: "-3px", marginLeft: "-3px" }}
                    data={classification}
                    taxon={taxon}
                    datasetKey={datasetKey}
                    catalogueKey={catalogueKey}
                  />
                </PresentationItem>
              )}
              {((taxon &&
                rank.indexOf(_.get(taxon, "name.rank")) < genusRankIndex &&
                rank.indexOf(_.get(taxon, "name.rank")) > -1) ||
                (_.get(taxon, "name.rank") === "unranked" &&
                  _.get(taxon, "name.scientificName") === "Biota")) && (
                <TaxonBreakdown taxon={taxon} datasetKey={datasetKey} />
              )}
              {includes.length > 1 && taxon && (
                <PresentationItem md={md} label="Statistics">
                  <IncludesTable
                    style={{ marginTop: "-3px", marginLeft: "-3px" }}
                    data={includes}
                    taxon={taxon}
                    datasetKey={datasetKey}
                  />
                </PresentationItem>
              )}
              {info && info.speciesInteractions && (
                <SpeciesInterActions
                  md={md}
                  style={{ marginTop: "-3px", marginLeft: "-10px" }}
                  speciesInteractions={info.speciesInteractions}
                  references={info?.references || {}}
                  referenceIndexMap={referenceIndexMap}
                  datasetKey={datasetKey}
                />
              )}
              {_.get(info, "media") && (
                <PresentationItem md={md} label="Media">
                  <TaxonMedia media={_.get(info, "media")} />
                </PresentationItem>
              )}
              {_.get(info, "vernacularNames") && taxon && (
                <PresentationItem md={md} label="Vernacular names">
                  <VernacularNames
                    style={{ marginTop: "-3px", marginLeft: "-3px" }}
                    data={info.vernacularNames}
                    datasetKey={taxon.datasetKey}
                    catalogueKey={catalogueKey}
                  />
                </PresentationItem>
              )}
              {_.get(info, "distributions") && (
                <PresentationItem md={md} label="Distributions">
                  <Distributions
                    style={{ marginTop: "-3px" }}
                    data={info.distributions}
                    datasetKey={datasetKey}
                    catalogueKey={catalogueKey}
                  />
                </PresentationItem>
              )}
              {_.get(taxon, "environments") && (
                <PresentationItem md={md} label="Environments">
                  {_.get(taxon, "environments").join(", ")}
                </PresentationItem>
              )}
              {_.get(info, "properties") && (
                <TaxonProperties
                  md={md}
                  references={_.get(info, "references")}
                  referenceIndexMap={referenceIndexMap}
                  properties={info.properties}
                />
              )}
              {_.get(taxon, "remarks") && (
                <PresentationItem md={md} label="Remarks">
                  {taxon?.remarks ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(marked(taxon.remarks)),
                      }}
                    ></span>
                  ) : (
                    taxon?.remarks
                  )}
                </PresentationItem>
              )}
              {_.get(sourceDataset, "title") && (
                <PresentationItem md={md} label="Source">
                  <div style={{ display: "inline-block" }}>
                    {" "}
                    {sourceTaxon && (
                      <>
                        <NavLink
                          to={{
                            pathname: `/dataset/${sourceTaxon.sourceDatasetKey}/taxon/${sourceTaxon.sourceId}`,
                          }}
                          exact={true}
                        >
                          {sourceTaxon.sourceId}
                        </NavLink>{" "}
                        in{" "}
                      </>
                    )}
                    <NavLink
                      to={{
                        pathname: `/dataset/${datasetKey}/source/${_.get(
                          sourceDataset,
                          "key"
                        )}`,
                      }}
                      exact={true}
                    >
                      {_.get(sourceDataset, "title")}
                    </NavLink>
                    <span style={{ marginLeft: "10px" }}>
                      {_.get(sourceDataset, "completeness") &&
                        _.get(sourceDataset, "completeness") + "%"}
                    </span>
                    {_.get(sourceDataset, "confidence") && (
                      <Rate
                        style={{ marginLeft: "10px" }}
                        value={_.get(sourceDataset, "confidence")}
                        disabled
                      />
                    )}
                  </div>
                </PresentationItem>
              )}
              {_.get(taxon, "link") && (
                <PresentationItem md={md} label="Online resource">
                  <a href={_.get(taxon, "link")}>{_.get(taxon, "link")}</a>
                </PresentationItem>
              )}
              {info?.source?.secondarySources && (
                <PresentationItem md={md} label="Secondary Sources">
                  <SecondarySources info={info} />
                </PresentationItem>
              )}
              {this.state?.sourceDatasetKeyMap && (
                <PresentationItem md={md} label="Synonym Sources">
                  <SourceDatasets
                    datasetKey={this.props.datasetKey}
                    primarySourceDatasetKey={info?.source?.sourceDatasetKey}
                    sourceDatasetKeyMap={this.state.sourceDatasetKeyMap}
                  />
                </PresentationItem>
              )}{" "}
              {/*  {sourceTaxon && (
                <PresentationItem md={md} label="Source taxon">
                  <NavLink
                    to={{
                      pathname: `/dataset/${sourceTaxon.sourceDatasetKey}/taxon/${sourceTaxon.sourceId}`,
                    }}
                    exact={true}
                  >
                    {sourceTaxon.sourceId}
                  </NavLink>
                </PresentationItem>
              )} */}
              {_.get(info, "taxon.name.namesIndexId") && (
                <PresentationItem md={md} label="Related names">
                  <NavLink
                    to={{
                      pathname: `/namesindex/${_.get(
                        info,
                        "taxon.name.namesIndexId"
                      )}/related`,
                    }}
                  >
                    <LinkOutlined />
                  </NavLink>
                </PresentationItem>
              )}
              <Row style={{ borderBottom: "1px solid #eee" }}>
                {_.get(taxon, "scrutinizer") && (
                  <Col span={12}>
                    <PresentationItem md={md * 2} label="Taxonomic scrutiny">
                      {`${_.get(taxon, "scrutinizer")}${
                        _.get(taxon, "scrutinizerDate")
                          ? ", " +
                            moment(_.get(taxon, "scrutinizerDate")).format("LL")
                          : ""
                      }`}
                    </PresentationItem>
                  </Col>
                )}

                <Col span={12}>
                  {_.get(taxon, "origin") && (
                    <PresentationItem md={md * 2} label="Origin">
                      {_.get(taxon, "origin")}
                    </PresentationItem>
                  )}
                </Col>
              </Row>
              {issues && issues.length > 0 && (
                <PresentationItem md={md} label="Issues and flags">
                  <div>
                    {issues.map((i) => (
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
              {_.get(info, "references") && (
                <PresentationItem md={md} label="References">
                  <References
                    data={_.get(info, "references")}
                    referenceIndexMap={referenceIndexMap}
                  />
                </PresentationItem>
              )}
            </TabPane>
            {_.get(taxon, "verbatimKey") && (
              <TabPane tab="Verbatim" key="2">
                <Verbatim
                  sourceDatasetKey={datasetKey}
                  verbatimKey={taxon.verbatimKey}
                />
              </TabPane>
            )}
          </Tabs>
        </div>
      </React.Fragment>
    );
  }
}

const mapContextToProps = ({
  issueMap,
  dataset,
  catalogueKey,
  getNomStatus,
  rank,
  user,
}) => ({
  issueMap,
  dataset,
  catalogueKey,
  getNomStatus,
  rank,
  user,
});

export default withContext(mapContextToProps)(TaxonPage);
