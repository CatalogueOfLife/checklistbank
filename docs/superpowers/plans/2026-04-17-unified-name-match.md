# Unified Name Match Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the sync and async name match pages into a single `/tools/name-match` page with a sync/async toggle switch, fix job status error handling, and remove the old async routes.

**Architecture:** Extend `NameMatch.js` in-place with an `asyncMode` boolean state and a `Switch` toggle. Not-logged-in users see only the simple data entry panel. Logged-in users in async mode see a target dataset selector plus Upload and Dataset panels. `NameMatchJob.js` gets a missing import fix, a `clearInterval`→`clearTimeout` bug fix, and prominent error display. `NameMatchAsync.js` is deleted and its routes removed from `App.js`.

**Tech Stack:** React 16, Ant Design 4, axios, React Router 5, lodash, csvtojson, PQueue

**Spec:** `docs/superpowers/specs/2026-04-17-unified-name-match-design.md`

---

## Files

| File | Action |
|---|---|
| `src/pages/tools/NameMatchJob.js` | Fix Tooltip import, clearTimeout bug, error/cancelled Alert, back-button path |
| `src/App.js` | Update job route path, remove async route + import |
| `src/pages/tools/NameMatchAsync.js` | Delete |
| `src/pages/tools/NameMatch.js` | Add List import, user context, asyncMode state, Switch toggle, login-gating, async submit handlers, file format list, remove dead async links |

---

### Task 1: Fix NameMatchJob.js

**Files:**
- Modify: `src/pages/tools/NameMatchJob.js`

- [ ] **Step 1.1: Fix imports — add Tooltip and Alert, remove unused jobOutlined**

Replace the antd import line (line 16) and the icons import (lines 3-7):

```js
import {
  SyncOutlined,
  HistoryOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
```

```js
import { Button, Card, Tag, Spin, Row, Col, Alert, Tooltip } from "antd";
```

- [ ] **Step 1.2: Fix clearInterval → clearTimeout in both useEffect hooks**

Replace the polling useEffect (currently lines 64–73):

```js
useEffect(() => {
  if (["running", "waiting"].includes(job?.status)) {
    if (!intervalHandle) {
      let hdl = setTimeout(init, 5000);
      setIntervalHandle(hdl);
    }
  } else if (intervalHandle) {
    clearTimeout(intervalHandle);
    setIntervalHandle(null);
  }
}, [job]);
```

Replace the cleanup useEffect (currently lines 75–81):

```js
useEffect(() => {
  return () => {
    if (intervalHandle) {
      clearTimeout(intervalHandle);
    }
  };
}, []);
```

- [ ] **Step 1.3: Replace the JSX return with improved error display and updated back-button path**

Replace the entire `return (...)` block:

```jsx
return (
  <Layout openKeys={[]} selectedKeys={[]} title="ChecklistBank Name Matching">
    <PageContent>
      {(job?.status === "failed" || job?.error) && (
        <Alert
          type="error"
          style={{ marginBottom: "16px" }}
          message="Matching job failed"
          description={job?.error || "An unknown error occurred"}
          showIcon
        />
      )}
      {job?.status === "cancelled" && (
        <Alert
          type="warning"
          style={{ marginBottom: "16px" }}
          message="Matching job was cancelled"
          showIcon
        />
      )}
      {resultUrl && (
        <Row>
          <Col flex="auto"></Col>
          <Col>
            <Button type="primary" size="large" href={resultUrl}>
              Download matching result <DownloadOutlined />
            </Button>
          </Col>
          <Col flex="auto"></Col>
          <Col>
            <Button
              type="primary"
              onClick={() => {
                history.push({ pathname: `/tools/name-match` });
              }}
            >
              New upload
            </Button>
          </Col>
        </Row>
      )}
      {!job && !resultUrl && resultUrlHasBeenChecked && (
        <Exception type="404" />
      )}
      <Spin spinning={loading}>
        {job && (
          <Card
            title={
              <>
                {job?.error ? (
                  <Tooltip title={job?.error}>
                    <Tag color="error">Failed</Tag>
                  </Tooltip>
                ) : job?.status === "finished" ? (
                  <Button
                    type="link"
                    href={job?.job}
                    style={{ color: "#1890ff" }}
                  >
                    <DownloadOutlined /> {job?.sizeWithUnit}
                  </Button>
                ) : job?.status === "waiting" ? (
                  <HistoryOutlined
                    style={{ marginRight: "10px", marginLeft: "10px" }}
                  />
                ) : (
                  <SyncOutlined
                    style={{ marginRight: "10px", marginLeft: "10px" }}
                    spin
                  />
                )}
                <span>{moment(job?.created).format("MMM Do YYYY")}</span>
              </>
            }
          >
            <div>
              <PresentationItem md={4} label="Request">
                {job.request && (
                  <div>
                    {Object.keys(job.request).map((key) => {
                      const value = job.request[key];
                      return (
                        <Tag key={key}>{`${key}: ${value?.label || value}`}</Tag>
                      );
                    })}
                  </div>
                )}
              </PresentationItem>
            </div>
          </Card>
        )}
      </Spin>
    </PageContent>
  </Layout>
);
```

