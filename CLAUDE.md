# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**South Vancouver Island Tracker (SVIT)** — A real-time civic monitoring dashboard for the Capital Regional District (CRD) in British Columbia, Canada. Modeled after marinmonitor.com. Primary audience: political campaigners/candidates and engaged citizens in Greater Victoria.

## Tech Stack

- **Framework**: SvelteKit 5 with Svelte 5 runes (`$state`, `$derived`, `$effect`) — client-side only (`ssr: false`)
- **Adapter**: `@sveltejs/adapter-vercel` with Node.js 22.x runtime
- **Mapping**: MapLibre GL JS — CARTO basemaps (no API key), municipality boundaries + feature pins
- **Charts**: D3.js — sparkline charts via `d3.line()` + `d3.curveBasis`
- **GTFS-RT**: `gtfs-realtime-bindings` for BC Transit protobuf alert decoding
- **Auth/DB**: Supabase (auth store + modal wired, optional accounts only)
- **Fonts**: Inter (body) + Geist Mono (data/monospace)
- **Persistence**: localStorage (anonymous) + Supabase (future, logged-in users)

## Commands

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Production build via adapter-vercel
npm run preview      # Preview production build locally
npm run check        # svelte-kit sync && svelte-check
npm run lint         # prettier --check . && eslint .
npm run format       # prettier --write .
npm run test         # vitest run
npm run test:e2e     # playwright test
```

## Architecture

### Data Flow

```
Municipality selector → municipalityStore (reactive) → panels read store.slug
                                                      → API clients pass ?municipality=slug
                                                      → server routes filter/fetch external data
                                                      → panels render filtered results
