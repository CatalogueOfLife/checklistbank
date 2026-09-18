import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { getDatasetsBatch } from "./dataset";

vi.mock("axios", () => ({ default: vi.fn() }));

describe("getDatasetsBatch", () => {
  beforeEach(() => axios.mockReset());

  it("lines results up with the requested ids", async () => {
    axios.mockResolvedValue({
      data: [
        { key: 7, alias: "B" },
        { key: 3, alias: "A" },
      ],
    });
    const res = await getDatasetsBatch([3, 7]);
    expect(res.map((d) => d.alias)).toEqual(["A", "B"]);
  });

  // /dataset/simple answers an unknown key with a null entry, not by
  // omitting it. That must only blank the unknown key, not the whole batch.
  it("keeps the known datasets when the API returns null for an unknown key", async () => {
    axios.mockResolvedValue({ data: [{ key: 3, alias: "COL" }, null] });
    const res = await getDatasetsBatch([3, 999999999]);
    expect(res).toEqual([{ key: 3, alias: "COL" }, null]);
  });
});
