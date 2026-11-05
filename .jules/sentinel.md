## 2026-09-30 - Standard Security Headers at Vercel Edge & Next.js Layer
**Vulnerability:** Missing defense-in-depth HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), exposing responses to MIME confusion/sniffing, clickjacking via unauthorized framing, and unwanted referrer information leakage.
**Learning:** In hybrid Next.js and Vercel deployments, static files and route handlers may bypass runtime middleware if edge-level headers in `vercel.json` and application-level headers in `next.config.js` are not synchronized.
**Prevention:** Always declare defense-in-depth security headers in both `next.config.js` (`headers()` hook) and `vercel.json` (`headers` array) and verify configuration via automated tests.
