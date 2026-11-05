# Freedom Through Retainers

Static site for freedomthroughretainers.com. No build step.

- `index.html`: the landing page. Photo and headline, then a free retainer calculator:
  1. Monthly survival number (one figure).
  2. Average earnings per job.
  3. Jobs per month (stepper).
  4. Name and email gate (posts the name, email and all answers to Formspree), then the results.
- Results: retainer price starts at 75% of the average job, multiplied by jobs per month. A ring shows how much of the survival number is covered. Sliders adjust retainer clients and retainer price, with quick buttons for more clients, a higher price, a bit of both, or reset. A 12-month chart compares uneven project income with the steady retainer line, then a short "the numbers are the easy part" section.
- Settings at the bottom of `index.html`: `FORM_ENDPOINT`, `RETAINER_RATE`, `PATTERN` (the illustrative month-to-month swing).
- No video, application form or call booking.
- `privacy.html`, `terms.html`: supporting pages (clean URLs via vercel.json).
