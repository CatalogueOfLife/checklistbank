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
} from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import history from "../../history";
import { NavLink } from "react-router-dom";

import DatasetAutocomplete from "../project/Assembly/DatasetAutocomplete";
import NameAutocomplete from "../project/Assembly/NameAutocomplete";
import NameMatchContext from "./NameMatchContext";
import ErrorMsg from "../../components/ErrorMsg";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import ToolHeader from "./ToolHeader";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import csv from "csvtojson/v2";
// p-queue 6.x is a CJS module that sets __esModule: true and assigns
// module.exports.default. Vite 7 / esbuild auto-unwrapped that; Vite 8 /
// Rolldown returns the wrapper object, so `new PQueue(...)` throws
// "PQueue is not a constructor". Pick the constructor out manually.
import PQueueModule from "p-queue";
const PQueue = PQueueModule?.default ?? PQueueModule;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Paragraph, Text } = Typography;

// Shows which dataset a match ran against: linked title plus alias & version (#1683)
const DatasetRef = ({ dataset }) =>
  dataset ? (
    <span>
      <NavLink to={`/dataset/${dataset.key}`}>
        {dataset.title || dataset.alias || dataset.key}
      </NavLink>
      {dataset.title && dataset.alias && (
        <Text style={{ fontSize: "0.85em" }}> · {dataset.alias}</Text>
      )}
      {dataset.version && (
        <Text type="secondary" style={{ fontSize: "0.85em" }}>
          {" "}
          · {dataset.version}
        </Text>
      )}
    </span>
  ) : null;

const MAX_LIST_SIZE = 6000;
// Above this many names a subject dataset can no longer be matched synchronously
// and the user must switch to asynchronous mode.
const MAX_SYNC_SIZE = 5000;

const { Dragger } = Upload;
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

