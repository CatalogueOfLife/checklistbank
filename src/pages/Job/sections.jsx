import React from "react";
import { NavLink } from "react-router-dom";
import { Tag, Typography } from "antd";
import PresentationItem from "../../components/PresentationItem";
import { formatRequestValue } from "../Download/requestValue";
import {
  searchParamsOfRequest,
  searchUrlOfJob,
} from "../NameSearch/searchDownload";

const { Text } = Typography;

/** A dataset or project by its title, with its alias, linking to its page. */
export const DatasetLink = ({ dataset, datasetKey }) => {
  const key = dataset?.key ?? datasetKey;
  if (!key && key !== 0) return null;
  const pathname =
    dataset?.origin === "project"
      ? `/project/${key}/metadata`
      : `/dataset/${key}/about`;
  return (
    <span>
      <NavLink to={{ pathname }} end>
        {dataset?.title || dataset?.alias || key}
      </NavLink>
      {dataset?.title && dataset?.alias && (
        <Text type="secondary"> · {dataset.alias}</Text>
      )}
    </span>
  );
};

/** The params a section does not render on its own, verbatim as key: value tags. */
const ParamTags = ({ params, omit = [] }) => {
  const entries = Object.entries(params || {}).filter(
    ([k, v]) => !omit.includes(k) && v !== null && v !== undefined,
  );
  if (!entries.length) return null;
  return (
    <div>
      {entries.map(([k, v]) => (
        <Tag key={k}>{`${k}: ${formatRequestValue(v)}`}</Tag>
      ))}
    </div>
  );
};

// Uploads are recorded as a path on the server, which means nothing to the
// user - only the file name is worth showing.
const fileName = (path) => String(path).split("/").pop();

export const ImportSection = ({ job }) => {
  const p = job.params || {};
  return (
    <>
      <PresentationItem label="Dataset">
        <DatasetLink dataset={job.dataset} datasetKey={job.datasetKey} />
      </PresentationItem>
      <PresentationItem label="Import attempt">
        {job.attempt ? (
          <NavLink
            to={{
              pathname: `/dataset/${job.datasetKey}/imports/${job.attempt}`,
            }}
            end
          >
            {`#${job.attempt} – import metrics`}
          </NavLink>
        ) : job.status === "finished" ? (
          <Text type="secondary">none, the data was unchanged</Text>
        ) : null}
      </PresentationItem>
      {p.upload && (
        <PresentationItem label="Source">
          <Tag>file upload</Tag> {fileName(p.upload)}
        </PresentationItem>
      )}
      <PresentationItem label="Options">
        <ParamTags params={{ force: p.force }} />
      </PresentationItem>
      {job.datasetKey && (
        <PresentationItem label="All imports">
          <NavLink to={{ pathname: `/dataset/${job.datasetKey}/imports` }} end>
            Import history of this dataset
          </NavLink>
        </PresentationItem>
      )}
    </>
  );
};

/** A dataset export. `exp` is the record of GET /export/{key}, which carries the counts. */
export const ExportSection = ({ job, exp }) => {
  const p = job.params || {};
  return (
    <>
      <PresentationItem label="Dataset">
        <DatasetLink dataset={job.dataset} datasetKey={job.datasetKey} />
      </PresentationItem>
      <PresentationItem label="Format">
        {p.format && <Tag>{p.format}</Tag>}
      </PresentationItem>
      {p.root && (
        <PresentationItem label="Root taxon">
          <span>
            <NavLink
              to={{
                pathname: `/dataset/${job.datasetKey}/taxon/${encodeURIComponent(
                  p.root.id,
                )}`,
              }}
              end
            >
              {formatRequestValue(p.root)}
            </NavLink>
            {p.root.rank && <Text type="secondary"> · {p.root.rank}</Text>}
          </span>
        </PresentationItem>
      )}
      <PresentationItem label="Options">
        <ParamTags params={p} omit={["datasetKey", "format", "root"]} />
      </PresentationItem>
      {exp?.taxonCount !== undefined && exp?.taxonCount !== null && (
        <PresentationItem label="Taxa">
          {exp.taxonCount.toLocaleString()}
        </PresentationItem>
      )}
      {exp?.synonymCount !== undefined && exp?.synonymCount !== null && (
        <PresentationItem label="Synonyms">
          {exp.synonymCount.toLocaleString()}
        </PresentationItem>
      )}
      {exp?.taxaByRankCount && (
        <PresentationItem label="Taxa by rank">
          <div>
            {Object.entries(exp.taxaByRankCount).map(([rank, n]) => (
              <Tag key={rank}>{`${rank}: ${n.toLocaleString()}`}</Tag>
            ))}
          </div>
        </PresentationItem>
      )}
      {job.datasetKey && (
        <PresentationItem label="New download">
          <NavLink to={{ pathname: `/dataset/${job.datasetKey}/download` }} end>
            Download this dataset
          </NavLink>
        </PresentationItem>
      )}
    </>
  );
};

export const SearchSection = ({ job }) => {
  const search = searchParamsOfRequest(job.params);
  return (
    <>
      <PresentationItem label="Dataset">
        <DatasetLink dataset={job.dataset} datasetKey={job.datasetKey} />
      </PresentationItem>
      <PresentationItem label="Search">
        <div>
          {Object.keys(search)
            .filter((k) => !["sortBy", "content", "reverse"].includes(k))
            .map((k) => (
              <Tag key={k}>{`${k}: ${[].concat(search[k]).join(", ")}`}</Tag>
            ))}
          {job.datasetKey && (
            <NavLink to={searchUrlOfJob(job.datasetKey, job.params)}>
              Re-run search
            </NavLink>
          )}
        </div>
      </PresentationItem>
    </>
  );
};

/** `source` is the dataset the names were taken from, if they were not uploaded. */
export const MatchingSection = ({ job, source }) => {
  const p = job.params || {};
  return (
    <>
      <PresentationItem label="Matched against">
        <DatasetLink dataset={job.dataset} datasetKey={job.datasetKey} />
      </PresentationItem>
      <PresentationItem label="Names from">
        {p.sourceDatasetKey ? (
          <DatasetLink dataset={source} datasetKey={p.sourceDatasetKey} />
        ) : p.upload ? (
          <Tag>file upload</Tag>
        ) : null}
      </PresentationItem>
      <PresentationItem label="Options">
        <ParamTags
          params={p}
          omit={["datasetKey", "sourceDatasetKey", "upload"]}
        />
      </PresentationItem>
      <PresentationItem label="New matching">
        <NavLink to={{ pathname: "/tools/name-match" }} end>
          Match more names
        </NavLink>
      </PresentationItem>
    </>
  );
};
