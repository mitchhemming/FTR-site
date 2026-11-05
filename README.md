# Freedom Through Retainers

Static site for freedomthroughretainers.com. No build step.

- `index.html`: the landing page. Photo and headline, then a four-question foundation calculator (business type, monthly fixed costs, typical job value, current recurring income). The result shows the foundation figure, how many retainers cover it and the price per retainer (two thirds of a typical job, rounded to $50). Below the result is a waitlist sign-up (first name and email) that posts the name, email and every calculator answer to Formspree. There is also a link to DM on Instagram.
- Settings at the bottom of `index.html`: `FORM_ENDPOINT`, `RETAINER_RATIO`.
- No video, application form or call booking.
- `privacy.html`, `terms.html`: supporting pages (clean URLs via vercel.json).
