import React from "react";
import config from "../../config";

import axios from "axios";
import { NavLink } from "react-router-dom";
import { RiNodeTree } from "react-icons/ri";
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
import MergedDataBadge from "../../components/MergedDataBadge";
import DecisionBadge from "../../components/DecisionBadge";
import Synonyms from "./Synonyms";
import VernacularNames from "./VernacularNames";
import Distributions from "./Distributions";
import Classification from "./Classification";
import NameRelations from "./NameRelations";
import SpeciesInterActions from "./SpeciesInteractions";
import ErrorMsg from "../../components/ErrorMsg";
import _ from "lodash";
import PresentationItem from "../../components/PresentationItem";
import Verbatim from "./Verbatim";
import TaxonProperties from "./TaxonProperties";
import SecondarySources from "./SecondarySources";
import moment from "moment";
import history from "../../history";
import withContext from "../../components/hoc/withContext";
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
import OtherUsages from "./OtherUsages";
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
  datasetLoading: true,
  infoLoading: true,
  infoError: null,
  logoUrl: null,
  sourceDataset: null,
  sourceDatasetKeyMap: null,
  sourceTaxon: null,
  includes: [],
  otherUsages: [],
  edit: false,
};

const getDatasetTreeRoute = (location, datasetKey, catalogueKey) => {
  return location.pathname.startsWith(`/catalogue/${catalogueKey}`)
    ? `/catalogue/${catalogueKey}/dataset/${datasetKey}/classification`
    : `/dataset/${datasetKey}/classification`;
};

