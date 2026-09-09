import { test } from "node:test";
import assert from "node:assert/strict";
import { parseEventDate, toEventInput, formatEventDate } from "../src/lib/dates";

test("Minsk event input represents the same instant in different server zones", () => {
  const original = process.env.TZ;
  try {
    for (const timezone of ["UTC", "Europe/Minsk", "America/New_York"]) {
      process.env.TZ = timezone;
      const date = parseEventDate("2026-10-15T10:00")!;
      assert.equal(date.toISOString(), "2026-10-15T07:00:00.000Z");
      assert.equal(toEventInput(date), "2026-10-15T10:00");
      assert.match(formatEventDate(date), /10:00/);
    }
  } finally { if (original) process.env.TZ = original; else delete process.env.TZ; }
});

test("invalid dates, absent time and timezone-injected inputs are rejected", () => {
  for (const value of ["2026-02-30T10:00", "2026-01-01", "invalid", "2026-10-15T25:00", "2026-10-15T10:00Z"]) {
    assert.equal(parseEventDate(value), null, value);
  }
});
