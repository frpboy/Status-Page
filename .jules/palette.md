# Palette Journal - Critical UX & Accessibility Learnings

## 2026-11-07 - Dense Calendar Visualizations & Keyboard Navigation
**Learning:** For dense data visualizations like 90-day uptime bar charts, individual bars need clear screen reader information and visual focus indicators, but exposing all 90 items in the natural DOM tab sequence can cause keyboard tab-fatigue.
**Action:** When designing data visualizations with dozens of items, consider using a roving tabIndex or grouping controls with accessible summary metrics so keyboard users can navigate quickly.
