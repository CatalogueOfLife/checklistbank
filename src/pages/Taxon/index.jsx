import React, { useEffect, useState, useRef } from "react";
import withRouter from "../../withRouter";
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
  Typography,
  Tooltip,
  App,
} from "antd";
import Tabs from "../../components/Tabs";
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
import Treatment from "./Treatment";
import TaxonProperties from "./TaxonProperties";
import SecondarySources from "./SecondarySources";
import moment from "dayjs";
import history from "../../history";
import withContext from "../../components/hoc/withContext";
import References from "./References";
import TypeMaterial from "./TypeMaterial";
import PublishedInPagePreview from "./PublishedInPagePreview";
import { CopyToClipboard } from "react-copy-to-clipboard";
import IncludesTable from "./Includes";
import SpeciesBySource from "./SpeciesBySource";
import TaxonBreakdown from "./TaxonBreakdown";
import TaxonMedia from "./TaxonMedia";
import EditTaxonModal from "../project/Assembly/EditTaxonModal";
import Auth from "../../components/Auth";
import Linkify from "../../components/Linkify";
import SourceDatasets from "./SourceDatasets";
import marked from "marked";
import DOMPurify from "dompurify";
import { getSectorsBatch } from "../../api/sector";
import { getDatasetsBatch } from "../../api/dataset";

import DataLoader from "dataloader";
import OtherUsages from "./OtherUsages";
import { IdentifierList } from "../../components/CurieIdentifier";
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
const { Title } = Typography;

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
  taxonMetrics: null,
  otherUsages: [],
  edit: false,
};

const getDatasetTreeRoute = (location, datasetKey, projectKey) => {
  return location.pathname.startsWith(`/project/${projectKey}`)
    ? `/project/${projectKey}/dataset/${datasetKey}/classification`
    : `/dataset/${datasetKey}/classification`;
};

const isAssembly = (location, projectKey) => {
  return (
    location.pathname.startsWith(`/project/${projectKey}`) &&
    location.pathname.indexOf("/dataset") === -1
  );
};

