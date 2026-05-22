import { useEffect, useState, Fragment } from "react";
import {
  Tooltip,
  Select,
  Table,
  Input,
  Row,
  Col,
  Tag,
  Checkbox,
  Switch,
  Modal,
  Button,
} from "antd";
import withRouter from "../../../withRouter";
import Papa from "papaparse";
import { QuestionCircleOutlined, LinkOutlined } from "@ant-design/icons";
import withContext from "../../../components/hoc/withContext";
import _ from "lodash";
import qs from "query-string";
import config from "../../../config";

const DOWNLOADS_URL = config.gbifTaxReview; //"https://download.checklistbank.org/taxreview/";

const { Search } = Input;

const verbatimPrefix = "verbatim_";
const currentPrefix = "current_";
const proposedPrefix = "proposed_";

const tagLabels = {
  verbatim: {
    short: "V",
    full: "Verbatim",
  },
  current: {
    short: "G",
    full: "GBIF backbone",
  },
  proposed: {
    short: "C",
    full: "Catalogue of Life",
  },
};

const ranksToCompare = [
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "subGenus",
  "species",
  "scientificName",
];
const fieldsToCompare = ["acceptedScientificName", "taxonKey"];
const tableColumns = [
  "scientificName",
  "acceptedScientificName",
  "species",
  "subGenus",
  "genus",
  "family",
  "order",
  "class",
  "phylum",
  "kingdom",
];

//const csvFallback = "/diff.txt";

//var url_string = window.location.href;
//var url = new URL(url_string);
//var customCsv = url.searchParams.get("csv");

const tagStyle = { paddingLeft: "5px", paddingRight: "5px", fontSize: "10px" };

