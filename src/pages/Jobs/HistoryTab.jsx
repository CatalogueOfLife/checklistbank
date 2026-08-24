import React, { useState, useEffect } from "react";
import { Table, Row, Col, Form, Select, Segmented, Alert, DatePicker } from "antd";
import _ from "lodash";
import moment from "dayjs";
import withContext from "../../components/hoc/withContext";
import ErrorMsg from "../../components/ErrorMsg";
import JobDetail from "../../components/job/JobDetail";
import DatasetAutocomplete from "../project/Assembly/DatasetAutocomplete";
import { searchJobs, getJobTypes, jobLabel, JOB_LANES } from "../../api/job";
import { decorateJobs } from "./decorate";
import { PRESETS, presetOf, applyPreset } from "./presets";
import {
  statusColumn,
  jobColumn,
  laneColumn,
  datasetColumn,
  sectorColumn,
  userColumn,
  dateColumn,
  durationColumn,
  resultColumn,
  logsColumn,
} from "./columns";

const { RangePicker } = DatePicker;
const PAGE_SIZE = 25;

const formItemLayout = {
  labelCol: { xs: { span: 24 }, sm: { span: 8 } },
  wrapperCol: { xs: { span: 24 }, sm: { span: 16 } },
};

const asArray = (v) =>
  v === undefined || v === null || v === "" ? undefined : [].concat(v);

/**
 * The persisted job history.
 *
 * The backend orders strictly by created DESC and offers no sortBy, so the
 * columns carry no sorters - showing arrows that cannot work would be a lie.
 */
const HistoryTab = ({ params, updateParams, jobStatus, jobPriority }) => {
  const [data, setData] = useState({ result: [], total: 0 });
  const [jobTypes, setJobTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getJobTypes().then(setJobTypes);
  }, []);

  const limit = Number(params.limit) || PAGE_SIZE;
  const offset = Number(params.offset) || 0;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await searchJobs({ ...params, limit, offset });
        setData({ ...res, result: await decorateJobs(res.result) });
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [JSON.stringify(params)]);

  const setFilter = (key, value) => {
    const next = { ...params };
    if (value === undefined || value === null || value.length === 0) {
      delete next[key];
    } else {
      next[key] = value;
    }
    delete next.offset;
    updateParams(next);
  };

  const columns = [
    statusColumn,
    jobColumn,
    laneColumn,
    datasetColumn,
    sectorColumn,
    userColumn,
    dateColumn("Created", "created"),
    dateColumn("Started", "started"),
    dateColumn("Finished", "finished"),
    durationColumn,
    resultColumn,
    logsColumn,
  ];

  return (
    <>
      {error && (
        <Alert
          style={{ marginBottom: 8 }}
          type="error"
          closable
          onClose={() => setError(null)}
          description={<ErrorMsg error={error} />}
        />
      )}
      <Segmented
        style={{ marginBottom: 16 }}
        value={presetOf(params) ?? null}
        options={PRESETS.map((p) => ({ label: p.label, value: p.key }))}
        onChange={(key) => updateParams(applyPreset(params, key))}
      />
      <Row gutter={16}>
        <Col md={12} sm={24}>
          <Form.Item {...formItemLayout} label="Status">
            <Select
              mode="multiple"
              allowClear
              placeholder="Any status"
              value={asArray(params.status) || []}
              onChange={(v) => setFilter("status", v)}
              options={(jobStatus || []).map((s) => ({
                value: s.name,
                label: _.startCase(s.name),
              }))}
            />
          </Form.Item>
          <Form.Item {...formItemLayout} label="Lane">
            <Select
              mode="multiple"
              allowClear
              placeholder="Any lane"
              value={asArray(params.lane) || []}
              onChange={(v) => setFilter("lane", v)}
              options={JOB_LANES.map((l) => ({
                value: l,
                label: _.startCase(l),
              }))}
            />
          </Form.Item>
          <Form.Item {...formItemLayout} label="Job type">
            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="Any job type"
              value={asArray(params.job) || []}
              onChange={(v) => setFilter("job", v)}
              options={jobTypes.map((j) => ({
                value: j,
                label: jobLabel(j),
              }))}
            />
          </Form.Item>
        </Col>
        <Col md={12} sm={24}>
          <Form.Item {...formItemLayout} label="Dataset">
            <DatasetAutocomplete
              defaultDatasetKey={params.datasetKey || null}
              onResetSearch={() => setFilter("datasetKey", undefined)}
              onSelectDataset={(d) => setFilter("datasetKey", d.key)}
              placeHolder="Any dataset"
            />
          </Form.Item>
          <Form.Item {...formItemLayout} label="Priority">
            <Select
              allowClear
              placeholder="Any priority"
              value={params.priority || undefined}
              onChange={(v) => setFilter("priority", v)}
              options={(jobPriority || []).map((p) => ({
                value: p.name,
                label: _.startCase(p.name),
              }))}
            />
          </Form.Item>
          <Form.Item {...formItemLayout} label="Created">
            <RangePicker
              value={
                params.createdAfter || params.createdBefore
                  ? [
                      params.createdAfter ? moment(params.createdAfter) : null,
                      params.createdBefore ? moment(params.createdBefore) : null,
                    ]
                  : null
              }
              onChange={(range) => {
                const next = { ...params };
                delete next.offset;
                if (!range) {
                  delete next.createdAfter;
                  delete next.createdBefore;
                } else {
                  next.createdAfter = range[0]?.format("YYYY-MM-DD");
                  next.createdBefore = range[1]?.format("YYYY-MM-DD");
                }
                updateParams(next);
              }}
            />
          </Form.Item>
        </Col>
      </Row>
      <Table
        size="small"
        rowKey="key"
        scroll={{ x: "max-content" }}
        columns={columns}
        dataSource={data.result}
        loading={loading}
        pagination={{
          current: Math.floor(offset / limit) + 1,
          pageSize: limit,
          total: data.total,
          showQuickJumper: true,
          showSizeChanger: true,
        }}
        onChange={(pagination) =>
          updateParams({
            ...params,
            limit: pagination.pageSize,
            offset: (pagination.current - 1) * pagination.pageSize,
          })
        }
        expandable={{
          expandedRowRender: (record) => <JobDetail job={record} />,
        }}
      />
    </>
  );
};

const mapContextToProps = ({ jobStatus, jobPriority }) => ({
  jobStatus,
  jobPriority,
});
export default withContext(mapContextToProps)(HistoryTab);
