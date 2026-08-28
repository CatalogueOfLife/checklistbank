import config from "../../config";

const { kibanaEnv } = config;

/*
 * Field names are the ECS ones the backend emits since it moved to the elastic logback
 * encoder (life.catalogue.dw.logging.ClbEcsEncoder), June 2024:
 *   level       -> log.level
 *   logger_name -> log.logger
 *   job         -> event.id   (remapped by ClbEcsEncoder.ECS_MAP, as is task -> event.action
 *                              and source -> labels.source)
 * dataset, sector and attempt stay verbatim MDC keys at the document root. All keyword typed,
 * so match_phrase filters work on them unchanged.
 */
const filter = (key, value) =>
  `('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'${kibanaEnv.index}',key:${key},negate:!f,params:(query:'${value}'),type:phrase),query:(match_phrase:(${key}:'${value}')))`;

const discover = (key, value, extra = "") =>
  `https://logs.gbif.org/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(columns:!(log.level,log.logger,message),filters:!(${filter(
    key,
    value
  )}${extra}),index:'${kibanaEnv.index}',interval:auto,query:(language:lucene,query:''),sort:!(!('@timestamp',desc)))`;

const andAttempt = (attempt) =>
  attempt || attempt === 0 ? `,${filter("attempt", attempt)}` : "";

/** Logs of one background job, by its uuid. Works for jobs of any kind. */
export const jobLogQuery = (jobKey) => discover("event.id", jobKey);

/** Logs of a dataset, optionally narrowed to one import attempt. */
export const datasetLogQuery = (datasetKey, attempt) =>
  discover("dataset", datasetKey, andAttempt(attempt));

/** Logs of a sector, optionally narrowed to one sync attempt. */
export const sectorLogQuery = (sectorKey, attempt) =>
  discover("sector", sectorKey, andAttempt(attempt));

export default jobLogQuery;
