# Sentinel Security Journal

## 2026-09-30 - Dual-Layer Next.js and Vercel Edge Security Header Synchronization
**Vulnerability:** Next.js applications deployed to Vercel risk serving responses without defense-in-depth HTTP security headers (e.g. `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`) if headers are configured in only one layer or omitted entirely.
**Learning:** Static assets or edge-routed responses handled by Vercel edge infrastructure do not always traverse the Next.js node server runtime if headers are only in `next.config.js`. Conversely, local development and server-rendered handlers depend on `next.config.js`.
**Prevention:** Always synchronize security headers between `next.config.js` (`headers()` hook) and `vercel.json` (`headers` array) to enforce complete edge-to-origin defense-in-depth across environments.
