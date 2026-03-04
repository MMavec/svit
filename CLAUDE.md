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
- **Caching**: IndexedDB (`svit-cache`) — per-endpoint TTL, stale-while-revalidate, fire-and-forget writes
- **Persistence**: localStorage (anonymous) + Supabase (future, logged-in users)

## Commands

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Production build via adapter-vercel
npm run preview      # Preview production build locally
npm run check        # svelte-kit sync && svelte-check
npm run lint         # prettier --check . && eslint .
npm run format       # prettier --write .
npm run test         # vitest run (all tests)
npm run test:e2e     # playwright test

# Single test file
npx vitest run src/lib/utils/__tests__/monitor-matcher.test.ts

# Watch mode
npx vitest --watch
```

### Verification Workflow (run before committing)

```bash
npx svelte-check --threshold error   # 0 errors, 0 warnings
npm run lint                          # Prettier + ESLint
npm run build                         # Production build
npm run test                          # Unit tests
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

Panel registration: `src/lib/components/layout/DashboardGrid.svelte` maps panel IDs to components. Tier 1+2 are eagerly loaded via `panelComponents: Record<string, Component>`. Tier 3+4 are lazily loaded via `lazyPanels: Record<string, () => Promise<...>>` using dynamic `import()` and `LazyPanel.svelte` wrapper — new panels in Tier 3/4 only need a `lazyPanels` entry. All panels are wrapped in `<svelte:boundary>` for error isolation — a crashing panel shows a retry button instead of breaking the dashboard.

### Panel Component Pattern

Every panel follows the same structure: local `$state` for data/loading, `$effect` watching `municipalityStore.slug` for reactive refetch (handles both initial load and municipality changes), and loading/content/empty conditional rendering. The `$effect` dependency is established by reading `municipalityStore.slug` inside it. Panels with auto-refresh timers use `onMount` only for timer setup (not data loading) with `onDestroy` cleanup.

### Reactive State (Svelte 5 Runes)

Nine stores in `src/lib/stores/*.svelte.ts`, all using `$state` with localStorage persistence:

- **`municipality.svelte.ts`** — Selected municipality slug (null = All CRD). Derived getters: `current`, `bbox`, `center`, `color`, `label`, `isAllCRD`. Every panel watches `municipalityStore.slug` via `$effect` to refetch data.
- **`theme.svelte.ts`** — Dark/light theme (exported as `theme`, not `themeStore`). Sets `data-theme` attribute on `<html>`. Init reads localStorage → system preference → default dark. Methods: `toggle()`, `init()`.
- **`layout.svelte.ts`** — Panel grid positions (id → {x, y, w, h}). Methods: `getPosition()`, `updatePosition()`, `reset()`.
- **`refresh.svelte.ts`** — Auto-refresh toggle + per-panel intervals. Methods: `toggle()`, `getInterval(panelId)`.
- **`auth.svelte.ts`** — Supabase auth state (user, session, loading). Methods: `signInWithEmail()`, `signUpWithEmail()`, `signOut()`, `resetPassword()`.
- **`bookmarks.svelte.ts`** — Item bookmarking with localStorage persistence. Methods: `add()`, `remove()`, `removeByExternalId()`, `has()`, `getByType()`. Used by `BookmarkButton.svelte` in council, news, development, and events panels.
- **`search.svelte.ts`** — Cross-panel global search with 300ms debounce. Searches 5 API sources (council, news, development, events, safety). Methods: `open()`, `close()`, query getter/setter. Keyboard shortcut: Cmd+K / Ctrl+K.
- **`url-state.svelte.ts`** — URL param synchronization (`?m=`, `?panel=`, `?q=`). Methods: `initialize()`, `setMunicipality()`, `focusPanel()`, `setSearchQuery()`, `getShareUrl()`. Municipality uses `replaceState`, panel focus uses `pushState` (enables Back button).
- **`leads.svelte.ts`** — Lead capture state (submitted/dismissed) with localStorage persistence (`svit-lead-capture`). Methods: `shouldShowPrompt()`, `submitLead()`, `dismiss()`, `openModal()`, `markSubmitted()`.

### API Proxy Pattern

All external data fetched through SvelteKit server routes at `src/routes/api/*/+server.ts`. Each route:

- Fetches from external APIs with timeout (`AbortSignal.timeout`)
- Falls back to seed data when live APIs are unavailable
- Tags items with municipality slugs for client-side filtering
- Sets `Cache-Control: public, s-maxage=N, stale-while-revalidate=M` headers for Vercel edge caching
- Returns `{ data: T[], meta: { total, municipality } }` shape (see `ApiResponse<T>` type)

Client-side fetch via thin wrappers in `src/lib/api/*.ts` → generic `apiFetch<T>()` in `fetcher.ts`.

### IndexedDB Cache Layer (`src/lib/cache/idb-cache.ts`)

Transparent caching at the `apiFetch` level — all 13 API clients and 23 panels benefit automatically with zero changes:

1. **Fresh cache** (within TTL): Return immediately, skip network
2. **Network success**: Store result in cache, return fresh data
3. **Network error**: Return stale cache (if <24h old) with `meta._cached: true` and `meta._cachedAt`
4. AbortError re-thrown (preserves panel cancellation)

Per-endpoint TTL: 2min (safety, transit), 5min (news, social, construction), 15min (council, development, weather-tides, environment), 30min (events, wildlife, trees), 60min (housing, budget). Auto-cleanup of entries >24h old on first load.

Vercel edge cache tiers: 5min (news, social, transit, safety), 15min (council, development, construction, weather-tides), future: 6hrs (tides-only), 24hrs (GIS).

### Implemented API Routes

| Route                    | External Source                                                                                                    | Seed Fallback                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `GET /api/council`       | eSCRIBE WebMethods (Victoria, Langford) + CivicWeb HTML scraping (9 municipalities)                                | 20 meetings across 5 municipalities                   |
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
| `GET /api/wildlife`      | iNaturalist API + eBird API v2 (CRD observations, 25km radius)                                                     | 8 sightings (orca, eagle, heron, seal, etc.)          |
| `GET /api/trees`         | iNaturalist (CRD tree observations)                                                                                | 8 trees (Garry Oak, Douglas Fir, Arbutus, etc.)       |
| `GET /api/environment`   | AQICN air quality via `AQICN_API_TOKEN` + ONC ocean temperature (VENUS observatory)                                | 8 readings (AQI, PM2.5, UV, pollen, water, ocean)     |

All routes accept `?municipality=slug&limit=N`. News also accepts `?source=slug`. Development accepts `?flagged=true`. Construction accepts `?event_type=CONSTRUCTION|INCIDENT`. Events accepts `?category=`. Budget accepts `?type=revenue|expenditure`. Wildlife accepts `?category=`. Trees accepts `?heritage=true`.

**Non-panel API routes**:

- `POST /api/leads` — Lead capture submission. Server-side validation (email regex, consent check), upsert on email, social accounts stored separately. Returns `{ success: true }` or `{ error }`. Requires Supabase (503 if unconfigured).

**SSR Share Route** (`/share`):

- `src/routes/share/+layout.ts` — Overrides parent's `ssr = false` with `ssr = true` for social crawler compatibility
- `src/routes/share/+page.server.ts` — Generates dynamic OG meta tags from `?m=` and `?panel=` params
- `src/routes/share/+page.svelte` — Renders `<svelte:head>` OG tags + `<meta http-equiv="refresh">` redirect to main SPA

**Panels without API routes**: Bylaw Tracker, Public Hearings, and Demographics use local seed data only (no external API). Voices combines social + news API data.

### MapLibre Gotchas

- `CRDMap.svelte` in `src/lib/components/map/` is the reusable map component; `CRDMapPanel.svelte` is the panel wrapper that feeds it `MapFeature[]` data
- On `setStyle()` (theme toggle), all sources/layers are destroyed — the `style.load` event callback must re-add them
- Municipality boundaries are static GeoJSON at `static/data/crd-municipalities.geojson` (real CRD polygons from BC WFS, Douglas-Peucker simplified)
- Feature pins come from development applications + construction events with coordinates
- **Clustering**: Features source has `cluster: true, clusterMaxZoom: 14, clusterRadius: 50`. Three layers: `feature-clusters` (circles), `feature-cluster-count` (labels), `feature-circles` (unclustered). Click on cluster zooms in via `getClusterExpansionZoom()`.
- **Keyboard nav**: Map container has `tabindex="0"`, `role="application"`. Escape closes popup. MapLibre's built-in arrow keys/+/- work once focused.
- **Filter UI**: `CRDMapPanel.svelte` has checkboxes for development/construction/flagged-only, passing `filteredFeatures` to `CRDMap`
- **WebGL limitation**: MapLibre paint properties cannot use CSS custom properties — use hex color values for cluster/circle paint