- [ ] **Step 1.4: Commit**

```bash
git add src/pages/tools/NameMatchJob.js
git commit -m "fix: NameMatchJob missing Tooltip import, clearTimeout bug, error/cancel display, back-button path"
```

---

### Task 2: Update App.js routes and delete NameMatchAsync.js

**Files:**
- Modify: `src/App.js`
- Delete: `src/pages/tools/NameMatchAsync.js`

- [ ] **Step 2.1: Remove NameMatchAsync import from App.js (line 58)**

Delete:
```js
import NameMatchAsync from "./pages/tools/NameMatchAsync";
```

- [ ] **Step 2.2: Update the job route path (around line 342)**

Change:
```js
path={`/tools/name-match-async/job/:key`}
```
to:
```js
path={`/tools/name-match/job/:key`}
```

- [ ] **Step 2.3: Remove the async page route (around line 345–350)**

Delete this entire block:
```js
<Route
  exact
  key="namematchasync"
  path={`/tools/name-match-async`}
  component={NameMatchAsync}
/>
```

- [ ] **Step 2.4: Delete NameMatchAsync.js and commit**

```bash
git rm src/pages/tools/NameMatchAsync.js
git add src/App.js
git commit -m "refactor: remove async name match route, job status at /tools/name-match/job/:key"
```

---

### Task 3: Prepare NameMatch.js — imports, state, context, handlers

**Files:**
- Modify: `src/pages/tools/NameMatch.js`

- [ ] **Step 3.1: Add List to antd imports**

Add `List` to the existing antd import:

```js
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
  List,
} from "antd";
```

- [ ] **Step 3.2: Add FileFormatList component above NameMatch**

Add this constant before the `NameMatch` function declaration (alongside `COL_LXR`):

