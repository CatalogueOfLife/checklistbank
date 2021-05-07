import React, { useState, useEffect } from "react";

import {
  Input,
  Row,
  Col,
  Progress,
  Alert,
  Steps,
  Button,
  Statistic,
  Table,
  Upload,
  Form,
  Tag,
  message,
  Typography,
  Space,
} from "antd";
import { CSVLink } from "react-csv";
import {
  DownloadOutlined,
  UploadOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import DatasetAutocomplete from "../catalogue/Assembly/DatasetAutocomplete";
import ErrorMsg from "../../components/ErrorMsg";
import Layout from "../../components/LayoutNew";
import history from "../../history";
import PageContent from "../../components/PageContent";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import { Converter } from "csvtojson/v1";
import ImportChart from "../../components/ImportChart";

const { Dragger } = Upload;
const { TextArea } = Input;
const Step = Steps.Step;
const defaultRanks = ["kingdom", "phylum", "class", "order", "family", "genus"];
const FormItem = Form.Item;
const matchTypeTypeMap = {
  exact: "green",
  none: "red",
  ambiguous: "gold",
};

const getLowerKeysObj = (obj) => {
  var key,
    keys = Object.keys(obj);
  var n = keys.length;
  var newobj = {};
  while (n--) {
    key = keys[n];
    newobj[key.toLowerCase()] = obj[key];
  }
  return newobj;
};
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const tailLayout = {
  wrapperCol: {
    offset: 4,
    span: 16,
  },
};

const MatchProgress = ({ matched, total }) => {
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    setPercent(getPercent(matched, total));
  });

  return (
    <Progress
      strokeColor={{
        from: "#108ee9",
        to: "#87d068",
      }}
      percent={percent}
      status="active"
    />
  );
};
const getPercent = (num, total) => Math.round((num / total) * 100);
const Metrics = ({ metrics, total }) =>
  Object.keys(metrics).map((m) => (
    <React.Fragment key="m">
      <Tag color={matchTypeTypeMap[m]} style={{ marginBottom: "6px" }}>
        {`${m}: ${metrics[m]} / ${total} (${getPercent(metrics[m], total)}%)`}
      </Tag>
      <br />
    </React.Fragment>
  ));
