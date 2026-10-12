// js/layout.js - dynamic shell: sidebar, theme, shared dropdowns (runs immediately)
(function () {
  var BB = window.BudgetBuddy || {};
  var MOBILE_BP = 900;

  // ---------- Dynamic sidebar (single definition for all 8 pages) ----------
  var PAGES = [
    { href: "index.html", ico: "📊", label: "Dashboard" },
    { href: "transactions.html", ico: "💸", label: "Transactions" },
    { href: "monthly.html", ico: "🗓️", label: "Monthly" },
    { href: "analytics.html", ico: "📈", label: "Analytics" },
    { href: "settings.html", ico: "⚙️", label: "Settings" },
  ];

  function currentPage() {
    return (location.pathname.split("/").pop() || "index.html").toLowerCase().split("?")[0];
  }

  function buildShell() {
    var root = document.getElementById("sidebar-root");
    if (!root) return;
    var page = currentPage();
    var links = PAGES.map(function (p) {
      return (
        '<a href="' + p.href + '" class="side-link' + (p.href === page ? " active" : "") + '">' +
        '<span class="ico">' + p.ico + "</span> " + p.label + "</a>"
      );
    }).join("");
    root.innerHTML =
      '<aside class="sidebar" id="sidebar">' +
      '<div class="brand"><div class="mark"><img src="assets/logo.png" alt="Logo"></div>' +
      "<div><b>BudgetBuddy</b><span>Personal finance</span></div></div>" +
      '<div class="side-label">Menu</div><nav class="side-nav">' + links + "</nav>" +
      '<div class="side-foot">💡 Tip: click any chart to drill down.</div></aside>' +
      '<div class="overlay" id="overlay"></div>';
  }

  // ---------- Dynamic dropdowns (categories + currencies come from monthly.js) ----------
  function buildSelects() {
    if (BB.CATEGORIES) {
      document.querySelectorAll("select[data-cats]").forEach(function (sel) {
        if (sel.options.length) return; // already filled
        var html = sel.getAttribute("data-cats") === "all" ? '<option value="all">All categories</option>' : "";
        html += BB.CATEGORIES.map(function (c) {
          return '<option value="' + c + '">' + BB.cap(c) + "</option>";
        }).join("");
        sel.innerHTML = html;
      });
    }
    var cur = document.getElementById("currencySel");
    if (cur && !cur.options.length && BB.CURRENCIES) {
      cur.innerHTML = Object.keys(BB.CURRENCIES).map(function (code) {
        return "<option value=\"" + code + "\">" + code + " — " + BB.CURRENCIES[code].trim() + "</option>";
      }).join("");
    }
  }

  // ---------- Theme (global dark mode) ----------
  function readSettings() {
    try {
      return Object.assign(
        { theme: "system", currency: "USD", monthlyBudget: 0 },
        JSON.parse(localStorage.getItem("bb_settings")) || {}
      );
    } catch (e) {
      return { theme: "system", currency: "USD", monthlyBudget: 0 };
    }
  }

  function resolveTheme() {
    var s = readSettings();
    if (s.theme === "dark") return "dark";
    if (s.theme === "light") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme() {
    var t = resolveTheme();
    document.documentElement.setAttribute("data-theme", t);
    if (window.Chart) {
      Chart.defaults.color = t === "dark" ? "#93a8a2" : "#5f6f6a";
      Chart.defaults.borderColor = t === "dark" ? "rgba(147,168,162,.15)" : "rgba(12,26,23,.08)";
    }
    return t;
  }

  applyTheme();
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (readSettings().theme === "system") applyTheme();
    });
  } catch (e) {}
  window.addEventListener("bb:theme", applyTheme);

  // ---------- Sidebar show/hide ----------
  function isMobile() {
    return window.matchMedia("(max-width: " + MOBILE_BP + "px)").matches;
  }

  function toggleSidebar() {
    document.body.classList.toggle("sidebar-hidden");
    if (!isMobile()) {
      try {
        localStorage.setItem(
          "bb_sidebar",
          document.body.classList.contains("sidebar-hidden") ? "hidden" : "open"
        );
      } catch (e) {}
    }
  }

  // Run immediately: scripts sit at end of body, so the DOM above exists.
  buildShell();
  buildSelects();

  if (isMobile()) {
    document.body.classList.add("sidebar-hidden");
  } else {
    try {
      if (localStorage.getItem("bb_sidebar") === "hidden") document.body.classList.add("sidebar-hidden");
    } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Re-resolve BB in case monthly.js loaded after layout.js
    BB = window.BudgetBuddy || BB;
    buildSelects();

    var btn = document.getElementById("menuBtn");
    if (btn) btn.addEventListener("click", toggleSidebar);

    var overlay = document.getElementById("overlay");
    if (overlay) overlay.addEventListener("click", toggleSidebar);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isMobile()) document.body.classList.add("sidebar-hidden");
    });

    document.querySelectorAll(".side-link").forEach(function (a) {
      a.addEventListener("click", function () {
        if (isMobile()) document.body.classList.add("sidebar-hidden");
      });
    });

    window.addEventListener("resize", function () {
      try {
        if (!isMobile() && localStorage.getItem("bb_sidebar") !== "hidden") {
          document.body.classList.remove("sidebar-hidden");
        }
      } catch (e) {}
    });
  });
})();
