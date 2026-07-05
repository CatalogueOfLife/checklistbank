import React, { useState } from "react";
import {
  Input,
  Row,
  Col,
  Progress,
  Alert,
  Button,
  Collapse,
  Statistic,
  Table,
  Upload,
  Tag,
  Typography,
  List,
  Space,
  Select,
} from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";

import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import ToolHeader from "./ToolHeader";
import TaxGroupIcon from "../NameSearch/TaxGroupIcon";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import csv from "csvtojson/v2";

const { TextArea } = Input;
const { Paragraph, Text } = Typography;
const { Dragger } = Upload;

// Above this many records we refuse to interpret in the browser and point at the API.
const MAX_LIST_SIZE = 10000;
// The taxgroup endpoint is one GET per record; this many run at a time.
const CONCURRENCY = 10;

// The delimiter used inside a single record to separate the queried name from
// its higher classification (and inside a "classification" file column). The
// pipe is the default because that is what our downloads use.
const DELIMITERS = [
  { label: "Pipe  |", value: "|" },
  { label: "Semicolon  ;", value: ";" },
  { label: "Comma  ,", value: "," },
  { label: "Colon  :", value: ":" },
  { label: "Slash  /", value: "/" },
];

// Fixed Linnean rank columns, in descending order, recognised in an uploaded
// file when there is no explicit "classification" column. Present, non-empty
// columns become the classification query params in this order.
const RANK_COLUMNS = [
  "domain",
  "superkingdom",
  "kingdom",
  "subkingdom",
  "infrakingdom",
  "superphylum",
  "superdivision",
  "phylum",
  "division",
  "subphylum",
  "subdivision",
  "infraphylum",
  "superclass",
  "class",
  "subclass",
  "infraclass",
  "subterclass",
  "superorder",
  "order",
  "suborder",
  "infraorder",
  "parvorder",
  "superfamily",
  "family",
  "subfamily",
  "supertribe",
  "tribe",
  "subtribe",
  "genus",
  "subgenus",
  "section",
  "subsection",
  "series",
  "subseries",
];

// Colour every group tag by its top-level kingdom-ish category. Keys are the
// category "anchor" group names; a group inherits the colour of the first such
// ancestor found by climbing the taxGroup hierarchy.
const GROUP_TAG_COLOR = {
  plants: "green",
  animals: "blue",
  prokaryotes: "red",
  viruses: "gold",
  fungi: "#8B4513",
  protists: "cyan",
};

// Walk a group's ancestry (via the taxGroup vocabulary) up to the first anchor
// in GROUP_TAG_COLOR and return its colour, or undefined if none applies.
const groupTagColor = (group, taxGroup) => {
  const seen = new Set();
  const stack = [group];
  while (stack.length) {
    const name = stack.pop();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    if (GROUP_TAG_COLOR[name]) return GROUP_TAG_COLOR[name];
    const parents = taxGroup?.[name]?.parents;
    if (parents) stack.push(...parents);
  }
  return undefined;
};

const getLowerKeysObj = (obj) => {
  const newobj = {};
  Object.keys(obj).forEach((key) => {
    newobj[key.toLowerCase().trim()] = obj[key];
  });
  return newobj;
};

const isValidFile = (file) =>
  !!file &&
  (file.type === "" ||
    file.type === "text/csv" ||
    file.type === "text/plain" ||
    file.type === "text/tab-separated-values" ||
    file.name.endsWith(".csv") ||
    file.name.endsWith(".tsv") ||
    file.name.endsWith(".txt"));

const triggerDownload = (content, type, filename) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Split one pasted line into a record: the first token is the queried name,
// the rest are the higher classification.
const recordFromLine = (line, delimiter) => {
  const parts = line
    .split(delimiter)
    .map((p) => p.trim())
    .filter(Boolean);
  const [q, ...classification] = parts;
  return { q: q || "", classification };
};

