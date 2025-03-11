import React, { useState } from "react";

import { Alert, Button, Input, Upload, Form } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import ErrorMsg from "../../components/ErrorMsg";
import Layout from "../../components/LayoutNew";
import { withRouter } from "react-router-dom";
import history from "../../history";
import PageContent from "../../components/PageContent";
import _ from "lodash";
import axios from "axios";
import config from "../../config";

const FormItem = Form.Item;
const { TextArea } = Input;


const ArchiveValidator = () => {
  const [submissionError, setSubmissionError] = useState(null);

  const customRequest = (options) => {
    const reqConfig = {
      headers: {
        "Content-Type": "application/octet-stream",
      },
    };
    return axios
      .post(options.action, options.file, reqConfig)
      .then((res) => {
        options.onSuccess(res.data, options.file);
      })
      .catch((err) => {
        setSubmissionError(err);
      });
  };

  const validateTxtTree = (values) => {
    console.log('Received values of form: ', values.ttree);
    const reqConfig = {
      headers: {
        "Content-Type": "text/plain",
      },
    };
    return axios.post(
        `${config.dataApi}validator/txtree`,
        values.ttree,
        reqConfig
      ).then((res) => {
        console.log(res);
        if (res.data.valid) {
          alert("Valid tree with " + res.data.lines + " lines.");
        } else {
          alert(res.data.message);
        }
      }).catch((err) => {
        console.log(err);
        alert("Error: " + err);
      });
  };


  return (
    <Layout
      selectedKeys={["validator"]}
      openKeys={["tools"]}
      title="Archive Validator"
    >
      <PageContent>
        {submissionError && (
          <Alert
            type="error"
            closable
            onClose={() => setSubmissionError(null)}
            message={
              <ErrorMsg
                error={submissionError}
                style={{ marginBottom: "10px" }}
              />
            }
          ></Alert>
        )}

        <h2>How it works</h2>
        <p>
          You can upload any archive file format supported by ChecklistBank to validate and preview it's data which includes:
          <ol>
            <li>ColDP</li>
            <li>DwC Archives</li>
            <li>TextTree</li>
          </ol>
          All archives need to be a single, zipped file.
        </p>
        <p>
          Once uploaded ChecklistBank will interpret your archive just as it does in a regular import.
          A temporary, private dataset will be created which is removed automatically after a week.
          You can then browse, search and review all issues flagged for the dataset.
        </p>
        <br />

        <h2>Upload to validator</h2>

        <React.Fragment>
          <FormItem>
            <Upload
              name="archivefile"
              action={`${config.dataApi}validator`}
              customRequest={customRequest}
              onSuccess={(d) => {
                history.push(`/dataset/${d.key}/imports`);
              }}
            >
              <Button icon={<UploadOutlined />}>Select local file</Button>
            </Upload>
          </FormItem>
        </React.Fragment>

        <p>
          After the upload you will be taken to the metrics page of your validation dataset.
          The validation will take a little while, depending on the size of your archive.
          Metrics, issues and the search will only be available once the validation has finished.
        </p>

        <h2>TextTree validation</h2>
        <p>
          You can paste any text tree here to validate it's indentation and structure.
        </p>

        <React.Fragment>
          <Form name="textree" onFinish={validateTxtTree}>
          <FormItem label="Text Tree" name="ttree">
            <TextArea rows={10}/>
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit">Validate</Button>
          </FormItem>
          </Form>
        </React.Fragment>

      </PageContent>
    </Layout>
  );
};

export default withRouter(ArchiveValidator);