```

### Dashboard Grid System

Single-page dashboard with a 12-column draggable grid (60px rows, 12px gap). Panels are absolutely positioned via `layoutStore` and draggable from their headers via pointer events. Layout persists to localStorage.

23 panels across 4 priority tiers:

- **Tier 1** (implemented): Council Watch, Bylaw Tracker, Voices, Public Hearings, Development Watch, Councillor Profiles
- **Tier 2** (implemented): Local Wire, CRD Map (MapLibre), Pulse (D3), Construction & Roads, Transit, Safety & Emergency
- **Tier 3** (implemented): Weather & Tides, Housing & Development, Community Events, Budget & Finance, Wildlife & Marine, Trees & Urban Forest, Nature & Environment
- **Tier 4** (implemented, requires account): My Monitors, Connections, Threads, Demographics

Panel registration: `DashboardGrid.svelte` maps panel IDs to components via `{#if panel.id === 'xxx'}` chain. New panels must be imported and added there.

### Panel Component Pattern

Every panel follows the same structure: local `$state` for data/loading, `onMount` for initial fetch, `$effect` watching `municipalityStore.slug` for reactive refetch, and loading/content/empty conditional rendering. The `$effect` dependency is established by reading `municipalityStore.slug` inside it.

### Reactive State (Svelte 5 Runes)

Five stores in `src/lib/stores/*.svelte.ts`, all using `$state` with localStorage persistence:

- **`municipality.svelte.ts`** — Selected municipality slug (null = All CRD). Derived getters: `current`, `bbox`, `center`, `color`, `label`. Every panel watches `municipalityStore.slug` via `$effect` to refetch data.
- **`theme.svelte.ts`** — Dark/light theme. Sets `data-theme` attribute on `<html>`. Init reads localStorage → system preference → default dark.
- **`layout.svelte.ts`** — Panel grid positions (id → {x, y, w, h}). Methods: `getPosition()`, `updatePosition()`, `reset()`.
- **`refresh.svelte.ts`** — Auto-refresh toggle + per-panel intervals. Methods: `toggle()`, `getInterval(panelId)`.
- **`auth.svelte.ts`** — Supabase auth state (user, session, loading). Methods: `signInWithEmail()`, `signUpWithEmail()`, `signOut()`, `resetPassword()`.

### API Proxy Pattern

All external data fetched through SvelteKit server routes at `src/routes/api/*/+server.ts`. Each route:

- Fetches from external APIs with timeout (`AbortSignal.timeout`)
- Falls back to seed data when live APIs are unavailable
- Tags items with municipality slugs for client-side filtering
- Sets `Cache-Control: public, s-maxage=N, stale-while-revalidate=M` headers for Vercel edge caching
- Returns `{ data: T[], meta: { total, municipality } }` shape (see `ApiResponse<T>` type)

Client-side fetch via thin wrappers in `src/lib/api/*.ts` → generic `apiFetch<T>()` in `fetcher.ts`.

Cache tiers: 5min (news, social, transit, safety), 15min (council, development, construction, weather-tides), future: 6hrs (tides-only), 24hrs (GIS).

### Implemented API Routes

| Route                    | External Source                                                                                                    | Seed Fallback                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `GET /api/council`       | eSCRIBE WebMethods (Victoria, Langford)                                                                            | 20 meetings across 5 municipalities                   |
| `GET /api/news`          | 8 RSS feeds (CHEK, VicNews, VictoriaBuzz, SaanichNews, OakBayNews, GoldstreamGazette, PeninsulaNewsReview, CBC BC) | None needed (live feeds work)                         |
| `GET /api/social`        | Bluesky AT Protocol search (#yyj, #yyjpoli)                                                                        | 5 representative posts                                |
| `GET /api/development`   | Victoria Open Data ArcGIS Hub                                                                                      | 6 applications across 4 municipalities                |
| `GET /api/construction`  | DriveBC Open511 (Vancouver Island, filtered to CRD bbox)                                                           | 5 events across 4 municipalities                      |
| `GET /api/transit`       | BC Transit GTFS-RT alerts (operator 48, protobuf)                                                                  | 3 service alerts                                      |
| `GET /api/safety`        | Environment Canada ATOM + BC Wildfire ArcGIS + DriveBC incidents + USGS FDSN earthquakes                           | 4 alerts (weather + wildfire + road + earthquake)     |
| `GET /api/weather-tides` | Environment Canada CityPage XML (s0000828) + CHS IWLS tides API (Victoria Harbour 07120)                           | Current conditions + 4 forecasts + 4 tide predictions |
| `GET /api/housing`       | CMHC housing indicators (Victoria CMA)                                                                             | 10 metrics (median price, rent, vacancy, starts)      |
| `GET /api/events`        | Tourism Victoria events feed                                                                                       | 8 events across 6 municipalities                      |
| `GET /api/budget`        | Static (future: open data portals)                                                                                 | 15 items across Victoria, Saanich, Langford           |
| `GET /api/wildlife`      | iNaturalist API (research-grade CRD observations)                                                                  | 8 sightings (orca, eagle, heron, seal, etc.)          |
| `GET /api/trees`         | iNaturalist (CRD tree observations)                                                                                | 8 trees (Garry Oak, Douglas Fir, Arbutus, etc.)       |
| `GET /api/environment`   | AQICN air quality via `AQICN_API_TOKEN` (dynamic import)                                                           | 8 readings (AQI, PM2.5, UV, pollen, water quality)    |

All routes accept `?municipality=slug&limit=N`. News also accepts `?source=slug`. Development accepts `?flagged=true`. Construction accepts `?event_type=CONSTRUCTION|INCIDENT`. Events accepts `?category=`. Budget accepts `?type=revenue|expenditure`. Wildlife accepts `?category=`. Trees accepts `?heritage=true`.

### MapLibre Gotchas

- `CRDMap.svelte` in `src/lib/components/map/` is the reusable map component; `CRDMapPanel.svelte` is the panel wrapper that feeds it `MapFeature[]` data
- On `setStyle()` (theme toggle), all sources/layers are destroyed — the `style.load` event callback must re-add them
- Municipality boundaries are static GeoJSON at `static/data/crd-municipalities.geojson` (real CRD polygons from BC WFS, Douglas-Peucker simplified)
- Feature pins come from development applications + construction events with coordinates

### Multi-Source API Pattern

`/api/safety` aggregates 4 independent sources via `Promise.allSettled` (weather, wildfire, road incidents, USGS earthquakes) — one failing source doesn't break others. Results merge and sort by severity. This pattern should be reused for future multi-source panels.

### Auto-Refresh System

`src/lib/stores/refresh.svelte.ts` provides per-panel refresh intervals (3min for transit/safety, 5min for news/pulse, 15min for council/weather, 30-60min for lower-frequency). Toggle via header button. Panels use `setInterval` with cleanup in `onDestroy`.

### Auth System

`src/lib/supabase.ts` creates Supabase client (returns null if env vars unconfigured). `src/lib/stores/auth.svelte.ts` manages session/user state with sign-in/sign-up/sign-out/reset flows. `AuthModal.svelte` provides login/signup/reset UI. All Tier 4 panels show auth-gate when unauthenticated.

### Key Data Sources (Planned but Not Yet Implemented)

- Legistar REST API for CRD/Esquimalt — API returns setup error, needs Granicus contact
- CivicWeb portals (Oak Bay, Colwood, Sooke, Sidney, N.Saanich, Metchosin) — HTML scrape
- eBird API (requires `EBIRD_API_KEY`), OBIS — additional wildlife/nature sources
- CRD ArcGIS REST (`mapservices.crd.bc.ca/arcgis/rest/services/`) — environment, parks

### Theme System

Two PNW-themed modes controlled by `[data-theme="dark"]` / `[data-theme="light"]` on `<html>`:

- **Dark (Starry Night)**: Canvas-animated stars + shooting star + aurora borealis. Frosted dark glass panels. Accents: teal `#63B3ED`, green `#68D391`, amber `#F6AD55`.
- **Light (Sunny Skies)**: SVG animated clouds + sun glow. Frosted white glass panels. Accents: ocean `#2B6CB0`, forest `#2F855A`, gold `#D69E2E`.

All colors are CSS custom properties (`--bg-surface`, `--text-primary`, `--accent-primary`, etc.) in `src/app.css`.

### Development Flagging

In DevelopmentWatch: applications with 4+ storeys, 100+ units, or significant rezonings are automatically flagged with red badges and `flagReasons` array.

### Adding a New Panel

1. Define the interface in `src/lib/types/index.ts`
2. Create API route at `src/routes/api/<name>/+server.ts` (with seed fallback)
3. Create API client at `src/lib/api/<name>.ts` wrapping `apiFetch<T>()`
4. Create panel component at `src/lib/components/panels/<Name>.svelte` following the panel pattern
5. Add entry to `src/lib/config/panels.ts` (id, title, icon, tier, defaultPosition, minW, minH)
6. Import and wire into `DashboardGrid.svelte` (add import + `{:else if panel.id === '<id>'}` branch)

### CRD Geographic Constants

13 municipalities: `victoria`, `saanich`, `esquimalt`, `oak-bay`, `langford`, `colwood`, `sooke`, `sidney`, `north-saanich`, `central-saanich`, `view-royal`, `highlands`, `metchosin`. Config in `src/lib/config/municipalities.ts` with slugs, bboxes, colors, council source types.

- `CRD_BBOX`: `[-123.770, 48.300, -123.280, 48.700]` — used for USGS, DriveBC, and other bbox-filtered APIs
- `CRD_CENTER`: `[-123.365, 48.428]` — Victoria Harbour, used for MapLibre default view

## Conventions

- **Svelte 5 runes only** — no legacy `writable`/`readable` stores
- **Svelte 5 event handling** — no modifier syntax (`onclick|stopPropagation` is invalid). Use wrapper functions: `onclick={(e) => { e.stopPropagation(); handler(); }}`
- **Stores** in `.svelte.ts` files using `$state`, `$derived`, `$effect`
- **TypeScript strict** — all interfaces in `src/lib/types/index.ts`
- **SSR disabled** — `src/routes/+layout.ts` exports `ssr = false` (client-only SPA)
- **Panel components** in `src/lib/components/panels/`, each manages its own data loading + municipality reactivity
- **API clients** in `src/lib/api/`, thin wrappers around `apiFetch<T>()`
- **`$lib/` imports must NOT use `.ts` extensions** — only relative imports can (due to `rewriteRelativeImportExtensions: true` in tsconfig)
- **Municipality attribution** — every data item tagged with its municipality slug for filtering. Attribution uses coordinate-in-bbox matching first, then text matching against municipality names.
- **Seed data** — every API route has hardcoded fallback arrays for when live APIs fail. Routes never throw.
- **Prettier**: tabs, single quotes, no trailing commas, 100-char width, svelte plugin
- **Testing**: vitest and playwright are configured in devDependencies but no test files exist yet

## Environment Variables

```
# .env (never committed)
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
EBIRD_API_KEY=              # Free from ebird.org
AQICN_API_TOKEN=            # Free from aqicn.org
ONC_API_TOKEN=              # Free from data.oceannetworks.ca
PUBLIC_MAPTILER_KEY=        # Free tier (optional — currently using CARTO basemaps, no key needed)
```

## Database (Supabase — Phase 4)

Supabase with 4 tables (all with RLS):

- `profiles` — extends auth.users (display_name, default_municipality, theme_preference)
- `monitors` — custom keyword alerts (keyword, municipality filter, source filter)
- `connections` — civic contact tracking (name, municipality, relationship, notes)
- `threads` — discussion threads (title, municipality, messages JSONB)

Additional future tables:

- `layout_preferences` — saved panel grid positions (JSONB)
- `saved_items` — bookmarked meetings/bylaws/news (item_type, external_id, metadata JSONB)

## Implementation Status

Phases 0–4 complete. All 23 panels are live across all 4 tiers. Tier 4 panels (My Monitors, Connections, Threads, Demographics) require Supabase auth to be configured for full functionality — they gracefully show auth prompts when Supabase is unconfigured.

### Recent Improvements

- Real CRD municipality boundary polygons from BC WFS (replaced bbox rectangles)
- USGS earthquake integration in Safety & Emergency panel
- Auto-refresh system with per-panel intervals and header toggle
- Panel collapse/minimize with localStorage persistence
- Responsive mobile layout (stacked below 768px)
