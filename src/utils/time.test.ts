import { describe, expect, test } from "vitest";
import {
  secondsToMs,
  msToSeconds,
  formatDuration,
  sleep,
  getTimestamp,
  formatTimestamp,
} from "./time.js";

describe("Time Utils", () => {
  test("secondsToMs should convert seconds to milliseconds", () => {
    expect(secondsToMs(1)).toBe(1000);
    expect(secondsToMs(2.5)).toBe(2500);
    expect(secondsToMs(0)).toBe(0);
  });

  test("msToSeconds should convert milliseconds to seconds", () => {
    expect(msToSeconds(1000)).toBe(1);
    expect(msToSeconds(2500)).toBe(2.5);
    expect(msToSeconds(0)).toBe(0);
  });

  test("formatDuration should format duration correctly", () => {
    expect(formatDuration(1000)).toBe("1s");
    expect(formatDuration(60000)).toBe("1m 0s");
    expect(formatDuration(3600000)).toBe("1h 0m 0s");
    expect(formatDuration(3661000)).toBe("1h 1m 1s");
  });

  test("sleep should pause execution for specified time", async () => {
    const start = Date.now();
    await sleep(100);
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(100);
  });

  test("getTimestamp should return current timestamp", () => {
    const timestamp = getTimestamp();
    expect(timestamp).toBeGreaterThan(0);
    expect(timestamp).toBeLessThanOrEqual(Date.now());
  });

  test("formatTimestamp should format timestamp correctly", () => {
    const timestamp = 1609459200000; // 2021-01-01T00:00:00.000Z
    expect(formatTimestamp(timestamp)).toBe("2021-01-01T00:00:00.000Z");
  });
}); 