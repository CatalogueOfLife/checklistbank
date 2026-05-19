import { useState } from "react";
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

const TextTreeUpload = ({ taxon }) => {
  const [submissionError, setSubmissionError] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replace, setReplace] = useState(false);
  const [textAreaContent, setTextAreaContent] = useState(null);

  const customRequest = async (options) => {
    setLoading(true);
    const cfg = {
      headers: {
        "content-type": "text/plain",
      },
    };

    const text = await readFile(options.file);
    const url = replace ? `${options.action}?replace=true` : options.action;
    return axios
      .post(url, text, cfg)
      .then((res) => {
        options.onSuccess(res.data, options.file);
        setSubmissionError(null);
        setLoading(false);
      })
      .catch((err) => {
        options.onError(err);
        setSubmissionError(err);
        console.log(err);
        setLoading(false);
      });
  };

  const confirmUpload = (file) => {
    return replace
      ? window.confirm(
          `ALL DATA BELOW THIS TAXON WILL BE REPLACED ${
            file ? "WITH CONTENT OF " + file.name : ""
          }, PROCEED?`
        )
      : true;
  };

  const sendDataFromText = async () => {
    if (confirmUpload()) {
      setLoading(true);
      const opts = {
        headers: {
          "content-type": "text/plain",
        },
      };

      const url = `${config.dataApi}dataset/${taxon.datasetKey}/taxon/${
        taxon.id
      }/tree${replace ? "?replace=true" : ""}`;
      return axios
        .post(url, textAreaContent, opts)
        .then((res) => {
          setSubmissionError(null);
          setLoading(false);
          message.success(`Data submitted successfully`);
        })
        .catch((err) => {
          setSubmissionError(err);
          console.log(err);
          setLoading(false);
          message.error(`Data submission failed.`);
        });
    }
  };

  const onChange = (info) => {
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
    setFileList(!info.file.status ? [] : [info.file]);
  };

  return (
    <>
      {submissionError && (
        <Alert
          style={{ marginBottom: "8px" }}
          closable={{ onClose: () => setSubmissionError(null) }}
          description={<ErrorMsg error={submissionError} />}
          type="error"
        />
      )}

      <Tabs
        defaultActiveKey="1"
        style={{ width: "100%" }}
        items={[
          {
            key: "1",
            label: "Paste tree",
            children: (
              <>
                <Checkbox
                  disabled={loading}
                  checked={replace}
                  onChange={(e) => setReplace(e.target.checked)}
                >
                  Replace
                </Checkbox>
                <TextArea
                  rows={10}
                  value={textAreaContent}
                  onChange={(e) => setTextAreaContent(e.target.value)}
                />
                <Button
                  style={{ marginTop: "10px" }}
                  onClick={sendDataFromText}
                >
                  Submit
                </Button>
              </>
            ),
          },
          {
            key: "2",
            label: "Upload tree",
            children: (
              <>
                <Upload
                  action={`${config.dataApi}dataset/${taxon.datasetKey}/taxon/${taxon.id}/tree`}
                  customRequest={customRequest}
                  onChange={onChange}
                  fileList={fileList}
                  beforeUpload={confirmUpload}
                  showUploadList={false}
                >
                  <Button
                    loading={loading}
                    style={{ marginTop: "8px", marginRight: "12px" }}
                    type="primary"
                  >
                    <UploadOutlined /> Upload text tree
                  </Button>
                </Upload>
                <Checkbox
                  disabled={loading}
                  checked={replace}
                  onChange={(e) => setReplace(e.target.checked)}
                >
                  Replace
                </Checkbox>
              </>
            ),
          },
        ]}
      />
    </>
  );
};

export default TextTreeUpload;
