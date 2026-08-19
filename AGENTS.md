# Mobile-First App Development Guidelines

This project is strictly **MOBILE-FIRST & MOBILE FOCUSED**. All future features, UI tweaks, and architectural changes must prioritize mobile devices (smartphones and tablets) first, with desktop/web view being secondary.

## Core Rules:
1. **Mobile Responsive Architecture**:
   - Touch targets must be at least 44px high/wide on touch devices.
   - Use responsive Tailwind utilities (`flex-col sm:flex-row`, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, `px-3 sm:px-6`).
   - Tables must convert to clean, mobile-optimized cards or touch-scrollable cards on narrow screens.
   - Headers and navigation menus must be touch-accessible, with quick bottom bar or scrollable pill navigation on mobile devices.

2. **Cursor & Touch Affordances**:
   - Ensure `cursor-pointer` is applied to all clickable/tappable elements (buttons, tabs, cards, dropdown toggles, modal closes, list items).
   - Non-interactive elements must NOT have `cursor-pointer`.
   - Provide active touch feedback states (`active:scale-95`, `active:bg-slate-200`, etc.).

3. **Standard Mobile Icons & UI**:
   - Use standard `lucide-react` icons (sizes 16px - 24px) for all actions, tabs, and status badges.
   - Keep text clean, scannable, and non-overflowing on narrow viewports (`truncate`, `break-words`).
