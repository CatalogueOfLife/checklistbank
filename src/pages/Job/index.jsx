import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Alert, Button, Card, Collapse, Space, Spin, Tag } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import PresentationItem from "../../components/PresentationItem";
import withContext from "../../components/hoc/withContext";
import JobStatusTag from "../../components/job/JobStatusTag";
import JobDuration from "../../components/job/JobDuration";
import JobDetail from "../../components/job/JobDetail";
import CancelJobButton from "../../components/job/CancelJobButton";
import { decorateJobs } from "../Jobs/decorate";
import { getDatasetsBatch } from "../../api/dataset";
import {
  getJob,
  isLive,
  jobKind,
  jobResultUrl,
  humanSize,
  JOB_KIND,
  JOB_STATUS,
} from "../../api/job";
import { formatTime } from "../../dateTime";
import config from "../../config";
import {
  ImportSection,
  ExportSection,
  SearchSection,
  MatchingSection,
} from "./sections";

const TITLE = {
  [JOB_KIND.IMPORT]: "Import",
  [JOB_KIND.EXPORT]: "Download",
  [JOB_KIND.SEARCH]: "Search download",
  [JOB_KIND.MATCHING]: "Name matching",
};

const dt = (v) => formatTime(v, "lll");

/**
 * The page of a single background job, of any kind. Imports, dataset and
 * search downloads and name matching jobs get a section of their own that
 * links to what they are about; every job also shows the generic JobDetail.
 */
const Job = ({ addError }) => {
  const { key } = useParams();
  const [job, setJob] = useState(null);
  // the export record of a dataset download, with its taxon counts
  const [exp, setExp] = useState(null);
  // the dataset a matching job took its names from
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  // a job record can be gone while its result archive is still there
  const [orphanResult, setOrphanResult] = useState(false);
  const timerRef = useRef(null);

  const load = async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const [j] = await decorateJobs([await getJob(key)]);
      setJob(j);
      setNotFound(false);
      const kind = jobKind(j.job);
      if (kind === JOB_KIND.EXPORT && !isLive(j.status)) {
        axios(`${config.dataApi}export/${key}`)
          .then((res) => setExp(res.data))
          .catch(() => setExp(null));
      }
      const sourceKey = j.params?.sourceDatasetKey;
      if (kind === JOB_KIND.MATCHING && sourceKey) {
        getDatasetsBatch([sourceKey]).then(([d]) => setSource(d));
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setJob(null);
        setNotFound(true);
        axios
          .head(jobResultUrl(key))
          .then(() => setOrphanResult(true))
          .catch(() => setOrphanResult(false));
      } else if (addError) {
        addError(err);
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    setJob(null);
    setExp(null);
    setSource(null);
    setNotFound(false);
    setOrphanResult(false);
    if (key) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Poll while the job is queued or running. setInterval with the handle in a
  // ref so the guard never goes stale and unmounting clears it.
  useEffect(() => {
    const live = isLive(job?.status);
    if (live && !timerRef.current) {
      timerRef.current = setInterval(
        () => load({ quiet: true }),
        config.pollingHeartBeat || 5000,
      );
    } else if (!live && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    },
    [],
  );

  const kind = job ? jobKind(job.job) : null;
  const title = job ? TITLE[kind] || job.job : "Job";

  const resultButton =
    job?.status === JOB_STATUS.FINISHED && job?.result ? (
      job.result.deleted ? (
        <Tag>Expired</Tag>
      ) : (
        <Button type="primary" href={jobResultUrl(job.key)}>
          <DownloadOutlined /> Download {humanSize(job.result.size)}
        </Button>
      )
    ) : null;

  return (
    <Layout openKeys={[]} selectedKeys={[]} title={title}>
      <PageContent>
        <Spin spinning={loading}>
          {notFound && (
            <Alert
              type={orphanResult ? "info" : "error"}
              showIcon
              title="Job not found"
              description={
                orphanResult ? (
                  <>
                    There is no record of this job any more, but its result is
                    still available.{" "}
                    <a href={jobResultUrl(key)}>
                      <DownloadOutlined /> Download result
                    </a>
                  </>
                ) : (
                  "There is no job with this key. A name matching job whose uploaded file could not be read never starts and leaves no record - make sure the file is a valid CSV or TSV with a scientificName column."
                )
              }
            />
          )}
          {job && (
            <Space
              orientation="vertical"
              size="middle"
              style={{ width: "100%" }}
            >
              {job.errorMessage && (
                <Alert
                  type="error"
                  showIcon
                  title={`${title} failed`}
                  description={job.errorMessage}
                />
              )}
              {job.status === JOB_STATUS.CANCELED && (
                <Alert
                  type="warning"
                  showIcon
                  title={`${title} was cancelled`}
                />
              )}
              <Card
                title={
                  <Space>
                    <JobStatusTag status={job.status} step={job.step} />
                    <span>{dt(job.created)}</span>
                  </Space>
                }
                extra={
                  <Space>
                    {resultButton}
                    <CancelJobButton job={job} onCancelled={() => load()} />
                  </Space>
                }
              >
                {kind === JOB_KIND.IMPORT && <ImportSection job={job} />}
                {kind === JOB_KIND.EXPORT && (
                  <ExportSection job={job} exp={exp} />
                )}
                {kind === JOB_KIND.SEARCH && <SearchSection job={job} />}
                {kind === JOB_KIND.MATCHING && (
                  <MatchingSection job={job} source={source} />
                )}
                <PresentationItem label="Created by">
                  {job.user?.username || job.userKey}
                </PresentationItem>
                <PresentationItem label="Started">
                  {dt(job.started)}
                </PresentationItem>
                <PresentationItem label="Finished">
                  {dt(job.finished)}
                </PresentationItem>
                <PresentationItem label="Duration">
                  <JobDuration job={job} />
                </PresentationItem>
              </Card>
              <Collapse
                // a job without a section of its own is only described here
                defaultActiveKey={kind === JOB_KIND.OTHER ? ["details"] : []}
                items={[
                  {
                    key: "details",
                    label: `Technical details: ${job.job}`,
                    children: <JobDetail job={job} />,
                  },
                ]}
              />
            </Space>
          )}
        </Spin>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });

export default withContext(mapContextToProps)(Job);
