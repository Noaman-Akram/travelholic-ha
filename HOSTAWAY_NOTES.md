# Hostaway booking engine integration (Cloudflare Pages)

Cloudflare Pages outputs:
- JS: https://travelholic-ha.pages.dev/app.js
- CSS: https://travelholic-ha.pages.dev/styles.css

Hostaway → Booking Engine → Advanced Settings:
- Head script: accepts `title`, `meta`, `script`, `style`, `link`.
- Top banner script: inserts at top of page; use simple HTML/CSS/JS only.
- Body script: accepts inline scripts; no `html/head/body/meta/link`.

Recommended Head script to pull our assets and add a safety meta:
```html
<!-- Prevent indexing (optional) -->
<meta name="robots" content="noindex">

<!-- Travelholic Hostaway custom bundle -->
<link rel="stylesheet" href="https://travelholic-ha.pages.dev/styles.css">
<script src="https://travelholic-ha.pages.dev/app.js" defer></script>
```

To test:
1) Save the Head script in Hostaway.
2) Load the booking engine page and check the console for logs starting with `[TH]`.
   - Expect: `[TH] travelholic-ha bundle v1.0.0`, `[TH] init start`, host/url logs, redirect message (only executes on book.travelholiceg.com), `[TH] th-ready class added`.
3) Inspect `<html>` to confirm the `th-ready` class is present; Hostaway listings should be hidden when ready (see CSS).

Top banner script example (if needed):
```html
<div style="background:#f2f232;width:100%;height:30px;text-align:center;line-height:30px;font-size:14px;">
  20% off all bookings with coupon code <b>DISCOUNT20</b>
  <!-- or inject Google Translate widget here -->
</div>
```

Notes:
- If the UI forces a build command in Cloudflare Pages, set framework preset to “None”, build command to blank/echo, and output directory to `.` so the raw files deploy.
- All network calls are to the Cloudflare Pages static assets; no external dependencies.
