import config from "../../config";

const { kibanaEnv } = config;

const discover = (key, value, extra = "") =>
  `https://logs.gbif.org/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(columns:!(level,logger_name,message),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'${kibanaEnv.index}',key:${key},negate:!f,params:(query:'${value}'),type:phrase),query:(match_phrase:(${key}:'${value}')))${extra}),index:'${kibanaEnv.index}',interval:auto,query:(language:lucene,query:''),sort:!())`;

const andAttempt = (attempt) =>
  attempt || attempt === 0
    ? `,('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'${kibanaEnv.index}',key:attempt,negate:!f,params:(query:'${attempt}'),type:phrase),query:(match_phrase:(attempt:'${attempt}')))`
    : "";

/** Logs of one background job, by its uuid. Works for jobs of any kind. */
export const jobLogQuery = (jobKey) => discover("job.keyword", jobKey);

/** Logs of a dataset, optionally narrowed to one import attempt. */
export const datasetLogQuery = (datasetKey, attempt) =>
  discover("dataset", datasetKey, andAttempt(attempt));

/** Logs of a sector, optionally narrowed to one sync attempt. */
export const sectorLogQuery = (sectorKey, attempt) =>
  discover("sector", sectorKey, andAttempt(attempt));

export default jobLogQuery;