### Multi-Source API Pattern

`/api/safety` aggregates 4 independent sources via `Promise.allSettled` (weather, wildfire, road incidents, USGS earthquakes) — one failing source doesn't break others. Results merge and sort by severity. This pattern should be reused for future multi-source panels.

### Auto-Refresh System

`src/lib/stores/refresh.svelte.ts` provides per-panel refresh intervals (3min for transit/safety, 5min for news/pulse, 15min for council/weather, 30-60min for lower-frequency). Toggle via header button. Panels use `setInterval` with cleanup in `onDestroy`.

### Auth System

`src/lib/supabase.ts` creates Supabase client (returns null if env vars unconfigured). `src/lib/stores/auth.svelte.ts` manages session/user state with sign-in/sign-up/sign-out/reset flows. `AuthModal.svelte` provides login/signup/reset UI. All Tier 4 panels show auth-gate when unauthenticated.

### Key Data Sources (Planned but Not Yet Implemented)

- Legistar REST API for CRD/Esquimalt — API returns setup error, needs Granicus contact
- CRD ArcGIS REST (`mapservices.crd.bc.ca/arcgis/rest/services/`) — environment, parks
- OBIS — additional marine/ocean biodiversity observations

### Theme System

Two PNW-themed modes controlled by `[data-theme="dark"]` / `[data-theme="light"]` on `<html>`:

- **Dark (Starry Night)**: Canvas-animated stars + shooting star + aurora borealis. Frosted dark glass panels. Accents: teal `#63B3ED`, green `#68D391`, amber `#F6AD55`.
- **Light (Sunny Skies)**: SVG animated clouds + sun glow. Frosted white glass panels. Accents: ocean `#2B6CB0`, forest `#2F855A`, gold `#D69E2E`.

All colors are CSS custom properties in `src/app.css`. Core accents: `--accent-primary`, `--accent-secondary`, `--accent-warning`, `--accent-danger`. Status severity: `--status-critical`, `--status-high`, `--status-hazardous`. Data viz palette: `--palette-purple`, `--palette-blue`, `--palette-cyan`, `--palette-green`, `--palette-lilac`, `--palette-pink`, `--palette-sky`, `--palette-muted`. All panel color functions use CSS vars — no hardcoded hex colors in panel components.

### Development Flagging

In DevelopmentWatch: applications with 4+ storeys, 100+ units, or significant rezonings are automatically flagged with red badges and `flagReasons` array.

### Adding a New Panel

1. Define the interface in `src/lib/types/index.ts`
2. Create API route at `src/routes/api/<name>/+server.ts` (with seed fallback, use `parseLimit`/`parseMunicipality` from `$lib/utils/api-validation`)
3. Create API client at `src/lib/api/<name>.ts` wrapping `apiFetch<T>()`
4. Create panel component at `src/lib/components/panels/<Name>.svelte` following the panel pattern (PanelSkeleton for loading, PanelError for errors). Use color functions from `$lib/utils/color-maps` — never define inline.
5. Add entry to `src/lib/config/panels.ts` (id, title, icon, tier, defaultPosition, minW, minH)
6. Wire into `DashboardGrid.svelte`:
   - **Tier 1/2**: Static import + add to `panelComponents` map
   - **Tier 3/4**: Add dynamic `import()` entry to `lazyPanels` map (no static import needed)

### Shared Utilities (`src/lib/utils/`)

- **`hash.ts`** — `hashCode(str)` for deterministic ID generation from strings (used in 7+ API routes)
- **`geo-attribution.ts`** — `attributeMunicipality(lng, lat)` (coordinate-based) and `attributeMunicipalityByText(text)` (keyword-based) for tagging data items with municipality slugs
- **`api-validation.ts`** — `parseLimit(raw, default, max)` and `parseMunicipality(raw)` for API route input validation
- **`monitor-matcher.ts`** — `matchMonitors(monitors, items, source)` for keyword matching in MyMonitors panel
- **`color-maps.ts`** — `colorMap<T>(map, fallback)` factory + 8 typed exports (`safetyAlertColor`, `constructionSeverityColor`, `transitSeverityColor`, `devStatusColor`, `envStatusColor`, `wildlifeCategoryColor`, `eventCategoryColor`, `searchCategoryColor`). All panel color functions live here — never define inline color maps in panel components.

