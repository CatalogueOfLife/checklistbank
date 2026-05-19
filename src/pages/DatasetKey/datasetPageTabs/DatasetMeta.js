import { useEffect, useState } from "react";
import config from "../../../config";
import _ from "lodash";
import axios from "axios";
import {
  Switch,
  Rate,
  Row,
  Col,
  notification,
  Popconfirm,
  Divider,
  Card,
  Button,
} from "antd";
import { NavLink } from "react-router-dom";
import MetaDataForm from "../../../components/MetaData/MetaDataForm";
import LogoUpload from "../../../components/MetaData/LogoUpload";
import ArchiveUpload from "../../../components/ArchiveUpload";
import MetaDataUpload from "../../../components/MetaData/MetaDataUpload";
import PageContent from "../../../components/PageContent";
import PresentationItem from "../../../components/PresentationItem";
import withContext from "../../../components/hoc/withContext";
import Auth from "../../../components/Auth";
import moment from "dayjs";
import AgentPresentation from "../../../components/MetaData/AgentPresentation";
import DoiPresentation from "../../../components/MetaData/DoiPresentation";
import BibTex from "../../../components/MetaData/BibTex";
import Eml from "../../../components/MetaData/Eml";
import Yaml from "../../../components/MetaData/Yaml";

import TaxGroupIcon, { filterRedundantGroups } from "../../NameSearch/TaxGroupIcon";
import TaxBreakdownChart from "./TaxBreakdownChart";
import marked from "marked";
import DOMPurify from "dompurify";
import linkify from "linkify-html";

export const IDENTIFIER_TYPES = {
  col: "https://www.checklistbank.org/dataset/",
  gbif: "https://www.gbif.org/dataset/",
  plazi: "http://publication.plazi.org/id/",
  doi: "https://doi.org/",
};

