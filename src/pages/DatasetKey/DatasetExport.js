import React from "react";
import { CopyOutlined } from "@ant-design/icons";
import withContext from "../../components/hoc/withContext";
import config from "../../config";
import _ from "lodash";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Button, Select, Modal, message } from "antd";
import axios from "axios";

const { Option } = Select;

class DatasetExport extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      selectedDataFormat: "coldp",
      exportUrl: null,
      downloadModalVisible: false,
    };
  }

  exportDataset = (options) => {
    const { datasetKey, addError } = this.props;
    axios
      .post(`${config.dataApi}dataset/${datasetKey}/export`, options)
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

  render() {
    const { selectedDataFormat, downloadModalVisible, exportUrl } = this.state;

    const { dataFormat } = this.props;
    return (
      <div>
        <Button
          type="primary"
          onClick={() => this.exportDataset({ format: selectedDataFormat })}
          style={{ marginRight: "0px", marginBottom: "10px" }}
        >
          Export dataset
        </Button>
        <Select
          defaultValue="coldp"
          style={{ width: 80 }}
          value={selectedDataFormat}
          onChange={(val) => this.setState({ selectedDataFormat: val })}
        >
          {dataFormat.map((f) => (
            <Option key={f.name} value={f.name}>
              {f.name}
            </Option>
          ))}
        </Select>
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
      </div>
    );
  }
}

const mapContextToProps = ({ dataFormat, addError }) => ({
  dataFormat,
  addError,
});
export default withContext(mapContextToProps)(DatasetExport);
