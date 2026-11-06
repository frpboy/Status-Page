# Palette's UX Journal

## 2025-05-18 - Keyboard Accessibility and Semantics for Visual Micro-Charts
**Learning:** Dense data-visualization bars (like 90-day status calendars) are frequently implemented as non-interactive `div` elements with hover `title` tags, leaving keyboard-only and screen reader users completely unable to access the daily uptime history and ping counts.
**Action:** Always provide `tabIndex={0}`, `role="img"`, a clear `aria-label` detailing the date and metrics, and high-contrast `focus-visible` ring indicators so keyboard navigators can seamlessly step through visual micro-charts.
