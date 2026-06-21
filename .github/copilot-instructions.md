Rule Number: 1
Do not start or restart the server or dev environment unless explicitly instructed to do so.
Always consider the client or the server is auto refreshed by the user.

## FitYo'l — Copilot / AI Agent Instructions

Welcome — this file gives immediate context needed to be productive in this repo.
Use it as an instruction set for quick PRs, bug fixes, and features.

Key project facts (big picture)
- Stack: React + TypeScript + Vite (client-side SPA), Tailwind-like classes via CDN.
- Auth + persistence: Supabase is used for auth and data storage (see `services/supabase.ts`).
- AI: Google Gemini SDK used in `services/geminiService.ts` to parse meal text & images.
- Views are not routed by a router; `App.tsx` manages app state with `AppView` enum (see `types.ts`).
- Primary UI: `components/*` contains all main views; `BottomNav` is a persistent fixed bottom nav.

Important files and responsibilities
- `App.tsx` — root flow and view orchestration. Check session setup, data load, and nav handling.
- `components/UploadArea.tsx` — camera and upload UI: getUserMedia, preview/confirm flow, new controls.
- `components/BottomNav.tsx` — fixed bottom nav; be mindful of fixed positioning and mobile safe area.
- `services/geminiService.ts` — AI interaction layer; `executeWithRotation` does key rotation and calls the API.
- `services/storageService.ts` — local + Supabase sync functions, calculations (BMR/TDEE/body fat), local storage keys.
- `services/supabase.ts` — Supabase client setup and defaults; check `VITE_SUPABASE_*` env var usage.
- `translations.ts` — all UI text; `t(key, lang)` resolves translation keys.
- `types.ts` — project types like `AppView`, `ScanMode`, `UserProfile`, etc.

Build & dev workflows
- Install: `npm install`
- Dev: `npm run dev` (add `-- --host` to bind to 0.0.0.0 for mobile device testing or use `vite.config.ts` `server.host=0.0.0.0`).
- Production build: `npm run build` and `npm run preview` to view artifacts.
- Windows dev: If serving on local IP for testing on phone, run `npm run dev -- --host` and allow port in firewall.

Patterns & conventions
- Global translations: Always call `t('key.path', language)` from translations.ts — components pass `language` prop by design.
- No router: The app uses `AppView` state in `App.tsx` — to add a new screen, add a case there and a `BottomNav` item if needed.
- Local persistence: Use `storageService.getProfile/saveProfileLocal` and `getLogsLocal/saveLogsLocal` before any direct `localStorage` usage.
- UI: all pages are responsive; bottom nav is fixed. When adding fixed bottom controls, ensure safe-area and `content-with-bottom-nav` padding.
- Camera flow: `UploadArea` handles camera permission, preview, retake, and confirm. Favor the confirm-then-send flow to avoid accidental submissions.
- Supabase: `sync*` functions operate using `supabase.from(...).insert/upsert` directly; prefer `sync*` helpers for consistency.
- AI calls: conducted with `services/geminiService.ts` where `RESPONSE_SCHEMA` defines expected structure — prefer this schema for stable typing.

Where to check when making changes
- If you touch the camera flow: `UploadArea.tsx` and `t('scan.*')` keys in translations.
- When adding a new view or menu item: update `App.tsx` (switch render), `types.ts` (AppView enum), and `BottomNav.tsx`.
- When adding backend calls: implement in `services/*` and use helper `sync*` functions for Supabase.

Testing and debug notes
- The project currently has no test suite; add focused unit tests for `storageService` (calculations) and `geminiService` (parsing behavior).
- Build size: large chunks may appear after bundling — use code-splitting via dynamic import to reduce initial payload.
- To test camera on a phone: `npm run dev -- --host` and ensure Windows firewall allows inbound port 3000; open the network IP printed by Vite.

Security & env keys (operational guidance — do not change in PRs unless asked)
- `GEMINI_API_KEY` and `VITE_SUPABASE_*` are environment variables — never commit them.
- Avoid using client-side secret keys — move sensitive flows to a server endpoint if you implement server features.

PR checklist for contributors (use for quick reviews)
1. Is there a `ts` type for new data? Avoid `any` unless necessary.
2. Is translation added for new UI copy and all languages (`en`, `uz`, `ru`)? Add to `translations.ts`.
3. If UI elements are fixed/overlay, ensure `content-with-bottom-nav` or `above-bottom-nav` classes are applied to prevent bottom nav overlap.
4. If adding controls to `UploadArea`, keep the confirm/retake flow and preserve `preview` state.
5. For Supabase changes, ensure `DEFAULT_URL`/`DEFAULT_KEY` fallback behavior is respected in `services/supabase.ts`.

Examples / common fixes
- How to make a view accessible from nav: add an `AppView` enum member in `types.ts`, implement UI in `components`, add `case AppView.NEWVIEW` to `App.tsx`, and add a new `navItem` in `BottomNav.tsx`.
- Add translation for new UI: `translations.ts` add under `en`, `uz`, `ru`, then call `t('path.key', language)`.
- If camera is overlapping bottom nav on mobile: ensure `main` has `content-with-bottom-nav` padding and bottom-bar uses `bottom-nav` class.

If anything is unclear or you'd like a deeper example for a pattern (e.g., adding an AI analysis endpoint vs client usage), ask for a short example change and I’ll create code-ready diffs.
