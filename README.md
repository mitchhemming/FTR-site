# Freedom Through Retainers

Static site for freedomthroughretainers.com. No build step.

- `index.html`: the offer page (headline, VSL, Apply, form). The long-form copy lives in the FTR Offer Page doc, not on the page. Settings at the bottom of the file: `VIMEO_ID`, `FORM_ENDPOINT`.
- Application form is hidden until an Apply button is clicked; on submit the applicant is sent to /book (Calendly, name and email prefilled). /book also works as a direct link.
- `book.html`, `privacy.html`, `terms.html`: supporting pages (clean URLs via vercel.json).