const Root = ({ location, addError }) => {
  const [csvUrl, setCsvUrl] = useState(null);
  const [searchCol, setSearchCol] = useState("scientificName");
  const [loading, setLoading] = useState(false);
  const [hideSelected, setHideSelected] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [dataSource, setDataSource] = useState(null);
  const [unfilteredData, setUnfilteredData] = useState(null);
  const [columns, setColumns] = useState(null);
  const [q, setQ] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const loadfromUrl = (url, colKey) => {
    Papa.parse(url, {
      download: true,
      skipEmptyLines: true,
      delimiter: "\t",
      quoteChar: "",
      escapeChar: "",
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        let rowIndex = 0;

        let changeSummary = {};
        ranksToCompare.forEach((rank) => (changeSummary[rank] = 0));
        fieldsToCompare.forEach((field) => (changeSummary[field] = 0));

        result.data.forEach((row) => {
          // All rows need a unique key for the table to render
          row._key = rowIndex++;
          row.changes = {};
          row.reviewed = false;

          // Add derrived flags - this should be in the csv, but we have decided that as an interim solution it will be here.
          ranksToCompare.forEach((rank) => {
            if (
              row[`${currentPrefix}${rank}`] !== row[`${proposedPrefix}${rank}`]
            ) {
              row.changes[rank] = true;
              changeSummary[rank]++;
            }
            if (
              row[`${currentPrefix}${rank}Key`] !==
              row[`${proposedPrefix}${rank}Key`]
            ) {
              row.changes[`${rank}Key`] = true;
              changeSummary[`${rank}Key`]++;
            }
          });
          fieldsToCompare.forEach((field) => {
            if (
              row[`${currentPrefix}${field}`] !==
              row[`${proposedPrefix}${field}`]
            ) {
              row.changes[field] = true;
              changeSummary[field]++;
            }
          });
        });

        // contruct main columns for table
        let cols = tableColumns.map((rank) => {
          return {
            title: rank,
            key: rank,
            dataIndex: `${currentPrefix}${rank}`,
            sorter: (a, b) =>
              a[`${currentPrefix}${rank}`].localeCompare(
                b[`${currentPrefix}${rank}`]
              ),
            sortDirections: ["descend", "ascend"],
            filters: [
              {
                text: `Has changed name(${changeSummary[rank]})`,
                value: true,
              },
              {
                text: "Has not changed name",
                value: false,
              },
            ],
            filterMultiple: false,
            onFilter: (value, record) => !!record.changes[rank] === value,
            render: (text, record) => {
              const isDifferent = record[`${proposedPrefix}${rank}`] !== text;
              const verbatimIsDifferent =
                record[`${verbatimPrefix}${rank}`] !== text;
              const smallDifference =
                isDifferent &&
                record[`${proposedPrefix}${rank}`]
                  .toLowerCase()
                  .replace(/[()]/g, "") ===
                  text.toLowerCase().replace(/[()]/g, "");
              const perfectMatchChanged =
                text !== "null" &&
                record[`${verbatimPrefix}${rank}`] === text &&
                isDifferent;
              const changedToPerfectMatch =
                record[`${verbatimPrefix}${rank}`] !== "null" &&
                record[`${verbatimPrefix}${rank}`] ===
                  record[`${proposedPrefix}${rank}`] &&
                isDifferent;
              const tooltipTitle = `${
                isDifferent ? rank + " has changed" : ""
              }${smallDifference ? " (casing and/or parenthesis)" : ""}${
                perfectMatchChanged ? " - current equals verbatim" : ""
              }${changedToPerfectMatch ? " - propsed equals verbatim" : ""}`;
              return !isDifferent && !verbatimIsDifferent ? (
                <div className="nowrap isSame">
                  <div>{text}</div>
                  <div>{" "}</div>
                  <div>{" "}</div>
                </div>
              ) : (
                <div
                  className={`nowrap ${isDifferent ? "hasChanged" : "isSame"} ${
                    smallDifference ? "smallChange" : ""
                  }`}
                >
                  <div
                    className={
                      changedToPerfectMatch
                        ? "changedToPerfectMatch"
                        : perfectMatchChanged
                        ? "perfectMatchChanged"
                        : ""
                    }
                  >
                    <Tooltip title={tooltipTitle}>
                      <Tag style={tagStyle}>{tagLabels.verbatim.short}</Tag>
                    </Tooltip>
                    {record[`${verbatimPrefix}${rank}`] || " "}
                    {rank === "scientificName" &&
                      record[`${verbatimPrefix}${rank}`] !== "null" && (
                        <Fragment>
                          {" "}
                          <a
                            target="_blank"
                            href={`https://www.checklistbank.org/dataset/${colKey}/names?q=${
                              record[`${verbatimPrefix}${rank}`]
                            }`}
                          >
                            <LinkOutlined />
                          </a>
                        </Fragment>
                      )}
                  </div>
                  <div
                    className={perfectMatchChanged ? "perfectMatchChanged" : ""}
                  >
                    <Tooltip title={tooltipTitle}>
                      <Tag
                        style={tagStyle}
                        color={perfectMatchChanged ? "red" : null}
                      >
                        {tagLabels.current.short}
                      </Tag>
                    </Tooltip>
                    {text}
                  </div>
                  <div
                    className={
                      changedToPerfectMatch ? "changedToPerfectMatch" : ""
                    }
                  >
                    <Tooltip title={tooltipTitle}>
                      <Tag
                        style={tagStyle}
                        color={changedToPerfectMatch ? "green" : null}
                      >
                        {tagLabels.proposed.short}
                      </Tag>
                    </Tooltip>
                    {record[`${proposedPrefix}${rank}`]}
                    {record[`${proposedPrefix}${rank}`] &&
                      record[`${proposedPrefix}${rank}`] !== "null" && (
                        <Fragment>
                          {" "}
                          <a
                            target="_blank"
                            href={`https://www.checklistbank.org/dataset/${colKey}/names?q=${
                              record[`${proposedPrefix}${rank}`]
                            }`}
                          >
                            <LinkOutlined />
                          </a>
                        </Fragment>
                      )}
                  </div>
                </div>
              );
            },
          };
        });

        // add columns for counts, changes and actions
        cols = [
          {
            title: "count",
            key: "count",
            dataIndex: "count",
            sorter: (a, b) => a.count - b.count,
            sortDirections: ["descend", "ascend"],
            render: (text, record) => (
              <a
                target="_blank"
                href={
                  `https://www.gbif.org/occurrence/search?advanced=1&verbatim_scientific_name=` +
                  record[`${verbatimPrefix}scientificName`]
                }
              >
                {Number(text).toLocaleString()}
              </a>
            ),
          },
          {
            title: "reviewed",
            key: "reviewed",
            dataIndex: "reviewed",
            render: (text, record) => {
              return (
                <Checkbox
                  checked={!!record.reviewed}
                  onChange={(e) => {
                    record.reviewed = e.target.checked;
                    // Force re-render by creating a new array reference
                    setDataSource((prev) => [...prev]);
                  }}
                />
              );
            },
          },
          ...cols,
          {
            title: "IDs",
            key: "identifier",
            render: (text, record) => (
              <>
                <Tag>NID</Tag> {record.verbatim_scientificNameID}
                <br />
                <Tag>TID</Tag> {record.verbatim_taxonID}
                <br />
                <Tag>CID</Tag> {record.verbatim_taxonConceptID}
              </>
            ),
          },
          {
            title: "Changes",
            key: "changes",
            dataIndex: "changes",
            render: (val, record) => (
              <Fragment>
                {Object.keys(val).map((f) => (
                  <span key={f}>{f}, </span>
                ))}
              </Fragment>
            ),
            filters: Object.keys(changeSummary).map((x) => {
              return { text: x, value: x };
            }),
            filterMultiple: true,
            onFilter: (value, record) => {
              return record.changes[value] > 0;
            },
          },
          {
            title: "Action",
            key: "operation",
            render: (text, record) => (
              <>
                <a ddd={colKey}
                  href={`https://github.com/CatalogueOfLife/data/issues/new?title=${getIssueSubjectText(
                    record
                  )}&body=${getIssueBodyText(record,colKey)}&labels=xrelease,feedback,xr${colKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Report
                </a>
                <br />
                <a href={record.debug_url} target="_blank">
                  Debug
                </a>
              </>
            ),
          },
        ];

        const sorted = result.data.sort((a, b) => b.count - a.count);
        setColumns(cols);
        setDataSource(sorted);
        setUnfilteredData(result.data);
        setLoading(false);
      },
      error: (err) => {
        if (addError && typeof addError === "function") {
          addError(err);
        }
      },
    });
  };

  useEffect(() => {
    const params = qs.parse(_.get(location, "search"));
    if (params.csv) {
      setLoading(true);
      setDataSource(null);
      loadfromUrl(DOWNLOADS_URL + params.csv, params.colKey);
    }
  }, [location?.search]);

  const getIssueSubjectText = (record) => {
    let template = `Regression for ${record[`${currentPrefix}scientificName`]}`;
    return encodeURIComponent(template);
  };

  const getIssueBodyText = (record, colKey) => {
    let template = `\`\`\`\n${JSON.stringify(record, null, 2)}\n\`\`\`\n\nUsing impact report based on [checklist ${colKey}](https://www.checklistbank.org/dataset/${colKey}/names?q=${record[`${currentPrefix}scientificName`]})`;
    return encodeURIComponent(template);
  };

  const expandedRowRender = (record) => {
    return (
      <p>
        <pre>{JSON.stringify(record, null, 2)}</pre>
      </p>
    );
    // return <Table columns={expandedRowColumns} dataSource={[record]} pagination={false} />;
  };

  const handleSearch = (newQ, newSearchCol) => {
    setQ(newQ);
    setSearchCol(newSearchCol);
    setDataSource(
      unfilteredData.filter((record) => {
        return (
          (record[`${currentPrefix}${newSearchCol}`] || "").indexOf(newQ) > -1 ||
          (record[`${proposedPrefix}${newSearchCol}`] || "").indexOf(newQ) > -1
        );
      })
    );
  };

  const onSelectChange = (newSelectedRowKeys) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  return (
    <Fragment>
      <div>
        <div>
          <Row gutter={16}>
            <Col span={16}>
              <Input.Group compact>
                <Select
                  defaultValue={searchCol}
                  style={{ width: "25%" }}
                  onChange={(value) => handleSearch(q, value)}
                  options={tableColumns.map((x) => ({ value: x, label: x }))}
                />
                <Search
                  style={{ width: "70%" }}
                  placeholder="Search names"
                  enterButton="Search"
                  onSearch={(value) =>
                    handleSearch(value, searchCol)
                  }
                />
              </Input.Group>
            </Col>
            <Col span={8} style={{ textAlign: "right" }}>
              <Switch
                style={{ marginRight: "10px" }}
                checked={hideSelected}
                onChange={(checked) => setHideSelected(checked)}
                checkedChildren={"Hide reviewed"}
                unCheckedChildren={"Hide reviewed"}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<QuestionCircleOutlined />}
                onClick={() => setHelpVisible(true)}
              />
            </Col>
          </Row>
        </div>

        <div style={{ overflow: "auto", width: "100%" }}>
          <Table
            dataSource={
              hideSelected
                ? (dataSource || []).filter((d) => !d.reviewed)
                : dataSource
            }
            columns={columns}
            bordered={true}
            loading={loading}
            scroll={{ x: 870 }}
            pagination={{
              position: ["topRight"],
              pageSizeOptions: [10, 20, 50, 100, 250, 500],
            }}
            size="middle"
            expandable={{
              expandedRowRender,
            }}
            rowKey="_key"
          />
        </div>
      </div>
      <Modal
        title="Help"
        open={helpVisible}
        onOk={() => setHelpVisible(false)}
        onCancel={() => setHelpVisible(false)}
        footer={[
          <Button
            key="back"
            onClick={() => setHelpVisible(false)}
          >
            Dismiss
          </Button>,
        ]}
      >
        <strong>Colors</strong>
        <ul>
          <li>
            <span className="isSame">Grey text</span> means nothing has
            changed
          </li>
          <li>
            <span className="hasChanged">Red text</span> means interpretation
            has changed
          </li>
          <li>
            <span className="changedToPerfectMatch">Green text</span> means
            interpretation has changed and now matches the verbatim value
          </li>
        </ul>
        <strong>Tags</strong>
        <ul>
          <li>
            <Tag style={tagStyle}>{tagLabels.verbatim.short}</Tag> ={" "}
            {tagLabels.verbatim.full}
          </li>
          <li>
            <Tag style={tagStyle}>{tagLabels.current.short}</Tag> ={" "}
            {tagLabels.current.full} <br />
            <span className="small-text">
              Red{" "}
              <Tag style={tagStyle} color="red">
                {tagLabels.current.short}
              </Tag>
              means that interpretation has changed away from an exact match
              to verbatim
            </span>
          </li>
          <li>
            <Tag style={tagStyle}>{tagLabels.proposed.short}</Tag> ={" "}
            {tagLabels.proposed.full}
          </li>

          {/*             <li><Tag style={tagStyle} color={perfectMatchChanged ? 'red': null}>{tagLabels.current.short}</Tag></li>
           */}
        </ul>
      </Modal>
    </Fragment>
  );
};
const mapContextToProps = ({ addError }) => ({ addError });

export default withContext(mapContextToProps)(withRouter(Root));