```js
const FileFormatList = () => (
  <List itemLayout="horizontal" bordered style={{ marginTop: "16px" }}>
    <List.Item><List.Item.Meta title="ID" description="A unique identifier for your name" /></List.Item>
    <List.Item><List.Item.Meta title="scientificName" description="The scientific name to be matched. May include the authorship" /></List.Item>
    <List.Item><List.Item.Meta title="authorship" description="Authorship of the scientificName" /></List.Item>
    <List.Item><List.Item.Meta title="rank" description="The rank of the name, preferably given in case-insensitive English. See http://api.checklistbank.org/vocab/rank" /></List.Item>
    <List.Item><List.Item.Meta title="code" description="The nomenclatural code the name falls under. See http://api.checklistbank.org/vocab/nomCode" /></List.Item>
    <List.Item><List.Item.Meta title="kingdom" description="The kingdom the name is classified in, e.g. Animalia" /></List.Item>
    <List.Item><List.Item.Meta title="phylum" description="The phylum the name is classified in, e.g. Arthropoda" /></List.Item>
    <List.Item><List.Item.Meta title="subphylum" description="The subphylum the name is classified in" /></List.Item>
    <List.Item><List.Item.Meta title="class" description="The class the name is classified in, e.g. Insecta" /></List.Item>
    <List.Item><List.Item.Meta title="subclass" description="The subclass the name is classified in" /></List.Item>
    <List.Item><List.Item.Meta title="order" description="The order the name is classified in, e.g. Lepidoptera" /></List.Item>
    <List.Item><List.Item.Meta title="suborder" description="The suborder the name is classified in, e.g. Glossata" /></List.Item>
    <List.Item><List.Item.Meta title="superfamily" description="The superfamily the name is classified in, e.g. Papilionoidea" /></List.Item>
    <List.Item><List.Item.Meta title="family" description="The family the name is classified in, e.g. Nymphalidae" /></List.Item>
    <List.Item><List.Item.Meta title="subfamily" description="The subfamily the name is classified in, e.g. Danainae" /></List.Item>
    <List.Item><List.Item.Meta title="tribe" description="The tribe the name is classified in, e.g. Danaini" /></List.Item>
    <List.Item><List.Item.Meta title="subtribe" description="The subtribe the name is classified in" /></List.Item>
    <List.Item><List.Item.Meta title="genus" description="The genus the name is classified in, e.g. Danaus" /></List.Item>
    <List.Item><List.Item.Meta title="subgenus" description="The subgenus the name is classified in" /></List.Item>
    <List.Item><List.Item.Meta title="section" description="The (botanical) section the name is classified in" /></List.Item>
  </List>
);
```

- [ ] **Step 3.3: Add user to component signature and state**

Change the component signature (line 106):
```js
const NameMatch = ({ addError, rank, issueMap, user }) => {
```

Add two new state variables immediately after the existing state declarations (after line 125 `const [textAreaVal, ...]`):
```js
const [asyncMode, setAsyncMode] = useState(false);
const [asyncSubmitting, setAsyncSubmitting] = useState(false);
```

- [ ] **Step 3.4: Add handleModeSwitch and async submit handlers**

Add these three functions immediately before the `return (` statement:

```js
const handleModeSwitch = (checked) => {
  setAsyncMode(checked);
  setNames(null);
  setStep(0);
  setTextAreaVal("");
  setInputType(checked ? "2" : "1");
  setSubjectDataset(null);
  setSubjectTaxon(null);
  setSubjectDataTotal(null);
};

const submitAsyncFile = async (options) => {
  setAsyncSubmitting(true);
  try {
    const res = await axios.post(
      `${config.dataApi}dataset/${primaryDataset.key}/match/nameusage/job`,
      options.file,
      { headers: { "Content-Type": "text/plain" } }
    );
    options.onSuccess(res.data, options.file);
    history.push({ pathname: `/tools/name-match/job/${res.data.key}` });
  } catch (err) {
    options.onError(err);
    setSubmissionError(err);
  } finally {
    setAsyncSubmitting(false);
  }
};

const submitAsyncDataset = async () => {
  setAsyncSubmitting(true);
  try {
    const body = { sourceDatasetKey: subjectDataset.key };
    if (subjectTaxon?.key) body.taxonID = subjectTaxon.key;
    const res = await axios.post(
      `${config.dataApi}dataset/${primaryDataset.key}/match/nameusage/job`,
      body
    );
    history.push({ pathname: `/tools/name-match/job/${res.data.key}` });
  } catch (err) {
    setSubmissionError(err);
  } finally {
    setAsyncSubmitting(false);
  }
};
```

- [ ] **Step 3.5: Update mapContextToProps to include user**

```js
const mapContextToProps = ({ nomCode, addError, rank, issueMap, user }) => ({
  nomCode,
  addError,
  rank,
  issueMap,
  user,
});
```

- [ ] **Step 3.6: Commit**

```bash
git add src/pages/tools/NameMatch.js
git commit -m "refactor: add asyncMode state, user context, async submit handlers, FileFormatList to NameMatch"
```

---

### Task 4: Rewrite NameMatch.js JSX return

**Files:**
- Modify: `src/pages/tools/NameMatch.js`

