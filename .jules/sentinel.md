# Sentinel Security Journal

## 2026-10-01 - HTTP Security Headers Edge and Framework Synchronization
**Vulnerability:** Missing standard HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`) on public application responses, leaving users vulnerable to clickjacking, MIME-type confusion attacks, and unencrypted transport downgrades.
**Learning:** In hybrid Next.js + Vercel deployments, headers configured solely in `next.config.js` may not be applied consistently if edge routing or static assets are handled directly by Vercel edge infrastructure, whereas headers configured solely in `vercel.json` are bypassed in local `next dev`/`next start` or non-Vercel environments. Synchronizing security headers across both layers guarantees defense-in-depth in both development and production edge environments.
**Prevention:** Maintain security headers in both `next.config.js` and `vercel.json` and enforce synchronization via automated unit tests.
