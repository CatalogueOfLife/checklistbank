import React from "react";
import PropTypes from "prop-types";
import config from "../../../config";
import _ from "lodash";
import axios from "axios";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { Switch, Rate, Row, Col, Space } from "antd";
import MetaDataForm from "../../../components/MetaDataForm";
import LogoUpload from "../../../components/LogoUpload";
import ArchiveUpload from "../../../components/ArchiveUpload";
import PageContent from "../../../components/PageContent";
import { FormattedMessage } from "react-intl";
import PresentationItem from "../../../components/PresentationItem";
import DeleteDatasetButton from "./DeleteDatasetButton";
import withContext from "../../../components/hoc/withContext";
import Auth from "../../../components/Auth";
import moment from "moment";
import ImportButton from "../../Imports/importTabs/ImportButton";
import PersonPresentation from "../../../components/PersonPresentation";

class DatasetMeta extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: null, editMode: false };
  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate = (prevProps) => {
    if (_.get(this.props, "id") !== _.get(prevProps, "id")) {
      this.getData();
    }
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

  render() {
    const { data, editMode } = this.state;
    const { user, datasetSettings } = this.props;
    const listData = _.map(data, function (value, key) {
      return { key, value };
    });
    return (
      <PageContent>
        {Auth.isAuthorised(user, ["editor", "admin"]) && (
          <React.Fragment>
            <Row>
              <Col span={4} style={{ minHeight: "210px" }}>
                {data && !data.deleted && (
                  <LogoUpload datasetKey={this.props.id} />
                )}
              </Col>
              <Col span={2} offset={18}>
                {data && !data.deleted && (
                  <DeleteDatasetButton record={data}></DeleteDatasetButton>
                )}
                {data && _.get(data, "origin") !== "managed" && (
                  <ImportButton
                    style={{ marginTop: "8px" }}
                    record={{ datasetKey: data.key }}
                  />
                )}
              </Col>
            </Row>
            <Row>
              <Col span={4}>
                {data && (
                  <ArchiveUpload
                    style={{ marginLeft: "12px", float: "right" }}
                    datasetKey={_.get(this.state, "data.key")}
                    origin={_.get(this.state, "data.origin")}
                  />
                )}
              </Col>

              <Col span={2} offset={18}>
                {data && !data.deleted && (
                  <Switch
                    checked={editMode}
                    onChange={this.setEditMode}
                    checkedChildren="Cancel"
                    unCheckedChildren="Edit"
                  />
                )}
              </Col>
            </Row>{" "}
          </React.Fragment>
        )}

        {editMode && (
          <MetaDataForm
            data={data}
            onSaveSuccess={() => {
              this.setEditMode(false);
              this.getData();
            }}
          />
        )}
        {!editMode && data && (
          <React.Fragment>
            <PresentationItem
              label={<FormattedMessage id="alias" defaultMessage="Alias" />}
            >
              {data.alias}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="organisations"
                  defaultMessage="Organisations"
                />
              }
            >
              {data.organisations}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="description"
                  defaultMessage="Description"
                />
              }
            >
              {data.description}
            </PresentationItem>
            {/* <PresentationItem label={<FormattedMessage id="released" defaultMessage="Released" />}>
            {data.released}
          </PresentationItem> */}
            <PresentationItem
              label={<FormattedMessage id="version" defaultMessage="Version" />}
            >
              {(data.version || data.released) &&
                `${data.version ? data.version : ""}${
                  data.released ? " Received by CoL: " + data.released : ""
                }`}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="contact" defaultMessage="Contact" />}
            >
              {data.contact && <PersonPresentation person={data.contact} />}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="authors" defaultMessage="Authors" />}
            >
              {data.authors && _.isArray(data.authors) && (
                <Row gutter={[8, 8]}>
                  {data.authors.map((a) => (
                    <Col>
                      <PersonPresentation person={a} />
                    </Col>
                  ))}
                </Row>
              )}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="editors" defaultMessage="Editors" />}
            >
              {data.editors && _.isArray(data.editors) && (
                <Row gutter={[8, 8]}>
                  {data.editors.map((a) => (
                    <Col>
                      <PersonPresentation person={a} />
                    </Col>
                  ))}
                </Row>
              )}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="website" defaultMessage="Website" />}
            >
              {data.website && (
                <a href={data.website} target="_blank">
                  {data.website}
                </a>
              )}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="origin" defaultMessage="Origin" />}
            >
              {data.origin === "external" && (
                <span
                  dangerouslySetInnerHTML={{
                    __html: `${data.dataFormat}: <a href='${data.dataAccess}' target='_blank'>${data.dataAccess}</a>`,
                  }}
                ></span>
              )}
              {data.origin !== "external" && data.origin}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="type" defaultMessage="Type" />}
            >
              {data.type}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage id="group" defaultMessage="Taxonomic Group" />
              }
            >
              {data.group}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="geographicScope"
                  defaultMessage="Geographic scope"
                />
              }
            >
              {data.geographicScope}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage id="citation" defaultMessage="Citation" />
              }
            >
              {data.citation}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="private" defaultMessage="Private" />}
            >
              {data.private === true ? (
                <LockOutlined style={{ color: "red" }} />
              ) : (
                <UnlockOutlined style={{ color: "green" }} />
              )}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="license" defaultMessage="License" />}
            >
              {data.license}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="Checklist Confidence"
                  defaultMessage="Checklist Confidence"
                />
              }
            >
              {<Rate value={data.confidence} disabled></Rate>}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="completeness"
                  defaultMessage="Completeness"
                />
              }
            >
              {data.completeness}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage
                  id="contributesTo"
                  defaultMessage="Contributes To"
                />
              }
            >
              {data.contributesToDatasets}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage id="gbifKey" defaultMessage="GBIF Key" />
              }
            >
              {data.gbifKey && (
                <a
                  href={`https://www.gbif.org/dataset/${data.gbifKey}`}
                  target="_blank"
                >
                  {data.gbifKey}
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
              {data.importFrequency}
            </PresentationItem>
            <PresentationItem
              label={<FormattedMessage id="created" defaultMessage="Created" />}
            >
              {`${moment(data.created).format("MMMM Do YYYY, h:mm:ss a")} by ${
                data.createdByUser
              }`}
            </PresentationItem>
            <PresentationItem
              label={
                <FormattedMessage id="modified" defaultMessage="Modified" />
              }
            >
              {`${moment(data.modified).format("MMMM Do YYYY, h:mm:ss a")} by ${
                data.modifiedByUser
              }`}
            </PresentationItem>
            {/*           <section className="code-box" style={{marginTop: '32px'}}>
          <div className="code-box-title">Settings</div>
        </section> */}
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
}) => ({ user, datasetoriginEnum, setDataset, datasetSettings });

export default withContext(mapContextToProps)(DatasetMeta);
