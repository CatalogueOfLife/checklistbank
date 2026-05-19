import { useState } from "react";
import axios from "axios";
import config from "../config";

import { Upload, message, Button, Alert } from "antd";
import ErrorMsg from "../components/ErrorMsg";
import { UploadOutlined } from "@ant-design/icons";

// const { confirm } = Modal;

const ArchiveUpload = ({ datasetKey }) => {
  const [submissionError, setSubmissionError] = useState(null);
  const [fileList, setFileList] = useState([]);

  const customRequest = (options) => {
    const reqConfig = {
      headers: {
        "content-type": options.file.type,
        "X-File-Name": options.file.name,
      },
    };
    if (
      !reqConfig.headers["content-type"] &&
      options.file.name.endsWith(".tree")
    ) {
      reqConfig.headers["content-type"] = "text/plain";
    }
    return axios
      .post(options.action, options.file, reqConfig)
      .then((res) => {
        options.onSuccess(res.data, options.file);
        setSubmissionError(null);
      })
      .catch((err) => {
        options.onError(err);
        setSubmissionError(err);
        console.log(err);
      });
  };

  const onChange = (info) => {
    if (info.file.status !== "uploading") {
      // console.log(info.file, info.fileList);
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
      `ALL DATA WILL BE REPLACED WITH CONTENT OF ${file.name}, PROCEED?`
    );
  };

  return (
    <div className="clearfix">
      {submissionError && (
        <Alert
          style={{ marginBottom: "8px" }}
          closable={{ onClose: () => setSubmissionError(null) }}
          description={<ErrorMsg error={submissionError} />}
          type="error"
        />
      )}

      <Upload
        action={`${config.dataApi}importer/${datasetKey}`}
        customRequest={customRequest}
        onChange={onChange}
        fileList={fileList}
        beforeUpload={confirmUpload}
      >
        <Button>
          <UploadOutlined /> Upload Data Archive
        </Button>
      </Upload>
    </div>
  );
};

export default ArchiveUpload;