This task replaces the entire `return (...)` block. The new return has three conditional sections based on login state and mode.

- [ ] **Step 4.1: Replace the full return block**

Replace everything from `return (` to the closing `);` with the following. Note that the sync mode section (marked `{/* === SYNC MODE === */}`) reuses the existing panels and steps content verbatim except for two changes: (a) the link to `/tools/name-match-async` inside Panel 2's dragger is removed and (b) the "5000 names" link is replaced with a toggle hint. Those changes are marked inline with comments.

```jsx
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
      {/* NOT LOGGED IN: only simple data entry + info alert       */}
      {/* ======================================================= */}
      {!user && (
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
                      Paste or write names - one name per row. Names may
                      include the author string.
                    </Paragraph>
                  </Typography>
                </Col>
              </Row>
            </Panel>
          </Collapse>
          <Row style={{ marginTop: "10px" }}>
            <Col>
              {names && (
                <>
                  <span>{`${names.length} name${
                    names.length === 1 ? "" : "s"
                  } provided for matching `}</span>
                  <Button type="primary" onClick={() => setStep(1)}>
                    Next
                  </Button>
                </>
              )}
            </Col>
          </Row>
          <Alert
            type="info"
            style={{ marginTop: "16px" }}
            message="File upload and dataset matching are also available — please log in to use them."
          />
        </>
      )}

      {/* ======================================================= */}
      {/* LOGGED IN — SYNC MODE                                    */}
      {/* ======================================================= */}
      {!!user && !asyncMode && (
        <>
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

          <Row style={{ marginBottom: "10px" }}>
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
                          Paste or write names - one name per row. Names may
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
                      <code className="code">superfamily</code>,{" "}
                      <code className="code">family</code>,{" "}
                      <code className="code">tribe</code>
                    </p>
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
                      better matching results include as many of the following{" "}
                      <a href="https://github.com/CatalogueOfLife/coldp/blob/master/README.md#nameusage">
                        ColDP columns
                      </a>{" "}
                      as possible:
                    </Paragraph>
                  </Typography>
                  <FileFormatList />
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
                  , switch to <b>Asynchronous mode</b> using the toggle above.
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
            <MatchProgress total={names.length} matched={numMatchedNames} />
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
                            {_.get(
                              record,
                              "secondaryDatasetUsage.labelHtml"
                            ) ? (
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
      )}

      {/* ======================================================= */}
      {/* LOGGED IN — ASYNC MODE                                   */}
      {/* ======================================================= */}
      {!!user && asyncMode && (
        <>
          {/* Target dataset selector */}
          <Row style={{ marginBottom: "16px" }}>
            <Col span={12}>
              <Typography>
                <Paragraph>Match against:</Paragraph>
              </Typography>
              <DatasetAutocomplete
                defaultDatasetKey={primaryDataset?.key}
                onResetSearch={() => setPrimaryDataset(null)}
                onSelectDataset={setPrimaryDataset}
                placeHolder="Choose target dataset"
              />
            </Col>
          </Row>

          <Collapse
            activeKey={inputType}
            onChange={(key) => setInputType(key)}
            accordion
          >
            <Panel header="Upload CSV/TSV" key="2">
              <Dragger
                name="file"
                multiple={false}
                customRequest={submitAsyncFile}
                disabled={!primaryDataset || asyncSubmitting}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag csv/tsv file to this area to upload
                </p>
                <p className="ant-upload-hint">
                  The file format is auto-detected. You will receive an email
                  when the result is ready.
                </p>
              </Dragger>
              <Typography style={{ marginTop: "16px" }}>
                <Paragraph>
                  Your uploaded file has to be a comma (CSV) or tab (TSV)
                  delimited text file with a header row to specify column names
                  (
                  <a
                    target="_blank"
                    href="https://gist.githubusercontent.com/mdoering/e8f464e97ac524973758c73162e4bf97/raw/8e38e8ab493d0afdcd7089b98358fc41e2f38d01/names.tsv"
                  >
                    example
                  </a>
                  ). It can contain any number of columns but must at least
                  contain <code className="code">scientificName</code>. For
                  better matching results include as many of the following{" "}
                  <a href="https://github.com/CatalogueOfLife/coldp/blob/master/README.md#nameusage">
                    ColDP columns
                  </a>{" "}
                  as possible:
                </Paragraph>
              </Typography>
              <FileFormatList />
            </Panel>

            <Panel header="Choose dataset in ChecklistBank" key="3">
              <Row>
                <Col
                  span={12}
                  style={{ paddingRight: "8px", paddingLeft: "8px" }}
                >
                  Select a source dataset:
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
                    placeHolder="Choose source dataset"
                  />
                  And an optional root taxon:
                  <NameAutocomplete
                    minRank="GENUS"
                    defaultTaxonKey={_.get(subjectTaxon, "key", null)}
                    datasetKey={_.get(subjectDataset, "key")}
                    onError={setError}
                    disabled={!subjectDataset}
                    onSelectName={(name) => setSubjectTaxon(name)}
                    onResetSearch={() => setSubjectTaxon(null)}
                  />
                  {subjectDataset && (
                    <Button
                      onClick={submitAsyncDataset}
                      style={{ marginTop: "10px" }}
                      type="primary"
                      loading={asyncSubmitting}
                      disabled={!primaryDataset}
                    >
                      Submit matching job
                    </Button>
                  )}
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </>
      )}
    </PageContent>
  </Layout>
);
```

