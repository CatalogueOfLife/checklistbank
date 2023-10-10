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
import { Converter } from "csvtojson/v1";
import PQueue from "p-queue";
const { Panel } = Collapse;
const { TextArea } = Input;
const { Paragraph } = Typography;

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
const COL_LR = {
  key: "3LR",
  alias: "COL LR",
};
const NameMatch = ({ addError }) => {
  const [error, setError] = useState(null);
  const [names, setNames] = useState(null);
  const [defaultCode, setDefaultCode] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [step, setStep] = useState(0);
  const [primaryDataset, setPrimaryDataset] = useState(COL_LR);
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
  const match = async (name) => {
    try {
      let nidxParams = `?q=${encodeURIComponent(name.providedScientificName)}`;
      if (name.code) {
        nidxParams += `&code=${name.code}`;
      }
      if (name.rank) {
        nidxParams += `&rank=${name.rank}`;
      }
      if (name.author) {
        nidxParams += `&author=${encodeURIComponent(name.author)}`;
      }
      /* const { data: indexMatch } = await axios(
        `${config.dataApi}nidx/match${nidxParams}`
      ); */
      const { data: primaryDatasetUsages } = await axios(
        `${config.dataApi}dataset/${primaryDataset.key}/match/nameusage${nidxParams}`
      );
      name.primaryDatasetUsage = _.get(primaryDatasetUsages, "result[0]");

      if (name.primaryDatasetUsage) {
        const { data: classification } = await axios(
          `${config.dataApi}dataset/${primaryDataset.key}/match/nameusage${nidxParams}`
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
          `${config.dataApi}dataset/${secondaryDataset.key}/match/nameusage${nidxParams}`
        );
        name.secondaryDatasetUsage = _.get(secondaryDatasetUsages, "result[0]");
        if (name.secondaryDatasetUsage) {
          const { data: classification } = await axios(
            `${config.dataApi}dataset/${secondaryDataset.key}/taxon/${name.secondaryDatasetUsage.id}/classification`
          );
          if (classification) {
            name.secondaryDatasetUsage.classification = _.keyBy(
              classification,
              "rank"
            );
          }
        }
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
              // setStep(1);
              // matchResult(result);
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
        matchRemark: matchRemark.includes(n.matchType) ? n.matchType : "",
        nameIndexId: _.get(n, `nidx.name.id`, ""),
        taxonId: _.get(n, `${usage}.id`, ""),
        acceptedTaxonId: _.get(
          n,
          `${usage}.accepted.id`,
          _.get(n, `${usage}.id`, "")
        ),
        parentTaxonId: _.get(n, `${usage}.parentId`, ""),
        scientificName: _.get(n, `${usage}.label`, ""),
        status: _.get(n, `${usage}.status`, ""),
        acceptedScientificName: _.get(
          n,
          `${usage}.accepted.label`,
          _.get(n, `${usage}.label`, "")
        ),
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
        {names && step === 0 && (
          <Row style={{ marginBottom: "10px" }}>
            <Col flex="auto"></Col>
            <Col>
              <span>{`${names.length} name${
                names.length === 1 ? "" : "s"
              } provided for matching `}</span>
              <Button type="primary" onClick={() => setStep(1)}>
                Next
              </Button>
            </Col>
          </Row>
        )}
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
                    include the author) and optional columns{" "}
                    <code className="code">author</code>,{" "}
                    <code className="code">rank</code> and{" "}
                    <code className="code">code</code> (nomenclatural code)
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
            columns={[
              {
                title: (
                  <Tooltip
                    placement="topLeft"
                    title={
                      "The name from your uploaded csv or the subject dataset you picked"
                    }
                  >
                    Provided Scientific Name
                  </Tooltip>
                ),
                dataIndex: "providedScientificName",
                key: "providedScientificName",
              },
              {
                title: "Match remark",
                dataIndex: "matchType",
                key: "matchType",
                filters: nameIndexMetrics
                  ? Object.keys(nameIndexMetrics)
                      .filter((k) => matchRemark.includes(k))
                      .map((m) => ({
                        text: m,
                        value: m,
                      }))
                  : null,
                onFilter: (value, record) => {
                  return record.matchType === value;
                },
                render: (text, record) =>
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
                title: "Status",
                dataIndex: ["usage", "status"],
                key: "status",
                render: (text, record) => {
                  return (
                    <>
                      <span className="col-reference-link">[1]</span>{" "}
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
                          <span className="col-reference-link">[2]</span>{" "}
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
            ]}
          />
        )}

        {/*         {step !== 1 && (
          <>
            {step === 0 && (
              <Divider
                orientation="left"
                style={{ marginTop: "24px", marginBottom: "24px" }}
              >
                Data you want to match against
              </Divider>
            )}
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
                )}
              </Col>
              {(step < 1 || secondaryDataset) && (
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
                  span={step === 0 || !secondaryDataset ? 12 : 10}
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

        {step === 0 && (
          <>
            <Divider orientation="left" style={{ marginTop: "48px" }}>
              Your input data
            </Divider>
            <Row style={{ marginTop: "10px" }}>
              <Col span={12} style={{ paddingRight: "8px" }}>
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
                    include the author) and optional columns{" "}
                    <code className="code">author</code>,{" "}
                    <code className="code">rank</code> and{" "}
                    <code className="code">code</code> (nomenclatural code)
                  </p>
                </Dragger>
              </Col>
              <Col
                span={12}
                style={{ paddingRight: "8px", paddingLeft: "8px" }}
              >
                Or select a subject dataset:
                <DatasetAutocomplete
                  onResetSearch={() => {
                    setSubjectDataset(null);
                    setSubjectTaxon(null);
                  }}
                  onSelectDataset={(dataset) => {
                    setSubjectDataset(dataset);
                    setSubjectTaxon(null);
                  }}
                  placeHolder="Choose subject dataset"
                />
                And a root taxon:
                <NameAutocomplete
                  minRank="GENUS"
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
                      Match {subjectDataTotal.toLocaleString()} names
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
          </>
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
                title: (
                  <Tooltip
                    placement="topLeft"
                    title={
                      "The name from your uploaded csv or the subject dataset you picked"
                    }
                  >
                    Provided Scientific Name
                  </Tooltip>
                ),
                dataIndex: "providedScientificName",
                key: "providedScientificName",
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
        )} */}
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ nomCode, addError }) => ({
  nomCode,
  addError,
});
export default withContext(mapContextToProps)(NameMatch);
