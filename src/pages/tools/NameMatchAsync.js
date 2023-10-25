import React, { useState, useEffect } from "react";
import {
  Input,
  Row,
  Col,
  Progress,
  Alert,
  Steps,
  Button,
  Collapse,
  Statistic,
  Table,
  Upload,
  Form,
  Tag,
  Switch,
  Tooltip,
  Typography,
} from "antd";
import { CSVLink } from "react-csv";
import {
  DownloadOutlined,
  UploadOutlined,
  LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import DatasetAutocomplete from "../catalogue/Assembly/DatasetAutocomplete";
import NameAutocomplete from "../catalogue/Assembly/NameAutocomplete";
import ErrorMsg from "../../components/ErrorMsg";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import history from "../../history";
const { Paragraph } = Typography;

const { Dragger } = Upload;

const COL_LR = {
  key: "3LR",
  alias: "COL LR",
};
const NameMatchAsync = ({ addError, rank }) => {
  const [error, setError] = useState(null);

  const [submissionError, setSubmissionError] = useState(null);
  const [step, setStep] = useState(0);
  const [primaryDataset, setPrimaryDataset] = useState(COL_LR);

  const isValidFile = (file) => {
    return (
      !!file &&
      (file.type == "" ||
        file.type == "text/csv" ||
        file.type == "text/plain" ||
        file.name.indexOf(".csv") > 1)
    );
  };
  const customRequest = (options) => {
    const reqConfig = {
      headers: {
        "Content-Type": options?.file?.type,
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
  const draggerProps = {
    name: "file",
    multiple: false,
    action: `${config.dataApi}dataset/${primaryDataset.key}/match/nameusage/job`,
    customRequest: customRequest,
    onSuccess: (res) => {
      console.log(res);
      history.push({
        pathname: `/tools/name-match-async/job/${res.key}`,
      });
      // setStep(1);
    },
  };

  return (
    <Layout
      selectedKeys={["namematch"]}
      openKeys={["tools"]}
      title="Name Match"
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
        {error && (
          <Alert
            type="error"
            closable
            onClose={() => setError(null)}
            message={error}
          ></Alert>
        )}

        {step === 0 && (
          <>
            <Dragger {...draggerProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag csv/tsv file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Your csv/tsv must contain a column{" "}
                <code className="code">scientificName</code> (which may include
                the author) and optional columns{" "}
                <code className="code">author</code>,{" "}
                <code className="code">status</code>,{" "}
                <code className="code">rank</code>,{" "}
                <code className="code">code</code> (nomenclatural code), and any
                higher taxon (like <code className="code">kingom</code>:
                Animalia or <code className="code">domain</code>: Bacteria)
              </p>
            </Dragger>
          </>
        )}

        <>
          <Row>
            <Col>
              <Typography>
                <Paragraph>
                  Which dataset do you want to match against?
                </Paragraph>
              </Typography>
            </Col>
          </Row>
          <Row>
            <Col
              style={{ paddingRight: "8px" }}
              span={step === 0 || !secondaryDataset ? 12 : 10}
            >
              <DatasetAutocomplete
                defaultDatasetKey={primaryDataset?.key}
                onResetSearch={() => setPrimaryDataset(null)}
                onSelectDataset={setPrimaryDataset}
                // contributesTo={this.props.catalogueKey}
                placeHolder="Choose primary dataset"
              />
            </Col>
          </Row>
        </>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ nomCode, addError, rank }) => ({
  nomCode,
  addError,
  rank,
});
export default withContext(mapContextToProps)(NameMatchAsync);
