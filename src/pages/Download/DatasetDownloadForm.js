import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import history from "../../history";
import moment from "moment";
import _ from "lodash";
import {
  Button,
  Modal,
  Select,
  message,
  Alert,
  Radio,
  Row,
  Col,
  Divider,
  Checkbox,
} from "antd";
import axios from "axios";
import config from "../../config";
import PageContent from "../../components/PageContent";
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext";
import Exception403 from "../../components/exception/403";

import NameAutocomplete from "../catalogue/Assembly/NameAutocomplete";
import qs from "query-string";

const Option = Select.Option;

class DatasetDownload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      selectedDataFormat: "coldp",
      exportUrl: null,
      downloadModalVisible: false,
      rootTaxon: null,
      synonyms: true,
      excel: false,
    };
  }

  componentDidMount = () => {
    const { location } = this.props;
    const taxonID = _.get(qs.parse(_.get(location, "search")), "taxonID");
    if (taxonID) {
      this.getRootTaxon(taxonID);
    }
  };

  exportDataset = (options) => {
    const { dataset, addError } = this.props;

    axios
      .post(`${config.dataApi}dataset/${dataset.key}/export`, options)
      .then((res) => {
        const uuid = res.data;
        this.setState({
          error: null,
          exportUrl: `${config.dataApi}export/${uuid}`,
          downloadModalVisible: true,
        });
      })
      .catch((err) => addError(err));
  };

  createCitation = () => {
    const { dataset } = this.props;
    const authors = _.get(dataset, "authors", [])
      .map((a) => a.name)
      .join(", ");
    return `${dataset.title}. ${authors} ${moment(dataset.modified).format(
      "LL"
    )}`;
  };

  getRootTaxon = (key) => {
    const { dataset, addError } = this.props;
    axios
      .get(`${config.dataApi}dataset/${dataset.key}/taxon/${key}`)
      .then(({ data: rootTaxon }) => {
        console.log(rootTaxon);
        this.setState({ rootTaxon });
      })
      .catch((err) => addError(err));
  };
  render() {
    const { error, rootTaxon, synonyms, excel, minRank } = this.state;

    const { selectedDataFormat, downloadModalVisible, exportUrl } = this.state;

    const { dataFormat, dataset, location, user, rank } = this.props;

    return user ? (
      <PageContent>
        {error && <Alert message={<ErrorMsg error={error} />} type="error" />}
        {dataset.origin === "external" && (
          <Row style={{ marginBottom: "10px" }}>
            <Col span={4} style={{ textAlign: "right", paddingRight: "10px" }}>
              Prepared downloads
            </Col>
            <Col span={20}>
              <a
                href={`${config.dataApi}dataset/${dataset.key}/export`}
                target="_blank"
              >
                original archive
              </a>
            </Col>
          </Row>
        )}
        <Row>
          <Col span={4} style={{ textAlign: "right", paddingRight: "10px" }}>
            Choose format
          </Col>
          <Col span={14}>
            <Radio.Group
              options={dataFormat
                .filter((f) => f.name != "proxy")
                .map((f) => ({
                  label: f.name,
                  value: f.name,
                }))}
              value={selectedDataFormat}
              onChange={(e) =>
                this.setState({ selectedDataFormat: e.target.value })
              }
              optionType="button"
            />
          </Col>
          <Col span={6} style={{ textAlign: "right" }}>
            <Button
              type="primary"
              onClick={() => {
                let options = { format: selectedDataFormat, synonyms, excel };
                if (rootTaxon) {
                  options.root = {};
                  options.root.id = rootTaxon.id;
                }
                if (minRank) {
                  options.minRank = minRank;
                }
                this.exportDataset(options);
              }}
              style={{ marginRight: "0px", marginBottom: "10px" }}
            >
              Download <DownloadOutlined />
            </Button>
          </Col>
        </Row>
        <Row>
          <Col span={4} style={{ textAlign: "right", paddingRight: "10px" }}>
            Choose root taxon (optional)
          </Col>
          <Col span={14}>
            <NameAutocomplete
              minRank="GENUS"
              datasetKey={dataset.key}
              defaultTaxonKey={
                _.get(qs.parse(_.get(location, "search")), "taxonID") || null
              }
              onError={(error) => this.setState({ error })}
              onSelectName={(name) => {
                history.push({
                  pathname: location.pathname,
                  search: `?taxonID=${_.get(name, "key")}`,
                });
                this.getRootTaxon(name.key);
                //this.setState({ rootTaxon: name });
              }}
              onResetSearch={() => {
                history.push({
                  pathname: location.pathname,
                });
                this.setState({ rootTaxon: null });
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col span={4} style={{ textAlign: "right", paddingRight: "10px" }}>
            Exclude ranks below (optional)
          </Col>
          <Col>
            <Select
              style={{ width: 200 }}
              showSearch
              onChange={(val) => this.setState({ minRank: val })}
            >
              {rank.map((r) => (
                <Option key={r} value={r}>
                  {r}
                </Option>
              ))}
            </Select>
          </Col>
          <Col style={{ paddingLeft: "10px" }}>
            <Checkbox
              checked={synonyms}
              onChange={(e) => this.setState({ synonyms: e.target.checked })}
            >
              Include synonyms
            </Checkbox>
          </Col>
          <Col>
            <Checkbox
              checked={excel}
              onChange={(e) => this.setState({ excel: e.target.checked })}
            >
              Excel
            </Checkbox>
          </Col>
        </Row>
        <Row style={{ marginTop: "24px" }}>
          <Col span={24}>
            <Divider plain>Please cite as:</Divider>
            <CopyToClipboard
              text={`${rootTaxon ? rootTaxon.label + " in " : ""}${dataset.citation || this.createCitation()
                }`}
              onCopy={() => message.info(`Copied citation to clipboard`)}
            >
              <p style={{ textAlign: "center", cursor: "pointer" }}>
                {rootTaxon && (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: rootTaxon.labelHtml + " in ",
                    }}
                  />
                )}
                {dataset.citation || this.createCitation()}
              </p>
            </CopyToClipboard>
          </Col>
        </Row>
        <Modal
          title="Your download will be available at this link"
          visible={downloadModalVisible}
          onCancel={() => this.setState({ downloadModalVisible: false })}
          footer={null}
        >
          <a href={exportUrl}>{exportUrl}</a>{" "}
          <CopyToClipboard
            text={exportUrl}
            onCopy={() => message.info(`Copied "${exportUrl}" to clipboard`)}
          >
            <Button>
              <CopyOutlined />
            </Button>
          </CopyToClipboard>
        </Modal>
      </PageContent>
    ) : (
      <Exception403 />
    );
  }
}

const mapContextToProps = ({ rank, dataFormat, addError, user }) => ({
  rank,
  user,
  dataFormat,
  addError,
});
export default withContext(mapContextToProps)(DatasetDownload);
