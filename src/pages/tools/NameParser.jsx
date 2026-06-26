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
} from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";

import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import ToolHeader from "./ToolHeader";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import csv from "csvtojson/v2";

const { TextArea } = Input;
const { Paragraph, Text } = Typography;
const { Dragger } = Upload;

// Above this many names we refuse to parse in the browser and point at the API.
const MAX_LIST_SIZE = 10000;
// Names are POSTed to the parser in chunks of this size, a few chunks at a time.
const CHUNK_SIZE = 500;
const CONCURRENCY = 4;

const getLowerKeysObj = (obj) => {
  const newobj = {};
  Object.keys(obj).forEach((key) => {
    newobj[key.toLowerCase()] = obj[key];
  });
  return newobj;
};

// Detects whether the first line looks like a delimited header carrying a
// scientificName column. If not, every row is treated as a bare name.
const hasScientificNameHeader = (firstLine) => {
  const headers = (firstLine || "")
    .split(/[\t,;|]/)
    .map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  return headers.includes("scientificname");
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

const FileFormatList = () => (
  <List itemLayout="horizontal" bordered style={{ marginTop: "16px" }}>
    <List.Item>
      <List.Item.Meta
        title="scientificName"
        description="The scientific name to parse. May include the authorship"
      />
    </List.Item>
    <List.Item>
      <List.Item.Meta title="authorship" description="Authorship of the scientificName, if given separately" />
    </List.Item>
    <List.Item>
      <List.Item.Meta
        title="rank"
        description="The rank of the name, preferably in case-insensitive English. See http://api.checklistbank.org/vocab/rank"
      />
    </List.Item>
    <List.Item>
      <List.Item.Meta
        title="code"
        description="The nomenclatural code the name falls under. See http://api.checklistbank.org/vocab/nomCode"
      />
    </List.Item>
  </List>
);

// One flattened, download-friendly row combining the provided input with the
// parsed result. The structured authorship objects are broken out into
// individual columns; multiple authors are joined with a "|".
const toFlatRow = (n) => {
  const r = n.result || {};
  const ca = r.combinationAuthorship || {};
  const ba = r.basionymAuthorship || {};
  return {
    providedName: n.providedName ?? "",
    providedAuthorship: n.providedAuthorship ?? "",
    providedRank: n.providedRank ?? "",
    providedCode: n.providedCode ?? "",
    parsed: n.error ? false : !!r.parsed,
    type: r.type ?? "",
    rank: r.rank ?? "",
    scientificName: r.scientificName ?? "",
    authorship: r.authorship ?? "",
    combinationAuthorship: (ca.authors || []).join("|"),
    combinationExAuthorship: (ca.exAuthors || []).join("|"),
    combinationAuthorshipYear: ca.year ?? "",
    basionymAuthorship: (ba.authors || []).join("|"),
    basionymExAuthorship: (ba.exAuthors || []).join("|"),
    basionymAuthorshipYear: ba.year ?? "",
    uninomial: r.uninomial ?? "",
    genus: r.genus ?? "",
    infragenericEpithet: r.infragenericEpithet ?? "",
    specificEpithet: r.specificEpithet ?? "",
    infraspecificEpithet: r.infraspecificEpithet ?? "",
    cultivarEpithet: r.cultivarEpithet ?? "",
    code: r.code ?? "",
    notho: r.notho ?? "",
    unparsed: r.unparsed ?? "",
    issues: (r.issues || []).join("; "),
  };
};

const NameParser = ({ addError }) => {
  const [error, setError] = useState(null);
  const [names, setNames] = useState(null);
  const [inputType, setInputType] = useState("1");
  const [textAreaVal, setTextAreaVal] = useState("");
  const [parsing, setParsing] = useState(false);
  const [numParsed, setNumParsed] = useState(0);
  const [results, setResults] = useState(null);

  const resetResult = () => {
    setResults(null);
    setNumParsed(0);
  };

  // --- input handling --------------------------------------------------------

  const setNamesFromText = (val) => {
    setTextAreaVal(val);
    resetResult();
    if (val && val.trim()) {
      setNames(
        val
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => ({ providedName: l }))
      );
    } else {
      setNames(null);
    }
  };

  const parseFile = (file) => {
    if (!isValidFile(file)) {
      setError("Invalid file format — upload a .txt, .csv or .tsv file");
      return false;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result || "";
      setError(null);
      resetResult();
      setTextAreaVal("");
      const firstLine = content.split(/\r?\n/)[0];

      if (hasScientificNameHeader(firstLine)) {
        // Delimited file with a header row: map ID/scientificName/authorship/rank/code.
        csv({ delimiter: [",", ";", "|", "\t"] })
          .fromString(content)
          .then((rows) => {
            if (rows.length === 0) {
              setError("There are no data rows in the file.");
              return;
            }
            if (rows.length > MAX_LIST_SIZE) {
              setError(
                `Too many rows (maximum ${MAX_LIST_SIZE.toLocaleString()}) — use the API instead.`
              );
              return;
            }
            setNames(
              rows.map((raw) => {
                const e = getLowerKeysObj(raw);
                return {
                  providedName: e.scientificname || "",
                  providedAuthorship: e.authorship || "",
                  providedRank: e.rank || "",
                  providedCode: e.code || "",
                };
              })
            );
          })
          .catch((err) => {
            console.log(err);
            setError("Could not read the delimited file.");
          });
      } else {
        // Plain text: one name per row.
        const rows = content
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        if (rows.length === 0) {
          setError("The file is empty.");
          return;
        }
        if (rows.length > MAX_LIST_SIZE) {
          setError(
            `Too many rows (maximum ${MAX_LIST_SIZE.toLocaleString()}) — use the API instead.`
          );
          return;
        }
        setNames(rows.map((l) => ({ providedName: l })));
      }
    };
    reader.readAsText(file);
    return false;
  };

  // --- parsing ---------------------------------------------------------------

  const parseChunk = async (chunk) => {
    const body = chunk.map((n) => ({
      name: n.providedName,
      ...(n.providedAuthorship ? { authorship: n.providedAuthorship } : {}),
      ...(n.providedRank ? { rank: n.providedRank } : {}),
      ...(n.providedCode ? { code: n.providedCode } : {}),
    }));
    try {
      const { data } = await axios.post(`${config.dataApi}parser/name`, body, {
        headers: { "Content-Type": "application/json" },
      });
      // The parser silently drops blank names; we filtered those out already so
      // the response maps 1:1 to the chunk. Guard defensively just in case.
      if (Array.isArray(data) && data.length === chunk.length) {
        chunk.forEach((n, i) => {
          n.result = data[i];
        });
      } else {
        chunk.forEach((n) => {
          n.error = true;
        });
      }
    } catch (err) {
      console.log(err);
      chunk.forEach((n) => {
        n.error = true;
      });
    }
  };

  const runParse = async () => {
    if (!names || names.length === 0) return;
    setParsing(true);
    setNumParsed(0);
    setError(null);

    // Drop blank names so the parser's response lines up 1:1 with our input.
    const work = names.filter((n) => (n.providedName || "").trim());
    const chunks = _.chunk(work, CHUNK_SIZE);
    let done = 0;

    try {
      for (let i = 0; i < chunks.length; i += CONCURRENCY) {
        const batch = chunks.slice(i, i + CONCURRENCY);
        await Promise.all(
          batch.map((c) =>
            parseChunk(c).then(() => {
              done += c.length;
              setNumParsed(done);
            })
          )
        );
      }
      setResults(names.map((n, i) => ((n._rowKey = i), n)));
    } catch (err) {
      if (typeof addError === "function") addError(err);
      setError("Parsing failed — please try again.");
    } finally {
      setParsing(false);
    }
  };

  // --- downloads -------------------------------------------------------------

  const downloadJson = () => {
    const out = names.map((n) => ({
      providedName: n.providedName,
      ...(n.providedAuthorship ? { providedAuthorship: n.providedAuthorship } : {}),
      ...(n.providedRank ? { providedRank: n.providedRank } : {}),
      ...(n.providedCode ? { providedCode: n.providedCode } : {}),
      result: n.error ? null : n.result || null,
    }));
    triggerDownload(
      JSON.stringify(out, null, 2),
      "application/json",
      "parsed_names.json"
    );
  };

  const downloadTsv = () => {
    const rows = names.map(toFlatRow);
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const body = rows.map((row) =>
      headers
        .map((h) => String(row[h] ?? "").replace(/[\t\r\n]+/g, " "))
        .join("\t")
    );
    triggerDownload(
      [headers.join("\t"), ...body].join("\n"),
      "text/tab-separated-values",
      "parsed_names.tsv"
    );
  };

  // --- result table ----------------------------------------------------------

  const numParsedOk = results
    ? results.filter((n) => !n.error && n.result?.parsed).length
    : 0;

  const columns = [
    {
      title: "Provided name",
      dataIndex: "providedName",
      key: "providedName",
      render: (text, record) => (
        <>
          {text}
          {record.providedAuthorship ? (
            <Text type="secondary"> {record.providedAuthorship}</Text>
          ) : null}
        </>
      ),
    },
    {
      title: "Parsed name",
      key: "label",
      render: (text, record) =>
        record.error ? (
          <Tag color="red">error</Tag>
        ) : record.result?.labelHtml ? (
          <span
            dangerouslySetInnerHTML={{ __html: record.result.labelHtml }}
          />
        ) : (
          <Tag color="red">unparsed</Tag>
        ),
    },
    {
      title: "Type",
      dataIndex: ["result", "type"],
      key: "type",
      filters: _.uniq(
        (results || []).map((n) => n.result?.type).filter(Boolean)
      ).map((t) => ({ text: t, value: t })),
      onFilter: (value, record) => record.result?.type === value,
    },
    { title: "Rank", dataIndex: ["result", "rank"], key: "rank" },
    {
      title: "Authorship",
      dataIndex: ["result", "authorship"],
      key: "authorship",
    },
    { title: "Code", dataIndex: ["result", "code"], key: "code" },
    {
      title: "Parsed",
      key: "parsed",
      filters: [
        { text: "Parsed", value: true },
        { text: "Not parsed", value: false },
      ],
      onFilter: (value, record) =>
        (!record.error && !!record.result?.parsed) === value,
      render: (text, record) =>
        !record.error && record.result?.parsed ? (
          <Tag color="green">yes</Tag>
        ) : (
          <Tag color="orange">no</Tag>
        ),
    },
    {
      title: "Issues",
      dataIndex: ["result", "issues"],
      key: "issues",
      render: (text, record) =>
        (record.result?.issues || []).map((i) => (
          <Tag key={i} color="warning" style={{ marginRight: 6 }}>
            {i}
          </Tag>
        )),
    },
  ];

  const parseButton = (
    <Button
      type="primary"
      onClick={runParse}
      loading={parsing}
      disabled={!names || names.length === 0}
    >
      Parse {names && names.length ? `${names.length.toLocaleString()} name${names.length === 1 ? "" : "s"}` : "names"}
    </Button>
  );

  return (
    <Layout selectedKeys={["nameparser"]} openKeys={["tools"]} title="Name Parser">
      <PageContent>
        <ToolHeader id="name-parser" />
        {error && (
          <Alert
            type="error"
            style={{ marginBottom: 16 }}
            closable={{ onClose: () => setError(null) }}
            title={error}
          />
        )}

        <Row justify="end" style={{ marginBottom: 8 }}>
          <Col>{parseButton}</Col>
        </Row>

        <Collapse
          activeKey={inputType}
          onChange={(key) => setInputType(key)}
          accordion
          items={[
            {
              key: "1",
              label: "Paste names",
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
                        "Abies alba Mill.\nPuma concolor (Linnaeus, 1771)\nBellis perennis L."
                      }
                    />
                  </Col>
                  <Col span={8}>
                    <Typography>
                      <Paragraph>
                        Paste or type names — one name per row. Names may include
                        the authorship.
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
                      A plain text file with one name per row, or a delimited
                      CSV/TSV file with a header row.
                    </p>
                  </Dragger>
                  <Typography style={{ marginTop: 16 }}>
                    <Paragraph>
                      If the file is a simple text file without delimiters, each
                      row is treated as a single name to parse. If it is a comma
                      (CSV) or tab (TSV) delimited file it must have a header row,
                      and the following columns are passed to the parser:
                    </Paragraph>
                  </Typography>
                  <FileFormatList />
                </>
              ),
            },
          ]}
        />

        {parsing && (
          <Progress
            style={{ marginTop: 24 }}
            strokeColor={{ from: "#108ee9", to: "#87d068" }}
            percent={
              names && names.length
                ? Math.round((numParsed / names.filter((n) => (n.providedName || "").trim()).length) * 100)
                : 0
            }
            status="active"
          />
        )}

        {results && !parsing && (
          <>
            <Row
              justify="space-between"
              align="middle"
              style={{ marginTop: 24, marginBottom: 8 }}
            >
              <Col>
                <Statistic
                  title="Parsed"
                  value={numParsedOk}
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
              scroll={{ x: 1200 }}
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

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(NameParser);
