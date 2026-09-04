import { describe, it, expect } from "vitest";
import { JOB_EXECUTOR_STATE, jobExecutorState } from "./admin";

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
