const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  toKey,
  hashDate,
  effectiveDate,
  pickPrimary,
  pickBackup,
  availableTeam,
} = require("./daily.js");

const TEAM = ["A", "B", "C"];

describe("toKey", () => {
  it("formats local Y-M-D", () => {
    assert.equal(toKey(new Date(2026, 3, 27)), "2026-04-27");
  });
});

describe("effectiveDate", () => {
  it("stays on calendar day at/after cutover", () => {
    const d = effectiveDate(new Date(2026, 3, 27, 9, 0, 0), 9);
    assert.equal(toKey(d), "2026-04-27");
  });
  it("rolls back before cutover", () => {
    const d = effectiveDate(new Date(2026, 3, 27, 8, 59, 0), 9);
    assert.equal(toKey(d), "2026-04-26");
  });
});

describe("pickPrimary", () => {
  it("is deterministic for a fixed date", () => {
    const date = new Date(2026, 3, 27, 12);
    const a = pickPrimary(TEAM, {}, {}, date);
    const b = pickPrimary(TEAM, {}, {}, date);
    assert.equal(a, b);
    assert.ok(TEAM.includes(a));
  });
  it("excludes unavailable members", () => {
    const date = new Date(2026, 3, 27, 12);
    const off = { "2026-04-27": ["A", "B"] };
    assert.equal(pickPrimary(TEAM, off, {}, date), "C");
  });
  it("returns null when pool empty", () => {
    const date = new Date(2026, 3, 27, 12);
    const off = { "2026-04-27": ["A", "B", "C"] };
    assert.equal(pickPrimary(TEAM, off, {}, date), null);
  });
});

describe("pickBackup", () => {
  it("never equals primary when pool allows", () => {
    const date = new Date(2026, 3, 27, 12);
    const primary = pickPrimary(TEAM, {}, {}, date);
    const backup = pickBackup(TEAM, {}, date, primary);
    assert.notEqual(backup, primary);
  });
});

describe("availableTeam", () => {
  it("filters by date key", () => {
    assert.deepEqual(
      availableTeam(TEAM, { "2026-04-27": ["B"] }, new Date(2026, 3, 27, 12)),
      ["A", "C"]
    );
  });
});

describe("hashDate", () => {
  it("changes with suffix", () => {
    const d = new Date(2026, 3, 27, 12);
    assert.notEqual(hashDate(d), hashDate(d, "::backup"));
  });
});
