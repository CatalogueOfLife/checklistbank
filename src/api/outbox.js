import axios from "axios";
import qs from "query-string";
import config from "../config";

/**
 * Client for the backend outbox: durable commands that must run exactly once
 * and survive restarts and deploys - DataCite DOI calls, sector deletions, the
 * work after a release is published and GBIF registry updates. A command that
 * succeeded is deleted, so the outbox only ever holds pending, running and
 * failed ones. Admin only.
 *
 * Types and statuses come from /vocab/outboxtype and /vocab/outboxstatus and
 * are lower cased on the wire like every enum, e.g. "sector delete", "failed".
 */

/** A page of outbox commands, earliest due first. */
export const getOutbox = ({ type, status, limit, offset } = {}) =>
  axios
    .get(
      `${config.dataApi}admin/outbox?${qs.stringify({
        type,
        status,
        limit,
        offset,
      })}`
    )
    .then(({ data }) => data);

/** Runs a pending or failed command right away, with its attempts reset. */
export const retryOutbox = (id) =>
  axios.post(`${config.dataApi}admin/outbox/${id}/retry`);

/** Removes a command for good. */
export const deleteOutbox = (id) =>
  axios.delete(`${config.dataApi}admin/outbox/${id}`);

export const getOutboxVocab = (name) =>
  axios
    .get(`${config.dataApi}vocab/${name}`)
    .then(({ data }) => (Array.isArray(data) ? data.map((v) => v.name) : []))
    .catch(() => []);
