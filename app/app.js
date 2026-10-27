// Project inventory board: paste CLI JSON, choose each organization's plan, see flags and a rough cost.
const $ = (id) => document.getElementById(id);
const plans = {}; // organization_id -> "free" | "pro" | "team"
let rows = [];

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function load(text) {
  $("msg").innerHTML = "";
  if (!text.trim()) { rows = []; render(); return; }
  try {
    const r = Inventory.parse(text);
    rows = r.rows;
    if (r.skipped.length) $("msg").innerHTML = `<div class="warn">Skipped ${r.skipped.length} incomplete row(s): ${esc(r.skipped.join("; "))}</div>`;
    if (!rows.length) $("msg").innerHTML += `<div class="warn err">No usable projects in this input.</div>`;
  } catch (e) {
    rows = [];
    $("msg").innerHTML = `<div class="warn err">${esc(e.message)}</div>`;
  }
  render();
}

function render() {
  const orgs = Inventory.analyze(rows, plans, new Date());
  $("board").innerHTML = orgs.map((o, i) => {
    const sel = ["unknown", "free", "pro", "team"].map((p) => `<option value="${p}"${p === o.plan ? " selected" : ""}>${p === "unknown" ? "plan: choose" : p}</option>`).join("");
    const cost = o.monthly === null ? "no estimate" : "about $" + o.monthly + " / month";
    const body = o.projects.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.region || "")}</td><td>${esc(p.status)}</td><td>${p.ageDays} d</td><td>${p.flags.map((f) => `<span class="tag${f.startsWith("dormant") ? " old" : ""}">${esc(f)}</span>`).join("")}</td></tr>`).join("");
    return `<section class="card org"><h2>Organization ${i + 1} <small>(${esc(o.id.slice(0, 6))}…)</small> <select data-org="${esc(o.id)}">${sel}</select> <span>${o.projects.length} ${o.projects.length === 1 ? "project" : "projects"}, ${o.active} active, ${o.paused} paused</span> <b>${cost}</b></h2>${o.warnings.map((w) => `<div class="warn">${esc(w)}</div>`).join("")}<table><tr><th>Project</th><th>Region</th><th>Status</th><th>Age</th><th>Flags</th></tr>${body}</table></section>`;
  }).join("");
  document.querySelectorAll("select[data-org]").forEach((s) => s.addEventListener("change", () => { plans[s.dataset.org] = s.value; render(); }));
}

$("input").addEventListener("input", () => load($("input").value));
$("clear").addEventListener("click", () => { $("input").value = ""; load(""); });
$("load-sample").addEventListener("click", async () => {
  try {
    const res = await fetch("../sample/projects.sample.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    $("input").value = await res.text();
    load($("input").value);
  } catch (e) {
    $("msg").innerHTML = `<div class="warn err">Could not load the sample (${esc(e.message)}). Open this page through a local web server.</div>`;
  }
});
render();
