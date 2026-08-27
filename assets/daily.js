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

const EN_DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];
const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(date) {
  const d = EN_DAYS[date.getDay()];
  const day = date.getDate();
  const m = EN_MONTHS[date.getMonth()];
  const y = date.getFullYear();
  return `${d}, ${m} ${day}, ${y}`;
}

function issueNumber(date) {
  const days = Math.floor((date - EPOCH) / 86400000);
  return "NO. " + String(Math.max(1, days + 1)).padStart(3, "0");
}

function renderMasthead(date, displayName) {
  document.getElementById("issue-number").textContent = issueNumber(date);
  document.getElementById("date-stamp").textContent = formatDate(date).toUpperCase();
  document.getElementById("gazette-name").textContent =
    `THE ${displayName.toUpperCase()} GAZETTE`;
  document.getElementById("footer-left").textContent = "EST. " + EPOCH.getFullYear();
}

function renderClosed(title, subtitle) {
  document.getElementById("hero").innerHTML = `
    <div class="closed-state">
      <div class="hero-label" style="margin-bottom: 1.5rem;">Press Closed</div>
      <h2 class="closed-title">${title}</h2>
      <p class="closed-subtitle">${subtitle}</p>
    </div>
  `;
}

function renderHero(date, team, unavailable, holidays, quotes) {
  const primary = pickPrimary(team, unavailable, holidays, date);

  if (!primary) {
    renderClosed(
      "Full House Off",
      "Nobody in the pool today — the whole team appears to be out."
    );
    return;
  }

  const backup = pickBackup(team, unavailable, date, primary);
  const quoteIdx = team.indexOf(primary);
  const quote = quotes[((quoteIdx >= 0 ? quoteIdx : 0) % quotes.length)];

  document.getElementById("hero").innerHTML = `
    <div class="hero">
      <div class="hero-label">Today's Facilitator</div>
      <span class="hero-name rolling" id="hero-name">${team[0]}</span>
      ${
        backup
          ? `<div class="hero-backup">Standby · <span class="hero-backup-name">${backup}</span></div>`
          : ""
      }
      <span class="hero-rule"></span>
      <p class="hero-quote">${quote}</p>
    </div>
  `;

  const el = document.getElementById("hero-name");
  let ticks = 0;
  const maxTicks = 14;
  const interval = setInterval(() => {
    el.textContent = team[Math.floor(Math.random() * team.length)];
    ticks++;
    if (ticks >= maxTicks) {
      clearInterval(interval);
      el.textContent = primary;
      el.classList.remove("rolling");
    }
  }, 70);
}

function init(config) {
  const cutoverHour = config.cutoverHour ?? DEFAULT_CUTOVER_HOUR;
  const holidays = config.holidays ?? DEFAULT_HOLIDAYS;
  const unavailable = config.unavailable || {};
  const quotes = config.quotes || DEFAULT_QUOTES;
  const today = effectiveDate(new Date(), cutoverHour);

  renderMasthead(today, config.displayName);

  const holidayName = isHoliday(today, holidays);
  if (isWeekend(today)) {
    renderClosed("Weekend", "The press is closed. Back on Monday.");
  } else if (holidayName) {
    renderClosed("Holiday", holidayName);
  } else {
    renderHero(today, config.team, unavailable, holidays, quotes);
  }
}

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

if (typeof window !== "undefined" && window.SQUAD_DAILY_CONFIG) {
  init(window.SQUAD_DAILY_CONFIG);
}
