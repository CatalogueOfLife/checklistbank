import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import history from "../../../history";
import _ from "lodash";
import {
  Button,
  Modal,
  message,
  Alert,
  Radio,
  Row,
  Col,
  Divider,
  Checkbox,
} from "antd";
import axios from "axios";
import config from "../../../config";
import PageContent from "../../../components/PageContent";
import ErrorMsg from "../../../components/ErrorMsg";
import withContext from "../../../components/hoc/withContext";
import Exception403 from "../../../components/exception/403";

import NameAutocomplete from "../../catalogue/Assembly/NameAutocomplete";
import qs from "query-string";

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
    const { rootTaxon } = this.state;
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
    const { error, rootTaxon, synonyms } = this.state;

    const { selectedDataFormat, downloadModalVisible, exportUrl } = this.state;

    const { dataFormat, dataset, location, user } = this.props;

    return user ? (
      <PageContent>
        {error && <Alert message={<ErrorMsg error={error} />} type="error" />}
        <Row>
          <Col span={3} style={{ textAlign: "right", paddingRight: "10px" }}>
            Choose format
          </Col>
          <Col span={15}>
            <Radio.Group
              options={dataFormat.map((f) => ({
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
                let options = { format: selectedDataFormat, synonyms };
                if (rootTaxon) {
                  options.taxonID = rootTaxon.id;
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
          <Col span={3} style={{ textAlign: "right", paddingRight: "10px" }}>
            Choose root taxon (optional)
          </Col>
          <Col span={15}>
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
          <Col span={3}></Col>
          <Col>
            <Checkbox
              checked={synonyms}
              onChange={(e) => this.setState({ synonyms: e.target.checked })}
            >
              Include synonyms
            </Checkbox>
          </Col>
        </Row>
        <Row>
          <Col>
            <Divider plain>Please cite as:</Divider>
            <p>
              {rootTaxon && (
                <span
                  dangerouslySetInnerHTML={{
                    __html: rootTaxon.labelHtml + " in ",
                  }}
                />
              )}
              {dataset.citation}
            </p>
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

const mapContextToProps = ({ dataFormat, addError, user }) => ({
  user,
  dataFormat,
  addError,
});
export default withContext(mapContextToProps)(DatasetDownload);
