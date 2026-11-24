/**
 * Goa Ferry & Bus Timetable Explorer with Multi-Leg Trip Planner
 * Features:
 * - 12 Bus Routes & 6 Ferry Routes seeded across Goa
 * - LocalStorage caching with offline mode detection & timestamp
 * - Route search with day-type resolution, sorting (time, fare, duration), and empty states
 * - Up to 3-leg trip planner (Bus, Ferry, Walk) with transfer waiting times
 * - Live stop departure board, saved favourites, recent searches, and printable schedules
 */

const STORAGE_KEYS = {
  TIMETABLE_CACHE: "goa_transit_timetable_v1",
  CACHE_TIMESTAMP: "goa_transit_cache_timestamp_v1",
  FAVOURITES: "goa_transit_favourites_v1",
  RECENT_SEARCHES: "goa_transit_recent_v1"
};

/* ==========================================================================
   1. SEED DATA: 12 BUS ROUTES, 6 FERRY ROUTES & SERVICE ALERTS
   ========================================================================== */
const SEED_DATA = {
  stops: [
    "Panjim",
    "Margao",
    "Vasco",
    "Mapusa",
    "Calangute",
    "Baga",
    "Palolem",
    "Colva",
    "Old Goa",
    "Divar Island",
    "Ribandar",
    "Chorao Island",
    "Betim",
    "Dona Paula",
    "Cavelossim",
    "Assolna",
    "Siolim",
    "Chopdem"
  ],
  alerts: [
    {
      id: "ALT-01",
      routeId: "BUS-101",
      type: "diversion",
      title: "Route Diverted: Panjim – Calangute Express (BUS-101)",
      message: "Due to smart-city roadwork near Porvorim flyover, buses are diverted via Betim–Verem coastal road (+10 mins delay)."
    },
    {
      id: "ALT-02",
      routeId: "FER-204",
      type: "cancellation",
      title: "Ferry Cancelled: Dona Paula – Vasco Jetty (FER-204)",
      message: "Afternoon ferry crossings suspended today due to rough sea swell at Mormugao bay. Use KTCL shuttle BUS-105 via Cortalim."
    }
  ],
  routes: [
    // --- 12 BUS ROUTES ---
    {
      id: "BUS-101",
      code: "KTCL-101",
      mode: "bus",
      operator: "Kadamba Transport (KTCL EV)",
      from: "Panjim",
      to: "Calangute",
      via: "Porvorim · Candolim",
      frequencyMins: 30,
      durationMins: 40,
      fare: 30,
      days: ["weekday", "saturday", "sunday"],
      departures: ["06:30", "07:00", "07:30", "08:00", "08:30", "09:15", "10:00", "11:00", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30", "21:00"]
    },
    {
      id: "BUS-102",
      code: "LOC-102",
      mode: "bus",
      operator: "North Goa Stage Carriage",
      from: "Calangute",
      to: "Baga",
      via: "Tito's Lane Junction",
      frequencyMins: 20,
      durationMins: 12,
      fare: 15,
      days: ["weekday", "saturday", "sunday"],
      departures: ["07:00", "07:30", "08:00", "08:30", "09:00", "09:45", "10:30", "11:15", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:30", "22:00"]
    },
    {
      id: "BUS-103",
      code: "KTCL-103",
      mode: "bus",
      operator: "Kadamba Transport (KTCL)",
      from: "Panjim",
      to: "Mapusa",
      via: "Porvorim Highway",
      frequencyMins: 15,
      durationMins: 30,
      fare: 20,
      days: ["weekday", "saturday", "sunday"],
      departures: ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:30", "11:30", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00", "21:15"]
    },
    {
      id: "BUS-104",
      code: "LOC-104",
      mode: "bus",
      operator: "Mapusa–Calangute Shuttle",
      from: "Mapusa",
      to: "Calangute",
      via: "Parra · Arpora",
      frequencyMins: 25,
      durationMins: 25,
      fare: 20,
      days: ["weekday", "saturday", "sunday"],
      departures: ["06:45", "07:15", "08:00", "08:45", "09:30", "10:15", "11:00", "12:00", "13:15", "14:30", "16:00", "17:30", "19:00", "20:15"]
    },
    {
      id: "BUS-105",
      code: "KTCL-105",
      mode: "bus",
      operator: "Kadamba Non-Stop Shuttle",
      from: "Panjim",
      to: "Margao",
      via: "Bambolim · Verna NH66",
      frequencyMins: 20,
      durationMins: 55,
      fare: 45,
      days: ["weekday", "saturday", "sunday"],
      departures: ["06:15", "06:45", "07:15", "07:45", "08:15", "09:00", "09:45", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:45"]
    },
    {
      id: "BUS-106",
      code: "KTCL-106",
      mode: "bus",
      operator: "Kadamba Non-Stop Shuttle",
      from: "Panjim",
      to: "Vasco",
      via: "Cortalim · Dabolim Airport",
      frequencyMins: 30,
      durationMins: 50,
      fare: 40,
      days: ["weekday", "saturday", "sunday"],
      departures: ["06:30", "07:15", "08:00", "08:45", "09:30", "10:30", "11:30", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"]
    },
    {
      id: "BUS-107",
      code: "LOC-107",
      mode: "bus",
      operator: "Salcete Coastal Bus",
      from: "Margao",
      to: "Colva",
      via: "Seraulim Cross",
      frequencyMins: 20,
      durationMins: 18,
      fare: 15,
      days: ["weekday", "saturday", "sunday"],
      departures: ["07:00", "07:30", "08:00", "08:30", "09:15", "10:00", "11:00", "12:00", "13:00", "14:30", "16:00", "17:15", "18:30", "19:45"]
    },
    {
      id: "BUS-108",
      code: "KTCL-108",
      mode: "bus",
      operator: "Kadamba South Express",
      from: "Margao",
      to: "Palolem",
      via: "Cuncolim · Canacona",
      frequencyMins: 45,
      durationMins: 75,
      fare: 55,
      days: ["weekday", "saturday", "sunday"],
      departures: ["06:45", "07:45", "08:45", "09:45", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30"]
    },
    {
      id: "BUS-109",
      code: "LOC-109",
      mode: "bus",
      operator: "Mormugao–Salcete Stage",
      from: "Vasco",
      to: "Margao",
      via: "Birla · Verna",
      frequencyMins: 30,
      durationMins: 45,
      fare: 35,
      days: ["weekday", "saturday", "sunday"],
      departures: ["07:00", "07:45", "08:30", "09:15", "10:00", "11:15", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"]
    },
    {
      id: "BUS-110",
      code: "KTCL-110",
      mode: "bus",
      operator: "Kadamba Heritage Line",
      from: "Panjim",
      to: "Old Goa",
      via: "Ribandar Causeway",
      frequencyMins: 20,
      durationMins: 22,
      fare: 15,
      days: ["weekday", "saturday", "sunday"],
      departures: ["06:40", "07:10", "07:40", "08:15", "08:50", "09:30", "10:15", "11:00", "12:00", "13:00", "14:15", "15:30", "16:45", "18:00", "19:15"]
    },
    {
      id: "BUS-111",
      code: "LOC-111",
      mode: "bus",
      operator: "Calangute–Panjim Direct",
      from: "Calangute",
      to: "Panjim",
      via: "Candolim · Betim",
      frequencyMins: 30,
      durationMins: 38,
      fare: 30,
      days: ["weekday", "saturday", "sunday"],
      departures: ["07:15", "08:00", "08:45", "09:30", "10:15", "11:15", "12:15", "13:30", "15:00", "16:30", "18:00", "19:30", "21:00"]
    },
    {
      id: "BUS-112",
      code: "KTCL-112",
      mode: "bus",
      operator: "Kadamba Weekend Beach Hopper",
      from: "Baga",
      to: "Panjim",
      via: "Calangute · Porvorim",
      frequencyMins: 60,
      durationMins: 48,
      fare: 35,
      days: ["saturday", "sunday"],
      departures: ["09:00", "10:00", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"]
    },

    // --- 6 FERRY ROUTES ---
    {
      id: "FER-201",
      code: "RND-201",
      mode: "ferry",
      operator: "Goa River Navigation Dept.",
      from: "Old Goa",
      to: "Divar Island",
      via: "Mandovi River (Sao Pedro Jetty)",
      frequencyMins: 30,
      durationMins: 10,
      fare: 0, // Free for foot passengers in Goa
      days: ["weekday", "saturday", "sunday"],
      departures: ["06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30"]
    },
    {
      id: "FER-202",
      code: "RND-202",
      mode: "ferry",
      operator: "Goa River Navigation Dept.",
      from: "Ribandar",
      to: "Chorao Island",
      via: "Dr. Salim Ali Bird Sanctuary Jetty",
      frequencyMins: 30,
      durationMins: 12,
      fare: 0,
      days: ["weekday", "saturday", "sunday"],
      departures: ["07:00", "07:30", "08:00", "08:30", "09:15", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
    },
    {
      id: "FER-203",
      code: "RND-203",
      mode: "ferry",
      operator: "Goa River Navigation Dept.",
      from: "Panjim",
      to: "Betim",
      via: "Mandovi Promenade Ferry Terminal",
      frequencyMins: 20,
      durationMins: 8,
      fare: 0,
      days: ["weekday", "saturday", "sunday"],
      departures: ["07:00", "07:20", "07:40", "08:00", "08:20", "08:40", "09:00", "09:30", "10:00", "10:30", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]
    },
    {
      id: "FER-204",
      code: "RND-204",
      mode: "ferry",
      operator: "Goa River Navigation Dept.",
      from: "Dona Paula",
      to: "Vasco",
      via: "Zuari Estuary Crossing",
      frequencyMins: 60,
      durationMins: 25,
      fare: 20,
      days: ["weekday", "saturday"],
      departures: ["07:30", "08:30", "09:30", "10:30", "12:30", "14:30", "16:30", "17:30"]
    },
    {
      id: "FER-205",
      code: "RND-205",
      mode: "ferry",
      operator: "Goa River Navigation Dept.",
      from: "Cavelossim",
      to: "Assolna",
      via: "Sal River Crossing",
      frequencyMins: 30,
      durationMins: 10,
      fare: 0,
      days: ["weekday", "saturday", "sunday"],
      departures: ["07:00", "07:30", "08:00", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30"]
    },
    {
      id: "FER-206",
      code: "RND-206",
      mode: "ferry",
      operator: "Goa River Navigation Dept.",
      from: "Siolim",
      to: "Chopdem",
      via: "Chapora River Crossing",
      frequencyMins: 30,
      durationMins: 10,
      fare: 0,
      days: ["weekday", "saturday", "sunday"],
      departures: ["07:00", "07:30", "08:15", "09:00", "09:45", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30"]
    }
  ]
};

/* ==========================================================================
   2. APPLICATION STATE & STORAGE LAYER
   ========================================================================== */
const state = {
  data: null,
  favourites: [],
  recentSearches: [],
  simulatedOffline: false,
  selectedDayType: "weekday",
  plannerLegs: []
};

function initStorageAndCache() {
  const cachedRaw = localStorage.getItem(STORAGE_KEYS.TIMETABLE_CACHE);
  const cachedTime = localStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMP);

  if (cachedRaw) {
    state.data = JSON.parse(cachedRaw);
  } else {
    state.data = SEED_DATA;
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_CACHE, JSON.stringify(SEED_DATA));
    const nowStr = new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    localStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, nowStr);
  }

  // Refresh cache timestamp if online
  if (navigator.onLine && !state.simulatedOffline) {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_CACHE, JSON.stringify(SEED_DATA));
    const nowStr = new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    localStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, nowStr);
  }

  state.favourites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVOURITES) || '["BUS-101", "FER-201"]');
  state.recentSearches = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES) || "[]");

  updateNetworkBanner();
}