const DatasetMeta = ({
  id,
  projectKey,
  archivedData,
  user,
  catalogue,
  taxGroup,
  setDataset,
  addError,
  isSourceInCatalogueView,
}) => {
  const [data, setData] = useState(null);
  const [patch, setPatch] = useState(null);
  const [sourceMeta, setSourceMeta] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editPatchMode, setEditPatchMode] = useState(false);
  const [confirmPrivatePopupVisible, setConfirmPrivatePopupVisible] = useState(false);
  const [privateChangeLoading, setPrivateChangeLoading] = useState(false);
  const [contributesTo, setContributesTo] = useState(null);
  const [releasedFrom, setReleasedFrom] = useState(null);
  const [showAllCreators, setShowAllCreators] = useState(false);
  const [showAllContributors, setShowAllContributors] = useState(false);
  const [showBreakdownTreemap, setShowBreakdownTreemap] = useState(false);

  const getReleasedFrom = (key) => {
    axios(`${config.dataApi}dataset/${key}`)
      .then((res) => setReleasedFrom(res.data))
      .catch((err) => {
        addError(err);
        setReleasedFrom(null);
      });
  };

  const getData = () => {
    axios(`${config.dataApi}dataset/${id}`)
      .then((res) => {
        return axios(
          `${config.dataApi}dataset?limit=1000&hasSourceDataset=${id}&origin=PROJECT`
        ).then((projects) => {
          if (_.get(projects, "data.result")) {
            setContributesTo(_.get(projects, "data.result"));
          }
          return res;
        });
      })
      .then((res) => {
        const { createdBy, modifiedBy } = res.data;
        if (!isSourceInCatalogueView) {
          setDataset(res.data);
        }
        if (res.data.sourceKey) {
          getReleasedFrom(res.data.sourceKey);
        }

        return Promise.all([
          res.data,
          axios(`${config.dataApi}user/${createdBy}`),
          axios(`${config.dataApi}user/${modifiedBy}`),
        ]);
      })
      .then((res) => {
        res[0].createdByUser = _.get(res[1], "data.username");
        res[0].modifiedByUser = _.get(res[2], "data.username");
        setData(res[0]);
      })
      .catch(() => {
        setData({});
      });
  };

  const getPatch = () => {
    axios(`${config.dataApi}dataset/${projectKey}/patch/${id}`)
      .then((res) => setPatch(res.data))
      .catch(() => setPatch(null));
  };

  const getSourceMeta = () => {
    axios(`${config.dataApi}dataset/${projectKey}/source/${id}`)
      .then((res) => setSourceMeta(res.data))
      .catch((err) => {
        addError(err);
        setSourceMeta(null);
      });
  };

  const fetchAllData = () => {
    if (archivedData) return;
    getData();
    if (projectKey) {
      getSourceMeta();
      getPatch();
    }
  };

  useEffect(() => {
    if (archivedData) {
      setData(archivedData);
    } else {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setPrivate = () => {
    const toggledPrivate = !data.private;
    setPrivateChangeLoading(true);
    axios
      .put(`${config.dataApi}dataset/${data.key}`, {
        ...data,
        private: toggledPrivate,
      })
      .then(() => {
        notification.open({
          message: "Updated",
          description: `The dataset is now ${
            toggledPrivate ? "private" : "public"
          }`,
        });
        setConfirmPrivatePopupVisible(false);
        setPrivateChangeLoading(false);
        getData();
      })
      .catch((err) => {
        setConfirmPrivatePopupVisible(false);
        setPrivateChangeLoading(false);
        addError(err);
      });
  };

  const getAgentSpan = (agents) => {
    return agents.length === 1 ? 24 : agents.length === 2 ? 12 : 8;
  };

  const patchMode = !!projectKey;
  const isArchived = !!archivedData;
  // If we are in a project, show the patched data. Otherwise the original data
  const displayData = patchMode ? sourceMeta : data;
  const modifyMetadata = data && !data.deleted && data?.origin != "release";

  return (
    <PageContent>
      {Auth.canEditDataset(displayData, user) && !patchMode && !isArchived && (
        <>
          <Row>
            <Col flex="auto">
              {modifyMetadata && (
                <LogoUpload datasetKey={id} />
              )}
            </Col>
          </Row>
          <Row>
            <Col>
              {data && !data.deleted && data?.origin === "external" && (
                <ArchiveUpload
                  datasetKey={_.get(data, "key")}
                  origin={_.get(data, "origin")}
                />
              )}
            </Col>
            <Col flex="auto">
              {modifyMetadata && (
                <MetaDataUpload
                  style={{ marginLeft: "10px" }}
                  datasetKey={id}
                  onSuccess={getData}
                />
              )}
            </Col>
            <Col>
              {
                /* !projectKey &&  */ data && !data.deleted && (
                  <Popconfirm
                    title={`Make dataset ${
                      data.private ? "public" : "private"
                    }`}
                    open={confirmPrivatePopupVisible}
                    onConfirm={setPrivate}
                    okButtonProps={{ loading: privateChangeLoading }}
                    onCancel={() => setConfirmPrivatePopupVisible(false)}
                  >
                    <Switch
                      style={{ marginRight: "8px" }}
                      checked={data.private}
                      onChange={() => setConfirmPrivatePopupVisible(true)}
                      checkedChildren="Private"
                      unCheckedChildren="Private"
                    />
                  </Popconfirm>
                )
              }
              {data && !data.deleted && (
                /* data.createdBy !== config.gbifSyncUser && */ <Switch
                  checked={editMode}
                  onChange={setEditMode}
                  checkedChildren="Cancel"
                  unCheckedChildren="Edit"
                />
              )}
            </Col>
          </Row>

          {editMode && (
            <MetaDataForm
              data={data}
              onSaveSuccess={() => {
                setEditMode(false);
                getData();
              }}
            />
          )}
        </>
      )}
      {/* The user is allowed to patch if edtor of a project, */}
      {Auth.canEditDataset(catalogue, user) && !isArchived && (
        <>
          <Row>
            <Col flex="auto"></Col>
            <Col>
              {data && !data.deleted && patchMode && (
                <Switch
                  checked={editPatchMode}
                  onChange={setEditPatchMode}
                  checkedChildren="Cancel"
                  unCheckedChildren="Patch"
                />
              )}
            </Col>
          </Row>
          {/* The patch form will show the unpatched raw data as a copy with option to transfer to patch*/}
          {editPatchMode && patchMode && data && (
            <MetaDataForm
              data={patch || {}}
              projectKey={projectKey}
              originalData={data}
              onSaveSuccess={() => {
                setEditPatchMode(false);
                getPatch();
              }}
            />
          )}
        </>
      )}
      {displayData && (
        <div style={{ textAlign: "right" }}>
          <Yaml datasetKey={displayData.key} />
          <Eml datasetKey={displayData.key} />
          <BibTex datasetKey={displayData.key} />
        </div>
      )}
      {!editMode && !editPatchMode && displayData && (
        <>
          <PresentationItem label="Alias">
            {catalogue ? (
              <NavLink
                to={{
                  pathname: `/dataset/${displayData.key}/metadata`,
                }}
              >
                {displayData.alias}
              </NavLink>
            ) : (
              displayData.alias
            )}
          </PresentationItem>

          <PresentationItem label="Title">
            {displayData.title}
          </PresentationItem>

          <PresentationItem label="DOI">
            {displayData.doi ? <DoiPresentation doi={displayData.doi} /> : ""}
          </PresentationItem>

          {displayData.versionDoi ? (
            <PresentationItem label="Version DOI">
              <DoiPresentation doi={displayData.versionDoi} />
            </PresentationItem>
          ) : ("")}

          <PresentationItem label="Description">
            {displayData.description ? (
              <span
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked(displayData.description)),
                }}
              ></span>
            ) : (
              displayData.description
            )}
          </PresentationItem>

          <PresentationItem
            label={`${displayData.version ? "Version" : ""}${
              displayData.version && displayData.issued ? " / " : ""
            }${displayData.issued ? "Issued" : ""}`}
          >
            {(displayData.version || displayData.issued) &&
              `${displayData.version ? displayData.version : ""}${
                displayData.issued ? " / " + displayData.issued : ""
              }`}
          </PresentationItem>

          <PresentationItem label="Contact">
            {displayData.contact && (
              <AgentPresentation
                hideEmail={!Auth.canEditDataset(displayData, user)}
                agent={displayData.contact}
              />
            )}
          </PresentationItem>
          <PresentationItem label="Publisher">
            {displayData.publisher && (
              <AgentPresentation
                hideEmail={!Auth.canEditDataset(displayData, user)}
                agent={displayData.publisher}
              />
            )}
          </PresentationItem>
          <PresentationItem label="Creator">
            {displayData.creator && _.isArray(displayData.creator) && (
              <>
                <Row gutter={[8, 8]}>
                  {(showAllCreators
                    ? displayData.creator
                    : displayData.creator.slice(0, 6)
                  ).map((a, i) => (
                    <Col key={i} span={getAgentSpan(displayData.creator)}>
                      <Card style={{ height: "100%", background: "#f5f7fa" }}>
                        <AgentPresentation
                          hideEmail={!Auth.canEditDataset(displayData, user)}
                          agent={a}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
                {_.isArray(displayData.creator) &&
                  displayData.creator.length > 6 && (
                    <Button
                      type="link"
                      onClick={() => setShowAllCreators(!showAllCreators)}
                    >
                      {showAllCreators
                        ? "Collapse creators"
                        : "Show all creators"}
                    </Button>
                  )}
              </>
            )}
          </PresentationItem>
          <PresentationItem label="Editor">
            {displayData.editor && _.isArray(displayData.editor) && (
              <Row gutter={[8, 8]}>
                {displayData.editor.map((a, i) => (
                  <Col key={i} span={getAgentSpan(displayData.editor)}>
                    <Card>
                      <AgentPresentation
                        hideEmail={!Auth.canEditDataset(displayData, user)}
                        agent={a}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </PresentationItem>
          <PresentationItem label="Contributor">
            {displayData.contributor &&
              _.isArray(displayData.contributor) && (
                <>
                  <Row gutter={[8, 8]}>
                    {(showAllContributors
                      ? displayData.contributor
                      : displayData.contributor.slice(0, 6)
                    ).map((a, i) => (
                      <Col key={i} span={getAgentSpan(displayData.contributor)}>
                        <Card styles={{ body: { background: "#f5f7fa" } }}>
                          <AgentPresentation
                            hideEmail={
                              !Auth.canEditDataset(displayData, user)
                            }
                            agent={a}
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  {_.isArray(displayData.contributor) &&
                    displayData.contributor.length > 6 && (
                      <Button
                        type="link"
                        onClick={() => setShowAllContributors(!showAllContributors)}
                      >
                        {showAllContributors
                          ? "Collapse contributors"
                          : "Show all contributors"}
                      </Button>
                    )}
                </>
              )}
          </PresentationItem>
          <PresentationItem label="Taxonomic scope">
            <span style={{ display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
              {displayData.taxonomicScope}
              {filterRedundantGroups(displayData.taxonomicGroupScope, taxGroup).map((g) => (
                <span
                  key={g}
                  title="Click to view taxonomic breakdown"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowBreakdownTreemap(!showBreakdownTreemap)}
                >
                  <TaxGroupIcon group={g} size={20} />
                </span>
              ))}
            </span>
            {showBreakdownTreemap && (
              <TaxBreakdownChart
                datasetKey={displayData.key}
                onClose={() => setShowBreakdownTreemap(false)}
              />
            )}
          </PresentationItem>
          <PresentationItem label="Geographic scope">
            {displayData.geographicScope}
          </PresentationItem>
          <PresentationItem label="Temporal scope">
            {displayData.temporalScope}
          </PresentationItem>

          <PresentationItem label="Keywords">
            {displayData.keyword &&
              _.isArray(displayData.keyword) &&
              displayData.keyword.join(", ")}
          </PresentationItem>

          <PresentationItem label="Origin">
            {displayData.origin}
          </PresentationItem>
          <PresentationItem label="Type">{displayData.type}</PresentationItem>
          <PresentationItem label="License">
            {displayData.license}
          </PresentationItem>
          <PresentationItem label="Checklist Confidence">
            {<Rate value={displayData.confidence} disabled></Rate>}
          </PresentationItem>
          <PresentationItem label="Completeness">
            {displayData.completeness}
          </PresentationItem>
          <PresentationItem label="Website">
            {displayData.url && (
              <a href={displayData.url} target="_blank">
                {displayData.url}
              </a>
            )}
          </PresentationItem>
          <PresentationItem label="Data Conversion">
            {displayData?.conversion?.url && (
              <a href={displayData?.conversion?.url} target="_blank">
                {displayData?.conversion?.url}
              </a>
            )}
            {displayData?.conversion?.url &&
              displayData?.conversion?.description && <br />}
            {displayData?.conversion?.description}
          </PresentationItem>
          <PresentationItem label="ISSN">
            {displayData.issn && (
              <a
                href={`https://portal.issn.org/resource/ISSN/${displayData.issn}`}
              >
                {displayData.issn}
              </a>
            )}
          </PresentationItem>
          {Auth.isAuthorised(user, ["admin"]) && (
            <PresentationItem label="GBIF key">
              {displayData.gbifKey && (
                <a
                  href={`https://www.gbif.org/dataset/${displayData.gbifKey}`}
                >
                  {displayData.gbifKey}
                </a>
              )}
            </PresentationItem>
          )}
          {Auth.isAuthorised(user, ["admin"]) && (
            <PresentationItem label="GBIF publisher key">
              {displayData.gbifPublisherKey && (
                <NavLink
                  to={{
                    pathname: `/dataset`,
                    search: `?gbifPublisherKey=${displayData.gbifPublisherKey}`,
                  }}
                >
                  {displayData.gbifPublisherKey}
                </NavLink>
              )}
            </PresentationItem>
          )}
          <PresentationItem label="Identifiers">
            {displayData.identifier && (
              <ol
                style={{
                  listStyle: "none",
                  paddingInlineStart: "0px",
                }}
              >
              {_.isArray(displayData.identifier) && displayData.identifier.map((id) => (
                  <li key={id}>
                    {IDENTIFIER_TYPES[id.split(":", 1)[0]] ? (
                      <a
                        href={`${IDENTIFIER_TYPES[id.split(":", 1)[0]]}${id.split(":", 2)[1]}`}
                        target="_blank"
                      >
                        {id}
                      </a>
                    ) : (
                      id
                    )}
                  </li>
              ))}
              </ol>
            )}
          </PresentationItem>

          <PresentationItem label="Citation">
            {displayData.citation && (
              <span
                dangerouslySetInnerHTML={{
                  __html: linkify(displayData?.citation || ""),
                }}
              ></span>
            )}
          </PresentationItem>
          <PresentationItem label="Released from">
            {
              <span>
                <NavLink
                  to={{
                    pathname: Auth.canViewDataset(catalogue, user)
                      ? `/project/${displayData.sourceKey}/metadata`
                      : `/dataset/${displayData.sourceKey}`,
                  }}
                >
                  {releasedFrom ? releasedFrom.title : displayData.sourceKey}
                </NavLink>
                {displayData.sourceKey && (
                  <span>
                    {" "}
                    - (
                    <a
                      href={`${config.downloadApi}releases/${displayData.sourceKey}/${displayData.attempt}`}
                      target="_blank"
                    >
                      logs
                    </a>
                    )
                  </span>
                )}
              </span>
            }
          </PresentationItem>
          <PresentationItem label="Source">
            {displayData.source &&
              _.isArray(displayData.source) &&
              displayData.source.map(
                (s) =>
                  !!s &&
                  (s.citation ? (
                    <div
                      style={{ display: "inline-block" }}
                      dangerouslySetInnerHTML={{
                        __html: linkify(s?.citation || ""),
                      }}
                    ></div>
                  ) : (
                    s.title
                  ))
              )}
          </PresentationItem>
          <PresentationItem label="Notes">
            {displayData.notes}
          </PresentationItem>
          <PresentationItem label="Last successful import attempt">
            {displayData.attempt}
          </PresentationItem>
          <PresentationItem label="Created">
            {`${moment(displayData.created).format(
              "MMMM Do YYYY, h:mm:ss a"
            )}${
              displayData.createdByUser
                ? " by " + displayData.createdByUser
                : ""
            }`}
          </PresentationItem>
          <PresentationItem label="Modified">
            {`${moment(displayData.modified).format(
              "MMMM Do YYYY, h:mm:ss a"
            )} by ${displayData.modifiedByUser}`}
          </PresentationItem>
          {contributesTo && (
            <>
              <Divider titlePlacement="left">Contributes to</Divider>
              {contributesTo
                .map((c) => (
                  <NavLink
                    key={c.key}
                    to={{
                      pathname: `/dataset/${c.key}/source/${displayData.key}`,
                    }}
                    end
                  >
                    {c.title}
                  </NavLink>
                ))
                .reduce((prev, curr) => [prev, " | ", curr])}
            </>
          )}
        </>
      )}
    </PageContent>
  );
};

const mapContextToProps = ({
  user,
  datasetOrigin: datasetoriginEnum,
  setDataset,
  datasetSettings,
  addError,
  catalogue,
  taxGroup,
}) => ({
  user,
  datasetoriginEnum,
  setDataset,
  datasetSettings,
  addError,
  catalogue,
  taxGroup,
});

export default withContext(mapContextToProps)(DatasetMeta);
