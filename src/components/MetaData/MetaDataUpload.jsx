import { useState } from "react";
import axios from "axios";
import config from "../../config";

import { Upload, App, Button, Alert } from "antd";
import ErrorMsg from "../ErrorMsg";
import { UploadOutlined } from "@ant-design/icons";

// const { confirm } = Modal;

const MetadataUpload = ({ datasetKey, onSuccess, onError, style }) => {
  const { message } = App.useApp();
  const [submissionError, setSubmissionError] = useState(null);
  const [fileList, setFileList] = useState([]);

  const customRequest = (options) => {
    const reqConfig = {
      headers: {
        "content-type": options.file.type,
      },
    };
    if (
      !reqConfig.headers["content-type"] &&
      (options.file.name.endsWith(".yaml") ||
        options.file.name.endsWith(".yml"))
    ) {
      reqConfig.headers["content-type"] = "text/yaml";
    }
    if (!reqConfig.headers["content-type"] && options.file.name.endsWith(".xml")) {
      reqConfig.headers["content-type"] = "text/xml";
    }
    return axios
      .put(options.action, options.file, reqConfig)
      .then((res) => {
        options.onSuccess(res.data, options.file);
        setSubmissionError(null);
        setFileList([]);
      })
      .catch((err) => {
        options.onError(err);
        setSubmissionError(err);
        setFileList([]);
        console.log(err);
      });
  };

  const onChange = (info) => {
    if (info.file.status !== "uploading") {
      console.log(info.file, info.fileList);
    }
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
    setFileList(!info.file.status ? [] : [info.file]);
  };

  const confirmUpload = (file) => {
    return window.confirm(
      `ALL METADATA WILL BE REPLACED WITH CONTENT OF ${file.name}, PROCEED?`
    );
  };

  return (
    <div className="clearfix" style={style}>
      {submissionError && (
        <Alert
          style={{ marginBottom: "8px" }}
          closable={{ onClose: () => setSubmissionError(null) }}
          description={<ErrorMsg error={submissionError} />}
          type="error"
        />
      )}

      <Upload
        action={`${config.dataApi}dataset/${datasetKey}`}
        customRequest={customRequest}
        onSuccess={onSuccess}
        onError={onError}
        onChange={onChange}
        fileList={fileList}
        beforeUpload={confirmUpload}
      >
        <Button>
          <UploadOutlined /> Upload Metadata file
        </Button>
      </Upload>
    </div>
  );
};

export default MetadataUpload;