const COL_LR = {
  key: "3LR",
  alias: "COL LR",
};
const NameMatch = () => {
  const [error, setError] = useState(null);
  const [names, setNames] = useState(null);
  const [defaultCode, setDefaultCode] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [step, setStep] = useState(0);
  const [primaryDataset, setPrimaryDataset] = useState(COL_LR);
  const [secondaryDataset, setSecondaryDataset] = useState(null);
  const [numMatchedNames, setNumMatchedNames] = useState(0);
  const [nameIndexMetrics, setNameIndexMetrics] = useState(null);
  const [primaryUsageMetrics, setPrimaryUsageMetrics] = useState(null);
  const [secondaryUsageMetrics, setSecondaryUsageMetrics] = useState(null);

  const match = async (name) => {
    try {
      let nidxParams = `?q=${name.providedScientificName}`;
      if (name.code) {
        nidxParams += `&code=${name.code}`;
      }
      if (name.rank) {
        nidxParams += `&rank=${name.rank}`;
      }
      if (name.author) {
        nidxParams += `&author=${name.author}`;
      }
      const { data: indexMatch } = await axios(
        `${config.dataApi}nidx/match${nidxParams}`
      );
      if (_.get(indexMatch, "nameKey") && _.get(indexMatch, "type")) {
        name.nidx = indexMatch;
        name.matchType = indexMatch.type;
        const { data: primaryDatasetUsages } = await axios(
          `${config.dataApi}dataset/${primaryDataset.key}/nameusage?nidx=${indexMatch.nameKey}`
        );
        name.primaryDatasetUsage = _.get(primaryDatasetUsages, "result[0]");
        if (name.primaryDatasetUsage) {
          const { data: classification } = await axios(
            `${config.dataApi}dataset/${primaryDataset.key}/taxon/${name.primaryDatasetUsage.id}/classification2`
          );
          if (classification) {
            name.primaryDatasetUsage.classification = _.keyBy(
              classification,
              "rank"
            );
          }
        }
        if (secondaryDataset) {
          const { data: secondaryDatasetUsages } = await axios(
            `${config.dataApi}dataset/${secondaryDataset.key}/nameusage?nidx=${indexMatch.nameKey}`
          );
          name.secondaryDatasetUsage = _.get(
            secondaryDatasetUsages,
            "result[0]"
          );
          if (name.secondaryDatasetUsage) {
            const { data: classification } = await axios(
              `${config.dataApi}dataset/${secondaryDataset.key}/taxon/${name.secondaryDatasetUsage.id}/classification2`
            );
            if (classification) {
              name.secondaryDatasetUsage.classification = _.keyBy(
                classification,
                "rank"
              );
            }
          }
        }
      } else {
        name.matchType = "none";
      }
    } catch (err) {
      name.matchType = "none";
      console.log(err);
      //setError(err.message);
    }
  };

  const isValidFile = (file) => {
    return (
      !!file &&
      (file.type == "" ||
        file.type == "text/csv" ||
        file.type == "text/plain" ||
        file.name.indexOf(".csv") > 1)
    );
  };
  const parseFile = (file) => {
    let invalidFileFormat = false;
    if (!isValidFile(file)) {
      invalidFileFormat = true;
      setError(
        "Invalid file format - the file must be a csv file and all rows must have a scientificName column"
      );
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var converter = new Converter({
        delimiter: [",", ";", "$", "|", "\t"],
      });
      var csvString = reader.result;
      setError(null);
      converter.fromString(csvString, function (err, result) {
        try {
          if (err) {
            setError(err);
          } else if (result.length == 0) {
            setError("There are no rows in the data.");
          } else if (result.length > 6000) {
            setError(
              "Too many rows (maximum 6.000) - try using our APIs instead"
            );
          } else {
            // make all keys lower to avoid casing issues
            result = result.map(function (e) {
              return getLowerKeysObj(e);
            });
            if (
              result.every(function (e) {
                return e.scientificname;
              })
            ) {
              result.forEach(function (e) {
                e.providedScientificName = e.scientificname;
                e.code = e.code || defaultCode;
                e.scientificName = undefined;
              });
              setNames(result);
              setStep(1);
              let matchedNames = 0;
              Promise.allSettled(
                result.map((name) =>
                  match(name).then(() => {
                    matchedNames++;
                    setNumMatchedNames(matchedNames);
                  })
                )
              ).then(() => {
                const grouped = _.groupBy(result, "matchType");
                let metrics = {};
                Object.keys(grouped).forEach((k, v) => {
                  metrics[k] = grouped[k].length;
                });
                let hasPrimaryDatasetUsageCount = 0;
                let hasSecondaryDatasetUsageCount = 0;
                result.forEach((r) => {
                  if (r.primaryDatasetUsage) {
                    hasPrimaryDatasetUsageCount++;
                  }
                  if (r.secondaryDatasetUsage) {
                    hasSecondaryDatasetUsageCount++;
                  }
                });
                setPrimaryUsageMetrics(hasPrimaryDatasetUsageCount);

                if (secondaryDataset) {
                  setSecondaryUsageMetrics(hasSecondaryDatasetUsageCount);
                }
                setNameIndexMetrics(metrics);
                setStep(2);
              });
            } else {
              setError(
                "all rows must have a scientificName - see example file for the required format"
              );
            }
          }
        } catch (err) {
          console.log(err);
        }
      });
    };
    reader.readAsText(file);
    return false;
  };
  const getClassificationColumns = () =>
    defaultRanks.map((rank) => ({
      title: rank,
      dataIndex: ["primaryDatasetUsage", "classification", rank, "name"],
      key: rank,
      render: (text, record) => (
        <React.Fragment key={_.get(record, "primaryDatasetUsage.id")}>
          <span
            dangerouslySetInnerHTML={{
              __html: _.get(
                record,
                `primaryDatasetUsage.classification.${rank}.labelHtml`
              ),
            }}
          />
          {secondaryDataset && (
            <React.Fragment>
              <br />
              <span
                dangerouslySetInnerHTML={{
                  __html: _.get(
                    record,
                    `secondaryDatasetUsage.classification.${rank}.labelHtml`
                  ),
                }}
              />
            </React.Fragment>
          )}
        </React.Fragment>
      ),
    }));

  const getDownLoadData = (whichDataset) => {
    const usage =
      !whichDataset || whichDataset === "primary"
        ? "primaryDatasetUsage"
        : "secondaryDatasetUsage";
    return names.map((n) => {
      let row = {
        providedScientificName: n.providedScientificName,
        matchType: n.matchType,
        nameIndexId: _.get(n, `nidx.name.id`, ""),
        taxonId: _.get(n, `${usage}.id`, ""),
        parentTaxonId: _.get(n, `${usage}.parentId`, ""),
        scientificName: _.get(n, `${usage}.label`, ""),
      };
      defaultRanks.forEach((r) => {
        row[r] = _.get(n, `${usage}.classification.${r}.label`, "");
      });
      return row;
    });
  };
  const getDownLoadDataFileName = (whichDataset) => {
    const dataset =
      !whichDataset || whichDataset === "primary"
        ? primaryDataset
        : secondaryDataset;
    return `${
      dataset.alias
        ? "Namematch_result_" + dataset.alias
        : "Namematch_result_dataset_" + dataset.key
    }.csv`.replace(" ", "_");
  };
  const draggerProps = {
    name: "file",
    multiple: false,
    beforeUpload(file) {
      return parseFile(file);
    },
    style: { marginTop: "10px" },
  };

  return (
    <Layout
      selectedKeys={["namematch"]}
      openKeys={["tools"]}
      title="Name Match"
    >
      <PageContent>
        <Steps
          current={step}
          style={{ marginBottom: "24px" }}
          onChange={(current) => setStep(current)}
        >
          <Step title={"Upload csv"} />
          <Step
            title={"Matching"}
            icon={step === 1 ? <LoadingOutlined /> : null}
          />
          <Step title={"Review result"} disabled />
        </Steps>
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

        {step !== 1 && (
          <Row>
            <Col
              style={{ paddingRight: "8px" }}
              span={step === 0 || !secondaryDataset ? 12 : 10}
            >
              <DatasetAutocomplete
                defaultDatasetKey={primaryDataset.key}
                onResetSearch={() => setPrimaryDataset(COL_LR)}
                onSelectDataset={setPrimaryDataset}
                // contributesTo={this.props.catalogueKey}
                placeHolder="Choose primary dataset"
              />
              {step === 2 && (
                <Row justify="space-between">
                  <Col>
                    <Statistic
                      title={"Usages"}
                      value={primaryUsageMetrics}
                      suffix={`/ ${names.length}`}
                    />
                  </Col>
                  <Col>
                    <CSVLink
                      filename={getDownLoadDataFileName("primary")}
                      data={getDownLoadData("primary")}
                    >
                      <Button type="primary" style={{ marginTop: "10px" }}>
                        <DownloadOutlined /> Download result
                      </Button>
                    </CSVLink>
                  </Col>
                </Row>
              )}
            </Col>
            {(step < 1 || secondaryDataset) && (
              <Col
                style={{ paddingLeft: "8px", paddingRight: "8px" }}
                span={step === 0 || !secondaryDataset ? 12 : 10}
              >
                <DatasetAutocomplete
                  defaultDatasetKey={
                    secondaryDataset ? secondaryDataset.key : null
                  }
                  onResetSearch={() => setSecondaryDataset(null)}
                  onSelectDataset={setSecondaryDataset}
                  // contributesTo={this.props.catalogueKey}
                  placeHolder="Choose secondary dataset"
                />
                {step === 2 && (
                  <Row justify="space-between">
                    <Col>
                      <Statistic
                        title={"Usages"}
                        value={secondaryUsageMetrics}
                        suffix={`/ ${names.length}`}
                      />
                    </Col>
                    <Col>
                      <CSVLink
                        filename={getDownLoadDataFileName("secondary")}
                        data={getDownLoadData("secondary")}
                      >
                        <Button type="primary" style={{ marginTop: "10px" }}>
                          <DownloadOutlined /> Download result
                        </Button>
                      </CSVLink>
                    </Col>
                  </Row>
                )}
              </Col>
            )}
            {step === 2 && (
              <Col
                span={secondaryDataset ? 4 : 12}
                style={{ paddingRight: "8px" }}
              >
                <Row>
                  <Col flex="auto"></Col>
                  <Col style={{ marginTop: "-22px" }}>
                    <span>Name index matches:</span>
                    <br />
                    <Metrics metrics={nameIndexMetrics} total={names.length} />
                  </Col>
                </Row>
              </Col>
            )}
          </Row>
        )}

        {step === 0 && (
          <Dragger {...draggerProps}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag csv file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Your csv must contain a column{" "}
              <code className="code">scientificName</code> (which may include
              the author) and optional columns{" "}
              <code className="code">author</code>,{" "}
              <code className="code">rank</code> and{" "}
              <code className="code">code</code> (nomenclatural code)
            </p>
          </Dragger>
        )}
        {step === 1 && (
          <MatchProgress total={names.length} matched={numMatchedNames} />
        )}

        {(step === 1 || step === 2) && (
          <Table
            scroll={{ x: 2000 }}
            dataSource={names}
            columns={[
              {
                title: "Provided Scientific Name",
                dataIndex: "providedScientificName",
                key: "providedScientificName",
              },
              {
                title: "Match type",
                dataIndex: "matchType",
                key: "matchType",
                filters: nameIndexMetrics
                  ? Object.keys(nameIndexMetrics).map((m) => ({
                      text: m,
                      value: m,
                    }))
                  : null,
                onFilter: (value, record) => {
                  return record.matchType === value;
                },
                render: (text, record) => (
                  <Tag color={_.get(matchTypeTypeMap, `${text}`, "")}>
                    {text}
                  </Tag>
                ),
              },
              {
                title: "Scientific Name",
                dataIndex: ["primaryDatasetUsage", "label"],
                key: "scientificName",
                filters: secondaryDataset
                  ? [
                      {
                        text: `Only usage in ${
                          primaryDataset.alias ||
                          "Dataset " + primaryDataset.key
                        }`,
                        value: "only_primary_usage",
                      },
                      {
                        text: `Only usage in ${
                          secondaryDataset.alias ||
                          "Dataset " + secondaryDataset.key
                        }`,
                        value: "only_secondary_usage",
                      },
                      {
                        text: `Usage in ${
                          primaryDataset.alias ||
                          "Dataset " + primaryDataset.key
                        }`,
                        value: "primary_usage",
                      },
                      {
                        text: `NO usage in ${
                          primaryDataset.alias ||
                          "Dataset " + primaryDataset.key
                        }`,
                        value: "no_primary_usage",
                      },
                      {
                        text: `Usage in ${
                          secondaryDataset.alias ||
                          "Dataset " + secondaryDataset.key
                        }`,
                        value: "secondary_usage",
                      },
                      {
                        text: `NO usage in ${
                          secondaryDataset.alias ||
                          "Dataset " + secondaryDataset.key
                        }`,
                        value: "no_secondary_usage",
                      },
                    ]
                  : [
                      {
                        text: `Usage in ${
                          primaryDataset.alias ||
                          "Dataset " + primaryDataset.key
                        }`,
                        value: "primary_usage",
                      },
                      {
                        text: ` NO usage in ${
                          primaryDataset.alias ||
                          "Dataset " + primaryDataset.key
                        }`,
                        value: "no_primary_usage",
                      },
                    ],
                onFilter: (value, record) => {
                  if (value === "only_primary_usage") {
                    return !!(
                      _.get(record, "primaryDatasetUsage") &&
                      !_.get(record, "secondaryDatasetUsage")
                    );
                  }
                  if (value === "only_secondary_usage") {
                    return !!(
                      !_.get(record, "primaryDatasetUsage") &&
                      _.get(record, "secondaryDatasetUsage")
                    );
                  }
                  if (value === "primary_usage") {
                    return !!_.get(record, "primaryDatasetUsage");
                  }
                  if (value === "no_primary_usage") {
                    return !_.get(record, "primaryDatasetUsage");
                  }
                  if (value === "secondary_usage") {
                    return !!_.get(record, "secondaryDatasetUsage");
                  }
                  if (value === "no_secondary_usage") {
                    return !_.get(record, "secondaryDatasetUsage");
                  }
                },
                render: (text, record) => {
                  return (
                    <React.Fragment
                      key={_.get(record, "primaryDatasetUsage.id")}
                    >
                      {_.get(record, "primaryDatasetUsage.labelHtml") ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: _.get(
                              record,
                              "primaryDatasetUsage.labelHtml"
                            ),
                          }}
                        />
                      ) : (
                        <Tag color="red">None</Tag>
                      )}
                      {secondaryDataset && (
                        <React.Fragment>
                          <br />
                          {_.get(record, "secondaryDatasetUsage.labelHtml") ? (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: _.get(
                                  record,
                                  "secondaryDatasetUsage.labelHtml"
                                ),
                              }}
                            />
                          ) : (
                            <Tag color="red">None</Tag>
                          )}
                        </React.Fragment>
                      )}
                    </React.Fragment>
                  );
                },
              },
              ...getClassificationColumns(),
            ]}
          />
        )}
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ nomCode }) => ({
  nomCode,
});
export default withContext(mapContextToProps)(NameMatch);
