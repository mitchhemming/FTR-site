// Private stats page: /api/stats?key=YOUR_STATS_PASSWORD  (add &format=csv to download)
const crypto = require("crypto");
const { list, get } = require("@vercel/blob");

const PROGRAM_PRICE = 3000; // used for the "price vs their numbers" context only

async function listAll(prefix) {
  let out = [], cursor;
  do { const r = await list({ prefix, cursor, limit: 1000 }); out = out.concat(r.blobs); cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
  return out;
}
async function readJson(pathname) {
  const r = await get(pathname, { access: "private" }); // cached reads keep this inside the free plan
  if (!r || r.statusCode !== 200) return null;
  try { return JSON.parse(await new Response(r.stream).text()); } catch (e) { return null; }
}
async function readAll(blobs) {
  const out = [];
  for (let i = 0; i < blobs.length; i += 20) {
    const part = await Promise.all(blobs.slice(i, i + 20).map((b) => readJson(b.pathname)));
    part.forEach((x) => x && out.push(x));
  }
  return out;
}
function keyOk(given) {
  const want = process.env.STATS_PASSWORD || "";
  if (!want || typeof given !== "string") return false;
  const a = Buffer.from(given), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const q = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((x, y) => x - y); const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
const $ = (n) => (n === null || n === undefined ? "–" : "$" + Math.round(n).toLocaleString("en-AU"));
const num = (n, d = 1) => (n === null || n === undefined ? "–" : (Math.round(n * 10 ** d) / 10 ** d).toLocaleString("en-AU"));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

module.exports = async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (!process.env.STATS_PASSWORD) { res.statusCode = 503; res.setHeader("content-type", "text/plain"); return res.end("Stats are locked. Add a STATS_PASSWORD environment variable in Vercel, then redeploy."); }
  if (!keyOk(url.searchParams.get("key"))) { res.statusCode = 401; res.setHeader("content-type", "text/plain"); return res.end("Not authorised."); }

  const [calcB, joinB, ctaB, viewB, startB, progB] = await Promise.all([listAll("calc/"), listAll("join/"), listAll("cta/"), listAll("view/"), listAll("start/"), listAll("progress/")]);
  const views = viewB.length, starts = startB.length;
  const [calc, joins, prog] = await Promise.all([readAll(calcB), readAll(joinB), readAll(progB)]);
  const ctaClicks = ctaB.length; // one record per visitor who tapped the Instagram button
  const planBy = Object.fromEntries(joins.map((p) => [p.id, p])); // sign-ups record where they left the sliders
  const joined = new Set(joins.map((j) => j.id));
  const rows = calc.map((c) => {
    const p = planBy[c.id] || {};
    return Object.assign({}, c, {
      avgMonth: c.aov * c.jobs, swing: c.high - c.low,
      finalClients: p.clients != null ? p.clients : c.clients, finalPrice: p.price != null ? p.price : c.price,
      joined: joined.has(c.id) ? "yes" : "no",
      name: (planBy[c.id] || {}).name || "", email: (planBy[c.id] || {}).email || ""
    });
  }).sort((a, b) => (a.ts < b.ts ? 1 : -1));

  if (url.searchParams.get("format") === "csv") {
    const cols = ["ts", "name", "email", "survival", "aov", "jobs", "avgMonth", "low", "high", "swing", "shortMonths", "clients", "price", "finalClients", "finalPrice", "joined", "source", "campaign", "device"];
    const csv = [cols.join(",")].concat(rows.map((r) => cols.map((k) => JSON.stringify(r[k] == null ? "" : r[k])).join(","))).join("\n");
    res.setHeader("content-type", "text/csv"); res.setHeader("content-disposition", 'attachment; filename="ftr-calculator.csv"');
    return res.end(csv);
  }

  const col = (k) => rows.map((r) => r[k]).filter((v) => typeof v === "number" && Number.isFinite(v));
  const metric = (label, k, fmt) => { const v = col(k); return `<tr><th>${label}</th><td>${fmt(q(v, 0.5))}</td><td>${fmt(avg(v))}</td><td>${fmt(q(v, 0.25))} to ${fmt(q(v, 0.75))}</td></tr>`; };
  const medSurv = q(col("survival"), 0.5), medAov = q(col("aov"), 0.5);
  const buckets = [[0, 5000, "Under $5k"], [5000, 10000, "$5k to $10k"], [10000, 15000, "$10k to $15k"], [15000, 25000, "$15k to $25k"], [25000, Infinity, "$25k+"]];
  const survs = col("survival");
  const bucketRows = buckets.map(([a, b, l]) => { const n = survs.filter((v) => v >= a && v < b).length; const pct = survs.length ? Math.round((n / survs.length) * 100) : 0; return `<tr><th>${l}</th><td>${n}</td><td><div class="bar"><i style="width:${pct}%"></i></div></td><td>${pct}%</td></tr>`; }).join("");
  const src = {}; rows.forEach((r) => { const k = r.source || "direct"; src[k] = (src[k] || 0) + 1; });
  const srcRows = Object.entries(src).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<tr><th>${esc(k)}</th><td>${n}</td></tr>`).join("") || `<tr><td colspan="2">No data yet</td></tr>`;
  const recent = rows.slice(0, 50).map((r) => `<tr><td>${esc(new Date(r.ts).toLocaleString("en-AU", { timeZone: "Australia/Brisbane", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }))}</td><td>${$(r.survival)}</td><td>${$(r.aov)}</td><td>${r.jobs}</td><td>${$(r.low)}</td><td>${$(r.high)}</td><td>${r.finalClients} × ${$(r.finalPrice)}</td><td>${r.email ? esc(r.name || "") + "<br><span style=\"color:var(--muted)\">" + esc(r.email) + "</span>" : "no"}</td><td>${esc(r.source || "direct")}</td></tr>`).join("") || `<tr><td colspan="9">No completions yet</td></tr>`;
  // Funnel: how far each visitor got through the five questions
  const doneIds = new Set(calc.map((c) => c.id));
  const reached = (k) => prog.filter((p) => !doneIds.has(p.id) && (p.answered || 0) >= k).length + calc.length;
  const qNames = ["Survival number", "Average job", "Jobs per month", "Lowest month", "Highest month"];
  const funnelBase = Math.max(starts, 1);
  const funnelRows = [["Visited the page", views], ["Started (typed in question 1)", starts]]
    .concat(qNames.map((n, i) => ["Answered " + (i + 1) + ". " + n, reached(i + 1)]))
    .concat([["Tapped the Instagram button", ctaClicks]])
    .map(([l, n], i) => { const pct = i === 0 ? "" : Math.round((n / funnelBase) * 100) + "%"; return `<tr><th>${l}</th><td>${n}</td><td>${pct}</td></tr>`; }).join("");
  const partial = prog.filter((p) => !doneIds.has(p.id)).sort((a, b) => (a.ts < b.ts ? 1 : -1)).slice(0, 50)
    .map((p) => `<tr><td>${esc(new Date(p.ts).toLocaleString("en-AU", { timeZone: "Australia/Brisbane", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }))}</td><td>${p.answered} of 5</td><td>${p.survival != null ? $(p.survival) : "–"}</td><td>${p.aov != null ? $(p.aov) : "–"}</td><td>${p.answered >= 3 && p.jobs != null ? p.jobs : "–"}</td><td>${p.answered >= 4 && p.low != null ? $(p.low) : "–"}</td><td>${esc(p.source || "direct")}</td></tr>`).join("") || `<tr><td colspan="7">No unfinished entries</td></tr>`;
  const key = encodeURIComponent(url.searchParams.get("key"));

  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-robots-tag", "noindex");
  res.end(`<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>FTR calculator stats</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=swap" rel="stylesheet">
<style>
:root{--paper:#F1F2F4;--ink:#111214;--muted:#5B616A;--line:#DCDFE3;--accent:#C6F135}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:"Archivo",system-ui,sans-serif;font-size:15px;line-height:1.5}
.wrap{width:min(100% - 32px,960px);margin:0 auto;padding:2rem 0 4rem}
h1{font-size:1.7rem;font-stretch:115%;font-weight:800;letter-spacing:-.03em;margin:0 0 .2rem}h2{font-size:1.1rem;font-weight:800;margin:0 0 .8rem}
.sub{color:var(--muted);margin:0 0 1.5rem}.sub a{color:var(--ink)}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.7rem;margin:0 0 1rem}
.kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:1rem}.kpi b{display:block;font-size:1.8rem;font-stretch:112%;font-weight:800;letter-spacing:-.03em}.kpi span{color:var(--muted);font-size:.85rem}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:1.2rem;margin:0 0 1rem;overflow-x:auto}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.5rem .6rem;border-bottom:1px solid var(--line);white-space:nowrap}th{font-weight:600}thead th{color:var(--muted);font-size:.8rem;font-weight:600}
.bar{height:10px;background:var(--paper);border-radius:5px;min-width:120px}.bar i{display:block;height:100%;background:var(--ink);border-radius:5px}
.note{background:#EEF8CF;border-radius:10px;padding:.9rem 1rem;margin:0 0 1rem}
.btn{display:inline-block;background:var(--ink);color:#fff;text-decoration:none;border-radius:8px;padding:.6rem 1rem;font-weight:600}
</style></head><body><div class="wrap">
<h1>Calculator stats</h1>
<p class="sub">Every completed calculator. Names and emails appear only for people who joined the waitlist. Times in Brisbane time. <a href="?key=${key}">Refresh</a></p>
<div class="kpis">
<div class="kpi"><b>${views}</b><span>page visits (from 11 Nov)</span></div>
<div class="kpi"><b>${starts}</b><span>started the calculator (from 11 Nov)</span></div>
<div class="kpi"><b>${rows.length}</b><span>completed calculators</span></div>
<div class="kpi"><b>${ctaClicks}</b><span>tapped the Instagram button</span></div>
<div class="kpi"><b>${rows.length ? Math.round((ctaClicks / rows.length) * 100) : 0}%</b><span>completion to Instagram</span></div>
<div class="kpi"><b>${joined.size}</b><span>joined the old waitlist</span></div>
<div class="kpi"><b>${num(avg(col("shortMonths")))}</b><span>average short months a year</span></div>
</div>
${medSurv ? `<p class="note">At the median survival number of <b>${$(medSurv)}</b>, a $${PROGRAM_PRICE.toLocaleString("en-AU")} program is about <b>${Math.round((PROGRAM_PRICE / medSurv) * 100)}%</b> of one month's costs. At the median job value of ${$(medAov)}, it's about <b>${num(PROGRAM_PRICE / medAov)}</b> jobs.</p>` : ""}
<div class="card"><h2>Calculator funnel</h2><table><tbody>${funnelRows}</tbody></table><p style="color:var(--muted);margin:.6rem 0 0;font-size:.85rem">Percentages are of people who started. Visits and starts are counted from 11 Nov.</p></div>
<div class="card"><h2>What people entered</h2><table><thead><tr><th></th><th>Median</th><th>Average</th><th>Middle 50%</th></tr></thead><tbody>
${metric("Survival number (monthly)", "survival", $)}${metric("Average job", "aov", $)}${metric("Jobs per month", "jobs", (v) => num(v))}${metric("Average month (job × jobs)", "avgMonth", $)}${metric("Lowest month", "low", $)}${metric("Best month", "high", $)}${metric("Swing (best minus lowest)", "swing", $)}${metric("Retainer clients they settled on", "finalClients", (v) => num(v))}${metric("Retainer price they settled on", "finalPrice", $)}
</tbody></table></div>
<div class="card"><h2>Survival number spread</h2><table><tbody>${bucketRows}</tbody></table></div>
<div class="card"><h2>Where they came from</h2><table><tbody>${srcRows}</tbody></table></div>
<div class="card"><h2>Latest 50</h2><table><thead><tr><th>When</th><th>Survival</th><th>Avg job</th><th>Jobs</th><th>Lowest</th><th>Best</th><th>Final plan</th><th>Joined</th><th>Source</th></tr></thead><tbody>${recent}</tbody></table></div>
<div class="card"><h2>Unfinished entries</h2><table><thead><tr><th>When</th><th>Got to</th><th>Survival</th><th>Avg job</th><th>Jobs</th><th>Lowest</th><th>Source</th></tr></thead><tbody>${partial}</tbody></table></div>
<p><a class="btn" href="?key=${key}&format=csv">Download all as a spreadsheet (CSV)</a></p>
</div></body></html>`);
};