### CRD Geographic Constants

13 municipalities: `victoria`, `saanich`, `esquimalt`, `oak-bay`, `langford`, `colwood`, `sooke`, `sidney`, `north-saanich`, `central-saanich`, `view-royal`, `highlands`, `metchosin`. Config in `src/lib/config/municipalities.ts` with slugs, bboxes, colors, council source types.

- `CRD_BBOX`: `[-123.770, 48.300, -123.280, 48.700]` — used for USGS, DriveBC, and other bbox-filtered APIs
- `CRD_CENTER`: `[-123.365, 48.428]` — Victoria Harbour, used for MapLibre default view

## Conventions

- **Svelte 5 runes only** — no legacy `writable`/`readable` stores
- **Svelte 5 event handling** — no modifier syntax (`onclick|stopPropagation` is invalid). Use wrapper functions: `onclick={(e) => { e.stopPropagation(); handler(); }}`
- **Stores** in `.svelte.ts` files using `$state`, `$derived`, `$effect`
- **TypeScript strict** — all interfaces in `src/lib/types/index.ts` (includes `Lead`, `LeadSocialAccount`, `LeadSubmission` types and `_cached`/`_cachedAt` in `ApiResponse.meta`)
- **SSR disabled** — `src/routes/+layout.ts` exports `ssr = false` (client-only SPA). Exception: `/share` route re-enables SSR for OG meta tag generation.
- **Panel components** in `src/lib/components/panels/`, each manages its own data loading + municipality reactivity
- **API clients** in `src/lib/api/`, thin wrappers around `apiFetch<T>()`
- **`$lib/` imports must NOT use `.ts` extensions** — only relative imports can (due to `rewriteRelativeImportExtensions: true` in tsconfig)
- **Municipality attribution** — every data item tagged with its municipality slug for filtering. Attribution uses coordinate-in-bbox matching first, then text matching against municipality names.
- **Seed data** — every API route has hardcoded fallback arrays for when live APIs fail. Routes never throw.
- **Prettier**: tabs, single quotes, no trailing commas, 100-char width, svelte plugin
- **Testing**: Vitest with jsdom environment (`npm run test`). `globals: true` in vite config — `describe`, `it`, `expect` available without imports. Test setup (`src/test-setup.ts`) mocks localStorage + matchMedia. Tests colocated at `src/lib/*/__tests__/*.test.ts`. Playwright E2E tests in `tests/*.e2e.ts` (`npm run test:e2e`) — 9 files, 72 tests. E2E tests run against preview build (`localhost:4173`). Use stable selectors (`data-panel-id`, `role`, `aria-label`, CSS classes). Lead capture tests need `test.setTimeout(80_000)` due to 30s banner delay.
- **ESLint**: `@typescript-eslint/no-unused-vars` allows `_` prefix for unused vars/args. In `.svelte.ts` files, `svelte/prefer-svelte-reactivity` flags `new Date()` — extract to helper functions.
- **Loading states**: `PanelSkeleton.svelte` component provides shimmer skeletons (variants: `list`, `card`, `chart`, `hero`). All panels use it during loading. Skeleton unmount auto-triggers data freshness timestamp via Svelte context.
- **Error states**: `PanelError.svelte` component with message and optional retry callback (`role="alert"`). All panels display it when API calls fail.
- **Data freshness**: `DataFreshness.svelte` shows relative timestamp ("Just now", "3m ago") in panel headers with green/amber/red color coding (fresh <2min, recent 2-10min, stale >10min). Shows "Cached" badge when serving stale IndexedDB data. Auto-updates via `Panel.svelte` context — no per-panel wiring needed.
- **API validation**: `parseLimit()` and `parseMunicipality()` from `$lib/utils/api-validation` — used in all API routes to clamp limits and validate municipality slugs.

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

## Database (Supabase)

Supabase with 6 tables (all with RLS):

- `profiles` — extends auth.users (display_name, default_municipality, theme_preference)
- `monitors` — custom keyword alerts (keyword, municipality filter, source filter)
- `connections` — civic contact tracking (name, municipality, relationship, notes)
- `threads` — discussion threads (title, municipality, messages JSONB)
- `leads` — visitor lead capture (email unique, phone, name, municipality_interest, interests[], consent flags, source, user_agent, referrer). RLS: INSERT-only for anon.
- `lead_social_accounts` — social handles per lead (lead_id FK, platform, handle). RLS: INSERT-only for anon. Unique on (lead_id, platform).