const TaxonPage = ({
  match,
  location,
  history,
  datasetKey,
  projectKey,
  getNomStatus,
  rank,
  issueMap,
  taxGroup,
  identifierScope,
  user,
  dataset,
}) => {
  const { message } = App.useApp();
  const taxonOrNameKey = match?.params?.taxonOrNameKey;

  const [taxon, setTaxon] = useState(null);
  const [info, setInfo] = useState(null);
  const [referenceIndexMap, setReferenceIndexMap] = useState({});
  const [infoLoading, setInfoLoading] = useState(true);
  const [infoError, setInfoError] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [sourceDataset, setSourceDataset] = useState(null);
  const [sourceDatasetKeyMap, setSourceDatasetKeyMap] = useState(null);
  const [sourceTaxon, setSourceTaxon] = useState(null);
  const [includes, setIncludes] = useState([]);
  const [taxonMetrics, setTaxonMetrics] = useState(null);
  const [otherUsages, setOtherUsages] = useState([]);
  const [edit, setEdit] = useState(false);

  const sectorLoaderRef = useRef(
    new DataLoader((ids) => getSectorsBatch(ids, datasetKey))
  );

  // Reset sectorLoader when datasetKey changes
  useEffect(() => {
    sectorLoaderRef.current = new DataLoader((ids) =>
      getSectorsBatch(ids, datasetKey)
    );
  }, [datasetKey]);

  const resetState = () => {
    setTaxon(null);
    setInfo(null);
    setReferenceIndexMap({});
    setInfoLoading(true);
    setInfoError(null);
    setLogoUrl(null);
    setSourceDataset(null);
    setSourceDatasetKeyMap(null);
    setSourceTaxon(null);
    setIncludes([]);
    setTaxonMetrics(null);
    setOtherUsages([]);
    setEdit(false);
  };

  const decorateWithSectorsAndDataset = async (synonyms) => {
    const sourceDatasetsMap = {};
    for (const type of ["misapplied", "heterotypic", "homotypic"].filter(
      (t) => !!synonyms[t]
    )) {
      await Promise.allSettled(
        synonyms[type]
          .filter((tx) => !!tx.sectorKey)
          .map((tx) =>
            sectorLoaderRef.current.load(tx.sectorKey, datasetKey).then((r) => {
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
              sectorLoaderRef.current.load(tx.sectorKey, datasetKey).then((r) => {
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

  const getTaxonMetrics = async () => {
    try {
      const res = await axios(
        `${config.dataApi}dataset/${datasetKey}/taxon/${urlSafe(
          taxonOrNameKey
        )}/metrics`
      );
      const metrics = res?.data || null;
      setTaxonMetrics(metrics);
      return metrics;
    } catch (err) {
      setTaxonMetrics(null);
      return null;
    }
  };

  const getIncludesAndIssues = async () => {
    axios(
      `${
        config.dataApi
      }dataset/${datasetKey}/nameusage/search?TAXON_ID=${urlSafe(
        taxonOrNameKey
      )}&facet=rank&status=accepted&status=provisionally%20accepted&limit=0`
    )
      .then((res) => {
        setIncludes(_.get(res, "data.facets.rank") || []);
      })
      .catch(() => {
        setIncludes([]);
      });
  };

  const getStatistics = async () => {
    const metrics = await getTaxonMetrics();
    if (!metrics?.taxaByRankCount) {
      getIncludesAndIssues();
    }
  };

  const getInfo = async () => {
    try {
      const res = await axios(
        `${config.dataApi}dataset/${datasetKey}/taxon/${urlSafe(taxonOrNameKey)}/info`
      );

      // we copy the taxon usage to the taxon property which this page used to load separately - avoids a big refactoring
      setTaxon(_.get(res, "data.usage"));

      if (_.get(res, "data.source")) {
        setSourceTaxon(_.get(res, "data.source"));
      }
      // sector keys are only present if its a project
      if (_.get(res, "data.usage.sectorKey")) {
        axios(
          `${config.dataApi}dataset/${datasetKey}/sector/${_.get(
            res,
            "data.usage.sectorKey"
          )}`
        ).then((sector) => {
          const logoUrlValue = `${
            config.dataApi
          }dataset/${datasetKey}/logo/source/${_.get(
            sector,
            "data.subjectDatasetKey"
          )}`;
          axios(logoUrlValue)
            .then(() => {
              setLogoUrl(logoUrlValue);
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
            setSourceDataset(dataset.data);
          });
        });
      }
      if (res?.data?.usage?.status === "ambiguous synonym") {
        axios(
          `${config.dataApi}dataset/${
            res?.data?.datasetKey
          }/nameusage/search?content=scientific_name&type=exact&q=${encodeURIComponent(
            res?.data?.name?.scientificName
          )}`
        ).then((otherUsagesRes) => {
          setOtherUsages(
            otherUsagesRes?.data?.result.filter(
              (u) => u?.id !== res?.data?.id
            ) || []
          );
        });
      }

      let newReferenceIndexMap = {};
      if (_.get(res, "data.references")) {
        Object.keys(res.data.references).forEach((k, i) => {
          newReferenceIndexMap[k] = (i + 1).toString();
        });
        await Promise.allSettled(
          Object.keys(res.data.references)
            .map((key) => res.data.references[key])
            .filter((ref) => !!ref.sectorKey)
            .map((ref) =>
              sectorLoaderRef.current.load(ref.sectorKey).then((r) => {
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
      if (res?.data?.vernacularNames) {
        await Promise.allSettled(
          res.data.vernacularNames
            .filter((name) => !!name.sectorKey)
            .map((name) =>
              sectorLoaderRef.current.load(name.sectorKey).then((r) => {
                name.sector = r;
                name.sourceDatasetKey = r.subjectDatasetKey;
              })
            )
        );
      }
      if (res?.data?.distributions) {
        await Promise.allSettled(
          res.data.distributions
            .filter((dist) => !!dist.sectorKey)
            .map((dist) =>
              sectorLoaderRef.current.load(dist.sectorKey).then((r) => {
                dist.sector = r;
                dist.sourceDatasetKey = r.subjectDatasetKey;
              })
            )
        );
      }

      let newSourceDatasetKeyMap = _.get(res, "data.synonyms")
        ? await decorateWithSectorsAndDataset(_.get(res, "data.synonyms"))
        : null;

      if (res?.data?.nameRelations && res?.data?.names) {
        res?.data?.nameRelations.forEach((rel) => {
          rel.relatedName = res?.data?.names?.[rel?.relatedNameId];
          rel.name = res?.data?.names?.[rel?.nameId];
        });
      }

      setInfoLoading(false);
      setInfo(res.data);
      setInfoError(null);
      setReferenceIndexMap(newReferenceIndexMap);
      setSourceDatasetKeyMap(newSourceDatasetKeyMap);
    } catch (err) {
      setInfoLoading(false);
      setInfoError(err);
      setInfo(null);
    }
  };

  const getData = async () => {
    getInfo();
    getStatistics();
  };

  const canEdit = () => {
    if (Number(datasetKey) === projectKey) {
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

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    resetState();
    getData();
  }, [datasetKey, taxonOrNameKey]);

  const genusRankIndex = rank.indexOf("genus");
  const taxonRank = _.get(taxon, "name.rank");
  const ranksFromMetrics = taxonMetrics?.taxaByRankCount
    ? Object.entries(taxonMetrics.taxaByRankCount).map(([value, count]) => ({
        value,
        count,
      }))
    : null;
  const rankStats = ranksFromMetrics || includes;
  const rankStatsHasChildren =
    rankStats.filter((t) => t.value !== taxonRank).length > 0;
  const speciesBySource = taxonMetrics?.speciesBySourceCount || {};
  const hasSpeciesBySource = Object.keys(speciesBySource).length > 0;

  const mergedIssues = [
    ...new Set([...(sourceTaxon?.issues || []), ...(info?.issues || [])]),
  ];

  // Tabs are deep-linkable via the URL hash (#about, #treatment, #verbatim).
  const tabKeys = [
    "about",
    ...(_.get(info, "treatment.document") ? ["treatment"] : []),
    ...(_.get(taxon, "verbatimKey") ? ["verbatim"] : []),
  ];
  const hashKey = (location?.hash || "").replace(/^#/, "");
  const activeTab = tabKeys.includes(hashKey) ? hashKey : "about";
  const onTabChange = (key) => {
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: key === "about" ? "" : `#${key}`,
    });
  };

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
            onCancel={() => setEdit(false)}
            onSuccess={() => { setEdit(false); getData(); }}
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
                    <span
                      dangerouslySetInnerHTML={{
                        __html: taxon?.accepted?.labelHtml,
                      }}
                    ></span>
                  </NavLink>
                </Title>
              )}
            </Col>
            <Col>
              {canEdit() && (
                <Button onClick={() => setEdit(true)}>
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
                    Number(datasetKey) === projectKey
                      ? `/project/${projectKey}/name/${encodeURIComponent(
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
            {logoUrl && (
              <Col>
                <img
                  style={{ marginLeft: "8px" }}
                  src={logoUrl}
                  alt={_.get(taxon, "name.scientificName")}
                />
              </Col>
            )}
          </Row>
        )}

        <Tabs
          activeKey={activeTab}
          onChange={onTabChange}
          tabBarExtraContent={null}
          items={[
            {
              key: "about",
              label: "About",
              children: (
                <>
                  {_.get(info, "publishedIn.citation") && (
                    <PresentationItem md={md} label="Published in">
                      <Linkify>{_.get(info, "publishedIn.citation", "")}</Linkify>
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
                              pathname: isAssembly(location, projectKey)
                                ? `/project/${projectKey}/assembly`
                                : getDatasetTreeRoute(
                                    location,
                                    datasetKey,
                                    projectKey
                                  ),
                              search: isAssembly(location, projectKey)
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
                        projectKey={projectKey}
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
                        projectKey={projectKey}
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
                        projectKey={projectKey}
                        datasetKey={datasetKey}
                      />
                    )}
                  {(_.get(info, "synonyms.homotypic.length") > 0 ||
                    _.get(info, "synonyms.heterotypicGroups.length") > 0) && (
                    <PresentationItem md={md} label="Synonyms and combinations">
                      <Synonyms
                        primarySource={sourceDataset}
                        onEditSuccess={getData}
                        canEdit={canEdit}
                        data={_.get(info, "synonyms")}
                        decisions={_.get(info, "decisions")}
                        references={_.get(info, "references")}
                        referenceIndexMap={referenceIndexMap}
                        typeMaterial={_.get(info, "typeMaterial")}
                        style={{ marginTop: "-3px" }}
                        datasetKey={datasetKey}
                        projectKey={projectKey}
                      />
                    </PresentationItem>
                  )}
                  {_.get(info, "synonyms.misapplied.length") > 0 && (
                    <PresentationItem md={md} label="Misapplied names">
                      <Synonyms
                        misapplied
                        primarySource={sourceDataset}
                        onEditSuccess={getData}
                        canEdit={canEdit}
                        data={_.get(info, "synonyms")}
                        decisions={_.get(info, "decisions")}
                        references={_.get(info, "references")}
                        referenceIndexMap={referenceIndexMap}
                        typeMaterial={_.get(info, "typeMaterial")}
                        style={{ marginTop: "-3px" }}
                        datasetKey={datasetKey}
                        projectKey={projectKey}
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
                  {taxon &&
                    rank.indexOf(_.get(taxon, "name.rank")) < genusRankIndex &&
                    rank.indexOf(_.get(taxon, "name.rank")) > -1 && (
                      <div style={{ borderBottom: "1px solid #eee" }}>
                        <TaxonBreakdown taxon={taxon} datasetKey={datasetKey} />
                      </div>
                    )}
                  {taxon && rankStatsHasChildren && (
                    <PresentationItem md={md} label="Statistics">
                      <IncludesTable
                        style={{ marginTop: "-3px", marginLeft: "-3px" }}
                        data={rankStats}
                        taxon={taxon}
                        datasetKey={datasetKey}
                      />
                    </PresentationItem>
                  )}
                  {taxon && hasSpeciesBySource && (
                    <PresentationItem md={md} label="Species by source">
                      <SpeciesBySource
                        counts={speciesBySource}
                        datasetKey={datasetKey}
                        taxonId={taxon.id}
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
                        style={{ marginTop: "-3px" }}
                        data={info.vernacularNames}
                        datasetKey={taxon.datasetKey}
                        projectKey={projectKey}
                      />
                    </PresentationItem>
                  )}
                  {_.get(info, "distributions") && (
                    <PresentationItem md={md} label="Distributions">
                      <Distributions
                        style={{ marginTop: "-3px" }}
                        data={info.distributions}
                        datasetKey={datasetKey}
                        projectKey={projectKey}
                        focalTaxon={taxon}
                        rankOrder={rank}
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
                        <span
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(marked(taxon.remarks)),
                          }}
                        ></span>
                      ) : (
                        taxon?.remarks
                      )}
                      {taxon?.name?.remarks ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(marked(taxon.name.remarks)),
                          }}
                        ></span>
                      ) : (
                        taxon?.name?.remarks
                      )}
                    </PresentationItem>
                  )}
                  {_.isArray(taxon?.identifier) && taxon.identifier.length > 0 && (
                    <PresentationItem md={md} label="Identifiers">
                      <IdentifierList
                        identifiers={taxon.identifier}
                        identifierScope={identifierScope}
                      />
                    </PresentationItem>
                  )}
                  {_.get(info, "usage.status") === "ambiguous synonym" && (
                    <PresentationItem md={md} label="Other usages">
                      <OtherUsages otherUsages={otherUsages} />
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
                                  end
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
                        {info?.decisions?.[taxon?.id] && (
                          <>
                            &nbsp;with{" "}
                            {info?.decisions?.[taxon?.id]?.mode}{" "}
                            decision
                            <DecisionBadge
                              style={{ marginLeft: "10px" }}
                              decision={info?.decisions?.[taxon?.id]}
                            />
                          </>
                        )}
                      </span>
                    </PresentationItem>
                  )}
                  {_.get(sourceDataset, "title") && (
                    <PresentationItem md={md} label="Source">
                      <div style={{ display: "inline-block" }}>
                        {info?.usage?.merged && (
                          <MergedDataBadge
                            createdBy={info?.usage?.createdBy}
                            datasetKey={info?.usage?.datasetKey}
                            verbatimSourceKey={info?.usage?.verbatimSourceKey}
                            sourceDatasetKey={info?.source?.sourceDatasetKey}
                            sourceId={info?.source?.sourceId}
                          />
                        )}{" "}
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
                              end
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
                            end
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
                      {_.get(taxon, "link") && (
                        <a href={_.get(taxon, "link")}>{_.get(taxon, "link")}</a>
                      )}
                      {_.get(taxon, "name.link") &&
                        _.get(taxon, "link") != _.get(taxon, "name.link") && (
                          <a href={_.get(taxon, "name.link")}>
                            {_.get(taxon, "name.link")}
                          </a>
                        )}
                    </PresentationItem>
                  )}
                  {info?.source?.secondarySources && (
                    <PresentationItem md={md} label="Secondary Sources">
                      <SecondarySources info={info} />
                    </PresentationItem>
                  )}
                  {sourceDatasetKeyMap && (
                    <PresentationItem md={md} label="Synonym Sources">
                      <SourceDatasets
                        datasetKey={datasetKey}
                        primarySourceDatasetKey={info?.source?.sourceDatasetKey}
                        sourceDatasetKeyMap={sourceDatasetKeyMap}
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
                </>
              ),
            },
            _.get(info, "treatment.document") && {
              key: "treatment",
              label: "Treatment",
              children: (
                <Treatment treatment={_.get(info, "treatment")} dataset={dataset} />
              ),
            },
            _.get(taxon, "verbatimKey") && {
              key: "verbatim",
              label: "Verbatim",
              children: (
                <Verbatim
                  sourceDatasetKey={datasetKey}
                  verbatimKey={taxon.verbatimKey}
                />
              ),
            },
          ].filter(Boolean)}
        />
      </div>
    </React.Fragment>
  );
};

const mapContextToProps = ({
  issueMap,
  dataset,
  projectKey,
  getNomStatus,
  rank,
  user,
  taxGroup,
  identifierScope,
}) => ({
  issueMap,
  dataset,
  projectKey,
  getNomStatus,
  rank,
  user,
  taxGroup,
  identifierScope,
});

export default withRouter(withContext(mapContextToProps)(TaxonPage));
