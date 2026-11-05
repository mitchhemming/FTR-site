// Adds a waitlist sign-up to Kit via the public form endpoint (no API key needed).
const { readBody, text } = require("./_lib");
const KIT_FORM_ID = "10146119"; // Kit form: FTR Waitlist

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.statusCode = 405; return res.end(); }
  const b = await readBody(req);
  const email = b && typeof b.email === "string" ? b.email.trim().slice(0, 200) : "";
  const name = b ? text(b.name, 60) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { res.statusCode = 400; return res.end(); }
  try {
    const r = await fetch(`https://app.kit.com/forms/${KIT_FORM_ID}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ email_address: email, first_name: name }).toString()
    });
    if (!r.ok) { console.error("kit status", r.status, (await r.text()).slice(0, 300)); res.statusCode = 502; return res.end(); }
    res.statusCode = 204; res.end();
  } catch (e) {
    console.error("kit failed", e && e.message);
    res.statusCode = 502; res.end();
  }
};
