import React from "react";
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
import { withRouter } from "react-router-dom";
import Papa from "papaparse";
import { QuestionCircleOutlined, LinkOutlined } from "@ant-design/icons";
import withContext from "../../../components/hoc/withContext";
import _ from "lodash";
import qs from "query-string";
import config from "../../../config";

const DOWNLOADS_URL = config.gbifTaxReview; //"https://download.checklistbank.org/taxreview/";

const { Search } = Input;
const { Option } = Select;

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
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "subGenus",
  "species",
  "scientificName",
  "acceptedScientificName",
];

//const csvFallback = "/diff.txt";

//var url_string = window.location.href;
//var url = new URL(url_string);
//var customCsv = url.searchParams.get("csv");

const tagStyle = { paddingLeft: "5px", paddingRight: "5px", fontSize: "10px" };

class Root extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      csvUrl: null,
      searchCol: "scientificName",
      loading: false,
      hideSelected: false,
      helpVisible: false,
    };
  }

  componentDidMount() {
    if (_.get(this.props, "location.search")) {
      const params = qs.parse(_.get(this.props, "location.search"));
      if (params.csv) {
        this.setState({ loading: true });
        this.loadfromUrl(DOWNLOADS_URL + params.csv, params.colKey);
      }
    }
  }

  componentDidUpdate = (prevProps) => {
    if (
      _.get(prevProps, "location.search") !==
      _.get(this.props, "location.search")
    ) {
      const params = qs.parse(_.get(this.props, "location.search"));
      if (params.csv) {
        this.setState({ loading: true, dataSource: null });
        this.loadfromUrl(DOWNLOADS_URL + params.csv, params.colKey);
      }
    }
  };

  loadfromUrl = (url, colKey) => {
    Papa.parse(url, {
      download: true,
      skipEmptyLines: true,
      delimiter: "\t",
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
        let columns = tableColumns.map((rank) => {
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
                  <div>{"\u00A0"}</div>
                  <div>{"\u00A0"}</div>
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
                    {record[`${verbatimPrefix}${rank}`] || "\u00A0"}
                    {rank === "scientificName" &&
                      record[`${verbatimPrefix}${rank}`] !== "null" && (
                        <React.Fragment>
                          {" "}
                          <a
                            target="_blank"
                            href={`https://www.checklistbank.org/dataset/${colKey}/names?q=${
                              record[`${verbatimPrefix}${rank}`]
                            }`}
                          >
                            <LinkOutlined />
                          </a>
                        </React.Fragment>
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
                        <React.Fragment>
                          {" "}
                          <a
                            target="_blank"
                            href={`https://www.checklistbank.org/dataset/${colKey}/names?q=${
                              record[`${proposedPrefix}${rank}`]
                            }`}
                          >
                            <LinkOutlined />
                          </a>
                        </React.Fragment>
                      )}
                  </div>
                </div>
              );
            },
          };
        });

        // add columns for counts, changes and actions
        columns = [
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
            render: (text, record) => (
              <Checkbox
                checked={text}
                onChange={(e) => {
                  record.reviewed = e.target.checked;
                  this.setState({ dataSource: [...this.state.dataSource] });
                }}
              />
            ),
          },
          ...columns,
          {
            title: "Changes",
            key: "changes",
            dataIndex: "changes",
            render: (val, record) => (
              <React.Fragment>
                {Object.keys(val).map((f) => (
                  <span key={f}>{f}, </span>
                ))}
              </React.Fragment>
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
              <a
                href={`https://github.com/CatalogueOfLife/data/issues/new?title=${this.getIssueSubjectText(
                  record
                )}&body=${this.getIssueBodyText(record)}&labels=feedback`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Report
              </a>
            ),
          },
        ];

        this.setState({
          columns,
          dataSource: result.data.sort((a, b) => b.count - a.count),
          unfilteredData: result.data,
          loading: false,
        });
      },
      error: (err) => {
        if (this.props.addError && typeof this.props.addError === "function") {
          this.props.addError(err);
        }
      },
    });
  };

  getIssueSubjectText = (record) => {
    let template = `Regression for ${record[`${currentPrefix}scientificName`]}`;
    return encodeURIComponent(template);
  };

  getIssueBodyText = (record) => {
    let template = `\`\`\`\n${JSON.stringify(record, null, 2)}\n\`\`\``;
    return encodeURIComponent(template);
  };

  expandedRowRender = (record) => {
    return (
      <p>
        <pre>{JSON.stringify(record, null, 2)}</pre>
      </p>
    );
    // return <Table columns={this.state.expandedRowColumns} dataSource={[record]} pagination={false} />;
  };

  handleSearch = (q, searchCol) => {
    this.setState({
      q,
      searchCol,
      dataSource: this.state.unfilteredData.filter((record) => {
        return (
          (record[`${currentPrefix}${searchCol}`] || "").indexOf(q) > -1 ||
          (record[`${proposedPrefix}${searchCol}`] || "").indexOf(q) > -1
        );
      }),
    });
  };
  onSelectChange = (selectedRowKeys) => {
    console.log("selectedRowKeys changed: ", selectedRowKeys);
    this.setState({ selectedRowKeys });
  };

  render() {
    const { helpVisible, hideSelected } = this.state;

    return (
      <React.Fragment>
        <div>
          <div>
            <Row gutter={16}>
              <Col span={16}>
                <Input.Group compact>
                  <Select
                    defaultValue={this.state.searchCol}
                    style={{ width: "25%" }}
                    onChange={(value) => this.handleSearch(this.state.q, value)}
                  >
                    {tableColumns.map((x) => (
                      <Option value={x} key={x}>
                        {x}
                      </Option>
                    ))}
                  </Select>
                  <Search
                    style={{ width: "70%" }}
                    placeholder="Search names"
                    enterButton="Search"
                    onSearch={(value) =>
                      this.handleSearch(value, this.state.searchCol)
                    }
                  />
                </Input.Group>
              </Col>
              <Col span={8} style={{ textAlign: "right" }}>
                <Switch
                  style={{ marginRight: "10px" }}
                  checked={hideSelected}
                  onChange={(checked) =>
                    this.setState({ hideSelected: checked })
                  }
                  checkedChildren={"Hide reviewed"}
                  unCheckedChildren={"Hide reviewed"}
                />
                <Button
                  type="primary"
                  shape="circle"
                  icon={<QuestionCircleOutlined />}
                  onClick={() => this.setState({ helpVisible: true })}
                />
              </Col>
            </Row>
          </div>

          <div style={{ overflow: "auto", width: "100%" }}>
            <Table
              dataSource={
                hideSelected
                  ? this.state.dataSource.filter((d) => !d.reviewed)
                  : this.state.dataSource
              }
              columns={this.state.columns}
              bordered={true}
              loading={this.state.loading}
              scroll={{ x: 870 }}
              pagination={{
                position: ["topRight"],
                pageSizeOptions: [10, 20, 50, 100, 250, 500],
              }}
              size="middle"
              expandable={{
                expandedRowRender: this.expandedRowRender,
              }}
              rowKey="_key"
            />
          </div>
        </div>
        <Modal
          title="Help"
          visible={helpVisible}
          onOk={() => this.setState({ helpVisible: false })}
          onCancel={() => this.setState({ helpVisible: false })}
          footer={[
            <Button
              key="back"
              onClick={() => this.setState({ helpVisible: false })}
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
      </React.Fragment>
    );
  }
}
const mapContextToProps = ({ addError }) => ({ addError });

export default withContext(mapContextToProps)(withRouter(Root));
