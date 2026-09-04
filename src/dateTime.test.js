import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import { parseTime, formatTime } from "./dateTime";

describe("parseTime", () => {
  it("reads a zone-less backend timestamp as UTC, not local", () => {
    // this is the shape the API actually emits, nanosecond precision and all
    expect(parseTime("2026-09-04T14:21:00.612018020").toISOString()).toBe(
      "2026-09-04T14:21:00.612Z"
    );
  });

  it("honours an explicit designator if the backend ever adds one", () => {
    expect(parseTime("2026-09-04T14:21:00.612Z").toISOString()).toBe(
      "2026-09-04T14:21:00.612Z"
    );
    expect(parseTime("2026-09-04T16:21:00.612+02:00").toISOString()).toBe(
      "2026-09-04T14:21:00.612Z"
    );
  });

  it("keeps a date-only value on its own day in any zone", () => {
    // `issued` and friends carry no instant - shifting them could move the day
    expect(parseTime("2021-07-29").format("YYYY-MM-DD")).toBe("2021-07-29");
    expect(parseTime("2024-03").format("YYYY-MM")).toBe("2024-03");
  });

  it("returns null for an absent value", () => {
    expect(parseTime(null)).toBeNull();
    expect(parseTime("")).toBeNull();
    expect(parseTime(undefined)).toBeNull();
  });

  it("measures a running job against the wall clock correctly", () => {
    // the queue bug: `now` is a true epoch, so parsing `started` as local time
    // inflated the elapsed time by the viewer's UTC offset
    const started = "2026-09-04T14:21:00.000";
    const now = dayjs.utc("2026-09-04T15:33:00.000").valueOf();
    expect(now - parseTime(started).valueOf()).toBe(72 * 60 * 1000);
  });
});

describe("formatTime", () => {
  it("renders the Do ordinal rather than a literal o", () => {
    expect(formatTime("2021-07-29", "MMM Do YYYY")).toBe("Jul 29th 2021");
  });

  it("returns an empty string for an absent value", () => {
    expect(formatTime(null)).toBe("");
    expect(formatTime(undefined, "lll")).toBe("");
  });

  it("returns an empty string for an unparseable value", () => {
    expect(formatTime("not a date")).toBe("");
  });
});
