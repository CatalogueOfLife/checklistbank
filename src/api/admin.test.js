import { describe, it, expect } from "vitest";
import {
  JOB_EXECUTOR_STATE,
  jobExecutorState,
  normalizeComponentState,
} from "./admin";

// The shape GET /admin/component has served since 2026-09-04.
const NEW_SHAPE = {
  quiesced: true,
  idle: true,
  components: {
    NamesIndex: { running: true, autostart: true },
    JobExecutor: { running: true, autostart: true },
    CronExecutor: { running: false, autostart: false },
    ImportScheduler: { running: false, autostart: false },
  },
};

// What a backend older than that answers - and what prod still answered while
// the UI was already on the new one, which is why the old shape is supported.
const OLD_SHAPE = {
  ImportScheduler: true,
  DoiUpdater: true,
  NamesIndex: true,
  idle: false,
  JobExecutor: true,
  SyncScheduler: false,
};

describe("normalizeComponentState", () => {
  it("passes the current shape through", () => {
    expect(normalizeComponentState(NEW_SHAPE)).toEqual({
      idle: true,
      quiesced: true,
      components: NEW_SHAPE.components,
    });
  });

  it("lifts the flat map of an older backend into the same shape", () => {
    const { idle, quiesced, components } = normalizeComponentState(OLD_SHAPE);
    expect(idle).toBe(false);
    expect(quiesced).toBeUndefined();
    // idle is a server wide flag, never a component
    expect(Object.keys(components).sort()).toEqual([
      "DoiUpdater",
      "ImportScheduler",
      "JobExecutor",
      "NamesIndex",
      "SyncScheduler",
    ]);
    // an old server starts everything it reports, so nothing there is manual
    expect(components.SyncScheduler).toEqual({
      running: false,
      autostart: true,
    });
    expect(components.NamesIndex).toEqual({ running: true, autostart: true });
  });

  it("treats a missing autostart as autostart, not as manual", () => {
    const { components } = normalizeComponentState({
      components: { NamesIndex: { running: true } },
    });
    expect(components.NamesIndex).toEqual({ running: true, autostart: true });
  });

  it("survives an empty or unusable body", () => {
    expect(normalizeComponentState(null).components).toEqual({});
    expect(normalizeComponentState("nope").components).toEqual({});
    expect(normalizeComponentState({}).components).toEqual({});
  });
});

describe("jobExecutorState", () => {
  it("reads the three operator states off the jobs state", () => {
    expect(jobExecutorState({ started: true, paused: false })).toBe(
      JOB_EXECUTOR_STATE.RUNNING
    );
    expect(jobExecutorState({ started: true, paused: true })).toBe(
      JOB_EXECUTOR_STATE.QUIET
    );
    // paused is meaningless once the component is down
    expect(jobExecutorState({ started: false, paused: true })).toBe(
      JOB_EXECUTOR_STATE.STOPPED
    );
  });

  it("reports stopped before the state has loaded", () => {
    expect(jobExecutorState(null)).toBe(JOB_EXECUTOR_STATE.STOPPED);
  });
});
