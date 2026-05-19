import { useState } from "react";
import { CopyOutlined } from "@ant-design/icons";
import withContext from "../../components/hoc/withContext";
import config from "../../config";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Button, Select, Modal, App } from "antd";
import axios from "axios";

const DatasetExport = ({ datasetKey, addError, dataFormat }) => {
  const { message } = App.useApp();
  const [selectedDataFormat, setSelectedDataFormat] = useState("coldp");
  const [exportUrl, setExportUrl] = useState(null);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);

  const exportDataset = (options) => {
    axios
      .post(`${config.dataApi}dataset/${datasetKey}/export`, options)
      .then((res) => {
        const uuid = res.data;
        setExportUrl(`${config.dataApi}export/${uuid}`);
        setDownloadModalVisible(true);
      })
      .catch((err) => addError(err));
  };

  return (
    <div>
      <Button
        type="primary"
        onClick={() => exportDataset({ format: selectedDataFormat })}
        style={{ marginRight: "0px", marginBottom: "10px" }}
      >
        Export dataset
      </Button>
      <Select
        defaultValue="coldp"
        style={{ width: 80 }}
        value={selectedDataFormat}
        onChange={(val) => setSelectedDataFormat(val)}
        options={dataFormat.map((f) => ({ value: f.name, label: f.name }))}
      />
      <Modal
        title="Your download will be available at this link"
        open={downloadModalVisible}
        onCancel={() => setDownloadModalVisible(false)}
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
};

const mapContextToProps = ({ dataFormat, addError }) => ({
  dataFormat,
  addError,
});
export default withContext(mapContextToProps)(DatasetExport);
