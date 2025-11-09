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
import history from "../../history";

import DatasetAutocomplete from "../catalogue/Assembly/DatasetAutocomplete";
import NameAutocomplete from "../catalogue/Assembly/NameAutocomplete";
import ErrorMsg from "../../components/ErrorMsg";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import csv from "csvtojson/v2";
import PQueue from "p-queue";
const { Panel } = Collapse;
const { TextArea } = Input;
const { Paragraph, Text } = Typography;

const MAX_LIST_SIZE = 6000;

const { Dragger } = Upload;
const Step = Steps.Step;
const defaultRanks = ["kingdom", "phylum", "class", "order", "family", "genus"];
const FormItem = Form.Item;
const matchTypeTypeMap = {
  exact: "green",
  none: "red",
  ambiguous: "gold",
  canonical: "gold",
};
const matchRemark = ["ambiguous", "canonical", "none"];
const matchRemarkTooltip = {
  ambiguous: "The name has more than one match in the names index",
  none: "There is no match for this name",
  canonical: "Only the name matches (without author string)",
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
/* const Metrics = ({ metrics, total }) =>
  Object.keys(metrics).map((m) => (
    <React.Fragment key="m">
      <Tag color={matchTypeTypeMap[m]} style={{ marginBottom: "6px" }}>
        {`${m}: ${metrics[m]} / ${total} (${getPercent(metrics[m], total)}%)`}
      </Tag>
      <br />
    </React.Fragment>
  )); */
const COL_LXR = {
  key: "3LXR",
  alias: "COL LXR",
};
const NameMatch = ({ addError, rank, issueMap }) => {
  const [error, setError] = useState(null);
  const [names, setNames] = useState(null);
  const [defaultCode, setDefaultCode] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [step, setStep] = useState(0);
  const [primaryDataset, setPrimaryDataset] = useState(COL_LXR);
  const [secondaryDataset, setSecondaryDataset] = useState(null);
  const [subjectDataset, setSubjectDataset] = useState(null);
  const [subjectTaxon, setSubjectTaxon] = useState(null);
  const [subjectDataLoading, setSubjectDataLoading] = useState(false);
  const [subjectDataTotal, setSubjectDataTotal] = useState(null);
  const [numMatchedNames, setNumMatchedNames] = useState(0);
  const [nameIndexMetrics, setNameIndexMetrics] = useState(null);
  const [primaryUsageMetrics, setPrimaryUsageMetrics] = useState(null);
  const [secondaryUsageMetrics, setSecondaryUsageMetrics] = useState(null);
  const [showSecondary, setShowSecondary] = useState(false);
  const [inputType, setInputType] = useState("1");
  const [textAreaVal, setTextAreaVal] = useState("");
  // const [erroredNames, setErroredNames] = useState(null);

  const formatUsageClassification = (usage) => {
    let result = {};
    if (usage?.classification) {
      result.keyedClassification = _.keyBy(usage?.classification, "rank");
      result.fullClassification = usage?.classification
        .map((tx) => `${tx.rank.toUpperCase()}:${tx.label}`)
        .join("|");
    }
    if (
      ["synonym", "ambiguous synonym", "misapplied"].includes(usage?.status) &&
      usage?.classification?.[0]
    ) {
      result.accepted = usage?.classification[0];
    }
    return result;
  };

  const matchParams = (name) => {
    let nidxParams = `?q=${encodeURIComponent(name.providedScientificName)}`;
    if (name.code) {
      nidxParams += `&code=${name.code}`;
    }
    if (name.rank) {
      nidxParams += `&rank=${name.rank}`;
    }
    if (name.authorship) {
      nidxParams += `&authorship=${encodeURIComponent(name.authorship)}`;
    }
    if (name.code) {
      nidxParams += `&code=${encodeURIComponent(name.code)}`;
    }
    if (name.status) {
      nidxParams += `&status=${encodeURIComponent(name.status)}`;
    }

    rank.forEach((r) => {
      if (name[r]) {
        nidxParams += `&${r}=${encodeURIComponent(name[r])}`;
      }
    });

    return nidxParams;
  };

  const match = async (name) => {
    try {
      let params = matchParams(name);

      const { data: primaryDatasetMatch } = await axios(
        `${config.dataApi}dataset/${primaryDataset.key}/match/nameusage${params}`
      );
      const {
        usage: primaryDatasetUsage,
        issues,
        original,
      } = primaryDatasetMatch;
      name.primaryDatasetUsage = {
        ...primaryDatasetUsage,
        ...formatUsageClassification(primaryDatasetUsage),
        matchType: primaryDatasetMatch?.type,
      };
      if (issues) {
        name.issues = issues;
      }
      if (original) {
        name.original = original;
      }
      name.apilink = `${config.dataApi}dataset/${primaryDataset.key}/match/nameusage${params}&verbose=true`;

      if (secondaryDataset) {
        const { data: secondaryDatasetMatch } = await axios(
          `${config.dataApi}dataset/${secondaryDataset.key}/match/nameusage${params}`
        );
        const { usage: secondaryDatasetUsage } = secondaryDatasetMatch;
        name.secondaryDatasetUsage = {
          ...secondaryDatasetUsage,
          ...formatUsageClassification(secondaryDatasetUsage),
          matchType: secondaryDatasetMatch?.type,
        };
      }
    } catch (error) {
      name.matchType = "none";
      name.error = error;
      console.log(error);
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
  const matchResult = async (/* result */) => {
    setNumMatchedNames(0);
    let result = names; //setNames(result);
    setStep(2);
    let matchedNames = 0;
    const queue = new PQueue({ concurrency: 10 });

    result.map((name) =>
      queue.add(() =>
        match(name).then(() => {
          matchedNames++;
          setNumMatchedNames(matchedNames);
        })
      )
    );
    await queue.onIdle();

    // const erroredNames = result.filter((n) => !!n.error);
    // console.log(erroredNames.length);
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
    setStep(3);
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
      var csvString = reader.result;
      setError(null);
      csv({
        delimiter: [",", ";", "$", "|", "\t"],
      })
        .fromString(csvString)
        .then((result) => {
          if (result.length == 0) {
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
                e.providedAuthorship = e.authorship || "";
                e.code = e.code || defaultCode;
                e.scientificName = undefined;
              });
              setNames(result);
              // setStep(1);
              // matchResult(result);
            } else {
              setError(
                "all rows must have a scientificName - see example file for the required format"
              );
            }
          }
        })
        .catch((err) => console.log(err));
    };
    reader.readAsText(file);
    return false;
  };
  const getClassificationColumns = () =>
    defaultRanks.map((rank) => ({
      title: rank,
      dataIndex: ["primaryDatasetUsage", "keyedClassification", rank, "name"],
      key: rank,
      render: (text, record) => (
        <React.Fragment key={_.get(record, "primaryDatasetUsage.id")}>
          <span
            dangerouslySetInnerHTML={{
              __html: _.get(
                record,
                `primaryDatasetUsage.keyedClassification.${rank}.labelHtml`
              ),
            }}
          />
          &nbsp;
          {secondaryDataset && (
            <React.Fragment>
              <br />
              <span
                dangerouslySetInnerHTML={{
                  __html: _.get(
                    record,
                    `secondaryDatasetUsage.keyedClassification.${rank}.labelHtml`
                  ),
                }}
              />
              &nbsp;
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
        matchRemark: matchRemark.includes(n.usage?.matchType)
          ? n?.usage?.matchType
          : "",
        taxonId: _.get(n, `${usage}.id`, ""),
        acceptedTaxonId: _.get(
          n,
          `${usage}.accepted.id`,
          _.get(n, `${usage}.id`, "")
        ),
        parentTaxonId: _.get(n, `${usage}.parentId`, ""),
        scientificName: _.get(n, `${usage}.label`, ""),
        canonicalName: _.get(n, `${usage}.name`, ""),
        authorship: _.get(n, `${usage}.authorship`, ""),
        status: _.get(n, `${usage}.status`, ""),
        acceptedScientificName: _.get(
          n,
          `${usage}.accepted.label`,
          _.get(n, `${usage}.label`, "")
        ),
        classification: _.get(n, `${usage}.fullClassification`),
      };
      defaultRanks.forEach((r) => {
        row[r] = _.get(n, `${usage}.keyedClassification.${r}.label`, "");
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
  };

  const testSizeLimit = async (tx) => {
    const {
      data: { total },
    } = await axios(
      `${config.dataApi}dataset/${subjectDataset.key}/nameusage/search?TAXON_ID=${tx.key}&limit=0`
    );
    console.log("Data estimated " + total);
    setSubjectDataTotal(total);
  };

  const getSubjectDataAndMatch = async () => {
    setSubjectDataLoading(true);
    try {
      const { data } = await axios(
        `${config.dataApi}dataset/${subjectDataset.key}/export.json?taxonID=${subjectTaxon.key}&flat=true&synonyms=true`
      );
      console.log("Data retrieved " + data.length);
      const result = data.map((e) => ({
        providedScientificName: e?.label,
        code: e?.code || defaultCode,
        scientificName: undefined,
      }));
      setSubjectDataLoading(false);

      setNames(result);
      setStep(1);
    } catch (error) {
      if (typeof addError === "function") {
        addError(error);
      }
    }

    // matchResult(result);
    // console.log(data[0]);
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
          <Step title={"Input data"} />
          <Step title={"Target data"} />
          <Step
            title={"Matching"}
            icon={step === 2 ? <LoadingOutlined /> : null}
            disabled={step !== 2}
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

        <Row style={{ marginBottom: "10px" }}>
          <Col>
            Please chose between one of three ways of submitting your names to
            the matching service:
          </Col>
          <Col flex="auto"></Col>
          {names && step === 0 && (
            <Col>
              <span>{`${names.length} name${
                names.length === 1 ? "" : "s"
              } provided for matching `}</span>
              <Button type="primary" onClick={() => setStep(1)}>
                Next
              </Button>
            </Col>
          )}
        </Row>

        {names && step === 1 && (
          <Row style={{ marginBottom: "10px" }}>
            <Col flex="auto"></Col>
            <Col>
              <span>{`${names.length} name${
                names.length === 1 ? "" : "s"
              } provided for matching `}</span>
              <Button type="primary" onClick={matchResult}>
                Next
              </Button>
            </Col>
          </Row>
        )}

        {step === 0 && (
          <>
            <Collapse
              activeKey={inputType}
              onChange={(key) => setInputType(key)}
              accordion
            >
              <Panel header="Simple data entry" key="1">
                <Row gutter={[16, 16]}>
                  <Col span={16}>
                    <TextArea
                      value={textAreaVal}
                      onChange={(e) => {
                        setTextAreaVal(e?.currentTarget?.value || "");
                        if (e?.currentTarget?.value) {
                          setNames(
                            e?.currentTarget?.value
                              ?.split("\n")
                              .filter((e) => !!e)
                              .map((e) => ({ providedScientificName: e }))
                          );
                        } else {
                          setNames(null);
                        }
                      }}
                      rows={10}
                    />
                  </Col>
                  <Col span={8}>
                    <Typography>
                      <Paragraph>
                        Paste or write names - one name pr row. Names may
                        include the author string.
                      </Paragraph>
                    </Typography>
                  </Col>
                </Row>
              </Panel>
              <Panel header="Upload CSV" key="2">
                <Dragger {...draggerProps}>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag csv file to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Your csv must contain a column{" "}
                    <code className="code">scientificName</code> (which may
                    include the author)
                  </p>
                  <p className="ant-upload-hint">
                    and optional but recommended columns:
                  </p>
                  <p className="ant-upload-hint">
                    <code className="code">authorship</code>,{" "}
                    <code className="code">rank</code>,{" "}
                    <code className="code">status</code>, nomenclatural{" "}
                    <code className="code">code</code> and the classification at
                    any rank:
                  </p>
                  <p className="ant-upload-hint">
                    <code className="code">kingdom</code>,{" "}
                    <code className="code">phylum</code>,{" "}
                    <code className="code">class</code>,{" "}
                    <code className="code">order</code>,{" "}
                    <code className="code">suborder</code>,{" "}
                    <code className="code">superfamly</code>,{" "}
                    <code className="code">family</code>,{" "}
                    <code className="code">tribe</code>
                  </p>
                  <p className="ant-upload-hint">
                    Read the full list of supported parameters on our
                    <Button
                      type="link"
                      style={{ padding: 0 }}
                      onClick={() => {
                        history.push({
                          pathname: `/tools/name-match-async`,
                        });
                      }}
                    >
                      asynchronous matching
                    </Button>{" "}
                    page.
                  </p>
                </Dragger>
              </Panel>
              <Panel header="Choose dataset in ChecklistBank" key="3">
                <Row>
                  <Col
                    span={12}
                    style={{ paddingRight: "8px", paddingLeft: "8px" }}
                  >
                    Select a subject dataset:
                    <DatasetAutocomplete
                      defaultDatasetKey={_.get(subjectDataset, "key", null)}
                      onResetSearch={() => {
                        setSubjectDataset(null);
                        setSubjectTaxon(null);
                      }}
                      onSelectDataset={(dataset) => {
                        setSubjectDataset(dataset);
                        if (dataset?.key !== subjectDataset?.key) {
                          setSubjectTaxon(null);
                        }
                      }}
                      placeHolder="Choose subject dataset"
                    />
                    And a root taxon:
                    <NameAutocomplete
                      minRank="GENUS"
                      defaultTaxonKey={_.get(subjectTaxon, "key", null)}
                      datasetKey={_.get(subjectDataset, "key")}
                      onError={setError}
                      disabled={!subjectDataset}
                      onSelectName={(name) => {
                        setSubjectTaxon(name);
                        testSizeLimit(name);
                      }}
                      onResetSearch={() => {
                        setSubjectTaxon(null);
                        setSubjectDataTotal(null);
                      }}
                    />
                    {!_.isNull(subjectDataTotal) &&
                      subjectDataTotal <= MAX_LIST_SIZE && (
                        <Button
                          onClick={getSubjectDataAndMatch}
                          style={{ marginTop: "10px" }}
                          type="primary"
                          loading={subjectDataLoading}
                        >
                          Fetch {subjectDataTotal.toLocaleString()} names
                        </Button>
                      )}
                    {!_.isNull(subjectDataTotal) &&
                      subjectDataTotal > MAX_LIST_SIZE && (
                        <Alert
                          message="Too many names"
                          description={`Found ${subjectDataTotal.toLocaleString()} names. This exceeds the limit of ${MAX_LIST_SIZE.toLocaleString()}.`}
                          type="error"
                          style={{ marginTop: "10px" }}
                          closable
                          onClose={() => {
                            setSubjectTaxon(null);
                            setSubjectDataTotal(null);
                          }}
                        />
                      )}
                  </Col>
                </Row>
              </Panel>
            </Collapse>
            <Row style={{ marginTop: "10px" }}>
              <Col>
                If your list contains{" "}
                <i>
                  <u>more than 5000 names</u>
                </i>
                , you should use our{" "}
                <Button
                  type="link"
                  style={{ padding: 0 }}
                  onClick={() => {
                    history.push({
                      pathname: `/tools/name-match-async`,
                    });
                  }}
                >
                  asynchronous matching
                </Button>
                .{" "}
              </Col>
              <Col flex="auto"></Col>
              {names && step === 0 && (
                <Col>
                  <span>{`${names.length} name${
                    names.length === 1 ? "" : "s"
                  } provided for matching `}</span>
                  <Button type="primary" onClick={() => setStep(1)}>
                    Next
                  </Button>
                </Col>
              )}
            </Row>
          </>
        )}
        {step === 1 && (
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
              {(step === 1 || secondaryDataset) && (
                <Col
                  style={
                    showSecondary
                      ? {
                          paddingLeft: "8px",
                          paddingRight: "8px",
                          marginTop: "-22px",
                        }
                      : { paddingLeft: "8px", paddingRight: "8px" }
                  }
                  span={step === 1 || !secondaryDataset ? 12 : 10}
                >
                  <span>Match against two datasets </span>
                  <Switch
                    checked={showSecondary}
                    onChange={(checked) => {
                      setShowSecondary(checked);
                      if (!checked) {
                        setSecondaryDataset(null);
                      }
                    }}
                  />
                  {showSecondary && (
                    <DatasetAutocomplete
                      defaultDatasetKey={
                        secondaryDataset ? secondaryDataset.key : null
                      }
                      onResetSearch={() => setSecondaryDataset(null)}
                      onSelectDataset={setSecondaryDataset}
                      // contributesTo={this.props.catalogueKey}
                      placeHolder="Choose secondary dataset"
                    />
                  )}
                  {step === 2 && (
                    <Row justify="space-between">
                      <Col>
                        <Statistic
                          title={"Matches"}
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
            </Row>
          </>
        )}
        {step === 2 && (
          <>
            <MatchProgress total={names.length} matched={numMatchedNames} />
          </>
        )}
        {step === 3 && (
          <>
            <Row justify="space-between">
              <Col span={12}>
                <Row>
                  <Col span={24}>
                    {secondaryDataset && (
                      <span className="col-reference-link">[1] </span>
                    )}
                    {primaryDataset?.title}
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={"Matches"}
                      value={primaryUsageMetrics}
                      suffix={`/ ${names.length.toLocaleString()}`}
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
              </Col>
              {secondaryDataset && (
                <Col span={12}>
                  <Row>
                    <Col span={24}>
                      <span className="col-reference-link">[2] </span>
                      {secondaryDataset?.title}
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={"Matches"}
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
                </Col>
              )}
            </Row>
          </>
        )}

        {(step === 2 || step === 3) && (
          <Table
            scroll={{ x: 2000 }}
            dataSource={names}
            /* expandable={{
              expandedRowRender: (record) => (
                <pre> {JSON.stringify(record?.original, null, 2)} </pre>
              ),
            }} */
            columns={[
              {
                title: (
                  <Tooltip
                    placement="topLeft"
                    title={
                      "The scientific name from your uploaded csv or the subject dataset you picked"
                    }
                  >
                    Provided Scientific Name
                  </Tooltip>
                ),
                dataIndex: "providedScientificName",
                key: "providedScientificName",
              },
              {
                title: (
                  <Tooltip
                    placement="topLeft"
                    title={
                      "The authorship from your uploaded csv or the subject dataset you picked"
                    }
                  >
                    Provided Authorship
                  </Tooltip>
                ),
                dataIndex: "providedAuthorship",
                key: "providedAuthorship",
              },
              {
                title: "Issues",
                dataIndex: ["issues", "issues"],
                key: "issues",
                render: (text, record) => (
                  <>
                    {record?.issues?.issues?.length > 0
                      ? record?.issues?.issues?.map((i) => (
                          <Tag
                            style={{ marginRight: "6px" }}
                            color={issueMap?.[i]?.color}
                          >
                            {i}
                          </Tag>
                        ))
                      : "None"}
                  </>
                ),
              },
              {
                title: "Match type",
                dataIndex: ["primaryDatasetUsage", "matchType"],
                key: "matchType",
                /*  filters: nameIndexMetrics
                  ? Object.keys(nameIndexMetrics)
                      .filter((k) => matchRemark.includes(k))
                      .map((m) => ({
                        text: m,
                        value: m,
                      }))
                  : null,
                onFilter: (value, record) => {
                  return record.matchType === value;
                }, */
                /*  render: (text, record) =>
                  matchRemark.includes(text) ? (
                    <Tooltip
                      placement="topLeft"
                      title={matchRemarkTooltip[text]}
                    >
                      {" "}
                      <Tag color={_.get(matchTypeTypeMap, `${text}`, "")}>
                        {text}
                      </Tag>{" "}
                    </Tooltip>
                  ) : (
                    ""
                  ), */
                render: (text, record) => (
                  <React.Fragment key={_.get(record, "primaryDatasetUsage.id")}>
                    {_.get(record, "primaryDatasetUsage.matchType") && (
                      <>
                        {" "}
                        {secondaryDataset && (
                          <span className="col-reference-link">[1]</span>
                        )}{" "}
                        {_.get(record, "primaryDatasetUsage.matchType")}
                      </>
                    )}
                    {secondaryDataset && (
                      <React.Fragment>
                        <br />
                        {_.get(record, "secondaryDatasetUsage.matchType") && (
                          <>
                            {" "}
                            <span className="col-reference-link">[2]</span>{" "}
                            {_.get(record, "secondaryDatasetUsage.matchType")}
                          </>
                        )}
                      </React.Fragment>
                    )}
                  </React.Fragment>
                ),
              },

              {
                title: "Scientific Name",
                dataIndex: ["primaryDatasetUsage", "label"],
                key: (
                  <Tooltip
                    placement="topLeft"
                    title={
                      "The name found in the Checklistbank dataset(s) you picked."
                    }
                  >
                    Scientific Name
                  </Tooltip>
                ),
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
                      _.get(record, "primaryDatasetUsage.id") &&
                      !_.get(record, "secondaryDatasetUsage.id")
                    );
                  }
                  if (value === "only_secondary_usage") {
                    return !!(
                      !_.get(record, "primaryDatasetUsage.id") &&
                      _.get(record, "secondaryDatasetUsage.id")
                    );
                  }
                  if (value === "primary_usage") {
                    return !!_.get(record, "primaryDatasetUsage.id");
                  }
                  if (value === "no_primary_usage") {
                    return !_.get(record, "primaryDatasetUsage.id");
                  }
                  if (value === "secondary_usage") {
                    return !!_.get(record, "secondaryDatasetUsage.id");
                  }
                  if (value === "no_secondary_usage") {
                    return !_.get(record, "secondaryDatasetUsage.id");
                  }
                },
                render: (text, record) => {
                  return (
                    <React.Fragment
                      key={_.get(record, "primaryDatasetUsage.id")}
                    >
                      {_.get(record, "primaryDatasetUsage.labelHtml") ? (
                        <>
                          {" "}
                          {secondaryDataset && (
                            <span className="col-reference-link">[1]</span>
                          )}{" "}
                          <span
                            dangerouslySetInnerHTML={{
                              __html: _.get(
                                record,
                                "primaryDatasetUsage.labelHtml"
                              ),
                            }}
                          />
                        </>
                      ) : (
                        <>
                          {secondaryDataset && (
                            <span className="col-reference-link">[1]</span>
                          )}{" "}
                          <Tag color="red">None</Tag>
                        </>
                      )}
                      {secondaryDataset && (
                        <React.Fragment>
                          <br />
                          {_.get(record, "secondaryDatasetUsage.labelHtml") ? (
                            <>
                              {" "}
                              <span className="col-reference-link">
                                [2]
                              </span>{" "}
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: _.get(
                                    record,
                                    "secondaryDatasetUsage.labelHtml"
                                  ),
                                }}
                              />
                            </>
                          ) : (
                            <>
                              {" "}
                              <span className="col-reference-link">
                                [2]
                              </span>{" "}
                              <Tag color="red">None</Tag>
                            </>
                          )}
                        </React.Fragment>
                      )}
                    </React.Fragment>
                  );
                },
              },
              {
                title: "Authorship",
                dataIndex: ["usage", "authorship"],
                key: "authorship",
                render: (text, record) => {
                  return (
                    <>
                      {_.get(record, "primaryDatasetUsage.id") && (
                        <span className="col-reference-link">[1] </span>
                      )}
                      {_.get(record, "primaryDatasetUsage.authorship")}
                      {secondaryDataset && (
                        <>
                          <br />
                          {_.get(record, "secondaryDatasetUsage.id") && (
                            <span className="col-reference-link">[2] </span>
                          )}
                          {_.get(record, "secondaryDatasetUsage.authorship")}
                        </>
                      )}
                    </>
                  );
                },
              },

              {
                title: "Status",
                dataIndex: ["usage", "status"],
                key: "status",
                render: (text, record) => {
                  return (
                    <>
                      {_.get(record, "primaryDatasetUsage.id") && (
                        <span className="col-reference-link">[1] </span>
                      )}
                      {!["synonym", "ambiguous synonym", "misapplied"].includes(
                        _.get(record, "primaryDatasetUsage.status")
                      ) ? (
                        _.get(record, "primaryDatasetUsage.status")
                      ) : (
                        <React.Fragment key={_.get(record, "usage.id")}>
                          {_.get(record, "primaryDatasetUsage.status")}{" "}
                          {_.get(record, "primaryDatasetUsage.status") ===
                          "misapplied"
                            ? "to "
                            : "of "}
                          <span
                            dangerouslySetInnerHTML={{
                              __html: _.get(
                                record,
                                "primaryDatasetUsage.accepted.labelHtml"
                              ),
                            }}
                          />
                        </React.Fragment>
                      )}
                      {secondaryDataset && (
                        <>
                          <br />
                          {_.get(record, "secondaryDatasetUsage.id") && (
                            <span className="col-reference-link">[2] </span>
                          )}
                          {![
                            "synonym",
                            "ambiguous synonym",
                            "misapplied",
                          ].includes(
                            _.get(record, "secondaryDatasetUsage.status")
                          ) ? (
                            _.get(record, "secondaryDatasetUsage.status")
                          ) : (
                            <React.Fragment key={_.get(record, "usage.id")}>
                              {_.get(record, "secondaryDatasetUsage.status")}{" "}
                              {_.get(record, "secondaryDatasetUsage.status") ===
                              "misapplied"
                                ? "to "
                                : "of "}
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: _.get(
                                    record,
                                    "secondaryDatasetUsage.accepted.labelHtml"
                                  ),
                                }}
                              />
                            </React.Fragment>
                          )}
                        </>
                      )}
                    </>
                  );
                },
              },
              ...getClassificationColumns(),
              {
                title: "API",
                dataIndex: ["apilink"],
                key: "apilink",
                render: (text, record) => {
                  return (
                    <a target="_blank" href={_.get(record, "apilink")}>
                      API
                    </a>
                  );
                },
              },
            ]}
          />
        )}
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ nomCode, addError, rank, issueMap }) => ({
  nomCode,
  addError,
  rank,
  issueMap,
});
export default withContext(mapContextToProps)(NameMatch);
