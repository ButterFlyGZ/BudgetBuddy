// LocalStorage helpers (date-aware, backwards compatible)
function getTransactions() {
  return JSON.parse(localStorage.getItem('transactions')) || [];
}

function saveTransactions(data) {
  localStorage.setItem('transactions', JSON.stringify(data));
}

function normalizeDate(d) {
  if (d && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  return new Date().toISOString().split("T")[0];
}

// DOM elements
const form = document.getElementById("transactionForm");
const list = document.getElementById("transactionList");
const searchInput = document.getElementById("search");
const filterType = document.getElementById("filterType");
const filterCategory = document.getElementById("filterCategory");
const filterMonth = document.getElementById("filterMonth");
const clearFilters = document.getElementById("clearFilters");
const filterHint = document.getElementById("filterHint");
const dateInput = document.getElementById("date");

// View state: list | grid | table | days (persisted)
let currentView = localStorage.getItem("bb_tx_view") || "list";
const viewSeg = document.getElementById("viewSeg");
const viewCount = document.getElementById("viewCount");
let lastFiltered = [];

// Deep-link support: ?month=YYYY-MM &category=.. &type=.. &day=YYYY-MM-DD &q=.. &view=..
let activeDay = null;
(function applyQueryParams() {
  const q = new URLSearchParams(location.search);
  if (q.get("type") && filterType) filterType.value = q.get("type");
  if (q.get("category") && filterCategory) filterCategory.value = q.get("category");
  if (q.get("month") && filterMonth) filterMonth.value = q.get("month");
  if (q.get("day")) activeDay = q.get("day");
  if (q.get("q") && searchInput) searchInput.value = q.get("q");
  if (q.get("view") && ["list", "grid", "table", "days"].includes(q.get("view"))) currentView = q.get("view");
})();

let transactions = getTransactions();

// Default date input to today
if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];