const isAssembly = (location, catalogueKey) => {
  return (
    location.pathname.startsWith(`/catalogue/${catalogueKey}`) &&
    location.pathname.indexOf("/dataset") === -1
  );
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
    this.getInfo();
    this.getIncludesAndIssues();
  };
  sectorLoader = new DataLoader((ids) =>
    getSectorsBatch(ids, this.props.datasetKey)
  );
  decorateWithSectorsAndDataset = async (synonyms) => {
    const { datasetKey } = this.props;
    const sourceDatasetsMap = {};
    for (const type of ["misapplied", "heterotypic", "homotypic"].filter(
      (t) => !!synonyms[t]
    )) {
      await Promise.allSettled(
        synonyms[type]
          .filter((tx) => !!tx.sectorKey)
          .map((tx) =>
            this.sectorLoader.load(tx.sectorKey, datasetKey).then((r) => {
              tx.sector = r;
              return datasetLoader.load(r.subjectDatasetKey).then((dataset) => {
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
              this.sectorLoader.load(tx.sectorKey, datasetKey).then((r) => {
                tx.sector = r;
                return datasetLoader
                  .load(r.subjectDatasetKey)
                  .then((dataset) => {
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

      // we copy the taxon usage to the taxon property which this page used to load separately - avoids a big refactoring
      this.setState({ taxon: _.get(res, "data.usage") });

      if (_.get(res, "data.source")) {
        this.setState({ sourceTaxon: _.get(res, "data.source") });
      }
      // sector keys are only present if its a catalogue
      if (_.get(res, "data.usage.sectorKey")) {
        axios(
          `${config.dataApi}dataset/${datasetKey}/sector/${_.get(res, "data.usage.sectorKey")}`
        ).then((sector) => {
          const logoUrl = `${config.dataApi}dataset/${datasetKey}/logo/source/${_.get(sector, "data.subjectDatasetKey")}`;
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
            `${config.dataApi}dataset/${_.get(sector, "data.subjectDatasetKey")}`
          ).then((dataset) => {
            this.setState({ sourceDataset: dataset.data });
          });
        });
      }
      if (res?.data?.usage?.status === "ambiguous synonym") {
        axios(
          `${config.dataApi}dataset/${res?.data?.datasetKey}/nameusage/search?content=scientific_name&type=exact&q=${encodeURIComponent(
            res?.data?.name?.scientificName
          )}`
        ).then((otherUsages) => {
          this.setState({
            otherUsages:
              otherUsages?.data?.result.filter(
                (u) => u?.id !== res?.data?.id
              ) || [],
          });
        });
      };

      let referenceIndexMap = {};
      if (_.get(res, "data.references")) {
        Object.keys(res.data.references).forEach((k, i) => {
          referenceIndexMap[k] = (i + 1).toString();
        });
        await Promise.allSettled(
          Object.keys(res.data.references)
            .map((key) => res.data.references[key])
            .filter((ref) => !!ref.sectorKey)
            .map((ref) =>
              this.sectorLoader.load(ref.sectorKey).then((r) => {
                ref.sector = r;
                return datasetLoader
                  .load(r.subjectDatasetKey)
                  .then((dataset) => {
                    ref.sourceDataset = dataset;
                  });
              })
            )
        );
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

  getIncludesAndIssues = async () => {
    const {
      match: {
        params: { taxonOrNameKey: taxonKey },
      },
      datasetKey,
    } = this.props;

    axios(
      `${config.dataApi}dataset/${datasetKey}/nameusage/search?TAXON_ID=${urlSafe(taxonKey)}&facet=rank&status=accepted&status=provisionally%20accepted&limit=0`
    )
      .then((res) => {
        this.setState({
          includesLoading: false,
          includes: _.get(res, "data.facets.rank") || [],
        });
      })
      .catch((err) => {
        this.setState({
          includesLoading: false,
          includes: [],
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
      taxGroup,
      user,
      dataset,
    } = this.props;
    const genusRankIndex = rank.indexOf("genus");
    const {
      taxon,
      info,
      sourceDataset,
      sourceTaxon,
      infoError,
      includes,
      edit,
      referenceIndexMap,
    } = this.state;

    const mergedIssues = [
      ...new Set([...(sourceTaxon?.issues || []), ...info?.issues || []]),
    ];

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
          {infoError && (
            <Alert description={<ErrorMsg error={infoError} />} type="error" />
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
                      <span dangerouslySetInnerHTML={{__html: taxon?.accepted?.labelHtml}}></span>
                    </NavLink>
                  </Title>
                )}
              </Col>
              <Col>
                {this.canEdit() && (
                  <Button onClick={() => this.setState({ edit: true })}>
                    <EditOutlined /> Edit taxon
                  </Button>
                )}
                {_.get(info, "group") && (
                  <Tooltip title={_.get(info, "group")}>
                    <a
                      href={`/vocabulary/taxgrouptree#${_.get(info, "group")}`}
                    >
                      <img
                        style={{
                          marginRight: "8px",
                          width: "24px",
                          height: "24px",
                        }}
                        src={_.get(taxGroup[_.get(info, "group")], "icon")}
                      />
                    </a>
                  </Tooltip>
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

          <Tabs defaultActiveKey="1" tabBarExtraContent={null}>
            <TabPane tab="About" key="1">
              {_.get(info, "publishedIn.citation") && (
                <PresentationItem md={md} label="Published in">
                  <Linkify>
                    {_.get(info, "publishedIn.citation", "")}
                  </Linkify>
                </PresentationItem>
              )}
              {_.get(info, "usage.accordingTo") && (
                <PresentationItem md={md} label="According to">
                  {_.get(info, "usage.accordingToId") ? (
                    <NavLink
                      to={{
                        pathname: `/dataset/${datasetKey}/reference/${_.get(
                          info,
                          "usage.accordingToId"
                        )}`,
                      }}
                    >
                      {_.get(info, "usage.accordingTo")}
                    </NavLink>
                  ) : (
                    _.get(info, "usage.accordingTo")
                  )}
                </PresentationItem>
              )}
              {_.get(info, "usage.name.publishedInPageLink") && (
                <PresentationItem md={md} label="Published In Page Link">
                  <Row>
                    <Col>
                      <a
                        href={_.get(info, "usage.name.publishedInPageLink")}
                        target="_blank"
                      >
                        {_.get(info, "usage.name.publishedInPageLink")}
                      </a>
                    </Col>
                    <Col>
                      <PublishedInPagePreview
                        publishedInPageLink={_.get(
                          info,
                          "usage.name.publishedInPageLink"
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
              {_.get(info, "classification") && (
                <PresentationItem
                  md={md}
                  label={
                    <>
                      <span>Classification</span>
                      <NavLink
                        style={{ marginLeft: "5px" }}
                        to={{
                          pathname: isAssembly(location, catalogueKey)
                            ? `/catalogue/${catalogueKey}/assembly`
                            : getDatasetTreeRoute(
                                location,
                                datasetKey,
                                catalogueKey
                              ),
                          search: isAssembly(location, catalogueKey)
                            ? `?assemblyTaxonKey=${encodeURIComponent(
                                _.get(taxon, "id")
                              )}`
                            : `?taxonKey=${encodeURIComponent(
                                _.get(taxon, "id")
                              )}`,
                        }}
                      >
                        <RiNodeTree />
                      </NavLink>
                    </>
                  }
                >
                  <Classification
                    style={{ marginTop: "-3px", marginLeft: "-3px" }}
                    data={_.get(info, "classification")}
                    taxon={taxon}
                    datasetKey={datasetKey}
                    catalogueKey={catalogueKey}
                  />
                </PresentationItem>
              )}
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
              {_.get(info, "synonyms") && (
                <PresentationItem md={md} label="Synonyms and combinations">
                  <Synonyms
                    primarySource={sourceDataset}
                    onEditSuccess={this.getData}
                    canEdit={this.canEdit}
                    data={_.get(info, "synonyms")}
                    decisions={_.get(info, "decisions")}
                    references={_.get(info, "references")}
                    referenceIndexMap={referenceIndexMap}
                    typeMaterial={_.get(info, "typeMaterial")}
                    style={{ marginTop: "-3px" }}
                    datasetKey={datasetKey}
                    catalogueKey={catalogueKey}
                  />
                </PresentationItem>
              )}
              {_.get(info, "typeMaterial") &&
                info.typeMaterial[info?.usage?.name?.id] && (
                  <PresentationItem md={md} label="Type material">
                    <TypeMaterial
                      data={_.get(info, "typeMaterial")}
                      nameID={_.get(taxon, "name.id")}
                    />
                  </PresentationItem>
              )}
              {_.get(info, "speciesInteractions") && (
                <SpeciesInterActions
                  md={md}
                  style={{ marginTop: "-3px", marginLeft: "-10px" }}
                  speciesInteractions={info?.speciesInteractions}
                  references={info?.references || {}}
                  referenceIndexMap={referenceIndexMap}
                  datasetKey={datasetKey}
                />
              )}
              {_.get(taxon, "environments") && (
                <PresentationItem md={md} label="Environments">
                  {_.get(taxon, "environments").join(", ")}
                </PresentationItem>
              )}
              {_.get(taxon, "temporalRangeStart") && (
                <PresentationItem md={md} label="Temporal range">
                  <span>
                    {taxon.temporalRangeStart}
                    {_.get(taxon, "temporalRangeEnd") &&
                      ` to ${taxon.temporalRangeEnd}`}
                  </span>
                </PresentationItem>
              )}
              {(taxon &&
                rank.indexOf(_.get(taxon, "name.rank")) < genusRankIndex &&
                rank.indexOf(_.get(taxon, "name.rank")) > -1
              ) && (
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
              {_.get(info, "properties") && (
                <TaxonProperties
                  md={md}
                  references={_.get(info, "references")}
                  referenceIndexMap={referenceIndexMap}
                  properties={info.properties}
                />
              )}
              {_.get(taxon, "name.etymology") && (
                <PresentationItem md={md} label="Etymology">
                  {_.get(taxon, "name.etymology")}
                </PresentationItem>
              )}
              {(_.get(taxon, "remarks") || _.get(taxon, "name.remarks")) && (
                <PresentationItem md={md} label="Remarks">
                  {taxon?.remarks ? (
                    <span dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(marked(taxon.remarks))}}></span>
                  ) : (
                    taxon?.remarks
                  )}
                  {taxon?.name?.remarks ? (
                    <span dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(marked(taxon.name.remarks))}}></span>
                  ) : (
                    taxon?.name?.remarks
                  )}
                </PresentationItem>
              )}
              {_.isArray(taxon?.identifier) && (
                <PresentationItem md={md} label="Identifiers">
                  {taxon?.identifier.join(", ")}
                </PresentationItem>
              )}
              {_.get(info, "usage.status") === "ambiguous synonym" && (
                <PresentationItem md={md} label="Other usages">
                  <OtherUsages otherUsages={this.state?.otherUsages} />
                </PresentationItem>
              )}
              {_.get(info, "usage.name.namesIndexId") && (
                <PresentationItem md={md} label="Related names">
                  <NavLink
                    to={{
                      pathname: `/namesindex/${encodeURIComponent(
                        _.get(info, "usage.name.namesIndexId")
                      )}/related`,
                    }}
                  >
                    Names Index Entry
                  </NavLink>
                </PresentationItem>
              )}
              {_.get(taxon, "scrutinizer") && (
                <PresentationItem md={md} label="Taxonomic scrutiny">
                  {`${_.get(taxon, "scrutinizer")}${
                    _.get(taxon, "scrutinizerDate")
                      ? ", " +
                        moment(_.get(taxon, "scrutinizerDate")).format("LL")
                      : ""
                  }`}
                </PresentationItem>
              )}
              {mergedIssues && mergedIssues.length > 0 && (
                <PresentationItem md={md} label="Issues and flags">
                  <div>
                    {mergedIssues.map((i) => {
                      const tag = (
                        <Tag key={i} color={_.get(issueMap, `[${i}].color`)}>
                          {i}
                        </Tag>
                      );
                      return (
                        <Tooltip
                          key={i}
                          title={_.get(issueMap, `[${i}].description`)}
                        >
                          {i === "duplicate name" ? (
                            <NavLink
                              to={{
                                pathname: `/dataset/${datasetKey}/names`,
                                search: `?q=${_.get(
                                  taxon,
                                  "name.scientificName"
                                )}&rank=${_.get(taxon, "name.rank")}`,
                              }}
                              exact={true}
                            >
                              {tag}
                            </NavLink>
                          ) : (
                            <React.Fragment>{tag}</React.Fragment>
                          )}
                        </Tooltip>
                      );
                    })}
                  </div>
                </PresentationItem>
              )}
              {_.get(taxon, "origin") && !_.get(sourceDataset, "title") && (
                <PresentationItem md={md} label="Origin">
                  <span>
                    {_.get(taxon, "origin")}
                    {this.state?.info?.decisions?.[taxon?.id] && (
                      <>
                        &nbsp;with{" "}
                        {this.state?.info?.decisions?.[taxon?.id]?.mode}{" "}
                        decision
                        <DecisionBadge
                          style={{ marginLeft: "10px" }}
                          decision={
                            this.state?.info?.decisions?.[taxon?.id]
                          }
                        />
                      </>
                    )}
                  </span>
                </PresentationItem>
              )}
              {_.get(sourceDataset, "title") && (
                <PresentationItem md={md} label="Source">
                  <div style={{ display: "inline-block" }}>
                    {info?.usage?.merged && <MergedDataBadge />}{" "}
                    {sourceTaxon && sourceTaxon.sourceId ? (
                      <>
                        <NavLink
                          to={{
                            pathname: `/dataset/${
                              sourceTaxon.sourceDatasetKey
                            }/taxon/${encodeURIComponent(
                              sourceTaxon.sourceId
                            )}`,
                          }}
                          exact={true}
                        >
                          {_.get(sourceDataset, "title")}
                        </NavLink>{" "}
                      </>
                    ) : (
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
                    )}
                    {_.get(sourceDataset, "confidence") && (
                      <>
                        <span style={{ marginLeft: "10px" }}>
                          {_.get(sourceDataset, "completeness") > 0 &&
                            _.get(sourceDataset, "completeness") + "%"}
                        </span>
                        <Rate
                          style={{ marginLeft: "10px" }}
                          value={_.get(sourceDataset, "confidence")}
                          disabled
                        />
                      </>
                    )}
                  </div>
                </PresentationItem>
              )}
              {(_.get(taxon, "link") || _.get(taxon, "name.link")) && (
                <PresentationItem md={md} label="Online resource">
                  {_.get(taxon, "link") && (<a href={_.get(taxon, "link")}>{_.get(taxon, "link")}</a>)}
                  {_.get(taxon, "name.link") && (_.get(taxon, "link") != _.get(taxon, "name.link")) && (<a href={_.get(taxon, "name.link")}>{_.get(taxon, "name.link")}</a>)}
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
              {_.get(info, "references") && (
                <PresentationItem md={md} label="References">
                  <References
                    data={_.get(info, "references")}
                    referenceIndexMap={referenceIndexMap}
                    primarySourceDatasetKey={info?.source?.sourceDatasetKey}
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
  taxGroup,
}) => ({
  issueMap,
  dataset,
  catalogueKey,
  getNomStatus,
  rank,
  user,
  taxGroup,
});

export default withContext(mapContextToProps)(TaxonPage);