Admin reads all data via Supabase dashboard (service role bypasses RLS).

Future tables: `layout_preferences` (saved grid positions), `saved_items` (bookmarked items).

## Cross-Panel Features

- **Global Search** (`SearchOverlay.svelte`): Full-screen overlay searching council, news, development, events, safety. Cmd+K shortcut. Results categorized with badges.
- **Item Bookmarks** (`BookmarkButton.svelte` + `bookmarks.svelte.ts`): Star icon on council, news, development, event items. localStorage-persisted. Flyout in header shows saved items.
- **Monitor Matching** (`monitor-matcher.ts`): MyMonitors panel scans 5 API sources for keyword matches. Case-insensitive, source-filtered, grouped by monitor with expandable match lists.
- **Shareable URL State** (`url-state.svelte.ts`): Municipality, focused panel, and search query reflected in URL params (`?m=victoria&panel=council-watch&q=transit`). Back button unfocuses panels. Validated against config.
- **Social Sharing** (`ShareDrawer.svelte` + `ShareButton.svelte`): Share buttons in header and panel headers. Twitter/X, Facebook, Instagram, TikTok via URL intent links (no JS SDKs). Copy-link with clipboard feedback. Share URLs point to `/share` SSR route for OG tag support.
- **Lead Capture** (`LeadCaptureBanner.svelte` + `LeadCaptureModal.svelte`): Bottom banner appears after 30s delay. Quick email subscribe or full 3-step modal (email → social accounts → interests/consent). Supabase backend with INSERT-only RLS. localStorage tracks dismiss/submit state.

## Implementation Status

Phases 0–11 complete. All 23 panels live across 4 tiers. 121 unit tests, 72 E2E tests (9 files). Tier 4 panels require Supabase auth. Lead capture requires Supabase (graceful 503 if unconfigured).

### Phase 5 Additions

- **Data expansion**: eBird API (wildlife), CivicWeb HTML scraping for 9 municipalities (council), ONC ocean temperature (environment)
- **Loading skeletons**: `PanelSkeleton.svelte` with shimmer animation (4 variants: `list`, `card`, `chart`, `hero`)
- **Global search**: Cross-panel search overlay with Cmd+K shortcut
- **Item bookmarks**: Star-based bookmarking with header flyout
- **Monitor matching engine**: Real-time keyword scanning across 5 data sources
- **Threads conversations**: Two-view thread detail with message list and reply input
- **Vitest unit tests**: 85 tests across 7 files (monitor-matcher, bookmarks, fetcher, hash, geo-attribution, api-validation, color-maps)

### Phase 6: Production Hardening

- **Councillor data**: 92 verified elected officials across all 13 CRD municipalities (was 40 with test data)
- **Double-fetch elimination**: Removed redundant `onMount` load calls from 14 panels — `$effect` handles initial load
- **Shared utilities**: Extracted `hashCode()` and `attributeMunicipality()` to `src/lib/utils/` (was duplicated across 13 routes)
- **Bug fixes**: Pulse timer leak (missing `onDestroy`), search debounce timer cleanup, `$derived.by` fix, ThreadMessage type dedup

### Phase 7: Robustness & Quality

- **Error handling**: `PanelError.svelte` component with retry — added to all 16 data panels (was only CouncilWatch)
- **Input validation**: `parseLimit()` and `parseMunicipality()` utilities applied to 13 API routes — clamps limits, validates slugs
- **Test expansion**: 24→61 tests — added hash, geo-attribution, api-validation test suites; geo-attribution ordering bug found and fixed
- **Accessibility**: `role="alert"` on errors, `role="status"` on loading, `aria-live` on search results, `focus-visible` outline, aria-labels on buttons
- **Fetcher**: Added optional `AbortSignal` parameter for request cancellation

### Phase 8: UX Polish

- **Panel wiring refactor**: Replaced 47-line `{#if}`/`{:else if}` chain in DashboardGrid with `panelComponents: Record<string, Component>` map + dynamic `<PanelComponent />` rendering
- **Empty states**: All 12 generic empty messages replaced with contextual, domain-specific messages (e.g., "No active transit alerts — service is running normally")
- **Data freshness indicators**: `DataFreshness.svelte` component shows relative timestamps in panel headers. Uses Svelte context pattern — `Panel.svelte` provides setter, `PanelSkeleton` triggers on unmount. Zero individual panel changes required.

