import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import advancedFormat from "dayjs/plugin/advancedFormat";

// registered here as well as in main.jsx so this module stands on its own -
// dayjs.extend is idempotent. utc backs the parse below; the other two supply
// the `lll` / `LT` / `Do` tokens the format strings use.
dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.extend(advancedFormat);

// The backend serializes java.time instants without a zone designator
// ("2026-09-04T14:21:00.612018"). They are UTC, but plain dayjs() would read
// them as local time - which silently shifts every displayed timestamp and, for
// a running job measured against Date.now(), inflates the duration by the
// viewer's UTC offset. Parse with dayjs.utc(), then convert to the viewer's
// zone. dayjs.utc() also honours an explicit Z / +02:00 should the backend
// ever start emitting one.
const DATE_ONLY = /^\d{4}(-\d{2}(-\d{2})?)?$/;

export const parseTime = (v) => {
  if (!v) return null;
  // partial / date-only values (e.g. a dataset's `issued`) carry no instant -
  // keep them at local midnight so a zone shift cannot move them a day
  if (typeof v === "string" && DATE_ONLY.test(v)) return dayjs(v);
  return dayjs.utc(v).local();
};

export const formatTime = (v, fmt = "lll") => {
  const d = parseTime(v);
  return d && d.isValid() ? d.format(fmt) : "";
};
