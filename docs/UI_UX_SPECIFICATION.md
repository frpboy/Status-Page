# UI/UX Design System Specification
## Zerpai Infrastructure Status Monitor

---

## 1. Visual Aesthetics & Design Philosophy

The status page enforces modern **glassmorphism**, rich dark mode palettes, vibrant state indicators, and subtle radial micro-gradients:

- **Background Palette**: Deep Slate `#020617` (`slate-950`) with radial top gradient (`from-blue-950/20 via-slate-950 to-slate-950`).
- **Surface Elevation**: Glassmorphic cards with `bg-slate-900/60 backdrop-blur-md` and subtle borders `border-slate-800`.
- **Status Accent Colors**:
  - **Operational / Healthy**: Emerald Green (`#10b981`, `text-emerald-400`, `bg-emerald-500/10`)
  - **Degraded / Warning**: Amber Yellow (`#f59e0b`, `text-amber-400`, `bg-amber-500/10`)
  - **Outage / Critical**: Rose Red (`#f43f5e`, `text-rose-400`, `bg-rose-500/10`)
  - **Subsystem Accents**: Electric Blue (`#3b82f6`), Indigo (`#6366f1`), Cyan (`#06b6d4`), Purple (`#a855f7`)

---

## 2. Component Hierarchy & Micro-Interactions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header: Logo, Title, Live Badge | Auto-refresh 5s | Refresh Now | App Portal│
├─────────────────────────────────────────────────────────────────────────────┤
│ Hero Status Card: All Systems Operational (Green Check Circle & Pulsing Dot)│
├─────────────────────────────────────────────────────────────────────────────┤
│ 4 KPI Cards: DB Latency (9ms) | RDS Class | Freeable RAM | CPU Utilization │
├─────────────────────────────────────────────────────────────────────────────┤
│ Subsystem Components List: 6 Rows with Icons, IDs, and Operational Badges   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Subsystem Monthly Uptime SLA Breakdown: 6-Card Matrix (Target SLA 99.9%)   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Historical Uptime (90 Days): 90 Vertical Bars with Hover Tooltips           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Incidents & Maintenance Announcements Log                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Footnote & Edge Region Indicator Banner                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```