// Build a record from a delimited file row (lower-cased keys). Prefers an
// explicit scientificName + classification column, otherwise assembles the
// classification from any fixed rank columns present.
const recordFromRow = (e, delimiter) => {
  const id = (e.id || "").trim();
  let q = (e.scientificname || e.name || "").trim();
  let classification = [];
  if (e.classification != null && e.classification !== "") {
    classification = e.classification
      .split(delimiter)
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    classification = RANK_COLUMNS.filter((rc) => (e[rc] || "").trim()).map((rc) =>
      e[rc].trim()
    );
    // No explicit name column: treat the most specific rank as the query name.
    if (!q && classification.length) {
      q = classification.pop();
    }
  }
  return { id, q, classification };
};

const FileFormatList = () => (
  <List itemLayout="horizontal" bordered style={{ marginTop: "16px" }}>
    <List.Item>
      <List.Item.Meta
        title="ID"
        description="Optional record identifier, echoed back in the result."
      />
    </List.Item>
    <List.Item>
      <List.Item.Meta
        title="scientificName"
        description="The name to interpret. Passed as the q parameter."
      />
    </List.Item>
    <List.Item>
      <List.Item.Meta
        title="classification"
        description="The higher classification of the name, its ranks concatenated with the selected delimiter (e.g. Animalia|Chordata|Mammalia)."
      />
    </List.Item>
    <List.Item>
      <List.Item.Meta
        title="kingdom, phylum, class, order, family …"
        description="Alternatively to a classification column, provide fixed Linnean rank columns. Present columns are used as the classification in rank order."
      />
    </List.Item>
  </List>
);

const toFlatRow = (n) => ({
  id: n.id ?? "",
  scientificName: n.q ?? "",
  classification: (n.classification || []).join(" | "),
  group: n.error ? "" : n.group ?? "",
});

