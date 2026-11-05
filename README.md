# Freedom Through Retainers

Static site for freedomthroughretainers.com. No build step.

- `index.html`: the landing page. Photo and headline, then a centred "Calculate your retainers" calculator with five questions: monthly survival number, average job value, jobs per month, lowest month revenue, highest month revenue. Results show straight away (no gate):
  - "Chasing jobs vs retainers": a 12-month chart built from their lowest, highest and average months (about 20% of months at each extreme, the rest in between) against a flat retainer line and their survival number, plus short-month counts for each and the month-to-month swing.
  - "Adjust your retainers": two sliders (clients and price per client). Price starts at 75% of their average job; clients start at whichever is higher, their jobs per month or enough to cover survival.
  - A short "the numbers are the easy part" section and an optional name and email sign-up that posts their answers and adjusted plan to Formspree.
- Settings at the bottom of `index.html`: `FORM_ENDPOINT`, `RETAINER_RATE`, `YEAR` and `MID_SPREAD` (how the 12 months are laid out).
- No video, application form or call booking.
- `privacy.html`, `terms.html`: supporting pages (clean URLs via vercel.json).
