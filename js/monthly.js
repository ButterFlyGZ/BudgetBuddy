// js/monthly.js - shared helpers for monthly / yearly tracking
// Works with legacy transactions: {title|description, amount, type, date?, category?, id?}
(function () {
  function normalizeTransactions(raw) {
    const today = new Date().toISOString().split("T")[0];
    return (raw || []).map((t) => {
      const date = t.date && /^\d{4}-\d{2}-\d{2}/.test(t.date) ? t.date.slice(0, 10) : today;
      return {
        id: t.id ?? Date.now() + Math.random(),
        title: t.title || t.description || "Transaction",
        description: t.description || t.title || "Transaction",
        amount: Number(t.amount) || 0,
        type: t.type === "income" ? "income" : "expense",
        category: t.category || "general",
        date,
      };
    });
  }

  function loadTransactions() {
    try {
      return normalizeTransactions(JSON.parse(localStorage.getItem("transactions")) || []);
    } catch {
      return [];
    }
  }

  function monthKey(dateStr) {
    return dateStr.slice(0, 7); // YYYY-MM
  }

  function filterByMonth(transactions, ym) {
    return transactions.filter((t) => monthKey(t.date) === ym);
  }

  function filterByYear(transactions, year) {
    return transactions.filter((t) => t.date.slice(0, 4) === String(year));
  }

  function totals(list) {
    const income = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense, count: list.length };
  }

  function daysInMonth(year, month1to12) {
    return new Date(year, month1to12, 0).getDate();
  }

  // Daily series for a given month: { labels: ['1',...], income: [...], expense: [...] }
  function dailySeries(transactions, ym) {
    const [y, m] = ym.split("-").map(Number);
    const n = daysInMonth(y, m);
    const income = new Array(n).fill(0);
    const expense = new Array(n).fill(0);
    filterByMonth(transactions, ym).forEach((t) => {
      const day = Number(t.date.slice(8, 10));
      if (day >= 1 && day <= n) {
        if (t.type === "income") income[day - 1] += t.amount;
        else expense[day - 1] += t.amount;
      }
    });
    return {
      labels: Array.from({ length: n }, (_, i) => String(i + 1)),
      income,
      expense,
    };
  }

  // Yearly series: per-month income/expense/balance + cumulative balance
  function yearlySeries(transactions, year) {
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const income = new Array(12).fill(0);
    const expense = new Array(12).fill(0);
    filterByYear(transactions, year).forEach((t) => {
      const mi = Number(t.date.slice(5, 7)) - 1;
      if (mi >= 0 && mi < 12) {
        if (t.type === "income") income[mi] += t.amount;
        else expense[mi] += t.amount;
      }
    });
    const balance = income.map((v, i) => v - expense[i]);
    const cumulative = [];
    balance.reduce((acc, v, i) => (cumulative[i] = acc + v), 0);
    return { labels, income, expense, balance, cumulative };
  }

  function availableMonths(transactions) {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    return [...set].sort().reverse();
  }

  function availableYears(transactions) {
    const set = new Set(transactions.map((t) => t.date.slice(0, 4)));
    if (set.size === 0) set.add(String(new Date().getFullYear()));
    return [...set].sort().reverse();
  }

  function currentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  // ---------- App settings (shared by all pages) ----------
  const DEFAULT_SETTINGS = {
    theme: "system", // light | dark | system
    currency: "USD", // USD | EUR | MAD | GBP | ...
    monthlyBudget: 0, // 0 = no budget set
  };

  function getSettings() {
    try {
      return Object.assign(
        {},
        DEFAULT_SETTINGS,
        JSON.parse(localStorage.getItem("bb_settings")) || {}
      );
    } catch {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings(patch) {
    const next = Object.assign(getSettings(), patch);
    localStorage.setItem("bb_settings", JSON.stringify(next));
    return next;
  }

  const CURRENCIES = { USD: "$", EUR: "€", GBP: "£", MAD: "DH ", CAD: "$", CHF: "CHF ", JPY: "¥" };

  // ---------- Categories (single source of truth for all pages) ----------
  const CATEGORIES = [
    "general", "food", "transport", "shopping", "bills",
    "housing", "health", "entertainment", "education", "travel",
    "subscriptions", "salary", "freelance", "gifts", "savings", "other",
  ];

  const CAT_COLORS = {
    general: "#64748b", food: "#f97316", transport: "#0ea5e9",
    shopping: "#a855f7", bills: "#ef4444", housing: "#7c3aed",
    health: "#ec4899", entertainment: "#eab308", education: "#06b6d4",
    travel: "#14b8a6", subscriptions: "#6366f1", salary: "#10b981",
    freelance: "#65a30d", gifts: "#f472b6", savings: "#0d9488",
    other: "#9ca3af",
  };

  function catColor(c) {
    return CAT_COLORS[c] || "#6366f1";
  }

  function currencySymbol() {
    const s = getSettings();
    return CURRENCIES[s.currency] || (s.currency + " ");
  }

  function money(n) {
    return `${currencySymbol()}${Number(n || 0).toFixed(2)}`;
  }

  // ---------- Shared view helpers (single implementation, used by all pages) ----------
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function cap(s) {
    return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
  }

  function fmtMonth(ym) {
    const [y, m] = String(ym).split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString("en", { month: "long", year: "numeric" });
  }

  function shiftMonth(ym, delta) {
    const [y, m] = String(ym).split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function amtHTML(t) {
    const symbol = t.type === "income" ? "+" : "-";
    const color = t.type === "income" ? "var(--green)" : "var(--red)";
    return `<b style="color:${color}">${symbol}${money(t.amount)}</b>`;
  }

  function catDotHTML(cat) {
    return `<span class="cat-dot" style="background:${catColor(cat)}"></span>`;
  }

  function metaHTML(t) {
    const date = String(t.date || "").slice(0, 10);
    return `<div class="muted small">${catDotHTML(t.category)}${esc(t.category || "general")} · ${date}</div>`;
  }

  function delBtnHTML(realIndex) {
    return `<button data-index="${realIndex}" class="delete btn-ghost small-btn">Delete</button>`;
  }

  function txRowInner(t, rightHTML) {
    return `<div><b>${esc(t.description || t.title || "Transaction")}</b>${metaHTML(t)}</div><div class="right">${rightHTML}</div>`;
  }

  window.BudgetBuddy = Object.assign(window.BudgetBuddy || {}, {
    normalizeTransactions,
    loadTransactions,
    monthKey,
    filterByMonth,
    filterByYear,
    totals,
    dailySeries,
    yearlySeries,
    availableMonths,
    availableYears,
    currentMonthKey,
    getSettings,
    saveSettings,
    currencySymbol,
    money,
    CATEGORIES,
    CAT_COLORS,
    catColor,
    CURRENCIES,
    esc,
    cap,
    fmtMonth,
    shiftMonth,
    amtHTML,
    catDotHTML,
    metaHTML,
    delBtnHTML,
    txRowInner,
  });
})();
