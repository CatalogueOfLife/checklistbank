import React from "react";
import axios from "axios";
import config from "../../config";

import { Upload, message, Button, Alert } from "antd";
import ErrorMsg from "../ErrorMsg";
import { UploadOutlined } from "@ant-design/icons";

// const { confirm } = Modal;

class MetadataUpload extends React.Component {
  constructor(props) {
    super(props);
    this.customRequest = this.customRequest.bind(this);
    this.onChange = this.onChange.bind(this);
    this.state = {
      confirmPromise: null,
      visible: false,
      submissionError: null,
      fileList: [],
    };
  }

  customRequest = (options) => {
    const config = {
      headers: {
        "content-type": options.file.type,
      },
    };
    if (
      !config.headers["content-type"] &&
      (options.file.name.endsWith(".yaml") ||
        options.file.name.endsWith(".yml"))
    ) {
      config.headers["content-type"] = "text/yaml";
    }
    if (!config.headers["content-type"] && options.file.name.endsWith(".xml")) {
      config.headers["content-type"] = "text/xml";
    }
    return axios
      .put(options.action, options.file, config)
      .then((res) => {
        options.onSuccess(res.data, options.file);
        this.setState({
          submissionError: null,
          confirmPromise: null,
          fileList: [],
        });
      })
      .catch((err) => {
        options.onError(err);
        this.setState({
          submissionError: err,
          confirmPromise: null,
          fileList: [],
        });
        console.log(err);
      });
  };

  onChange(info) {
    if (info.file.status !== "uploading") {
      console.log(info.file, info.fileList);
    }
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
    this.setState({ fileList: !info.file.status ? [] : [info.file] });
  }

  confirmUpload = (file) => {
    return window.confirm(
      `ALL METADATA WILL BE REPLACED WITH CONTENT OF ${file.name}, PROCEED?`
    );
  };

  render() {
    const { datasetKey, onSuccess, onError, style } = this.props;
    const { submissionError, fileList } = this.state;
    return (
      <div className="clearfix" style={style}>
        {submissionError && (
          <Alert
            style={{ marginBottom: "8px" }}
            closable
            onClose={() => this.setState({ submissionError: null })}
            message={<ErrorMsg error={submissionError} />}
            type="error"
          />
        )}

        <Upload
          action={`${config.dataApi}dataset/${datasetKey}`}
          customRequest={this.customRequest}
          onSuccess={onSuccess}
          onError={onError}
          onChange={this.onChange}
          fileList={fileList}
          beforeUpload={this.confirmUpload}
        >
          <Button>
            <UploadOutlined /> Upload Metadata file
          </Button>
        </Upload>
      </div>
    );
  }
}

export default MetadataUpload;
