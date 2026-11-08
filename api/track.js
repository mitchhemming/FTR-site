// Saves one anonymous record per calculator event to the private Blob store.
// Calculator answers are anonymous. A name and email are stored only when someone joins the waitlist.
const { put } = require("@vercel/blob");
const { readBody, money, count, text, validId } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.statusCode = 405; return res.end(); }
  const b = await readBody(req);
  if (!b || !validId(b.id) || !["complete", "join", "cta"].includes(b.type)) { res.statusCode = 400; return res.end(); }

  const rec = { id: b.id, type: b.type, ts: new Date().toISOString() };
  if (b.type === "complete") {
    Object.assign(rec, {
      survival: money(b.survival), aov: money(b.aov), jobs: count(b.jobs, 500),
      low: money(b.low), high: money(b.high),
      shortMonths: count(b.shortMonths, 12), clients: count(b.clients, 1000), price: money(b.price),
      source: text(b.source, 80), campaign: text(b.campaign, 80), device: text(b.device, 10)
    });
    if (rec.survival === null || rec.aov === null || rec.jobs === null || rec.low === null || rec.high === null) { res.statusCode = 400; return res.end(); }
  } else if (b.type === "cta") {
    // Clicked the Instagram button under the results. Anonymous.
    Object.assign(rec, { clients: count(b.clients, 1000), price: money(b.price), source: text(b.source, 80), device: text(b.device, 10) });
  } else {
    // Waitlist join: they chose to give their name and email, so it's stored with their answers.
    const email = typeof b.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim()) ? b.email.trim().slice(0, 200) : "";
    Object.assign(rec, { clients: count(b.clients, 1000), price: money(b.price), name: text(b.name, 60), email });
  }

  const folder = b.type === "complete" ? "calc" : b.type;
  try {
    await put(`${folder}/${b.id}.json`, JSON.stringify(rec), {
      access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true
    });
    res.statusCode = 204; res.end();
  } catch (e) {
    console.error("track failed", e && e.message);
    res.statusCode = 500; res.end();
  }
};