// Shared row helpers: single implementation in monthly.js (BB)
const BB = window.BudgetBuddy;
const { esc, money: fmtMoney, catDotHTML: catDot, delBtnHTML: delBtn, amtHTML: amt, metaHTML: meta } = BB;
function sortedNewest(data) {
  return [...data].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

// Render transactions — dispatches to the active view
function renderTransactions(data = transactions) {
  lastFiltered = data;
  const sorted = sortedNewest(data);
  if (viewCount) viewCount.textContent = `${data.length} shown`;
  document.querySelectorAll("#viewSeg button").forEach((b) =>
    b.classList.toggle("on", b.dataset.view === currentView)
  );

  if (data.length === 0) {
    list.className = "";
    list.innerHTML = `<p style="text-align:center;color:var(--muted)">No transactions yet.</p>`;
    return;
  }

  if (currentView === "grid") return renderGrid(sorted);
  if (currentView === "table") return renderTable(sorted);
  if (currentView === "days") return renderDays(sorted);
  return renderList(sorted);
}

// View 1 — classic list rows
function renderList(sorted) {
  list.className = "";
  list.innerHTML = "";
  sorted.forEach((t) => {
    const label = t.description || t.title || "Transaction";
    const realIndex = transactions.indexOf(t);
    const div = document.createElement("div");
    div.className = "tx-row";
    div.innerHTML = `
      <div>
        <b>${esc(label)}</b>
        <span class="pill" style="margin-left:8px">${t.type}</span>
        ${meta(t)}
      </div>
      <div style="text-align:right">
        ${amt(t)}<br>
        <span style="display:inline-block;margin-top:6px">${delBtn(realIndex)}</span>
      </div>
    `;
    list.appendChild(div);
  });
}

// View 2 — card grid (visual scan)
function renderGrid(sorted) {
  list.className = "tx-grid";
  list.innerHTML = "";
  sorted.forEach((t) => {
    const label = t.description || t.title || "Transaction";
    const realIndex = transactions.indexOf(t);
    const accent = BB ? BB.catColor(t.category) : "#6366f1";
    const card = document.createElement("div");
    card.className = "tx-card";
    card.style.setProperty("--accent", accent);
    card.innerHTML = `
      <div style="font-size:12px;color:var(--muted)">${esc(t.date || "")}</div>
      <div style="font-weight:800;font-size:20px;letter-spacing:-0.02em;margin:2px 0">${amt(t)}</div>
      <div style="font-weight:600">${esc(label)}</div>
      ${meta(t)}
      <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
        <span class="pill">${t.type}</span>
        ${delBtn(realIndex)}
      </div>
    `;
    list.appendChild(card);
  });
}

// View 3 — compact table (compare + scan amounts)
function renderTable(sorted) {
  list.className = "";
  const rows = sorted.map((t) => {
    const label = t.description || t.title || "Transaction";
    const realIndex = transactions.indexOf(t);
    return `<tr>
      <td>${esc(t.date || "")}</td>
      <td><b>${esc(label)}</b></td>
      <td>${catDot(t.category)}${esc(t.category || "general")}</td>
      <td>${t.type}</td>
      <td style="text-align:right">${amt(t)}</td>
      <td style="text-align:right">${delBtn(realIndex)}</td>
    </tr>`;
  }).join("");
  list.innerHTML = `<div class="table-wrap"><table class="data">
    <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th style="text-align:right">Amount</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

// View 4 — grouped by day with daily totals
function renderDays(sorted) {
  list.className = "";
  const groups = {};
  sorted.forEach((t) => {
    const d = String(t.date || "").slice(0, 10);
    (groups[d] = groups[d] || []).push(t);
  });
  list.innerHTML = Object.keys(groups).sort().reverse().map((day) => {
    const items = groups[day];
    const inn = items.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const out = items.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const net = inn - out;
    const cards = items.map((t) => {
      const label = t.description || t.title || "Transaction";
      const realIndex = transactions.indexOf(t);
      return `<div class="tx-row">
        <div><b>${esc(label)}</b>${meta(t)}</div>
        <div style="text-align:right">${amt(t)}<br><span style="display:inline-block;margin-top:6px">${delBtn(realIndex)}</span></div>
      </div>`;
    }).join("");
    return `<div class="day-group">
      <div class="day-head">
        <b>${day}</b>
        <span>in ${fmtMoney(inn)} · out ${fmtMoney(out)} · <b style="color:${net >= 0 ? "var(--green)" : "var(--red)"}">${net >= 0 ? "+" : ""}${fmtMoney(net)}</b></span>
      </div>
      ${cards}
    </div>`;
  }).join("");
}

function setView(v) {
  currentView = v;
  localStorage.setItem("bb_tx_view", v);
  renderTransactions(lastFiltered);
}
if (viewSeg) viewSeg.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-view]");
  if (b) setView(b.dataset.view);
});

// Add transaction
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const desc = document.getElementById("description").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const date = normalizeDate(dateInput ? dateInput.value : null);

  if (!desc || !(amount > 0)) return;

  transactions.push({
    id: Date.now(),
    title: desc,
    description: desc,
    amount,
    type,
    category,
    date,
  });
  saveTransactions(transactions);
  applyFilters();

  form.reset();
  if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];
  Swal.fire("Added!", "Transaction added successfully!", "success");
});

// Delete transaction
list.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete")) {
    const index = Number(e.target.dataset.index);
    transactions.splice(index, 1);
    saveTransactions(transactions);
    renderTransactions();
    Swal.fire("Deleted", "Transaction removed.", "info");
  }
});

function applyFilters() {
  const query = searchInput.value.toLowerCase();
  const type = filterType.value;
  const cat = filterCategory ? filterCategory.value : "all";
  const ym = filterMonth ? filterMonth.value : "";
  const filtered = transactions.filter(t => {
    const label = (t.description || t.title || "").toLowerCase();
    const okSearch = label.includes(query);
    const okType = type === "all" ? true : t.type === type;
    const okCat = cat === "all" ? true : (t.category || "general") === cat;
    const okMonth = !ym ? true : String(t.date || "").slice(0, 7) === ym;
    const okDay = !activeDay ? true : String(t.date || "").slice(0, 10) === activeDay;
    return okSearch && okType && okCat && okMonth && okDay;
  });
  if (filterHint) {
    const parts = [];
    if (ym) parts.push(`month ${ym}`);
    if (activeDay) parts.push(`day ${activeDay}`);
    if (cat !== "all") parts.push(`category ${cat}`);
    if (type !== "all") parts.push(`type ${type}`);
    filterHint.textContent = parts.length
      ? `Filtered by ${parts.join(" · ")} — showing ${filtered.length} of ${transactions.length}. Click a chart to navigate here.`
      : `Showing ${filtered.length} of ${transactions.length}.`;
  }
  renderTransactions(filtered);
}

// Search filter
searchInput.addEventListener("input", applyFilters);

// Type filter
filterType.addEventListener("change", applyFilters);

if (filterCategory) filterCategory.addEventListener("change", applyFilters);
if (filterMonth) filterMonth.addEventListener("change", () => { activeDay = null; applyFilters(); });
if (clearFilters) clearFilters.addEventListener("click", () => {
  searchInput.value = "";
  filterType.value = "all";
  if (filterCategory) filterCategory.value = "all";
  if (filterMonth) filterMonth.value = "";
  activeDay = null;
  history.replaceState(null, "", location.pathname);
  applyFilters();
});

// Initial render
applyFilters();
