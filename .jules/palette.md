# Palette's UX Journal

## 2026-09-30 - Interactive Controls & Toggle Button Accessibility
**Learning:** Dense monitoring dashboards feature prominent live polling and refresh controls. Buttons that toggle states (like auto-refresh) must explicitly declare `aria-pressed` and dynamic descriptive labels (`aria-label`) so screen reader users know both the current state and the toggle action. Async action buttons (like manual refresh) must declare `aria-busy` and descriptive labels while suppressing decorative icons with `aria-hidden="true"`. Furthermore, interactive header buttons must provide discernible, high-contrast keyboard focus indicators (`focus-visible:ring-2`) to support keyboard navigation.
**Action:** When adding or updating header action controls, always pair toggle states with `aria-pressed`, async states with `aria-busy`, hide decorative icons with `aria-hidden`, and provide visible keyboard focus rings using `focus-visible:ring-2`.
