// Pure logic for the project inventory board (no DOM). Input: output of `supabase projects list --output json`.
(function (root) {
  const DAY = 86400000;

  // Accepts {projects:[...]} (what the CLI prints) or a bare array. Throws with a readable message otherwise.
  function parse(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error("Not valid JSON: " + e.message); }
    const list = Array.isArray(data) ? data : data && data.projects;
    if (!Array.isArray(list)) throw new Error('Expected {"projects":[...]} or an array of projects');
    const bad = [];
    const rows = list.map((p, i) => {
      const miss = ["ref", "name", "organization_id", "status", "created_at"].filter((k) => !p || !p[k]);
      if (miss.length) bad.push(`#${i + 1} is missing ${miss.join(", ")}`);
      return p;
    }).filter((p) => p && p.ref && p.name && p.organization_id && p.status && p.created_at);
    return { rows, skipped: bad };
  }

  // plans: { <organization_id>: "free" | "pro" | "team" }  (the CLI output has no plan: you tell the board)
  function analyze(rows, plans, now, opts) {
    const o = Object.assign({ oldDays: 90, microCost: 10, credit: 10, freeActiveLimit: 2 }, opts);
    const orgs = {};
    for (const p of rows) {
      const org = (orgs[p.organization_id] = orgs[p.organization_id] || { id: p.organization_id, projects: [] });
      const ageDays = Math.floor((new Date(now) - new Date(p.created_at)) / DAY);
      const paused = p.status === "INACTIVE";
      const flags = [];
      if (paused) flags.push("paused");
      if (paused && ageDays >= o.oldDays) flags.push("dormant candidate");
      if (p.status !== "ACTIVE_HEALTHY" && !paused) flags.push("status: " + p.status);
      org.projects.push({ ref: p.ref, name: p.name, region: p.region, status: p.status, ageDays, flags });
    }
    for (const org of Object.values(orgs)) {
      const plan = plans[org.id] || "unknown";
      const active = org.projects.filter((p) => p.status !== "INACTIVE").length;
      const warnings = [];
      let monthly = null;
      if (plan === "free") {
        monthly = 0;
        if (active > o.freeActiveLimit) warnings.push(`${active} active projects but Free allows ${o.freeActiveLimit}`);
      } else if (plan === "pro" || plan === "team") {
        monthly = Math.max(0, active * o.microCost - o.credit);
        monthly += plan === "pro" ? 25 : 599;
      } else {
        warnings.push("plan not set: no cost estimate");
      }
      Object.assign(org, { plan, active, paused: org.projects.length - active, monthly, warnings });
    }
    return Object.values(orgs).sort((a, b) => b.projects.length - a.projects.length);
  }

  const api = { parse, analyze };
  if (typeof module !== "undefined") module.exports = api; else root.Inventory = api;
})(this);
