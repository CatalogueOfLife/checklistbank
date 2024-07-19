import React, { useState, useEffect } from "react";
import {
  Input,
  Row,
  Col,
  Progress,
  Alert,
  List,
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
const { Paragraph, Text, Title } = Typography;

const { Dragger } = Upload;

const COL_LR = {
  key: "3LR",
  alias: "COL LR",
};
const NameMatchAsync = ({ addError, rank, user }) => {
  const [error, setError] = useState(null);

  const [submissionError, setSubmissionError] = useState(null);
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
    /*  let type = options?.file?.type;

    if (!type) {
      let name = options?.file?.name || "";
      if (name.endsWith(".csv")) {
        type == "text/csv";
      } else if (name.endsWith(".tsv")) {
        type == "text/tab-separated-values";
      }
    } */

    const reqConfig = {
      headers: {
        "Content-Type": "text/plain",
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
      {!user && (
        <PageContent>
          Please login to use the asynchronous name matching service
        </PageContent>
      )}
      {!!user && (
        <>
          {" "}
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
            <Row style={{ marginBottom: "10px" }}>
              <Col>
                <Title level={3}>Name Matching Jobs</Title>
                <Paragraph>
                  Here you can upload text files for larger, asynchronous name
                  matching jobs. It requires a login and you will recieve an
                  email when the result is ready.
                </Paragraph>
              </Col>
              <Col flex="auto"></Col>
              <Col>
                <Button
                  type="primary"
                  onClick={() => {
                    history.push({
                      pathname: `/tools/name-match`,
                    });
                  }}
                >
                  {" "}
                  Back{" "}
                </Button>
              </Col>
            </Row>

            <Dragger {...draggerProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag csv/tsv file to this area to upload
              </p>
            </Dragger>

            <Row>
              <Col>
                <Paragraph>
                  Which dataset do you want to match against?
                </Paragraph>
              </Col>
            </Row>
            <Row>
              <Col style={{ paddingRight: "8px" }} span={12}>
                <DatasetAutocomplete
                  defaultDatasetKey={primaryDataset?.key}
                  onResetSearch={() => setPrimaryDataset(null)}
                  onSelectDataset={setPrimaryDataset}
                  // contributesTo={this.props.catalogueKey}
                  placeHolder="Choose primary dataset"
                />
              </Col>
            </Row>

            <Row style={{ marginTop: "50px" }}>
              <Col>
                <Title level={3}>File format</Title>
                <Paragraph>
                  Your uploaded file has to be a comma (CSV) or tab (TSV)
                  delimited text file with a header row to specify column names
                  -
                  <a
                    target="_blank"
                    href="https://gist.githubusercontent.com/mdoering/e8f464e97ac524973758c73162e4bf97/raw/8e38e8ab493d0afdcd7089b98358fc41e2f38d01/names.tsv"
                  >
                    example
                  </a>
                  . It can contain any number of columns which will all be
                  included again in the result, but must at least contain the
                  column <code className="code">scientificName</code>. For
                  better matching results we recommend to include as many of the
                  following
                  <a href="https://github.com/CatalogueOfLife/coldp/blob/master/README.md#nameusage">
                    {" "}
                    ColDP columns
                  </a>{" "}
                  as possible:
                </Paragraph>

                <List itemLayout="horizontal" bordered="true">
                  <List.Item>
                    <List.Item.Meta
                      title="ID"
                      description="A unique identifier for your name"
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="scientificName"
                      description="The scientific name to be matched. May include the authorship"
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="authorship"
                      description="Authorship of the scientificName"
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="rank"
                      description="The rank of the name preferably given in case insensitive english. See http://api.checklistbank.org/vocab/rank"
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="code"
                      description="The nomenclatural code the name falls under. See http://api.checklistbank.org/vocab/nomCode"
                    />
                  </List.Item>

                  <List.Item>
                    <List.Item.Meta
                      title="kingdom"
                      description="The kingdom the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="phylum"
                      description="The phylum the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="subphylum"
                      description="The subphylum the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="class"
                      description="The class the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="subclass"
                      description="The subclass the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="order"
                      description="The order the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="suborder"
                      description="The suborder the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="superfamily"
                      description="The superfamily the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="family"
                      description="The family the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="subfamily"
                      description="The subfamily the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="tribe"
                      description="The tribe the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="subtribe"
                      description="The subtribe the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="genus"
                      description="The genus the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="subgenus"
                      description="The subgenus the name is classified in."
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="section"
                      description="The (botanical) section the name is classified in. Considered a botanical rank below subgenus, not a zoological above family."
                    />
                  </List.Item>
                </List>
              </Col>
              <Col flex="auto"></Col>
            </Row>
          </PageContent>
        </>
      )}
    </Layout>
  );
};

const mapContextToProps = ({ nomCode, addError, rank, user }) => ({
  nomCode,
  addError,
  rank,
  user,
});
export default withContext(mapContextToProps)(NameMatchAsync);