const NameMatch = ({ addError, issueMap, user, nomCode }) => {
  const [error, setError] = useState(null);
  const [names, setNames] = useState(null);
  // A single nomenclatural code and a set of higher taxa (name + major rank) the
  // user can pin as matching hints for every input record of the simple entry
  // form and the synchronous CSV/TSV upload. Merged in at match time by
  // applyMatchContext (gap-fill: per-record values win).
  const [defaultCode, setDefaultCode] = useState(null);
  const [higherTaxa, setHigherTaxa] = useState([{ rank: undefined, name: "" }]);
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

  // Final action on the input step: run the match (sync) or submit a job (async).
  const inputActionButton = asyncMode ? (
    <Button
      type="primary"
      onClick={() => submitAsyncJob()}
      loading={asyncSubmitting}
      disabled={!primaryDataset || !(asyncFile || subjectDataset)}
    >
      Submit matching job
    </Button>
  ) : (
    <Button
      type="primary"
      onClick={() => matchResult()}
      disabled={!names || !primaryDataset}
    >
      Match
    </Button>
  );

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
        name.secondaryApilink = `${config.dataApi}dataset/${secondaryDataset.key}/match/nameusage${params}&verbose=true`;
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

  // Merge the pinned code + higher taxa into a record. Returns a NEW object so the
  // base input array is never mutated; existing per-record values win (gap-fill),
  // so CSV rows carrying their own code/classification columns are preserved.
  const applyMatchContext = (rec) => {
    const merged = { ...rec };
    if (defaultCode && !merged.code) merged.code = defaultCode;
    higherTaxa.forEach(({ rank, name }) => {
      const n = (name || "").trim();
      if (rank && n && !merged[rank]) merged[rank] = n;
    });
    return merged;
  };

  const matchResult = async (namesArg, { applyContext = true } = {}) => {
    setNumMatchedNames(0);
    let result = namesArg || names;
    if (applyContext) {
      // Store the merged records so the result table and TSV download reflect the
      // injected context, and so match() attaches its results to these objects.
      result = result.map(applyMatchContext);
      setNames(result);
    }
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
        if (n.providedId) row.original_ID = n.providedId;
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

  // Fetch a quick estimate of how many names the current subject selection holds,
  // reading from precomputed metrics rather than counting live. With a root taxon
  // we use the taxon metrics; for a whole dataset the latest import metrics
  // (accepted taxa + synonyms, matching the synonyms=true export).
  const fetchSubjectTotal = async (datasetKey, taxon) => {
    try {
      if (taxon?.key) {
        const { data } = await axios(
          `${config.dataApi}dataset/${datasetKey}/taxon/${encodeURIComponent(
            taxon.key
          )}/metrics`
        );
        setSubjectDataTotal(_.get(data, "taxonCount", 0));
      } else {
        const { data } = await axios(
          `${config.dataApi}dataset/${datasetKey}/import?limit=1&state=FINISHED`
        );
        const m = Array.isArray(data) ? data[0] : null;
        setSubjectDataTotal(
          m ? _.get(m, "taxonCount", 0) + _.get(m, "synonymCount", 0) : null
        );
      }
    } catch (err) {
      console.log(err);
      setSubjectDataTotal(null);
    }
  };

  const getSubjectDataAndMatch = async () => {
    setSubjectDataLoading(true);
    try {
      const { data } = await axios(
        `${config.dataApi}dataset/${subjectDataset.key}/export.json?flat=true&synonyms=true${
          subjectTaxon?.key ? `&taxonID=${subjectTaxon.key}` : ""
        }`
      );
      console.log("Data retrieved " + data.length);
      // Mirror the CSV upload path: keep the source authorship (both as a match
      // hint and for the "Provided Authorship" column) and the source id so the
      // downloaded result carries an original_ID column (#1701).
      const result = data.map((e) => ({
        providedScientificName: e?.name,
        providedAuthorship: e?.authorship || "",
        providedId: e?.id,
        authorship: e?.authorship,
        rank: e?.rank,
        code: e?.code || defaultCode,
        scientificName: undefined,
      }));
      setSubjectDataLoading(false);
      setNames(result);
      // Source dataset records already carry rank/code and a full classification;
      // the pinned higher-taxa hints are meaningless here, so skip the merge.
      matchResult(result, { applyContext: false });
    } catch (error) {
      setSubjectDataLoading(false);
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
        <ToolHeader id="name-match" />
        {submissionError && (
          <Alert
            type="error"
            closable={{ onClose: () => setSubmissionError(null) }}
            title={
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
            closable={{ onClose: () => setError(null) }}
            title={error}
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
            items={[
              { title: "Target data" },
              { title: "Input data" },
              {
                title: "Matching",
                icon: step === 2 ? <LoadingOutlined /> : undefined,
                disabled: asyncMode || step !== 2,
              },
              { title: "Review result", disabled: asyncMode },
            ]}
          />

          {/* STEP 1: Input panels */}
          {step === 1 && (
            <>
              {(asyncMode ? (asyncFile || subjectDataset) : names) && (
                <Row justify="end" style={{ marginBottom: "8px" }}>
                  <Col>
                    {!asyncMode && (
                      <span>{`${names.length} name${
                        names.length === 1 ? "" : "s"
                      } provided for matching `}</span>
                    )}
                    {inputActionButton}
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
                        <NameMatchContext
                          code={defaultCode}
                          onCodeChange={setDefaultCode}
                          higherTaxa={higherTaxa}
                          onHigherTaxaChange={setHigherTaxa}
                          nomCode={nomCode}
                        />
                      </Col>
                    </Row>
                  </Panel>
                )}
                {!!user && (
                  <Panel header="Upload CSV/TSV" key="2">
                    {!asyncMode && (
                      <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
                        <Col span={8}>
                          <NameMatchContext
                            code={defaultCode}
                            onCodeChange={setDefaultCode}
                            higherTaxa={higherTaxa}
                            onHigherTaxaChange={setHigherTaxa}
                            nomCode={nomCode}
                          />
                        </Col>
                        <Col span={16}>
                          <Typography>
                            <Paragraph type="secondary">
                              Optional: pin a nomenclatural code and higher taxa
                              to apply to every row that does not already provide
                              its own <code className="code">code</code> or
                              classification columns.
                            </Paragraph>
                          </Typography>
                        </Col>
                      </Row>
                    )}
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
                            setSubjectDataTotal(null);
                          }}
                          onSelectDataset={(dataset) => {
                            setSubjectDataset(dataset);
                            if (dataset?.key !== subjectDataset?.key) {
                              setSubjectTaxon(null);
                            }
                            fetchSubjectTotal(dataset.key, null);
                          }}
                          placeHolder="Choose subject dataset"
                        />
                        And an optional root taxon:
                        <NameAutocomplete
                          minRank="GENUS"
                          defaultTaxonKey={_.get(subjectTaxon, "key", null)}
                          datasetKey={_.get(subjectDataset, "key")}
                          onError={setError}
                          disabled={!subjectDataset}
                          onSelectName={(name) => {
                            setSubjectTaxon(name);
                            fetchSubjectTotal(subjectDataset.key, name);
                          }}
                          onResetSearch={() => {
                            setSubjectTaxon(null);
                            if (subjectDataset) fetchSubjectTotal(subjectDataset.key, null);
                          }}
                        />
                        {!_.isNull(subjectDataTotal) && (
                          <div style={{ marginTop: "10px" }}>
                            <Statistic
                              title={subjectTaxon ? "Names below the root taxon" : "Names in dataset"}
                              value={subjectDataTotal}
                            />
                          </div>
                        )}
                        {!asyncMode && !_.isNull(subjectDataTotal) &&
                          subjectDataTotal <= MAX_SYNC_SIZE && (
                            <Button
                              onClick={getSubjectDataAndMatch}
                              style={{ marginTop: "10px" }}
                              type="primary"
                              loading={subjectDataLoading}
                              disabled={!primaryDataset}
                            >
                              Match {subjectDataTotal.toLocaleString()} names
                            </Button>
                          )}
                        {!asyncMode && !_.isNull(subjectDataTotal) &&
                          subjectDataTotal > MAX_SYNC_SIZE && (
                            <Alert
                              title="Too many names for synchronous matching"
                              description={`This selection has ${subjectDataTotal.toLocaleString()} names, more than the synchronous limit of ${MAX_SYNC_SIZE.toLocaleString()}. Switch to asynchronous mode to match it.`}
                              type="warning"
                              style={{ marginTop: "10px" }}
                              action={
                                <Button size="small" onClick={() => setAsyncMode(true)}>
                                  Switch to async
                                </Button>
                              }
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
                      title="File upload and dataset matching are also available — please log in to use them."
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
                    {inputActionButton}
                  </Col>
                )}
              </Row>
            </>
          )}

          {step === 0 && (
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
                    origin={["external", "release", "xrelease"]}
                    notPrivate
                    onResetSearch={() => {
                      setPrimaryDataset(null);
                    }}
                    onSelectDataset={(dataset) => {
                      setPrimaryDataset(dataset);
                    }}
                    placeHolder="Choose primary dataset"
                  />
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
                        }
                      }}
                    />
                    {showSecondary && (
                      <DatasetAutocomplete
                        defaultDatasetKey={
                          secondaryDataset ? secondaryDataset.key : null
                        }
                        origin={["external", "release", "xrelease"]}
                        notPrivate
                        onResetSearch={() => {
                          setSecondaryDataset(null);
                        }}
                        onSelectDataset={(dataset) => {
                          setSecondaryDataset(dataset);
                        }}
                        placeHolder="Choose secondary dataset"
                      />
                    )}
                  </Col>
                )}
              </Row>
              <Row style={{ marginTop: "16px" }} justify="end">
                <Col>
                  <Button
                    type="primary"
                    onClick={() => setStep(1)}
                    disabled={!primaryDataset}
                  >
                    Next
                  </Button>
                </Col>
              </Row>
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
                      <DatasetRef dataset={primaryDataset} />
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
                        <DatasetRef dataset={secondaryDataset} />
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
                      const primary = _.get(record, "apilink");
                      const secondary = _.get(record, "secondaryApilink");
                      return (
                        <span>
                          {primary && (
                            <a target="_blank" rel="noopener noreferrer" href={primary}>
                              {secondaryDataset ? "[1] API" : "API"}
                            </a>
                          )}
                          {secondary && (
                            <>
                              {primary && <br />}
                              <a target="_blank" rel="noopener noreferrer" href={secondary}>
                                [2] API
                              </a>
                            </>
                          )}
                        </span>
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

const mapContextToProps = ({ addError, issueMap, user, nomCode }) => ({
  addError,
  issueMap,
  user,
  nomCode,
});
export default withContext(mapContextToProps)(NameMatch);
