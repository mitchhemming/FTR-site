# Freedom Through Retainers

Static site for freedomthroughretainers.com. No build step.

- `index.html`: the landing page. Photo and headline, then a centred "Calculate your retainers" calculator with five questions: monthly survival number, average job value, jobs per month, lowest month revenue, highest month revenue. Results show straight away (no gate):
  - "Where you are now": how many of their 12 months fall short of their survival number and roughly how much they have to find each year, with a chart built from their lowest, highest and average months (about 20% of months at each extreme, the rest in between).
  - "With retainers": a short statement of what their retainers put in the account each month.
  - "Try your own numbers": two sliders (clients and monthly price per client). Price starts at 75% of their average job (not stated on the page); clients start at whichever is higher, their jobs per month or enough to cover survival.
  - A short curiosity section that hints at the price and the positioning without explaining the method and an optional name and email sign-up that posts their answers and adjusted plan to Formspree.
- Settings at the bottom of `index.html`: `FORM_ENDPOINT`, `RETAINER_RATE`, `YEAR` and `MID_SPREAD` (how the 12 months are laid out).
- No video, application form or call booking.
- Anonymous stats: `api/track.js` saves one JSON record per calculator completion (`calc/`), last slider position (`plan/`) and waitlist join (`join/`) to a private Vercel Blob store (ftr-site-blob, Sydney). No names or emails are stored there. The page sends events from `track()` in `index.html` and records `utm_source` / `utm_campaign` or the referrer.
- Private stats page: `/api/stats?key=STATS_PASSWORD` (add `&format=csv` to download). Needs the `STATS_PASSWORD` environment variable set in Vercel.
- `package.json` only exists for the `@vercel/blob` dependency used by the functions; there is no build step.
- `privacy.html`, `terms.html`: supporting pages (clean URLs via vercel.json).
