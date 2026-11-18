import { useState } from "react";
import axios from "axios";
import config from "../config";

import { Upload, App, Button, Popover } from "antd";
import ErrorMsg from "../components/ErrorMsg";
import { UploadOutlined, WarningOutlined } from "@ant-design/icons";

/**
 * Uploads a data archive and imports it, replacing all data of the dataset.
 * Made to sit in a row of buttons like the ImportButton: the progress shows in
 * the button and an error behind a warning icon next to it.
 */
const ArchiveUpload = ({ datasetKey, onSuccess, style }) => {
  const { message } = App.useApp();
  const [error, setError] = useState(null);
  // the upload progress in percent, null while nothing is uploading
  const [percent, setPercent] = useState(null);

  const customRequest = ({ file, action, onSuccess: done, onError }) => {
    const headers = {
      "content-type": file.type,
      "X-File-Name": file.name,
    };
    if (!headers["content-type"] && file.name.endsWith(".tree")) {
      headers["content-type"] = "text/plain";
    }
    setError(null);
    setPercent(0);
    return axios
      .post(action, file, {
        headers,
        onUploadProgress: (e) => {
          if (e.total) setPercent(Math.round((e.loaded * 100) / e.total));
        },
      })
      .then((res) => {
        setPercent(null);
        done(res.data, file);
        message.success(`${file.name} uploaded, the import is scheduled`);
        if (typeof onSuccess === "function") onSuccess(res.data);
      })
      .catch((err) => {
        setPercent(null);
        onError(err);
        setError(err);
        message.error(`${file.name} upload failed`);
      });
  };

  const confirmUpload = (file) =>
    window.confirm(
      `ALL DATA WILL BE REPLACED WITH CONTENT OF ${file.name}, PROCEED?`
    ) || Upload.LIST_IGNORE;

  const uploading = percent !== null;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", ...style }}>
      <Upload
        action={`${config.dataApi}importer/${datasetKey}`}
        customRequest={customRequest}
        beforeUpload={confirmUpload}
        showUploadList={false}
        disabled={uploading}
      >
        <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
          {uploading ? `Uploading ${percent}%` : "Upload Data"}
        </Button>
      </Upload>
      {error && (
        <Popover
          placement="bottom"
          title="Error"
          content={<ErrorMsg error={error} />}
          trigger="click"
        >
          <WarningOutlined
            style={{ color: "red", marginLeft: "10px", cursor: "pointer" }}
          />
        </Popover>
      )}
    </span>
  );
};

export default ArchiveUpload;