const TaxGroupParser = ({ addError, taxGroup }) => {
  const [error, setError] = useState(null);
  const [records, setRecords] = useState(null);
  const [inputType, setInputType] = useState("1");
  const [textAreaVal, setTextAreaVal] = useState("");
  const [fileContent, setFileContent] = useState(null);
  const [delimiter, setDelimiter] = useState("|");
  const [running, setRunning] = useState(false);
  const [numDone, setNumDone] = useState(0);
  const [results, setResults] = useState(null);

  const resetResult = () => {
    setResults(null);
    setNumDone(0);
  };

  // --- input handling --------------------------------------------------------

  const buildFromText = (val, delim) => {
    if (val && val.trim()) {
      setRecords(
        val
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => recordFromLine(l, delim))
          .filter((r) => r.q)
      );
    } else {
      setRecords(null);
    }
  };

  const setNamesFromText = (val) => {
    setTextAreaVal(val);
    setFileContent(null);
    resetResult();
    buildFromText(val, delimiter);
  };

  const buildFromFile = (content, delim) => {
    const rows = content.split(/\r?\n/).filter((l) => l.trim());
    if (rows.length === 0) {
      setError("The file is empty.");
      setRecords(null);
      return;
    }
    // Restrict field delimiters to comma/tab so the record delimiter (which may
    // be ; | : /) stays intact inside a classification cell.
    csv({ delimiter: [",", "\t"] })
      .fromString(content)
      .then((parsed) => {
        if (parsed.length === 0) {
          setError("There are no data rows in the file.");
          setRecords(null);
          return;
        }
        if (parsed.length > MAX_LIST_SIZE) {
          setError(
            `Too many rows (maximum ${MAX_LIST_SIZE.toLocaleString()}) — use the API instead.`
          );
          setRecords(null);
          return;
        }
        setError(null);
        setRecords(
          parsed
            .map((raw) => recordFromRow(getLowerKeysObj(raw), delim))
            .filter((r) => r.q)
        );
      })
      .catch((err) => {
        console.log(err);
        setError("Could not read the delimited file.");
        setRecords(null);
      });
  };

  const parseFile = (file) => {
    if (!isValidFile(file)) {
      setError("Invalid file format — upload a .csv, .tsv or .txt file");
      return false;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result || "";
      resetResult();
      setTextAreaVal("");
      setFileContent(content);
      buildFromFile(content, delimiter);
    };
    reader.readAsText(file);
    return false;
  };

  const onDelimiterChange = (delim) => {
    setDelimiter(delim);
    resetResult();
    if (fileContent) {
      buildFromFile(fileContent, delim);
    } else {
      buildFromText(textAreaVal, delim);
    }
  };

  // --- interpretation --------------------------------------------------------

  const interpretOne = async (rec) => {
    const params = new URLSearchParams();
    if (rec.id) params.append("id", rec.id);
    params.append("q", rec.q);
    (rec.classification || []).forEach((c) => c && params.append("classification", c));
    try {
      const { data } = await axios.get(
        `${config.dataApi}parser/taxgroup?${params.toString()}`
      );
      rec.group = data?.group || null;
      rec.result = data?.name || null;
    } catch (err) {
      console.log(err);
      rec.error = true;
    }
  };

  const run = async () => {
    if (!records || records.length === 0) return;
    setRunning(true);
    setNumDone(0);
    setError(null);

    const work = records.filter((r) => (r.q || "").trim());
    let idx = 0;
    let done = 0;
    const worker = async () => {
      while (idx < work.length) {
        const rec = work[idx++];
        await interpretOne(rec);
        done += 1;
        setNumDone(done);
      }
    };

    try {
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, work.length) }, worker)
      );
      setResults(records.map((n, i) => ((n._rowKey = i), n)));
    } catch (err) {
      if (typeof addError === "function") addError(err);
      setError("Interpretation failed — please try again.");
    } finally {
      setRunning(false);
    }
  };

  // --- downloads -------------------------------------------------------------

  const downloadJson = () => {
    const out = records.map((n) => ({
      ...(n.id ? { id: n.id } : {}),
      scientificName: n.q,
      classification: n.classification || [],
      group: n.error ? null : n.group || null,
    }));
    triggerDownload(
      JSON.stringify(out, null, 2),
      "application/json",
      "taxon_groups.json"
    );
  };

  const downloadTsv = () => {
    const rows = records.map(toFlatRow);
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const body = rows.map((row) =>
      headers.map((h) => String(row[h] ?? "").replace(/[\t\r\n]+/g, " ")).join("\t")
    );
    triggerDownload(
      [headers.join("\t"), ...body].join("\n"),
      "text/tab-separated-values",
      "taxon_groups.tsv"
    );
  };

  // --- result table ----------------------------------------------------------

  const numResolved = results ? results.filter((n) => !n.error && n.group).length : 0;

  const columns = [
    {
      title: "Name",
      dataIndex: "q",
      key: "q",
      render: (text, record) => (
        <>
          {record.id ? <Text type="secondary">{record.id}: </Text> : null}
          {text}
        </>
      ),
    },
    {
      title: "Classification",
      key: "classification",
      render: (text, record) =>
        (record.classification || []).length ? (
          <Text type="secondary">{record.classification.join(" › ")}</Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Taxonomic group",
      key: "group",
      filters: _.uniq((results || []).map((n) => n.group).filter(Boolean))
        .sort()
        .map((g) => ({ text: g, value: g })),
      onFilter: (value, record) => record.group === value,
      render: (text, record) =>
        record.error ? (
          <Tag color="red">error</Tag>
        ) : record.group ? (
          <Space>
            <TaxGroupIcon group={record.group} size={20} />
            <Tag color={groupTagColor(record.group, taxGroup)}>
              {record.group}
            </Tag>
          </Space>
        ) : (
          <Tag color="orange">unresolved</Tag>
        ),
    },
  ];

  const runButton = (
    <Button
      type="primary"
      onClick={run}
      loading={running}
      disabled={!records || records.length === 0}
    >
      Interpret{" "}
      {records && records.length
        ? `${records.length.toLocaleString()} record${records.length === 1 ? "" : "s"}`
        : "records"}
    </Button>
  );

  return (
    <Layout
      selectedKeys={["taxgroupparser"]}
      openKeys={["tools"]}
      title="Taxon Group Parser"
    >
      <PageContent>
        <ToolHeader id="taxgroup-parser" />
        {error && (
          <Alert
            type="error"
            style={{ marginBottom: 16 }}
            closable={{ onClose: () => setError(null) }}
            title={error}
          />
        )}

        <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
          <Col>
            <Space>
              <Text>Classification delimiter</Text>
              <Select
                value={delimiter}
                onChange={onDelimiterChange}
                options={DELIMITERS}
                style={{ width: 160 }}
              />
            </Space>
          </Col>
          <Col>{runButton}</Col>
        </Row>

        <Collapse
          activeKey={inputType}
          onChange={(key) => setInputType(key)}
          accordion
          items={[
            {
              key: "1",
              label: "Paste records",
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={16}>
                    <TextArea
                      value={textAreaVal}
                      onChange={(e) =>
                        setNamesFromText(e?.currentTarget?.value || "")
                      }
                      rows={10}
                      placeholder={
                        "Puma concolor|Animalia|Chordata|Mammalia|Carnivora|Felidae\nAbies alba|Plantae|Pinaceae\nBufo bufo|Animalia|Chordata|Amphibia"
                      }
                    />
                  </Col>
                  <Col span={8}>
                    <Typography>
                      <Paragraph>
                        One record per row. The first name is the name to
                        interpret; the remaining names are its higher
                        classification, concatenated with the selected delimiter
                        (pipe by default).
                      </Paragraph>
                    </Typography>
                  </Col>
                </Row>
              ),
            },
            {
              key: "2",
              label: "Upload a file",
              children: (
                <>
                  <Dragger
                    name="file"
                    multiple={false}
                    beforeUpload={parseFile}
                    showUploadList={false}
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag a file to this area to upload
                    </p>
                    <p className="ant-upload-hint">
                      A comma (CSV) or tab (TSV) delimited file with a header row.
                    </p>
                  </Dragger>
                  <Typography style={{ marginTop: 16 }}>
                    <Paragraph>
                      The file must have a header row. Provide either an{" "}
                      <Text code>ID</Text>, <Text code>scientificName</Text> and{" "}
                      <Text code>classification</Text> column, or fixed Linnean
                      rank columns:
                    </Paragraph>
                  </Typography>
                  <FileFormatList />
                </>
              ),
            },
          ]}
        />

        {running && (
          <Progress
            style={{ marginTop: 24 }}
            strokeColor={{ from: "#108ee9", to: "#87d068" }}
            percent={
              records && records.length
                ? Math.round(
                    (numDone /
                      records.filter((n) => (n.q || "").trim()).length) *
                      100
                  )
                : 0
            }
            status="active"
          />
        )}

        {results && !running && (
          <>
            <Row
              justify="space-between"
              align="middle"
              style={{ marginTop: 24, marginBottom: 8 }}
            >
              <Col>
                <Statistic
                  title="Resolved"
                  value={numResolved}
                  suffix={`/ ${results.length.toLocaleString()}`}
                />
              </Col>
              <Col>
                <Space>
                  <Button onClick={downloadJson}>
                    <DownloadOutlined /> JSON
                  </Button>
                  <Button onClick={downloadTsv}>
                    <DownloadOutlined /> TSV
                  </Button>
                </Space>
              </Col>
            </Row>
            <Table
              rowKey="_rowKey"
              size="small"
              dataSource={results}
              columns={columns}
              pagination={{ defaultPageSize: 100, showSizeChanger: true }}
            />
          </>
        )}
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError, taxGroup }) => ({ addError, taxGroup });
export default withContext(mapContextToProps)(TaxGroupParser);
