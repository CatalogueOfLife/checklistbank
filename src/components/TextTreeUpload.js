import React from "react";
import axios from "axios";
import config from "../config";

import { Upload, message, Button, Alert, Checkbox } from "antd";
import ErrorMsg from "./ErrorMsg";
import { UploadOutlined } from "@ant-design/icons";
// const { confirm } = Modal;

const readFile = (file) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = event => resolve(event.target.result)
    reader.onerror = error => reject(error)
    reader.readAsText(file)
  })
}

class TextTreeUpload extends React.Component {
  constructor(props) {
    super(props);
    this.customRequest = this.customRequest.bind(this);
    this.onChange = this.onChange.bind(this);
    this.state = {
      confirmPromise: null,
      visible: false,
      submissionError: null,
      fileList: [],
      loading: false,
      replace: false
    };
  }

  customRequest = async (options) => {
    this.setState({ loading: true })
    const { replace } = this.state;
    const config = {
      headers: {
        "content-type": "text/plain"
      },
    };

    const text = await readFile(options.file)
    const url = replace ? `${options.action}?replace=true` : options.action;
    return axios
      .post(url, text, config)
      .then((res) => {
        options.onSuccess(res.data, options.file);
        this.setState({ submissionError: null, confirmPromise: null });
        this.setState({ loading: false })
      })
      .catch((err) => {
        options.onError(err);
        this.setState({ submissionError: err, confirmPromise: null });
        console.log(err);
        this.setState({ loading: false })
      });
  };

  onChange(info) {
    if (info.file.status !== "uploading") {
      // console.log(info.file, info.fileList);
    }
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
    this.setState({ fileList: !info.file.status ? [] : [info.file] });
  }

  confirmUpload = (file) => {
    const { replace } = this.state;

    return replace ? window.confirm(
      `ALL DATA BELOW THIS TAXON WILL BE REPLACED WITH CONTENT OF ${file.name}, PROCEED?`
    ) : true;
  };

  render() {
    const { taxon } = this.props;
    const { submissionError, fileList, replace } = this.state;
    return (
      <>
        {submissionError && (
          <Alert
            style={{ marginBottom: "8px" }}
            closable
            onClose={() => this.setState({ submissionError: null })}
            description={<ErrorMsg error={submissionError} />}
            type="error"
          />
        )}

        <Upload
          action={`${config.dataApi}dataset/${taxon.datasetKey}/taxon/${taxon.id}/tree`}
          customRequest={this.customRequest}
          onChange={this.onChange}
          fileList={fileList}
          beforeUpload={this.confirmUpload}
          showUploadList={false}
        >
          <Button
            loading={this.state.loading}
            style={{ marginTop: "8px", marginRight: "12px" }}
            type="primary">
            <UploadOutlined /> Upload text tree
          </Button>
          <Checkbox
            disabled={this.state.loading}
            checked={replace}
            onChange={(e) => this.setState({ replace: e.target.checked })}
          >
            Replace
          </Checkbox>
        </Upload>
      </>
    );
  }
}

export default TextTreeUpload;
