// Shared helpers for the calculator stats functions.
const MAX_MONEY = 10000000;

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    if (typeof req.body === "string") { try { return resolve(JSON.parse(req.body)); } catch (e) { return resolve(null); } }
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 10000) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(raw)); } catch (e) { resolve(null); } });
    req.on("error", () => resolve(null));
  });
}

const money = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n <= MAX_MONEY ? Math.round(n) : null; };
const count = (v, max) => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n) : null; };
const text = (v, max) => (typeof v === "string" ? v.replace(/[^\w .:/@#?&=+-]/g, "").slice(0, max) : "");
const validId = (v) => typeof v === "string" && /^[a-z0-9]{8,32}$/.test(v);

module.exports = { readBody, money, count, text, validId };
