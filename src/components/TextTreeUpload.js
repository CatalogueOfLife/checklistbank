import React from "react";
import axios from "axios";
import config from "../config";

import { Upload, message, Button, Alert, Checkbox, Input, Tabs } from "antd";
import ErrorMsg from "./ErrorMsg";
import { UploadOutlined } from "@ant-design/icons";
const { TextArea } = Input;

const readFile = (file) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

class TextTreeUpload extends React.Component {
  constructor(props) {
    super(props);
    this.customRequest = this.customRequest.bind(this);
    this.state = {
      confirmPromise: null,
      visible: false,
      submissionError: null,
      fileList: [],
      loading: false,
      replace: false,
      textAreaContent: null,
    };
  }

  customRequest = async (options) => {
    this.setState({ loading: true });
    const { replace } = this.state;
    const config = {
      headers: {
        "content-type": "text/plain",
      },
    };

    const text = await readFile(options.file);
    const url = replace ? `${options.action}?replace=true` : options.action;
    return axios
      .post(url, text, config)
      .then((res) => {
        options.onSuccess(res.data, options.file);
        this.setState({ submissionError: null, confirmPromise: null });
        this.setState({ loading: false });
      })
      .catch((err) => {
        options.onError(err);
        this.setState({ submissionError: err, confirmPromise: null });
        console.log(err);
        this.setState({ loading: false });
      });
  };

  sendDataFromText = async () => {
    if (this.confirmUpload()) {
      const { taxon } = this.props;
      const { replace, textAreaContent: text } = this.state;
      this.setState({ loading: true });
      const opts = {
        headers: {
          "content-type": "text/plain",
        },
      };

      const url = `${config.dataApi}dataset/${taxon.datasetKey}/taxon/${
        taxon.id
      }/tree${replace ? "?replace=true" : ""}`;
      return axios
        .post(url, text, opts)
        .then((res) => {
          // options.onSuccess(res.data, options.file);
          this.setState({ submissionError: null, confirmPromise: null });
          this.setState({ loading: false });
          message.success(`Data submitted successfully`);
        })
        .catch((err) => {
          //  options.onError(err);
          this.setState({ submissionError: err, confirmPromise: null });
          console.log(err);
          this.setState({ loading: false });
          message.error(`Data submission failed.`);
        });
    }
  };

  onChange = (info) => {
    if (info.file.status !== "uploading") {
      // console.log(info.file, info.fileList);
    }
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
    this.setState({ fileList: !info.file.status ? [] : [info.file] });
  };

  confirmUpload = (file) => {
    const { replace } = this.state;

    return replace
      ? window.confirm(
          `ALL DATA BELOW THIS TAXON WILL BE REPLACED ${
            file ? "WITH CONTENT OF " + file.name : ""
          }, PROCEED?`
        )
      : true;
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

        <Tabs defaultActiveKey="1" style={{ width: "100%" }}>
          <Tabs.TabPane tab="Paste tree" key="1">
            <Checkbox
              disabled={this.state.loading}
              checked={replace}
              onChange={(e) => this.setState({ replace: e.target.checked })}
            >
              Replace
            </Checkbox>
            <TextArea
              rows={10}
              value={this.state.textAreaContent}
              onChange={(e) =>
                this.setState({ textAreaContent: e.target.value })
              }
            />
            <Button
              style={{ marginTop: "10px" }}
              onClick={this.sendDataFromText}
            >
              Submit
            </Button>
          </Tabs.TabPane>
          <Tabs.TabPane tab="Upload tree" key="2">
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
                type="primary"
              >
                <UploadOutlined /> Upload text tree
              </Button>
            </Upload>
            <Checkbox
              disabled={this.state.loading}
              checked={replace}
              onChange={(e) => this.setState({ replace: e.target.checked })}
            >
              Replace
            </Checkbox>
          </Tabs.TabPane>
        </Tabs>
      </>
    );
  }
}

export default TextTreeUpload;
