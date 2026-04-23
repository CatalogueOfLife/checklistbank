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
  Tag,
  Switch,
  Tooltip,
  Typography,
  List,
  Spin,
} from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  LoadingOutlined,
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
const { Paragraph } = Typography;

const MAX_LIST_SIZE = 6000;

const { Dragger } = Upload;
const Step = Steps.Step;
const classificationRanks = ["kingdom", "phylum", "class", "order", "family", "genus"];
const API_HINT_PARAMS = [
  "kingdom", "phylum", "subphylum", "class", "subclass",
  "order", "suborder", "superfamily", "family", "subfamily",
  "tribe", "subtribe", "genus", "subgenus", "section",
];

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

const COL_LXR = {
  key: "3LXR",
  alias: "COL LXR",
};

const checkScientificNameHeader = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const firstLine = (e.target.result || "").split(/\r?\n/)[0];
      const headers = firstLine.split(/[\t,;|$]/).map((h) => h.trim().toLowerCase());
      resolve(headers.includes("scientificname"));
    };
    reader.readAsText(file.slice(0, 2048));
  });

const downloadTsv = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => row[h] ?? "").join("\t"));
  const content = [headers.join("\t"), ...rows].join("\n");
  const blob = new Blob([content], { type: "text/tab-separated-values" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const FileFormatList = () => (
  <List itemLayout="horizontal" bordered style={{ marginTop: "16px" }}>
    <List.Item>
      <List.Item.Meta title="ID" description="A unique identifier for your name" />
    </List.Item>
    <List.Item>
      <List.Item.Meta
        title="scientificName"
        description="The scientific name to be matched. May include the authorship"
      />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="authorship" description="Authorship of the scientificName" />
    </List.Item>
    <List.Item>
      <List.Item.Meta
        title="rank"
        description="The rank of the name, preferably given in case-insensitive English. See http://api.checklistbank.org/vocab/rank"
      />
    </List.Item>
    <List.Item>
      <List.Item.Meta
        title="code"
        description="The nomenclatural code the name falls under. See http://api.checklistbank.org/vocab/nomCode"
      />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="kingdom" description="The kingdom the name is classified in, e.g. Animalia" />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="phylum" description="The phylum the name is classified in, e.g. Arthropoda" />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="subphylum" description="The subphylum the name is classified in" />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="class" description="The class the name is classified in, e.g. Insecta" />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="subclass" description="The subclass the name is classified in" />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="order" description="The order the name is classified in, e.g. Lepidoptera" />
    </List.Item>
    <List.Item>
      <List.Item.Meta
        title="suborder"
        description="The suborder the name is classified in, e.g. Glossata"
      />
    </List.Item>
    <List.Item>
      <List.Item.Meta
        title="superfamily"
        description="The superfamily the name is classified in, e.g. Papilionoidea"
      />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="family" description="The family the name is classified in, e.g. Nymphalidae" />
    </List.Item>
    <List.Item>
      <List.Item.Meta
        title="subfamily"
        description="The subfamily the name is classified in, e.g. Danainae"
      />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="tribe" description="The tribe the name is classified in, e.g. Danaini" />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="subtribe" description="The subtribe the name is classified in" />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="genus" description="The genus the name is classified in, e.g. Danaus" />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="subgenus" description="The subgenus the name is classified in" />
    </List.Item>
    <List.Item>
      <List.Item.Meta
        title="section"
        description="The (botanical) section the name is classified in"
      />
    </List.Item>
  </List>
);

const NameMatch = ({ addError, issueMap, user }) => {
  const [error, setError] = useState(null);
  const [names, setNames] = useState(null);
  const [defaultCode] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [step, setStep] = useState(0);
  const [primaryDataset, setPrimaryDataset] = useState(COL_LXR);
  const [secondaryDataset, setSecondaryDataset] = useState(null);
  const [subjectDataset, setSubjectDataset] = useState(null);
  const [subjectTaxon, setSubjectTaxon] = useState(null);
  const [subjectDataLoading, setSubjectDataLoading] = useState(false);
  const [subjectDataTotal, setSubjectDataTotal] = useState(null);
  const [numMatchedNames, setNumMatchedNames] = useState(0);
  const [primaryUsageMetrics, setPrimaryUsageMetrics] = useState(null);
  const [secondaryUsageMetrics, setSecondaryUsageMetrics] = useState(null);
  const [showSecondary, setShowSecondary] = useState(false);
  const [inputType, setInputType] = useState("1");
  const [textAreaVal, setTextAreaVal] = useState("");
  const [asyncMode, setAsyncMode] = useState(false);
  const [asyncSubmitting, setAsyncSubmitting] = useState(false);
  const [asyncFile, setAsyncFile] = useState(null);
  const [originalHeaders, setOriginalHeaders] = useState([]);
  const [primaryMatcherStatus, setPrimaryMatcherStatus] = useState(null);
  const [secondaryMatcherStatus, setSecondaryMatcherStatus] = useState(null);
  const [primaryMatcherRequested, setPrimaryMatcherRequested] = useState(false);
  const [secondaryMatcherRequested, setSecondaryMatcherRequested] = useState(false);

  const formatUsageClassification = (usage) => {
    let result = {};
    if (usage?.classification) {
      result.keyedClassification = _.keyBy(usage?.classification, "rank");
      result.fullClassification = usage?.classification
        .map((tx) => `${tx.rank.toUpperCase()}:${tx.name}`)
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

  const checkMatcher = async (datasetKey, setStatus) => {
    setStatus('checking');
    try {
      const { data } = await axios.get(`${config.dataApi}matcher/${datasetKey}`);
      setStatus(data.size > 0 ? 'ok' : 'missing');
    } catch (err) {
      setStatus(err?.response?.status === 404 ? 'missing' : 'ok');
    }
  };

  const requestMatcher = async (datasetKey, setStatus, setRequested) => {
    try {
      await axios.post(`${config.dataApi}matcher/${datasetKey}`);
      setRequested(true);
    } catch (err) {
      console.log(err);
    }
  };

  const matcherStatusUI = (status, requested, datasetKey, setStatus, setRequested) => {
    if (status === 'checking') {
      return (
        <div style={{ marginTop: 6 }}>
          <Spin size="small" /> <span style={{ marginLeft: 8, color: '#888' }}>Checking matcher index…</span>
        </div>
      );
    }
    if (status === 'missing' && !requested) {
      return (
        <Alert
          style={{ marginTop: 6 }}
          type="warning"
          message="No matcher index exists for this dataset — matching results will be incorrect."
          action={
            <Button size="small" onClick={() => requestMatcher(datasetKey, setStatus, setRequested)}>
              Request matcher
            </Button>
          }
        />
      );
    }
    if (status === 'missing' && requested) {
      return (
        <Alert
          style={{ marginTop: 6 }}
          type="info"
          message="Matcher is being built. Please come back in about an hour before running the match."
        />
      );
    }
    return null;
  };

  const matcherBlocking = primaryMatcherStatus === 'checking' || primaryMatcherStatus === 'missing' ||
    secondaryMatcherStatus === 'checking' || secondaryMatcherStatus === 'missing';

  const matchParams = (name) => {
    let nidxParams = `?q=${encodeURIComponent(name.providedScientificName)}`;
    if (name.rank) {
      nidxParams += `&rank=${encodeURIComponent(name.rank)}`;
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
    API_HINT_PARAMS.forEach((param) => {
      if (name[param]) {
        nidxParams += `&${param}=${encodeURIComponent(name[param])}`;
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
    }
  };

  const isValidFile = (file) => {
    return (
      !!file &&
      (file.type == "" ||
        file.type == "text/csv" ||
        file.type == "text/plain" ||
        file.type == "text/tab-separated-values" ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".tsv") ||
        file.name.endsWith(".txt"))
    );
  };

  const matchResult = async () => {
    setNumMatchedNames(0);
    let result = names;
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

    const grouped = _.groupBy(result, "matchType");
    let metrics = {};
    Object.keys(grouped).forEach((k) => {
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
    setStep(3);
  };

  const parseFile = (file) => {
    if (!isValidFile(file)) {
      setError(
        "Invalid file format - the file must be a csv or tsv file and all rows must have a scientificName column"
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
            const headers = Object.keys(result[0]);
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
              setOriginalHeaders(headers);
              setNames(result);
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
    classificationRanks.map((rank) => ({
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
    const usageKey =
      !whichDataset || whichDataset === "primary"
        ? "primaryDatasetUsage"
        : "secondaryDatasetUsage";
    return names.map((n) => {
      const u = _.get(n, usageKey);
      const isAccepted = _.get(u, "status") === "accepted";

      // Preserve original input columns dynamically (CSV upload) or fall back to
      // a minimal fixed set (simple text entry / dataset picker).
      const row = {};
      if (originalHeaders.length > 0) {
        originalHeaders.forEach((header) => {
          row[`original_${header}`] = n[header.toLowerCase()] ?? "";
        });
      } else {
        row.original_scientificName = n.providedScientificName || "";
        if (n.providedAuthorship) row.original_authorship = n.providedAuthorship;
      }

      row.matchType = _.get(u, "matchType", "");
      row.matchIssues = (_.get(n, "issues.issues") || []).join(";");
      row.ID = _.get(u, "id", "");
      row.rank = _.get(u, "rank", "");
      row.scientificName = _.get(u, "name", "");
      row.authorship = _.get(u, "authorship", "");
      row.status = _.get(u, "status", "");
      row.acceptedID = isAccepted ? "" : _.get(u, "accepted.id", "");
      row.acceptedScientificName = isAccepted ? "" : _.get(u, "accepted.name", "");
      row.acceptedAuthorship = isAccepted ? "" : _.get(u, "accepted.authorship", "");
      classificationRanks.forEach((r) => {
        row[r] = _.get(u, `keyedClassification.${r}.name`, "");
      });
      row.classification = _.get(u, "fullClassification", "");
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
    }.tsv`.replace(" ", "_");
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
  };

  const handleModeSwitch = (checked) => {
    setAsyncMode(checked);
    setNames(null);
    setStep(0);
    setTextAreaVal("");
    // panel "1" (simple text entry) is only available in sync mode
    if (checked && inputType === "1") setInputType("2");
    setSubjectDataset(null);
    setSubjectTaxon(null);
    setSubjectDataTotal(null);
    setAsyncFile(null);
    setOriginalHeaders([]);
  };

  const submitAsyncJob = async () => {
    setAsyncSubmitting(true);
    try {
      let res;
      if (asyncFile) {
        res = await axios.post(
          `${config.dataApi}dataset/${primaryDataset.key}/match/nameusage/job`,
          asyncFile,
          { headers: { "Content-Type": "text/plain" } }
        );
      } else {
        const body = { sourceDatasetKey: subjectDataset.key };
        if (subjectTaxon?.key) body.taxonID = subjectTaxon.key;
        res = await axios.post(
          `${config.dataApi}dataset/${primaryDataset.key}/match/nameusage/job`,
          body
        );
      }
      history.push({ pathname: `/tools/name-match/job/${res.data.key}` });
    } catch (err) {
      setSubmissionError(err);
    } finally {
      setAsyncSubmitting(false);
    }
  };

  return (
    <Layout
      selectedKeys={["namematch"]}
      openKeys={["tools"]}
      title="Name Matching"
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

        {/* Header row */}
        <Row style={{ marginBottom: "16px", alignItems: "center" }}>
          <Col flex="auto">
            {asyncMode
              ? "Upload a file or select a ChecklistBank dataset for asynchronous name matching."
              : "Please choose between one of three ways of submitting your names to the matching service:"}
          </Col>
          {!!user && (
            <Col>
              <span style={{ marginRight: 8 }}>Asynchronous mode</span>
              <Switch checked={asyncMode} onChange={handleModeSwitch} />
            </Col>
          )}
        </Row>

        {/* ======================================================= */}
        {/* UNIFIED STEP WORKFLOW (sync + async)                     */}
        {/* ======================================================= */}
        <>
          <Steps
            current={step}
            style={{ marginBottom: "24px" }}
            onChange={(current) => {
              if (!asyncMode || current <= 1) setStep(current);
            }}
          >
            <Step title={"Input data"} />
            <Step title={"Target data"} />
            <Step
              title={"Matching"}
              icon={step === 2 ? <LoadingOutlined /> : null}
              disabled={asyncMode || step !== 2}
            />
            <Step title={"Review result"} disabled={asyncMode} />
          </Steps>

          {/* STEP 0: Input panels */}
          {step === 0 && (
            <>
              {(asyncMode ? (asyncFile || subjectDataset) : names) && (
                <Row justify="end" style={{ marginBottom: "8px" }}>
                  <Col>
                    {!asyncMode && (
                      <span>{`${names.length} name${
                        names.length === 1 ? "" : "s"
                      } provided for matching `}</span>
                    )}
                    <Button type="primary" onClick={() => setStep(1)}>
                      Next
                    </Button>
                  </Col>
                </Row>
              )}
              <Collapse
                activeKey={inputType}
                onChange={(key) => setInputType(key)}
                accordion
              >
                {!asyncMode && (
                  <Panel header="Simple data entry" key="1">
                    <Row gutter={[16, 16]}>
                      <Col span={16}>
                        <TextArea
                          name="names"
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
                            Paste or write names - one name per row. Names may
                            include the author string.
                          </Paragraph>
                        </Typography>
                      </Col>
                    </Row>
                  </Panel>
                )}
                {!!user && (
                  <Panel header="Upload CSV/TSV" key="2">
                    <Dragger
                      name="file"
                      multiple={false}
                      beforeUpload={asyncMode ? async (file) => {
                        if (!isValidFile(file)) {
                          setError("Invalid file format — the file must be a CSV or TSV file");
                          return false;
                        }
                        const hasHeader = await checkScientificNameHeader(file);
                        if (!hasHeader) {
                          setError("The file must contain a scientificName column");
                          return false;
                        }
                        setAsyncFile(file);
                        setError(null);
                        return false;
                      } : draggerProps.beforeUpload}
                      {...(asyncMode ? { fileList: asyncFile ? [asyncFile] : [], onRemove: () => setAsyncFile(null) } : {})}
                    >
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined />
                      </p>
                      <p className="ant-upload-text">
                        Click or drag file to this area to upload
                      </p>
                      <p className="ant-upload-hint">
                        Your file must contain a column{" "}
                        <code className="code">scientificName</code> (which may
                        include the author)
                      </p>
                      <p className="ant-upload-hint">
                        Optional but recommended:{" "}
                        <code className="code">authorship</code>,{" "}
                        <code className="code">rank</code>,{" "}
                        <code className="code">code</code> and the classification (see below)
                      </p>
                      {asyncMode && (
                        <p className="ant-upload-hint">
                          You will receive an email when the result is ready.
                        </p>
                      )}
                    </Dragger>
                    <Typography style={{ marginTop: "16px" }}>
                      <Paragraph>
                        Your uploaded file has to be a comma (CSV) or tab (TSV)
                        delimited text file with a header row to specify column
                        names (
                        <a
                          target="_blank"
                          href="https://gist.githubusercontent.com/mdoering/e8f464e97ac524973758c73162e4bf97/raw/8e38e8ab493d0afdcd7089b98358fc41e2f38d01/names.tsv"
                        >
                          example
                        </a>
                        ). It can contain any number of columns but must at least
                        contain <code className="code">scientificName</code>. For
                        better matching results include <code className="code">rank</code> and as many of the following{" "}
                        <a href="https://github.com/CatalogueOfLife/coldp/blob/master/README.md#nameusage">
                          ColDP columns
                        </a>{" "}
                        as possible:
                      </Paragraph>
                    </Typography>
                    <FileFormatList />
                  </Panel>
                )}
                {!!user && (
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
                        {asyncMode ? "And an optional root taxon:" : "And a root taxon:"}
                        <NameAutocomplete
                          minRank="GENUS"
                          defaultTaxonKey={_.get(subjectTaxon, "key", null)}
                          datasetKey={_.get(subjectDataset, "key")}
                          onError={setError}
                          disabled={!subjectDataset}
                          onSelectName={(name) => {
                            setSubjectTaxon(name);
                            if (!asyncMode) testSizeLimit(name);
                          }}
                          onResetSearch={() => {
                            setSubjectTaxon(null);
                            if (!asyncMode) setSubjectDataTotal(null);
                          }}
                        />
                        {!asyncMode && !_.isNull(subjectDataTotal) &&
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
                        {!asyncMode && !_.isNull(subjectDataTotal) &&
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
                )}
              </Collapse>
              <Row style={{ marginTop: "10px" }}>
                {!user && (
                  <Col>
                    <Alert
                      type="info"
                      message="File upload and dataset matching are also available — please log in to use them."
                    />
                  </Col>
                )}
                {!!user && !asyncMode && (
                  <Col>
                    If your list contains{" "}
                    <i>
                      <u>more than 5000 names</u>
                    </i>
                    , switch to <b>Asynchronous mode</b> using the toggle above.
                  </Col>
                )}
                <Col flex="auto"></Col>
                {(asyncMode ? (asyncFile || subjectDataset) : names) && (
                  <Col>
                    {!asyncMode && (
                      <span>{`${names.length} name${
                        names.length === 1 ? "" : "s"
                      } provided for matching `}</span>
                    )}
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
                  span={!secondaryDataset || asyncMode ? 12 : 10}
                >
                  <DatasetAutocomplete
                    defaultDatasetKey={primaryDataset?.key}
                    onResetSearch={() => {
                      setPrimaryDataset(null);
                      setPrimaryMatcherStatus(null);
                      setPrimaryMatcherRequested(false);
                    }}
                    onSelectDataset={(dataset) => {
                      setPrimaryDataset(dataset);
                      setPrimaryMatcherRequested(false);
                      checkMatcher(dataset.key, setPrimaryMatcherStatus);
                    }}
                    placeHolder="Choose primary dataset"
                  />
                  {matcherStatusUI(primaryMatcherStatus, primaryMatcherRequested, primaryDataset?.key, setPrimaryMatcherStatus, setPrimaryMatcherRequested)}
                </Col>
                {!asyncMode && (
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
                    span={!secondaryDataset ? 12 : 10}
                  >
                    <span>Match against two datasets </span>
                    <Switch
                      checked={showSecondary}
                      onChange={(checked) => {
                        setShowSecondary(checked);
                        if (!checked) {
                          setSecondaryDataset(null);
                          setSecondaryMatcherStatus(null);
                          setSecondaryMatcherRequested(false);
                        }
                      }}
                    />
                    {showSecondary && (
                      <>
                        <DatasetAutocomplete
                          defaultDatasetKey={
                            secondaryDataset ? secondaryDataset.key : null
                          }
                          onResetSearch={() => {
                            setSecondaryDataset(null);
                            setSecondaryMatcherStatus(null);
                            setSecondaryMatcherRequested(false);
                          }}
                          onSelectDataset={(dataset) => {
                            setSecondaryDataset(dataset);
                            setSecondaryMatcherRequested(false);
                            checkMatcher(dataset.key, setSecondaryMatcherStatus);
                          }}
                          placeHolder="Choose secondary dataset"
                        />
                        {matcherStatusUI(secondaryMatcherStatus, secondaryMatcherRequested, secondaryDataset?.key, setSecondaryMatcherStatus, setSecondaryMatcherRequested)}
                      </>
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
                          <Button
                            type="primary"
                            style={{ marginTop: "10px" }}
                            onClick={() => downloadTsv(getDownLoadData("secondary"), getDownLoadDataFileName("secondary"))}
                          >
                            <DownloadOutlined /> Download result
                          </Button>
                        </Col>
                      </Row>
                    )}
                  </Col>
                )}
              </Row>
              {asyncMode && (
                <Row style={{ marginTop: "16px" }}>
                  <Col>
                    <Button
                      type="primary"
                      onClick={submitAsyncJob}
                      loading={asyncSubmitting}
                      disabled={!primaryDataset || matcherBlocking}
                    >
                      Submit matching job
                    </Button>
                  </Col>
                </Row>
              )}
              {!asyncMode && names && (
                <Row style={{ marginTop: "16px" }} justify="end">
                  <Col>
                    <span>{`${names.length} name${
                      names.length === 1 ? "" : "s"
                    } provided for matching `}</span>
                    <Button type="primary" onClick={matchResult} disabled={!primaryDataset || matcherBlocking}>
                      Match
                    </Button>
                  </Col>
                </Row>
              )}
            </>
          )}

          {!asyncMode && step === 2 && (
            <MatchProgress total={names.length} matched={numMatchedNames} />
          )}

          {!asyncMode && step === 3 && (
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
                      <Button
                        type="primary"
                        style={{ marginTop: "10px" }}
                        onClick={() => downloadTsv(getDownLoadData("primary"), getDownLoadDataFileName("primary"))}
                      >
                        <DownloadOutlined /> Download result
                      </Button>
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
                          <Button
                            type="primary"
                            style={{ marginTop: "10px" }}
                            onClick={() => downloadTsv(getDownLoadData("secondary"), getDownLoadDataFileName("secondary"))}
                          >
                            <DownloadOutlined /> Download result
                          </Button>
                      </Col>
                    </Row>
                  </Col>
                )}
              </Row>
            </>
          )}

          {!asyncMode && (step === 2 || step === 3) && (
            <Table
              scroll={{ x: 2000 }}
              dataSource={names}
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
                    render: (text, record) => (
                      <React.Fragment
                        key={_.get(record, "primaryDatasetUsage.id")}
                      >
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
                            {_.get(
                              record,
                              "secondaryDatasetUsage.matchType"
                            ) && (
                              <>
                                {" "}
                                <span className="col-reference-link">
                                  [2]
                                </span>{" "}
                                {_.get(
                                  record,
                                  "secondaryDatasetUsage.matchType"
                                )}
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
                              <a
                                href={`/dataset/${primaryDataset.key}/nameusage/${_.get(record, "primaryDatasetUsage.id")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: _.get(
                                      record,
                                      "primaryDatasetUsage.labelHtml"
                                    ),
                                  }}
                                />
                              </a>
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
                              {_.get(
                                record,
                                "secondaryDatasetUsage.labelHtml"
                              ) ? (
                                <>
                                  {" "}
                                  <span className="col-reference-link">
                                    [2]
                                  </span>{" "}
                                  <a
                                    href={`/dataset/${secondaryDataset.key}/nameusage/${_.get(record, "secondaryDatasetUsage.id")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: _.get(
                                          record,
                                          "secondaryDatasetUsage.labelHtml"
                                        ),
                                      }}
                                    />
                                  </a>
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
                          {secondaryDataset && _.get(record, "primaryDatasetUsage.id") && (
                            <span className="col-reference-link">[1] </span>
                          )}
                          {![
                            "synonym",
                            "ambiguous synonym",
                            "misapplied",
                          ].includes(
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
                                <span className="col-reference-link">
                                  [2]{" "}
                                </span>
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
                                <React.Fragment
                                  key={_.get(record, "usage.id")}
                                >
                                  {_.get(
                                    record,
                                    "secondaryDatasetUsage.status"
                                  )}{" "}
                                  {_.get(
                                    record,
                                    "secondaryDatasetUsage.status"
                                  ) === "misapplied"
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
          </>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError, issueMap, user }) => ({
  addError,
  issueMap,
  user,
});
export default withContext(mapContextToProps)(NameMatch);
