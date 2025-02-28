import React from "react";
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
import DeleteDatasetButton from "./DeleteDatasetButton";
import withContext from "../../../components/hoc/withContext";
import Auth from "../../../components/Auth";
import moment from "moment";
import AgentPresentation from "../../../components/MetaData/AgentPresentation";
import DoiPresentation from "../../../components/MetaData/DoiPresentation";
import BibTex from "../../../components/MetaData/BibTex";
import Eml from "../../../components/MetaData/Eml";
import Yaml from "../../../components/MetaData/Yaml";

import marked from "marked";
import DOMPurify from "dompurify";
import linkify from "linkify-html";

export const IDENTIFIER_TYPES = {
  col: "https://www.checklistbank.org/dataset/",
  gbif: "https://www.gbif.org/dataset/",
  plazi: "http://publication.plazi.org/id/",
  doi: "https://doi.org/",
};

class DatasetMeta extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      patch: null,
      editMode: false,
      editPatchMode: false,
      patchError: null,
      sourceError: null,
      confirmPrivatePopupVisible: false,
      privateChangeLoading: false,
      contributesTo: null,
      releasedFrom: null,
      showAllCreators: false,
      showAllContributors: false,
    };
  }

  componentDidMount() {
    this.fetchAllData();
  }

  componentDidUpdate = (prevProps) => {
    if (_.get(this.props, "id") !== _.get(prevProps, "id")) {
      this.fetchAllData();
    }
  };

  fetchAllData = () => {
    const { catalogueKey } = this.props;

    this.getData();

    if (catalogueKey) {
      this.getSourceMeta();
      this.getPatch();
    }
  };

  getPatch = () => {
    const { id, catalogueKey, addError } = this.props;

    axios(`${config.dataApi}dataset/${catalogueKey}/patch/${id}`)
      .then((res) => this.setState({ patch: res.data, patchError: null }))
      .catch((err) => {
        this.setState({ patchError: err, patch: null });
      });
  };
  getSourceMeta = () => {
    const { id, catalogueKey, addError } = this.props;

    axios(`${config.dataApi}dataset/${catalogueKey}/source/${id}`)
      .then((res) => this.setState({ sourceMeta: res.data, sourceError: null }))
      .catch((err) => {
        addError(err);
        this.setState({ sourceError: err, sourceMeta: null });
      });
  };

  getReleasedFrom = (key) => {
    const { addError } = this.props;

    axios(`${config.dataApi}dataset/${key}`)
      .then((res) => this.setState({ releasedFrom: res.data }))
      .catch((err) => {
        addError(err);
        this.setState({ releasedFrom: null });
      });
  };

  getData = () => {
    const { id, isSourceInCatalogueView, setDataset, user } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${id}`)
      .then((res) => {
        return axios(
          `${config.dataApi}dataset?limit=1000&hasSourceDataset=${id}&origin=PROJECT`
        ).then((projects) => {
          if (_.get(projects, "data.result")) {
            //res.data.contributesTo = projects.data.result.map((r) => r.key);
            this.setState({ contributesTo: _.get(projects, "data.result") });
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
          this.getReleasedFrom(res.data.sourceKey);
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

        this.setState({ loading: false, data: res[0], err: null });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: {} });
      });
  };

  setEditMode = (checked) => {
    this.setState({ editMode: checked });
  };

  setEditPatchMode = (checked) => {
    this.setState({ editPatchMode: checked });
  };

  setPrivate = () => {
    const { data } = this.state;
    const { addError } = this.props;
    const toggledPrivate = !data.private;
    this.setState({ privateChangeLoading: true });
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
        this.setState(
          {
            confirmPrivatePopupVisible: false,
            privateChangeLoading: false,
          },
          this.getData
        );
      })
      .catch((err) => {
        this.setState({
          confirmPrivatePopupVisible: false,
          privateChangeLoading: false,
        });
        addError(err);
      });
  };

  getAgentSpan = (agents) => {
    return agents.length === 1 ? 24 : agents.length === 2 ? 12 : 8;
  };

  render() {
    const {
      data,
      editMode,
      editPatchMode,
      patch,
      sourceMeta,
      confirmPrivatePopupVisible,
      privateChangeLoading,
      contributesTo,
      releasedFrom,
    } = this.state;
    const { user, catalogueKey, catalogue } = this.props;
    const patchMode = !!catalogueKey;
    // If we are in a project, show the patched data. Otherwise the original data
    const displayData = patchMode ? sourceMeta : data;
    return (
      <PageContent>
        {Auth.canEditDataset(displayData, user) && !patchMode && (
          <React.Fragment>
            <Row>
              <Col flex="auto">
                {data && !data.deleted && (
                  <LogoUpload datasetKey={this.props.id} />
                )}
              </Col>
            </Row>
            <Row>
              <Col>
                {data && (
                  <ArchiveUpload
                    datasetKey={_.get(this.state, "data.key")}
                    origin={_.get(this.state, "data.origin")}
                  />
                )}
              </Col>
              <Col flex="auto">
                {data && !data.deleted && (
                  <MetaDataUpload
                    style={{ marginLeft: "10px" }}
                    datasetKey={this.props.id}
                    onSuccess={this.getData}
                  />
                )}
              </Col>
              <Col>
                {
                  /* !catalogueKey &&  */ data && !data.deleted && (
                    <Popconfirm
                      title={`Make dataset ${
                        data.private ? "public" : "private"
                      }`}
                      visible={confirmPrivatePopupVisible}
                      onConfirm={this.setPrivate}
                      okButtonProps={{ loading: privateChangeLoading }}
                      onCancel={() =>
                        this.setState({ confirmPrivatePopupVisible: false })
                      }
                    >
                      <Switch
                        style={{ marginRight: "8px" }}
                        checked={data.private}
                        onChange={() =>
                          this.setState({ confirmPrivatePopupVisible: true })
                        }
                        checkedChildren="Private"
                        unCheckedChildren="Private"
                      />
                    </Popconfirm>
                  )
                }
                {data && !data.deleted && (
                  /* data.createdBy !== config.gbifSyncUser && */ <Switch
                    checked={editMode}
                    onChange={this.setEditMode}
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
                  this.setEditMode(false);
                  this.getData();
                }}
              />
            )}
          </React.Fragment>
        )}
        {/* The user is allowed to patch if edtor of a project, */}
        {Auth.canEditDataset(catalogue, user) && (
          <React.Fragment>
            <Row>
              <Col flex="auto"></Col>
              <Col>
                {data && !data.deleted && patchMode && (
                  <Switch
                    checked={editPatchMode}
                    onChange={this.setEditPatchMode}
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
                catalogueKey={catalogueKey}
                originalData={data}
                onSaveSuccess={() => {
                  this.setEditPatchMode(false);
                  this.getPatch();
                }}
              />
            )}
          </React.Fragment>
        )}
        {displayData && (
          <div style={{ textAlign: "right" }}>
            <Yaml datasetKey={displayData.key} />
            <Eml datasetKey={displayData.key} />
            <BibTex datasetKey={displayData.key} />
          </div>
        )}
        {!editMode && !editPatchMode && displayData && (
          <React.Fragment>
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
            <PresentationItem label="DOI">
              {displayData.doi ? <DoiPresentation doi={displayData.doi} /> : ""}
            </PresentationItem>

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
                    {(this.state.showAllCreators
                      ? displayData.creator
                      : displayData.creator.slice(0, 6)
                    ).map((a) => (
                      <Col span={this.getAgentSpan(displayData.creator)}>
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
                        onClick={() =>
                          this.setState({
                            showAllCreators: !this.state.showAllCreators,
                          })
                        }
                      >
                        {this.state.showAllCreators
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
                  {displayData.editor.map((a) => (
                    <Col span={this.getAgentSpan(displayData.editor)}>
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
                      {(this.state.showAllContributors
                        ? displayData.contributor
                        : displayData.contributor.slice(0, 6)
                      ).map((a) => (
                        <Col span={this.getAgentSpan(displayData.contributor)}>
                          <Card bodyStyle={{ background: "#f5f7fa" }}>
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
                          onClick={() =>
                            this.setState({
                              showAllContributors:
                                !this.state.showAllContributors,
                            })
                          }
                        >
                          {this.state.showAllContributors
                            ? "Collapse contributors"
                            : "Show all contributors"}
                        </Button>
                      )}
                  </>
                )}
            </PresentationItem>
            <PresentationItem label="Taxonomic scope">
              {displayData.taxonomicScope}
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
            <PresentationItem label="Logo Url">
              {displayData.url && (
                <a href={displayData.logoUrl} target="_blank">
                  {displayData.logoUrl}
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
                  {Object.keys(displayData.identifier).map((i) => (
                    <li
                      style={{
                        float: "left",
                        marginRight: "8px",
                      }}
                    >
                      {`${i.toUpperCase()}: `}
                      {IDENTIFIER_TYPES[i] ? (
                        <a
                          href={`${IDENTIFIER_TYPES[i]}${displayData.identifier[i]}`}
                          target="_blank"
                        >
                          {displayData.identifier[i]}
                        </a>
                      ) : (
                        displayData.identifier[i]
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
                        ? `/catalogue/${displayData.sourceKey}/metadata`
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
            {/*             <PresentationItem
              label={
                <FormattedMessage
                  id="contributesTo"
                  defaultMessage="Contributes To"
                />
              }
            >
              {displayData.contributesToDatasets}
            </PresentationItem> */}

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
              <React.Fragment>
                <Divider orientation="left">Contributes to</Divider>
                {contributesTo
                  .map((c) => (
                    <NavLink
                      to={{
                        pathname: `/dataset/${c.key}/source/${displayData.key}`,
                      }}
                      exact={true}
                    >
                      {c.title}
                    </NavLink>
                  ))
                  .reduce((prev, curr) => [prev, " | ", curr])}
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </PageContent>
    );
  }
}

const mapContextToProps = ({
  user,
  datasetOrigin: datasetoriginEnum,
  setDataset,
  datasetSettings,
  addError,
  catalogue,
}) => ({
  user,
  datasetoriginEnum,
  setDataset,
  datasetSettings,
  addError,
  catalogue,
});

export default withContext(mapContextToProps)(DatasetMeta);