function updateNetworkBanner() {
  const isOffline = !navigator.onLine || state.simulatedOffline;
  const banner = document.getElementById("status-banner");
  const indicator = document.getElementById("network-indicator");
  const tsEl = document.getElementById("cache-timestamp");
  const simBtn = document.getElementById("simulate-offline-btn");
  const savedTs = localStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMP) || "Unknown";

  if (isOffline) {
    banner.className = "status-banner offline";
    indicator.className = "badge badge-offline";
    indicator.textContent = "⚠ Offline Mode (Using Cached Timetables)";
    tsEl.textContent = `Last synced: ${savedTs}`;
    simBtn.textContent = state.simulatedOffline ? "Go Back Online" : "Offline Detected";
  } else {
    banner.className = "status-banner online";
    indicator.className = "badge badge-online";
    indicator.textContent = "● Online";
    tsEl.textContent = `Timetable cached: ${savedTs}`;
    simBtn.textContent = "Simulate Offline";
  }
}

/* ==========================================================================
   3. TIME & DATE UTILITIES
   ========================================================================== */
function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMins) {
  const wrapped = ((totalMins % 1440) + 1440) % 1440;
  const h = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const m = String(wrapped % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function formatDuration(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function getDayTypeFromDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay(); // 0 = Sun, 6 = Sat
  if (day === 0) return "sunday";
  if (day === 6) return "saturday";
  return "weekday";
}

function getTodayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().split("T")[0];
}

function getCurrentHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/* ==========================================================================
   4. ROUTE SEARCH & SORTING
   ========================================================================== */
function runRouteSearch() {
  const from = document.getElementById("search-from").value;
  const to = document.getElementById("search-to").value;
  const date = document.getElementById("search-date").value;
  const earliestTime = document.getElementById("search-time").value;
  const sortBy = document.getElementById("sort-select").value;

  const dayType = getDayTypeFromDate(date);
  const earliestMins = timeToMinutes(earliestTime);

  saveRecentSearch({ from, to, date, time: earliestTime });

  // Filter matching routes & departures strictly >= earliestTime
  const matches = [];
  state.data.routes.forEach((route) => {
    if (route.from === from && route.to === to && route.days.includes(dayType)) {
      route.departures.forEach((dep) => {
        const depMins = timeToMinutes(dep);
        if (depMins >= earliestMins) {
          matches.push({
            route,
            departure: dep,
            depMins,
            arrival: minutesToTime(depMins + route.durationMins),
            isFav: state.favourites.includes(route.id)
          });
        }
      });
    }
  });

  // Sort results: Favourites always appear first, then sorted by chosen criterion
  matches.sort((a, b) => {
    if (a.isFav !== b.isFav) return a.isFav ? -1 : 1;
    if (sortBy === "fare") return a.route.fare - b.route.fare || a.depMins - b.depMins;
    if (sortBy === "duration") return a.route.durationMins - b.route.durationMins || a.depMins - b.depMins;
    return a.depMins - b.depMins;
  });

  renderSearchResults(matches, { from, to, date, earliestTime, dayType });
}

function renderSearchResults(matches, query) {
  const container = document.getElementById("search-results-list");
  const summary = document.getElementById("results-summary");
  const dayBadge = document.getElementById("results-day-badge");

  summary.textContent = `${query.from} → ${query.to} (${matches.length} departure${matches.length === 1 ? "" : "s"})`;
  dayBadge.textContent = `Schedule: ${query.dayType.toUpperCase()} (${query.date}) · Departing after ${query.earliestTime}`;

  if (matches.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🧭</div>
        <h3>No matching departures found</h3>
        <p class="muted-text">No direct buses or ferries leave <strong>${query.from}</strong> for <strong>${query.to}</strong> after <strong>${query.earliestTime}</strong> on this ${query.dayType}.</p>
        <p class="muted-text small-text" style="margin-top:8px;">Tip: Try an earlier departure time or use the <strong>Multi-Leg Planner</strong> tab for connecting routes.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = matches
    .map((item) => {
      const { route, departure, arrival, isFav } = item;
      const alert = state.data.alerts.find((a) => a.routeId === route.id);
      const fareLabel = route.fare === 0 ? "FREE (Foot Passenger)" : `₹${route.fare}`;

      return `
        <article class="route-card ${isFav ? "is-favourite" : ""}">
          <div class="route-card-top">
            <div>
              <span class="mode-badge mode-${route.mode}">${route.mode}</span>
              <span class="route-title">${route.code}: ${route.from} → ${route.to}</span>
              <div class="route-meta">Operator: ${route.operator} · Via ${route.via} · Every ${route.frequencyMins} min</div>
            </div>
            <button type="button" class="fav-btn ${isFav ? "active" : ""}" onclick="toggleFavourite('${route.id}')">
              ${isFav ? "★ Saved" : "☆ Save"}
            </button>
          </div>

          <div class="route-times">
            <div class="time-block">
              <strong>${departure}</strong>
              <span>Departs ${route.from}</span>
            </div>
            <div class="muted-text">── ${formatDuration(route.durationMins)} ──▶</div>
            <div class="time-block">
              <strong>${arrival}</strong>
              <span>Arrives ${route.to}</span>
            </div>
            <div class="fare-pill">
              <div class="price">${fareLabel}</div>
              <span class="muted-text small-text">Single ticket</span>
            </div>
          </div>

          ${
            alert
              ? `<div class="inline-alert ${alert.type === "diversion" ? "diversion" : ""}">
                  <strong>${alert.title}:</strong> ${alert.message}
                </div>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

/* ==========================================================================
   5. MULTI-LEG TRIP PLANNER (UP TO 3 LEGS: BUS, FERRY, WALK)
   ========================================================================== */
function initPlannerLegs(customLegs = null) {
  state.plannerLegs = customLegs || [
    { mode: "bus", from: "Calangute", to: "Panjim", walkMins: 10 },
    { mode: "bus", from: "Panjim", to: "Old Goa", walkMins: 10 }
  ];
  renderPlannerLegInputs();
}

function renderPlannerLegInputs() {
  const container = document.getElementById("planner-legs-container");
  const addBtn = document.getElementById("add-leg-btn");
  addBtn.disabled = state.plannerLegs.length >= 3;

  const stopsOptions = (selected) =>
    state.data.stops.map((s) => `<option value="${s}" ${s === selected ? "selected" : ""}>${s}</option>`).join("");

  container.innerHTML = state.plannerLegs
    .map(
      (leg, idx) => `
      <div class="leg-box">
        <div class="leg-box-header">
          <span>Leg ${idx + 1}</span>
          ${
            state.plannerLegs.length > 1
              ? `<button type="button" class="btn-link" onclick="removePlannerLeg(${idx})">Remove</button>`
              : ""
          }
        </div>
        <div class="leg-fields">
          <div class="form-group">
            <label>Mode</label>
            <select onchange="updateLegField(${idx}, 'mode', this.value)">
              <option value="bus" ${leg.mode === "bus" ? "selected" : ""}>🚌 Bus</option>
              <option value="ferry" ${leg.mode === "ferry" ? "selected" : ""}>⛴️ Ferry</option>
              <option value="walk" ${leg.mode === "walk" ? "selected" : ""}>🚶 Walk</option>
            </select>
          </div>
          <div class="form-group">
            <label>From Stop</label>
            <select onchange="updateLegField(${idx}, 'from', this.value)">
              ${stopsOptions(leg.from)}
            </select>
          </div>
          <div class="form-group">
            <label>To Stop</label>
            <select onchange="updateLegField(${idx}, 'to', this.value)">
              ${stopsOptions(leg.to)}
            </select>
          </div>
          <div class="form-group">
            <label>${leg.mode === "walk" ? "Walk Duration (mins)" : "Min Transfer Buffer"}</label>
            <select onchange="updateLegField(${idx}, 'walkMins', Number(this.value))">
              <option value="5" ${leg.walkMins === 5 ? "selected" : ""}>5 mins</option>
              <option value="10" ${leg.walkMins === 10 ? "selected" : ""}>10 mins</option>
              <option value="15" ${leg.walkMins === 15 ? "selected" : ""}>15 mins</option>
              <option value="20" ${leg.walkMins === 20 ? "selected" : ""}>20 mins</option>
              <option value="30" ${leg.walkMins === 30 ? "selected" : ""}>30 mins</option>
            </select>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

window.updateLegField = function (index, field, value) {
  state.plannerLegs[index][field] = value;
  if (index === 0 && field === "from") {
    document.getElementById("planner-origin").value = value;
  }
  if (index === state.plannerLegs.length - 1 && field === "to") {
    document.getElementById("planner-dest").value = value;
  }
  renderPlannerLegInputs();
};

window.removePlannerLeg = function (index) {
  state.plannerLegs.splice(index, 1);
  renderPlannerLegInputs();
};

function calculateMultiLegTrip(e) {
  if (e) e.preventDefault();
  const date = document.getElementById("planner-date").value;
  const startTime = document.getElementById("planner-start-time").value;
  const dayType = getDayTypeFromDate(date);

  let currentMins = timeToMinutes(startTime);
  const initialStartMins = currentMins;

  let totalFare = 0;
  let totalWaitMins = 0;
  const computedLegs = [];

  for (let i = 0; i < state.plannerLegs.length; i++) {
    const leg = state.plannerLegs[i];
    const bufferMins = i === 0 ? 0 : 5; // Minimum 5-min transfer buffer between legs
    const earliestBoardMins = currentMins + bufferMins;

    if (leg.mode === "walk") {
      const depMins = currentMins;
      const arrMins = depMins + leg.walkMins;
      computedLegs.push({
        legNum: i + 1,
        mode: "walk",
        title: `Walk: ${leg.from} → ${leg.to}`,
        operator: "Pedestrian Transfer",
        departure: minutesToTime(depMins),
        arrival: minutesToTime(arrMins),
        durationMins: leg.walkMins,
        waitMins: 0,
        fare: 0
      });
      currentMins = arrMins;
      continue;
    }

    // Find earliest scheduled bus or ferry on this leg
    const candidateRoutes = state.data.routes.filter(
      (r) => r.mode === leg.mode && r.from === leg.from && r.to === leg.to && r.days.includes(dayType)
    );

    let bestCatch = null;
    candidateRoutes.forEach((route) => {
      route.departures.forEach((depStr) => {
        const depMins = timeToMinutes(depStr);
        if (depMins >= earliestBoardMins) {
          if (!bestCatch || depMins < bestCatch.depMins) {
            bestCatch = { route, depStr, depMins };
          }
        }
      });
    });

    if (!bestCatch) {
      document.getElementById("itinerary-output").innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Connection Not Possible on Leg ${i + 1}</h3>
          <p class="muted-text">No <strong>${leg.mode.toUpperCase()}</strong> service found from <strong>${leg.from}</strong> to <strong>${leg.to}</strong> after <strong>${minutesToTime(earliestBoardMins)}</strong> on ${dayType}.</p>
        </div>
      `;
      return;
    }

    const waitMins = i === 0 ? 0 : bestCatch.depMins - currentMins;
    const arrMins = bestCatch.depMins + bestCatch.route.durationMins;

    totalFare += bestCatch.route.fare;
    totalWaitMins += waitMins;

    computedLegs.push({
      legNum: i + 1,
      mode: leg.mode,
      title: `${bestCatch.route.code}: ${leg.from} → ${leg.to}`,
      operator: bestCatch.route.operator,
      departure: bestCatch.depStr,
      arrival: minutesToTime(arrMins),
      durationMins: bestCatch.route.durationMins,
      waitMins,
      fare: bestCatch.route.fare
    });

    currentMins = arrMins;
  }

  const totalTripMins = currentMins - initialStartMins;
  renderComputedItinerary(computedLegs, { totalFare, totalTripMins, totalWaitMins });
}

function renderComputedItinerary(legs, totals) {
  const out = document.getElementById("itinerary-output");
  const startDep = legs[0].departure;
  const finalArr = legs[legs.length - 1].arrival;

  out.innerHTML = `
    <div class="itinerary-summary-bar">
      <div class="summary-metric">
        <span>Total Trip Duration</span>
        <strong>${formatDuration(totals.totalTripMins)}</strong>
      </div>
      <div class="summary-metric">
        <span>Total Fare</span>
        <strong>₹${totals.totalFare}</strong>
      </div>
      <div class="summary-metric">
        <span>Total Transfer Wait</span>
        <strong>${formatDuration(totals.totalWaitMins)}</strong>
      </div>
      <div class="summary-metric">
        <span>Window</span>
        <strong>${startDep} → ${finalArr}</strong>
      </div>
    </div>

    ${legs
      .map(
        (leg, idx) => `
        ${
          idx > 0 && leg.waitMins > 0
            ? `<div class="wait-connector">⏳ Transfer wait at ${leg.title.split(":")[1].split("→")[0].trim()}: <strong>${leg.waitMins} mins</strong></div>`
            : ""
        }
        <div class="route-card">
          <div class="route-card-top">
            <div>
              <span class="mode-badge mode-${leg.mode}">Leg ${leg.legNum} · ${leg.mode}</span>
              <span class="route-title">${leg.title}</span>
              <div class="route-meta">${leg.operator}</div>
            </div>
            <div class="fare-pill">
              <div class="price">${leg.fare === 0 ? "FREE" : `₹${leg.fare}`}</div>
            </div>
          </div>
          <div class="route-times">
            <div class="time-block"><strong>${leg.departure}</strong><span>Depart</span></div>
            <div class="muted-text">── ${formatDuration(leg.durationMins)} ──▶</div>
            <div class="time-block"><strong>${leg.arrival}</strong><span>Arrive</span></div>
          </div>
        </div>
      `
      )
      .join("")}
  `;
}

/* ==========================================================================
   6. FULL TIMETABLE VIEW, LIVE STOP BOARD, FAVOURITES & RECENT SEARCHES
   ========================================================================== */
function renderFullTimetable() {
  const routeId = document.getElementById("timetable-route-select").value;
  const route = state.data.routes.find((r) => r.id === routeId);
  const display = document.getElementById("full-timetable-display");
  if (!route) return;

  const operatesToday = route.days.includes(state.selectedDayType);
  const alert = state.data.alerts.find((a) => a.routeId === route.id);

  display.innerHTML = `
    <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
      <span class="mode-badge mode-${route.mode}">${route.mode}</span>
      <h3 style="display:inline; margin-left:8px;">${route.code}: ${route.from} ↔ ${route.to}</h3>
      <p class="muted-text" style="margin-top:4px;">
        <strong>Operator:</strong> ${route.operator} · <strong>Via:</strong> ${route.via} ·
        <strong>Fare:</strong> ${route.fare === 0 ? "FREE" : `₹${route.fare}`} ·
        <strong>Duration:</strong> ${formatDuration(route.durationMins)}
      </p>
    </div>

    ${
      alert
        ? `<div class="inline-alert ${alert.type === "diversion" ? "diversion" : ""}" style="margin-bottom:14px;">
            <strong>${alert.title}:</strong> ${alert.message}
          </div>`
        : ""
    }

    ${
      !operatesToday
        ? `<div class="empty-state"><p><strong>Service Note:</strong> This route does not operate on <strong>${state.selectedDayType.toUpperCase()}</strong> schedules.</p></div>`
        : `
          <table class="timetable-table">
            <thead>
              <tr>
                <th>Trip #</th>
                <th>Departs ${route.from}</th>
                <th>Arrives ${route.to}</th>
                <th>Duration</th>
                <th>Fare</th>
              </tr>
            </thead>
            <tbody>
              ${route.departures
                .map(
                  (dep, idx) => `
                <tr>
                  <td>#${idx + 1}</td>
                  <td><strong>${dep}</strong></td>
                  <td>${minutesToTime(timeToMinutes(dep) + route.durationMins)}</td>
                  <td>${formatDuration(route.durationMins)}</td>
                  <td>${route.fare === 0 ? "FREE" : `₹${route.fare}`}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `
    }
  `;
}

function renderLiveStopBoard() {
  const stop = document.getElementById("live-stop-select").value;
  const nowHHMM = getCurrentHHMM();
  const nowMins = timeToMinutes(nowHHMM);
  const todayType = getDayTypeFromDate(getTodayISO());

  document.getElementById("live-clock-label").textContent = `Showing next departures after ${nowHHMM} (${todayType})`;

  const upcoming = [];
  state.data.routes.forEach((route) => {
    if (route.from === stop && route.days.includes(todayType)) {
      route.departures.forEach((dep) => {
        const depMins = timeToMinutes(dep);
        if (depMins >= nowMins) {
          upcoming.push({
            route,
            dep,
            inMins: depMins - nowMins
          });
        }
      });
    }
  });

  upcoming.sort((a, b) => a.inMins - b.inMins);
  const topFive = upcoming.slice(0, 5);
  const listEl = document.getElementById("live-departures-list");

  if (topFive.length === 0) {
    listEl.innerHTML = `<p class="muted-text small-text">No more scheduled departures from ${stop} today.</p>`;
    return;
  }

  listEl.innerHTML = topFive
    .map(
      (item) => `
      <div class="live-item">
        <div class="live-item-top">
          <span>${item.route.mode === "ferry" ? "⛴️" : "🚌"} To ${item.route.to}</span>
          <span>${item.dep}</span>
        </div>
        <div class="muted-text small-text" style="display:flex; justify-content:space-between; margin-top:3px;">
          <span>${item.route.code}</span>
          <strong>${item.inMins === 0 ? "Departing now" : `in ${formatDuration(item.inMins)}`}</strong>
        </div>
      </div>
    `
    )
    .join("");
}

window.toggleFavourite = function (routeId) {
  const idx = state.favourites.indexOf(routeId);
  if (idx === -1) {
    state.favourites.push(routeId);
  } else {
    state.favourites.splice(idx, 1);
  }
  localStorage.setItem(STORAGE_KEYS.FAVOURITES, JSON.stringify(state.favourites));
  renderFavouritesSidebar();
  runRouteSearch();
};

function renderFavouritesSidebar() {
  const container = document.getElementById("favourites-list");
  if (state.favourites.length === 0) {
    container.innerHTML = `<p class="muted-text small-text">No favourite routes saved yet. Click "☆ Save" on any route.</p>`;
    return;
  }

  container.innerHTML = state.favourites
    .map((id) => {
      const r = state.data.routes.find((rt) => rt.id === id);
      if (!r) return "";
      return `
        <div class="fav-item">
          <div>
            <strong>${r.from} → ${r.to}</strong>
            <div class="muted-text small-text">${r.code} · ${r.fare === 0 ? "FREE" : `₹${r.fare}`}</div>
          </div>
          <button type="button" class="btn-link" onclick="quickFillSearch('${r.from}', '${r.to}')">View</button>
        </div>
      `;
    })
    .join("");
}

window.quickFillSearch = function (from, to) {
  document.getElementById("search-from").value = from;
  document.getElementById("search-to").value = to;
  document.querySelector('[data-tab="search-tab"]').click();
  runRouteSearch();
};

function saveRecentSearch(entry) {
  const key = `${entry.from}|${entry.to}`;
  state.recentSearches = [
    entry,
    ...state.recentSearches.filter((item) => `${item.from}|${item.to}` !== key)
  ].slice(0, 5);

  localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(state.recentSearches));
  renderRecentSearches();
}

function renderRecentSearches() {
  const wrapper = document.getElementById("recent-searches-wrapper");
  const list = document.getElementById("recent-searches-list");

  if (state.recentSearches.length === 0) {
    wrapper.classList.add("hidden");
    return;
  }

  wrapper.classList.remove("hidden");
  list.innerHTML = state.recentSearches
    .map(
      (s) => `
      <button type="button" class="chip" onclick="quickFillSearch('${s.from}', '${s.to}')">
        ${s.from} → ${s.to}
      </button>
    `
    )
    .join("");
}

function renderGlobalAlerts() {
  const container = document.getElementById("global-alerts-container");
  container.innerHTML = state.data.alerts
    .map(
      (a) => `
      <div class="alert-banner ${a.type === "diversion" ? "diversion" : ""}">
        <span>${a.type === "diversion" ? "🚧" : "⛔"}</span>
        <div>
          <span class="alert-title">${a.title}</span>
          <span>${a.message}</span>
        </div>
      </div>
    `
    )
    .join("");
}

/* ==========================================================================
   7. INITIALIZATION & EVENT LISTENERS
   ========================================================================== */
function populateDropdowns() {
  const stopOptions = state.data.stops.map((s) => `<option value="${s}">${s}</option>`).join("");

  ["search-from", "search-to", "planner-origin", "planner-dest", "live-stop-select"].forEach((id) => {
    document.getElementById(id).innerHTML = stopOptions;
  });

  document.getElementById("search-from").value = "Panjim";
  document.getElementById("search-to").value = "Calangute";
  document.getElementById("planner-origin").value = "Calangute";
  document.getElementById("planner-dest").value = "Divar Island";
  document.getElementById("live-stop-select").value = "Panjim";

  const today = getTodayISO();
  document.getElementById("search-date").value = today;
  document.getElementById("planner-date").value = today;
  document.getElementById("search-time").value = "08:00";

  const routeSelect = document.getElementById("timetable-route-select");
  routeSelect.innerHTML = state.data.routes
    .map((r) => `<option value="${r.id}">[${r.mode.toUpperCase()}] ${r.code}: ${r.from} → ${r.to}</option>`)
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  initStorageAndCache();
  populateDropdowns();
  renderGlobalAlerts();
  renderFavouritesSidebar();
  renderRecentSearches();
  renderLiveStopBoard();
  renderFullTimetable();
  runRouteSearch();

  // Sample 3-leg trip pre-loaded for immediate demo
  initPlannerLegs([
    { mode: "bus", from: "Calangute", to: "Panjim", walkMins: 5 },
    { mode: "bus", from: "Panjim", to: "Old Goa", walkMins: 5 },
    { mode: "ferry", from: "Old Goa", to: "Divar Island", walkMins: 5 }
  ]);
  calculateMultiLegTrip();

  // Tab navigation
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  // Search form & sort
  document.getElementById("route-search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    runRouteSearch();
  });

  document.getElementById("sort-select").addEventListener("change", runRouteSearch);

  document.getElementById("swap-locations-btn").addEventListener("click", () => {
    const fromEl = document.getElementById("search-from");
    const toEl = document.getElementById("search-to");
    [fromEl.value, toEl.value] = [toEl.value, fromEl.value];
    runRouteSearch();
  });

  // Multi-leg planner events
  document.getElementById("add-leg-btn").addEventListener("click", () => {
    if (state.plannerLegs.length < 3) {
      const prevTo = state.plannerLegs[state.plannerLegs.length - 1].to;
      state.plannerLegs.push({ mode: "ferry", from: prevTo, to: "Divar Island", walkMins: 10 });
      renderPlannerLegInputs();
    }
  });

  document.getElementById("trip-planner-form").addEventListener("submit", calculateMultiLegTrip);

  document.getElementById("load-sample-trip-btn").addEventListener("click", () => {
    document.getElementById("planner-origin").value = "Calangute";
    document.getElementById("planner-dest").value = "Divar Island";
    document.getElementById("planner-start-time").value = "08:30";
    initPlannerLegs([
      { mode: "bus", from: "Calangute", to: "Panjim", walkMins: 5 },
      { mode: "bus", from: "Panjim", to: "Old Goa", walkMins: 5 },
      { mode: "ferry", from: "Old Goa", to: "Divar Island", walkMins: 5 }
    ]);
    calculateMultiLegTrip();
  });

  // Full timetable controls
  document.getElementById("timetable-route-select").addEventListener("change", renderFullTimetable);
  document.querySelectorAll(".day-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".day-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.selectedDayType = btn.dataset.daytype;
      renderFullTimetable();
    });
  });

  document.getElementById("print-timetable-btn").addEventListener("click", () => window.print());

  // Live stop board
  document.getElementById("live-stop-select").addEventListener("change", renderLiveStopBoard);

  // Offline status listeners + testing toggle
  window.addEventListener("online", updateNetworkBanner);
  window.addEventListener("offline", updateNetworkBanner);
  document.getElementById("simulate-offline-btn").addEventListener("click", () => {
    state.simulatedOffline = !state.simulatedOffline;
    updateNetworkBanner();
  });
});