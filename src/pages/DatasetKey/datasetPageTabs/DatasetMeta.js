import React from "react";
import config from "../../../config";
import _ from "lodash";
import axios from "axios";
import { Switch, Rate, Row, Col, notification, Popconfirm } from "antd";
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
import ImportButton from "../../Imports/importTabs/ImportButton";
import AgentPresentation from "../../../components/MetaData/AgentPresentation";
import CitationPresentation from "../../../components/MetaData/CitationPresentation";
import marked from "marked";
import DOMPurify from "dompurify";

const IDENTIFIER_TYPES = {
  col: "https://data.catalogueoflife.org/dataset/",
  gbif: "https://www.gbif.org/dataset/",
  plazi: "http://publication.plazi.org/id/",
  doi: "https://doi.org/",
};

const readOnlyAgent = (agent) =>
  [agent.name, agent.address].filter((a) => !!a).join(", ");

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
  getData = () => {
    const { id, setDataset } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${id}`)
      .then((res) => {
        return axios(
          `${config.dataApi}dataset?limit=1000&hasSourceDataset=${id}&origin=MANAGED`
        ).then((projects) => {
          if (_.get(projects, "data.result")) {
            res.data.contributesTo = projects.data.result.map((r) => r.key);
          }
          return res;
        });
      })
      .then((res) => {
        const { createdBy, modifiedBy } = res.data;
        setDataset(res.data);
        if (!res.data.contributesTo) {
          res.data.contributesTo = [];
        }
        return Promise.all([
          res.data,
          axios(`${config.dataApi}user/${createdBy}`),
          axios(`${config.dataApi}user/${modifiedBy}`),
          Promise.allSettled(
            res.data.contributesTo.map((c) =>
              axios(`${config.dataApi}dataset/${c}`)
            )
          ),
        ]);
      })
      .then((res) => {
        res[0].createdByUser = _.get(res[1], "data.username");
        res[0].modifiedByUser = _.get(res[2], "data.username");
        res[0].contributesToDatasets = res[0].contributesTo.map((d, i) =>
          res[3][i].status === "fulfilled"
            ? _.get(res[3][i], "value.data.title")
            : d
        );
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
  render() {
    const {
      data,
      editMode,
      editPatchMode,
      patch,
      sourceMeta,
      confirmPrivatePopupVisible,
      privateChangeLoading,
    } = this.state;
    const { user, catalogueKey } = this.props;
    const patchMode = !!catalogueKey;
    // If we are in a project, show the patched data. Otherwise the original data
    const displayData = patchMode ? sourceMeta : data;
    return (
      <PageContent>
        {Auth.isAuthorised(user, ["editor", "admin"]) && (
          <React.Fragment>
            <Row>
              <Col flex="auto">
                {data && !data.deleted && (
                  <LogoUpload datasetKey={this.props.id} />
                )}
              </Col>

              <Col style={{ textAlign: "right" }}>
                {data && !data.deleted && (
                  <DeleteDatasetButton
                    style={{ marginBottom: "10px" }}
                    record={data}
                  ></DeleteDatasetButton>
                )}
                {data && _.get(data, "origin") !== "managed" && (
                  <ImportButton
                    style={{ marginLeft: "8px", marginBottom: "10px" }}
                    record={{ datasetKey: data.key }}
                  />
                )}
                {/*                 {data && !data.deleted && (
                  <DatasetExport datasetKey={data.key} />
                )} */}
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
                {!catalogueKey && data && !data.deleted && (
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
                )}
                {data && !data.deleted && !patchMode && (
                  <Switch
                    checked={editMode}
                    onChange={this.setEditMode}
                    checkedChildren="Cancel"
                    unCheckedChildren="Edit"
                  />
                )}
                {data && !data.deleted && patchMode && (
                  <Switch
                    checked={editPatchMode}
                    onChange={this.setEditPatchMode}
                    checkedChildren="Cancel"
                    unCheckedChildren="Patch"
                  />
                )}
              </Col>
            </Row>{" "}
          </React.Fragment>
        )}
        {editMode && !patchMode && (
          <MetaDataForm
            data={data}
            onSaveSuccess={() => {
              this.setEditMode(false);
              this.getData();
            }}
          />
        )}
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
        {!editMode && !editPatchMode && displayData && (
          <React.Fragment>
            <PresentationItem label="Alias">
              {displayData.alias}
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

            <PresentationItem label="Version">
              {(displayData.version || displayData.issued) &&
                `${displayData.version ? displayData.version : ""}${
                  displayData.issued ? displayData.issued : ""
                }`}
            </PresentationItem>
            <PresentationItem label="Contact">
              {Auth.isAuthorised(user, ["editor", "admin"]) &&
                displayData.contact && (
                  <AgentPresentation agent={displayData.contact} />
                )}
              {!Auth.isAuthorised(user, ["editor", "admin"]) &&
                displayData.contact &&
                readOnlyAgent(displayData.contact)}
            </PresentationItem>
            <PresentationItem label="Publisher">
              {Auth.isAuthorised(user, ["editor", "admin"]) &&
                displayData.contact && (
                  <AgentPresentation agent={displayData.publisher} />
                )}
              {!Auth.isAuthorised(user, ["editor", "admin"]) &&
                displayData.publisher &&
                readOnlyAgent(displayData.publisher)}
            </PresentationItem>
            <PresentationItem label="Creator">
              {displayData.creator && _.isArray(displayData.creator) && (
                <Row gutter={[8, 8]}>
                  {Auth.isAuthorised(user, ["editor", "admin"]) &&
                    displayData.creator.map((a) => (
                      <Col>
                        <AgentPresentation agent={a} />
                      </Col>
                    ))}
                  {!Auth.isAuthorised(user, ["editor", "admin"]) &&
                    displayData.creator.map(readOnlyAgent).join(" | ")}
                </Row>
              )}
            </PresentationItem>
            <PresentationItem label="Editor">
              {displayData.editor && _.isArray(displayData.editor) && (
                <Row gutter={[8, 8]}>
                  {Auth.isAuthorised(user, ["editor", "admin"]) &&
                    displayData.editor.map((a) => (
                      <Col>
                        <AgentPresentation agent={a} />
                      </Col>
                    ))}
                  {!Auth.isAuthorised(user, ["editor", "admin"]) &&
                    displayData.editor.map(readOnlyAgent).join(" | ")}
                </Row>
              )}
            </PresentationItem>
            <PresentationItem label="Contributor">
              {displayData.contributor && _.isArray(displayData.contributor) && (
                <Row gutter={[8, 8]}>
                  {Auth.isAuthorised(user, ["editor", "admin"]) &&
                    displayData.contributor.map((a) => (
                      <Col>
                        <AgentPresentation agent={a} />
                      </Col>
                    ))}
                  {!Auth.isAuthorised(user, ["editor", "admin"]) &&
                    displayData.contributor.map(readOnlyAgent).join(" | ")}
                </Row>
              )}
            </PresentationItem>
            <PresentationItem label="Url (website)">
              {displayData.url && (
                <a href={displayData.url} target="_blank">
                  {displayData.url}
                </a>
              )}
            </PresentationItem>
            <PresentationItem label="Origin">
              {displayData.origin}
            </PresentationItem>
            <PresentationItem label="Type">{displayData.type}</PresentationItem>
            <PresentationItem label="Taxonomic scope">
              {displayData.taxonomicScope}
            </PresentationItem>
            <PresentationItem label="Temporal scope">
              {displayData.temporalScope}
            </PresentationItem>
            <PresentationItem label="Geographic scope">
              {displayData.geographicScope}
            </PresentationItem>
            <PresentationItem label="DOI">{displayData.doi}</PresentationItem>
            <PresentationItem label="ISSN">{displayData.issn}</PresentationItem>
            <PresentationItem label="Source">
              {displayData.source && (
                <CitationPresentation csl={displayData.source} />
              )}
            </PresentationItem>
            <PresentationItem label="License">
              {displayData.license}
            </PresentationItem>
            <PresentationItem label="Checklist Confidence">
              {<Rate value={displayData.confidence} disabled></Rate>}
            </PresentationItem>
            <PresentationItem label="Completeness">
              {displayData.completeness}
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
            <PresentationItem label="Download">
              {
                <a
                  href={`${config.dataApi}dataset/${displayData.key}/export`}
                  target="_blank"
                >
                  original archive
                </a>
              }
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
}) => ({ user, datasetoriginEnum, setDataset, datasetSettings, addError });

export default withContext(mapContextToProps)(DatasetMeta);