- [ ] **Step 4.2: Verify compilation**

```bash
npm start
```

Expected: dev server starts without compilation errors. Navigate to `http://localhost:3000/tools/name-match`.

- [ ] **Step 4.3: Commit**

```bash
git add src/pages/tools/NameMatch.js
git commit -m "feat: unified sync/async name match page with login-gating and file format list"
```

---

### Task 5: Manual verification

- [ ] **Step 5.1: Verify not-logged-in state**

Navigate to `http://localhost:3000/tools/name-match` without logging in.
Expected:
- Only "Simple data entry" accordion panel shown
- Info alert: "File upload and dataset matching are also available — please log in to use them."
- No async Switch visible

- [ ] **Step 5.2: Verify sync mode (logged in)**

Log in, navigate to `/tools/name-match`.
Expected:
- Async Switch visible top-right, unchecked
- Steps component visible (Input → Target → Matching → Review result)
- All 3 accordion panels available
- "more than 5000 names" text says "switch to Asynchronous mode using the toggle above" (no link to old async page)
- Upload CSV panel (key 2) shows file format list below dragger
- No broken buttons/links pointing to `/tools/name-match-async`

- [ ] **Step 5.3: Verify sync matching flow**

In sync mode: enter 3 names in the textarea, click Next, confirm COL LXR is selected, click Next, wait for matching, download CSV result.
Expected: all 4 steps work as before.

- [ ] **Step 5.4: Verify async mode switch**

Toggle the Async Switch.
Expected:
- "Simple data entry" panel disappears
- "Upload CSV/TSV" and "Choose dataset in ChecklistBank" panels shown
- Target dataset selector (defaulting to COL LXR) appears above accordion
- Steps component hidden

- [ ] **Step 5.5: Verify async file upload**

In async mode, leave target as COL LXR, drag a small TSV/CSV file onto the dragger.
Expected: redirect to `/tools/name-match/job/{key}` immediately after upload.

- [ ] **Step 5.6: Verify async dataset job**

In async mode, select a source dataset, optionally pick a root taxon, click "Submit matching job".
Expected: redirect to `/tools/name-match/job/{key}`.

- [ ] **Step 5.7: Verify job status page**

Navigate to `/tools/name-match/job/{key}`.
Expected:
- Page polls status every 5 seconds
- "New upload" button navigates to `/tools/name-match`
- If job fails: red Alert with error message shown above the card, spinner stops

- [ ] **Step 5.8: Verify old routes are gone**

Navigate to `http://localhost:3000/tools/name-match-async`.
Expected: page not found (no route matches).

- [ ] **Step 5.9: Final commit**

```bash
git add .
git commit -m "chore: verify unified name match complete"
```
