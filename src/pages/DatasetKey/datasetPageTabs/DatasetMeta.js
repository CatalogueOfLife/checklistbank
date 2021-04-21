import React from "react";
import config from "../../../config";
import _ from "lodash";
import axios from "axios";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { Switch, Rate, Row, Col, notification, Popconfirm } from "antd";
import MetaDataForm from "../../../components/MetaDataForm";
import LogoUpload from "../../../components/LogoUpload";
import ArchiveUpload from "../../../components/ArchiveUpload";
import MetaDataUpload from "../../../components/MetaDataUpload";
import PageContent from "../../../components/PageContent";
import { FormattedMessage } from "react-intl";
import PresentationItem from "../../../components/PresentationItem";
import DeleteDatasetButton from "./DeleteDatasetButton";
import DatasetExport from "../DatasetExport";
import withContext from "../../../components/hoc/withContext";
import Auth from "../../../components/Auth";
import moment from "moment";
import ImportButton from "../../Imports/importTabs/ImportButton";
import PersonPresentation from "../../../components/PersonPresentation";
import marked from "marked";
import DOMPurify from "dompurify";

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
    const { id, catalogueKey } = this.props;

    axios(`${config.dataApi}dataset/${catalogueKey}/patch/${id}`)
      .then((res) => this.setState({ patch: res.data, patchError: null }))
      .catch((err) => this.setState({ patchError: err, patch: null }));
  };
  getSourceMeta = () => {
    const { id, catalogueKey } = this.props;

    axios(`${config.dataApi}dataset/${catalogueKey}/source/${id}`)
      .then((res) => this.setState({ sourceMeta: res.data, sourceError: null }))
      .catch((err) => this.setState({ sourceError: err, sourceMeta: null }));
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
                {data && !data.deleted && (
                  <DatasetExport datasetKey={data.key} />
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
                {data && !data.deleted && (
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
        {!Auth.isAuthorised(user, ["editor", "admin"]) &&
          data &&
          !data.deleted && (
            <Row>
              <Col flex></Col>
              <Col>
                <DatasetExport datasetKey={data.key} />
              </Col>
            </Row>
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
            <PresentationItem
              label={<FormattedMessage id="alias" defaultMessage="Alias" />}
            >
              {displayData.alias}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="organisations"
                  defaultMessage="Organisations"
                />
              }
            >
              {_.isArray(displayData.organisations)
                ? displayData.organisations.map((o) => o.label)
                : ""}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="description"
                  defaultMessage="Description"
                />
              }
            >
              {displayData.description && (
                <span
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked(displayData.description)),
                  }}
                ></span>
              )}
            </PresentationItem>
            {/* <PresentationItem label={<FormattedMessage id="released" defaultMessage="Released" />}>
            {data.released}
          </PresentationItem> */}
            <PresentationItem
              label={<FormattedMessage id="version" defaultMessage="Version" />}
            >
              {(displayData.version || displayData.released) &&
                `${displayData.version ? displayData.version : ""}${
                  displayData.released
                    ? " Received by COL: " + displayData.released
                    : ""
                }`}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="contact" defaultMessage="Contact" />}
            >
              {Auth.isAuthorised(user, ["editor", "admin"]) &&
                displayData.contact && (
                  <PersonPresentation person={displayData.contact} />
                )}
              {!Auth.isAuthorised(user, ["editor", "admin"]) &&
                displayData.contact &&
                displayData.contact.name}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="authors" defaultMessage="Authors" />}
            >
              {displayData.authors && _.isArray(displayData.authors) && (
                <Row gutter={[8, 8]}>
                  {Auth.isAuthorised(user, ["editor", "admin"]) &&
                    displayData.authors.map((a) => (
                      <Col>
                        <PersonPresentation person={a} />
                      </Col>
                    ))}
                  {!Auth.isAuthorised(user, ["editor", "admin"]) &&
                    displayData.authors.map((a) => a.name).join(", ")}
                </Row>
              )}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="editors" defaultMessage="Editors" />}
            >
              {displayData.editors && _.isArray(displayData.editors) && (
                <Row gutter={[8, 8]}>
                  {Auth.isAuthorised(user, ["editor", "admin"]) &&
                    displayData.editors.map((a) => (
                      <Col>
                        <PersonPresentation person={a} />
                      </Col>
                    ))}
                  {!Auth.isAuthorised(user, ["editor", "admin"]) &&
                    displayData.editors.map((a) => a.name).join(", ")}
                </Row>
              )}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="website" defaultMessage="Website" />}
            >
              {displayData.website && (
                <a href={displayData.website} target="_blank">
                  {displayData.website}
                </a>
              )}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="origin" defaultMessage="Origin" />}
            >
              {displayData.origin}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="type" defaultMessage="Type" />}
            >
              {displayData.type}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage id="group" defaultMessage="Taxonomic Group" />
              }
            >
              {displayData.group}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="geographicScope"
                  defaultMessage="Geographic scope"
                />
              }
            >
              {displayData.geographicScope}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage id="citation" defaultMessage="Citation" />
              }
            >
              {displayData.citation}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="license" defaultMessage="License" />}
            >
              {displayData.license}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="Checklist Confidence"
                  defaultMessage="Checklist Confidence"
                />
              }
            >
              {<Rate value={displayData.confidence} disabled></Rate>}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="completeness"
                  defaultMessage="Completeness"
                />
              }
            >
              {displayData.completeness}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="contributesTo"
                  defaultMessage="Contributes To"
                />
              }
            >
              {displayData.contributesToDatasets}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage id="gbifKey" defaultMessage="GBIF Key" />
              }
            >
              {displayData.gbifKey && (
                <a
                  href={`https://www.gbif.org/dataset/${displayData.gbifKey}`}
                  target="_blank"
                >
                  {displayData.gbifKey}
                </a>
              )}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="importFrequency"
                  defaultMessage="Automated Import Frequency"
                />
              }
            >
              {displayData.importFrequency}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage id="download" defaultMessage="Download" />
              }
            >
              {
                <a
                  href={`${config.dataApi}dataset/${displayData.key}/export`}
                  target="_blank"
                >
                  original archive
                </a>
              }
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="created" defaultMessage="Created" />}
            >
              {`${moment(displayData.created).format(
                "MMMM Do YYYY, h:mm:ss a"
              )} by ${displayData.createdByUser}`}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage id="modified" defaultMessage="Modified" />
              }
            >
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