### Phase 9: Color System Standardization

- **CSS color palette**: Added `--status-critical`, `--status-high`, `--status-hazardous` severity scale and `--palette-*` data visualization colors to both dark/light themes in `app.css`
- **Hardcoded color elimination**: Replaced all ~50 hardcoded hex colors across 13 panel components with CSS custom properties. Status/category/severity color functions now use `var()` for full theme awareness.
- **Consistent fallback removal**: Removed unnecessary `var(--x, #fallback)` patterns in Transit, ConstructionRoads, SafetyEmergency — `app.css` always provides values

### Phase 10: Comprehensive Product Improvement

- **Color map extraction**: 7+ duplicate `severityColor`/`statusColor`/`categoryColor` functions replaced by shared `colorMap<T>()` factory in `src/lib/utils/color-maps.ts` with 24 tests
- **Dead code removal**: Removed unused `hasError`/`errorMessage` state and error UI from `Panel.svelte` (panels handle their own errors via `PanelError`)
- **Error boundaries**: `<svelte:boundary>` wraps all panel renders in DashboardGrid — single-panel crashes no longer break the dashboard
- **ARIA improvements**: `role="img"` + aria-labels on Pulse sparkline SVGs, `role="status"` on DataFreshness, visually-hidden live region for search result count
- **Mobile hamburger menu**: Secondary header buttons (auto-refresh, reset layout, sign-in/out) collapse into hamburger dropdown at <600px. Primary (search, bookmarks, theme) stay visible.
- **Mobile panel sizing**: Reduced min-height from 300px→200px / 280px→180px
- **Map keyboard navigation**: `tabindex="0"`, `role="application"`, Escape closes popup, built-in MapLibre arrow keys activate
- **Map feature clustering**: `cluster: true` on features source with click-to-zoom expansion
- **Map filter UI**: Checkboxes for development/construction/flagged-only in CRDMapPanel
- **Sparkline memoization**: Pre-computed `$derived` sparkline paths in Pulse (avoid re-running D3 on every render)
- **Lazy loading**: Tier 3/4 panels (11 of 23) loaded via dynamic `import()` through `LazyPanel.svelte` — reduces initial bundle
- **SEO**: Open Graph, Twitter Card meta tags, JSON-LD `WebApplication` structured data in `app.html`
- **E2E tests**: Initial Playwright config + 7 smoke tests (expanded to 72 tests in Phase 11)

### Phase 11: Growth Features & E2E Testing

- **IndexedDB cache layer**: `src/lib/cache/idb-cache.ts` — transparent stale-while-revalidate at `apiFetch` level. Per-endpoint TTL (2-60min). Silent degradation. 13 unit tests.
- **Data freshness enhancement**: Cached data shows "Cached" badge with amber/red aging. `meta._cached` and `meta._cachedAt` threaded through Panel → DataFreshness.
- **Shareable URL state**: `url-state.svelte.ts` — municipality, panel focus, search query in URL params. `pushState` for panel focus (Back button), `replaceState` for municipality/search.
- **Social sharing**: `ShareDrawer.svelte` + `ShareButton.svelte` — Twitter/X, Facebook, Instagram, TikTok via URL intents (no JS SDKs). `/share` SSR route for OG meta tags with client redirect.
- **Lead capture system**: Banner (30s delay) + 3-step modal (email → social → interests/consent). Supabase INSERT-only RLS. `POST /api/leads` with server-side validation + upsert on email.
- **E2E test suite**: 72 Playwright tests across 9 files (smoke, panels, municipality, search, theme, bookmarks, navigation, url-sharing, lead-capture). `screenshot: 'only-on-failure'`, `retries: 1`.
- **DashboardGrid drag fix**: Panel header drag handler now excludes `button, a, input, select, textarea` — clicking collapse/focus/share buttons no longer initiates drag.

### Earlier Improvements

- Real CRD municipality boundary polygons from BC WFS (replaced bbox rectangles)
- USGS earthquake integration in Safety & Emergency panel
- Auto-refresh system with per-panel intervals and header toggle
- Panel collapse/minimize with localStorage persistence
- Responsive mobile layout (stacked below 768px)
