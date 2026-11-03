# Palette's Journal - Critical Learnings

## 2025-05-18 - Status Page Keyboard Accessibility & Reduced Motion
**Learning:** Live telemetry and status pages often feature pulsating indicators and polling controls that lack keyboard focus indicators, screen-reader status announcements, and reduced-motion considerations. Adding `focus-visible:ring-2`, `motion-reduce:animate-none`, and `role="status"` with `aria-live="polite"` makes live monitoring interfaces substantially more accessible without altering any core visual aesthetics.
**Action:** Always check interactive header controls and animated pulse indicators for `focus-visible` ring offsets and `motion-reduce` support in monitoring dashboards.
