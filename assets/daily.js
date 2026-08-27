const DEFAULT_CUTOVER_HOUR = 9;

const DEFAULT_HOLIDAYS = {
  "2026-01-01": "New Year's Day",
  "2026-01-02": "New Year's Holiday",
  "2026-01-20": "Martyrs' Day",
  "2026-03-09": "Day off for Women's Day",
  "2026-03-20": "Novruz Holiday",
  "2026-03-23": "Novruz Holiday",
  "2026-03-24": "Novruz Holiday",
  "2026-03-25": "Novruz Holiday (extended)",
  "2026-03-26": "Novruz Holiday (extended)",
  "2026-03-27": "Novruz Holiday (extended)",
  "2026-03-30": "Novruz Holiday (extended)",
  "2026-05-11": "Day off for Victory Day over Fascism",
  "2026-05-27": "Feast of the Sacrifice (Gurban)",
  "2026-05-28": "Republic Day / Gurban Holiday",
  "2026-06-15": "Day of National Salvation",
  "2026-06-26": "Armed Forces Day",
  "2026-11-09": "State Flag Day / Victory Day observed",
  "2026-12-31": "World Azerbaijanis Solidarity Day",
};

const DEFAULT_QUOTES = [
  "I'm running today — we'll keep it short.",
  "Grab your coffee, we're starting.",
  "Morning, everyone — let's dive in.",
  "Aiming for five minutes, max.",
  "Can't wait to hear today's blockers.",
];

const EPOCH = new Date("2026-01-01");

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hashDate(date, suffix = "") {
  const key = toKey(date) + suffix;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function isHoliday(date, holidays) {
  return holidays[toKey(date)] || null;
}

function availableTeam(team, unavailable, date) {
  const offList = unavailable[toKey(date)] || [];
  return team.filter((n) => !offList.includes(n));
}

function effectiveDate(now, cutoverHour = DEFAULT_CUTOVER_HOUR) {
  const d = new Date(now);
  if (now.getHours() < cutoverHour) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(12, 0, 0, 0);
  return d;
}

function previousWorkday(date, holidays) {
  const d = new Date(date);
  do {
    d.setDate(d.getDate() - 1);
  } while (isWeekend(d) || isHoliday(d, holidays));
  return d;
}

function pickPrimary(team, unavailable, holidays, date) {
  const pool = availableTeam(team, unavailable, date);
  if (pool.length === 0) return null;

  let idx = hashDate(date) % pool.length;

  if (pool.length > 1) {
    const prev = previousWorkday(date, holidays);
    const prevPool = availableTeam(team, unavailable, prev);
    if (prevPool.length > 0) {
      const prevName = prevPool[hashDate(prev) % prevPool.length];
      if (pool[idx] === prevName) {
        idx = (idx + 1) % pool.length;
      }
    }
  }
  return pool[idx];
}

function pickBackup(team, unavailable, date, primary) {
  const pool = availableTeam(team, unavailable, date).filter((n) => n !== primary);
  if (pool.length === 0) return null;
  return pool[hashDate(date, "::backup") % pool.length];
}

function init(config) {}

if (typeof module !== "undefined") {
  module.exports = {
    toKey,
    hashDate,
    effectiveDate,
    availableTeam,
    pickPrimary,
    pickBackup,
    isWeekend,
    isHoliday,
    init,
    DEFAULT_CUTOVER_HOUR,
    DEFAULT_HOLIDAYS,
    DEFAULT_QUOTES,
    EPOCH,
  };
}
