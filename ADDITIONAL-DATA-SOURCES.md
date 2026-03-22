# SVIT Additional Data Sources: Research & Planning

Research date: March 2026. This document catalogs potential data sources for the South Vancouver Island Tracker dashboard, organized by feasibility.

---

## Feasibility Tiers

| Tier         | Definition                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| **Easy**     | Public API or RSS with structured data, no auth or free auth, stable endpoint                            |
| **Moderate** | Requires scraping, limited/unofficial API, API key with restrictions, or data needs heavy transformation |
| **Hard**     | No public data feed, commercial API with costs, legal/TOS concerns, or requires partnership              |

---

## 1. BC Ferries (Swartz Bay Departures)

**Feasibility: Easy**

### Data Source

- **Third-party API**: `https://www.bcferriesapi.ca/v2/` (MIT-licensed, open source, free, no auth)
- **GitHub**: [samuel-pratt/bc-ferries-api](https://github.com/samuel-pratt/bc-ferries-api)
- **How it works**: Go web scraper fetches BC Ferries Current Conditions pages every 3 minutes, serves normalized JSON

### Endpoints

| Endpoint               | Description                                |
| ---------------------- | ------------------------------------------ |
| `GET /v2/capacity/`    | All routes with vehicle capacity data      |
| `GET /v2/noncapacity/` | All routes without capacity (Gulf Islands) |

### Terminal Code

Swartz Bay = `SWB`. Routes: SWB-TSA (Tsawwassen), SWB-FUL (Fulford Harbour), SWB-SGI (Southern Gulf Islands)

### Data Fields per Sailing

- `time` (departure), `arrivalTime`, `sailingStatus` (past/current/future)
- `vesselName` (e.g., "Queen of Cowichan")
- `vesselStatus` (operational status)
- `fill` (overall capacity %), `carFill` (vehicle %), `oversizeFill` (oversize %)
- `sailingDuration`, `routeCode`, `fromTerminalCode`, `toTerminalCode`

### Update Frequency

Every 3 minutes (scraper interval). BC Ferries official Current Conditions updates every 5 minutes.

### Dashboard Integration

- **Panel**: New "BC Ferries" panel, or embed in existing Transit panel as a sub-section
- **Dashboard modes**: Generalist (high value), active-senior, family, social
- **Map**: Pin at Swartz Bay terminal (lat: 48.6883, lon: -123.4108)
- **Municipalities**: Primarily North Saanich and Sidney, but relevant CRD-wide (everyone takes ferries)

### Implementation Notes

- Simple `apiFetch` wrapper to `/v2/capacity/`
- Filter JSON response for SWB routes
- Show next 3-4 departures with capacity bars
- Color code: green (<50%), amber (50-80%), red (>80% fill)
- Could add to SkyPulse signals (ferry disruptions)

---

## 2. BC Hydro Outage Map (Power Outages)

**Feasibility: Easy**

### Data Source

- **RSS/XML feeds**: `https://www.bchydro.com/rss/outages/{municipality}.xml`
- **Info page**: [BC Hydro RSS Outages](https://www.bchydro.com/safety-outages/power-outages/outages_rss.html)

### Available Feeds (CRD municipalities)

| Municipality                      | Feed URL (pattern)                        |
| --------------------------------- | ----------------------------------------- |
| Victoria                          | `/rss/outages/victoria.xml`               |
| Saanich                           | `/rss/outages/saanich.xml`                |
| Langford                          | `/rss/outages/langford.xml`               |
| Colwood                           | `/rss/outages/colwood.xml`                |
| Sooke                             | `/rss/outages/sooke.xml`                  |
| Sidney                            | `/rss/outages/sidney.xml`                 |
| Vancouver Island South (regional) | `/rss/outages/vancouver_island_south.xml` |

### Data Format

RSS/XML, plain text content. Unplanned outages only (Current and Restored status). Includes special update messaging during escalated events.

### Update Frequency

Every 15 minutes.

### Dashboard Integration

- **Panel**: Add to existing Safety & Emergency panel as a "Power Outages" section
- **Dashboard modes**: All modes (power outages affect everyone)
- **Map**: Outage locations on HeroMap (if coordinates are in RSS items)
- **SkyPulse**: Feed into `alertLevel` signal
- **Municipalities**: All 13 CRD municipalities (separate feed per municipality)

### Implementation Notes

- Use `Promise.allSettled` to fetch multiple municipality feeds (follows existing safety panel pattern)
- Parse RSS XML with same approach used for news feeds
- Show active outage count, affected customers, estimated restoration
- Municipality-specific filtering works naturally (one feed per municipality)

---

## 3. CivicJobs.ca / CivicInfo BC (Municipal Job Postings)

**Feasibility: Easy**

### Data Source

- **RSS feed**: `https://www.civicjobs.ca/rss/region.php?id=11&region=South+Vancouver+Island+-+BC`
- **Alternative**: `https://www.civicinfo.bc.ca/rss/careers.php` (all BC)
- **All BC jobs**: `https://www.civicjobs.ca/rss/province.php?id=BC`
- **Info**: [CivicJobs RSS](https://www.civicjobs.ca/rss2)

### Feed Structure

Region-specific RSS feed for South Vancouver Island. Standard RSS format with job posting fields (title, employer, posting date, deadline, link).

### Update Frequency

As new jobs are posted (real-time RSS).

### Dashboard Integration

- **Panel**: New "Municipal Jobs" panel (Tier 3, lazy loaded) or sub-section in Community Board panel
- **Dashboard modes**: Political (civic engagement), social, generalist
- **Municipalities**: All CRD municipalities (filtered from South Vancouver Island region feed)

### Implementation Notes

- Simple RSS fetch and parse, same pattern as news feeds
- Filter by municipality name in job title/employer field
- Show employer, title, closing date, link
- Low volume (maybe 5-15 active postings at any time), so no pagination needed

---

## 4. UVic Events Calendar

**Feasibility: Easy**

### Data Source

- **JSON endpoint**: `https://events.uvic.ca/live/json/events/`
- **RSS endpoint**: `https://events.uvic.ca/live/rss/events/`
- **iCal endpoint**: `https://events.uvic.ca/live/ical/events/`
- **Platform**: LiveWhale CMS (well-documented API)
- **API docs**: [LiveWhale API](https://support.livewhale.com/live/blurbs/api)

### Filtering Parameters

| Parameter             | Example                    | Description                                |
| --------------------- | -------------------------- | ------------------------------------------ |
| `/category/{name}/`   | `/category/concerts/`      | Filter by event category                   |
| `/tag/{name}/`        | `/tag/free/`               | Filter by tag                              |
| `/start_date/{date}/` | `/start_date/today/`       | Start date (supports "today", "-24 hours") |
| `/end_date/{date}/`   | `/end_date/+7 days/`       | End date                                   |
| `/max/{n}/`           | `/max/20/`                 | Limit results                              |
| `/search/{term}/`     | `/search/lecture/`         | Keyword search                             |
| `/group/{name}/`      | Filter by department/group |

### Output Formats

JSON, RSS, iCal, CSV (LiveWhale 2.0+)

### Event Categories

Concerts, Lectures & Seminars, Workshops, Theatre, Conferences & Forums, Information Sessions, Tours, Athletics, Arts & Culture, Science & Technology, Health & Wellness, Student Life, Professional Development, Research, Indigenous, International, Sustainability

### Update Frequency

Real-time (events are added/updated by campus departments continuously).

### Dashboard Integration

- **Panel**: Add to existing Community Events panel alongside Tourism Victoria events
- **Dashboard modes**: Social, family, generalist
- **Municipalities**: Saanich (UVic campus is in Saanich)
- **Map**: Pin at UVic campus (lat: 48.4634, lon: -123.3117)

### Implementation Notes

- JSON endpoint is ideal, no parsing needed
- Combine with Tourism Victoria events in the events API route using `Promise.allSettled`
- Tag items with `saanich` municipality
- Filter for public/community audience events (exclude internal staff events)

---

## 5. Camosun College Events

**Feasibility: Easy**

### Data Source

- **Events page**: `https://camosun.ca/events`
- **RSS feed**: Available via NEPS (News and Events Publishing System)
- **iCal feeds**: Google Calendar iCal endpoints for student society events
- **Student society**: `https://camosunstudent.org/clubs/calendar/`

### Data Format

RSS (via NEPS) and iCal (via Google Calendar). NEPS is Camosun's content syndication service for news (RSS) and events (iCal).

### Update Frequency

As events are posted.

### Dashboard Integration

- **Panel**: Add to Community Events panel alongside UVic and Tourism Victoria
- **Dashboard modes**: Social, family, generalist
- **Municipalities**: Saanich (Lansdowne campus) and Esquimalt (Interurban campus)
- **Map**: Pins at both campuses

### Implementation Notes

- Fetch RSS/iCal feed, parse events
- Tag with appropriate municipality based on campus location
- Lower priority than UVic (smaller event volume)

---

## 6. OBIS (Ocean Biodiversity Information System)

**Feasibility: Easy**

### Data Source

- **API base**: `https://api.obis.org/v3/`
- **Documentation**: Swagger UI at `https://api.obis.org`
- **Manual**: `https://manual.obis.org`

### Key Endpoint

`GET /v3/occurrence` with geography filter:

- `geometry` parameter: WKT format, e.g., `POLYGON((-123.77 48.30, -123.28 48.30, -123.28 48.70, -123.77 48.70, -123.77 48.30))`
- This matches the existing `CRD_BBOX` used in other API routes

### Additional Parameters

- `scientificname`: Filter by species
- `startdate`, `enddate`: Temporal filtering
- `startdepth`, `enddepth`: Depth filtering

### Data Format

JSON. Returns occurrence records with species, coordinates, timestamps, depth.

### Update Frequency

Database updated regularly as new datasets are harvested. Not real-time (observations from research cruises, citizen science submissions).

### Dashboard Integration

- **Panel**: Add to existing Wildlife & Marine panel as additional marine observation source
- **Dashboard modes**: Nature
- **Municipalities**: All coastal municipalities
- **Map**: Marine observation pins on HeroMap

### Implementation Notes

- Complements existing iNaturalist marine data
- Use CRD_BBOX as WKT polygon in geometry parameter
- No auth required, free and open
- Rate limiting unclear but academic use is welcome
- Already listed as a planned source in CLAUDE.md

---

## 7. BC Parks Advisories (Provincial Parks)

**Feasibility: Easy**

### Data Source

- **REST API**: `https://bcparks.api.gov.bc.ca/api/public-advisories`
- **GraphQL**: `https://bcparks.api.gov.bc.ca/graphql`
- **Platform**: Strapi CMS (headless), open government data
- **Source code**: [bcgov/bcparks.ca](https://github.com/bcgov/bcparks.ca)

### Advisory Data Fields

- `id`, `advisoryNumber`, `revisionNumber`
- `title`, `description` (HTML)
- `isSafetyRelated` (boolean)
- `advisoryDate`, `effectiveDate`, `endDate`, `expiryDate`, `updatedDate`
- `latitude`, `longitude` (when available)
- `listingRank` (priority), `isReservationsAffected`

### CRD-relevant Provincial Parks

Goldstream, Gowlland Tod, Mount Work, East Sooke, John Dean, Island View Beach, Thetis Lake (some of these are CRD regional parks, not BC Parks, so filter accordingly)

### Update Frequency

Monday through Friday, 8:30am to 4:30pm (excluding holidays).

### Dashboard Integration

- **Panel**: Add to existing Parks & Recreation panel or Safety & Emergency panel
- **Dashboard modes**: Nature, family, generalist, active-senior
- **Map**: Advisory locations on HeroMap when lat/lon available
- **Municipalities**: Filter by park coordinates within CRD bbox

### Implementation Notes

- Complements CRD Regional Parks info (CRD operates its own parks system separately from BC Parks)
- Use REST API with Strapi filters to get active advisories
- Filter server-side to parks within CRD bbox
- No auth required

---

## 8. Acartia.io (Whale & Marine Mammal Sightings)

**Feasibility: Moderate**

### Data Source

- **API base**: `https://acartia.io/api/v1`
- **GitHub**: [salish-sea/acartia](https://github.com/salish-sea/acartia)
- **Platform**: Decentralized data cooperative for Salish Sea marine mammal sightings

### Endpoints

| Endpoint                 | Description             |
| ------------------------ | ----------------------- |
| `GET /sightings/current` | All current sightings   |
| `GET /sightings/trusted` | Verified sightings only |
| `GET /sightings/:id`     | Specific sighting       |

### Authentication

Requires account registration and API key via Acartia Project Dashboard at acartia.io.

### Data Fields

Species, coordinates, timestamp (exact schema in DOCS.md). Focused on cetaceans (orcas, humpbacks, gray whales) in the Salish Sea.

### Update Frequency

Near real-time. Aggregates sightings from Orca Network, Ocean Wise, and citizen scientists. The Whale Report app shows sightings with a 24-hour delay for public access.

### Dashboard Integration

- **Panel**: Add to existing Wildlife & Marine panel as a whale-specific data source
- **Dashboard modes**: Nature, family, social
- **Map**: Whale sighting pins on HeroMap with species icons
- **Municipalities**: All coastal CRD municipalities

### Implementation Notes

- Requires API key signup (free)
- Better than iNaturalist for real-time whale sightings (iNaturalist has research-grade delay)
- Would be a strong differentiator for the dashboard, especially for tourists
- Need to check if sighting coordinates fall within CRD bbox
- Add env var: `ACARTIA_API_KEY`

---

## 9. CRD Alerts (Parks, Water, Facilities)

**Feasibility: Moderate**

### Data Source

- **Alerts page**: `https://www.crd.ca/news/alerts`
- **No RSS feed** or API available; web scraping required

### Current Alert Categories (observed March 2026)

- Parks & Trails (Galloping Goose closures, trail conditions, parking lot construction)
- Water Services (boil water advisories, water main flushing, blue-green algae)
- Facilities & Maintenance (wastewater treatment, landfill operations)

### Data Fields (from HTML)

Alert title, description, date, category/type, affected area

### Update Frequency

As needed (alerts are posted when conditions change).

### Dashboard Integration

- **Panel**: Add to Safety & Emergency panel (water/facilities alerts) and Parks & Recreation panel (trail alerts)
- **Dashboard modes**: All modes
- **Map**: Location-based alerts on HeroMap when geographic info can be extracted
- **Municipalities**: All 13 CRD municipalities

### Implementation Notes

- Requires HTML scraping (no structured feed)
- Parse the alerts page for structured data (title, description, category)
- Similar to how the council route scrapes CivicWeb HTML
- CRD alert categories map naturally to existing panels
- Monitor for page structure changes
- Consider: CRD Emergency Dashboard at `emergency.crd.ca` uses Guardian IMS API (`canadaapi.guardianims.com/api/v1/`) but requires authentication

---

## 10. BC Hydro Outage Map (Enhanced: Map Layer)

Already covered in item #2. Additional enhancement via the outage map:

### Data Source (Map API)

- **Outage map**: `https://www.bchydro.com/power-outages/app/outage-map.html`
- The map likely uses an internal API for outage polygon/point data with coordinates
- Network inspection of the map page may reveal a JSON endpoint for outage geometries

### Implementation Notes

- The RSS feeds (item #2) are the easy path
- For map integration with outage polygons, would need to reverse-engineer the map's data source
- Feasibility for map layer: Moderate (requires network analysis of the outage map page)

---

## 11. Island Health Public Notices

**Feasibility: Moderate**

### Data Source

- **Public notices portal**: `https://inspections.myhealthdepartment.com/island-health/public-notices`
- **Drinking water page**: `https://www.islandhealth.ca/learn-about-health/drinking-water`
- **Boil water list**: `https://www.healthspace.ca/Clients/VIHA/VIHA_Website.nsf/Water-List-Boil?OpenView`
- **Platform**: My Health Department (inspections.myhealthdepartment.com)

### Data Types

- Boil water advisories (three levels: water quality advisory, boil water advisory, do-not-use)
- Food safety notices
- Beach water quality (seasonal)
- Public health advisories

### Data Format

Web pages only, no known RSS or API. The myhealthdepartment.com portal returned 403 when fetched, suggesting anti-scraping measures.

### Update Frequency

Varies. Boil water advisories are posted as conditions change.

### Dashboard Integration

- **Panel**: Add to Safety & Emergency panel (health advisories) and Nature & Environment (beach water quality)
- **Dashboard modes**: All modes (health advisories are universal)
- **Municipalities**: All CRD municipalities

### Implementation Notes

- The HealthSpace boil water list (`healthspace.ca`) may be more scrapable than myhealthdepartment.com
- Could also monitor Island Health news/media releases for advisory announcements
- Province of BC maintains a water quality notifications page at `www2.gov.bc.ca` that aggregates health authority advisories
- Lower volume of data (advisories are infrequent in urban CRD areas)

---

## 12. YYJ Airport (Victoria International Airport)

**Feasibility: Moderate**

### Data Source

- **Official flight status**: `https://yyj.ca/en/flights-info/flight-status/`
- **Third-party APIs**:
  - FlightAware AeroAPI: `https://aeroapi.flightaware.com/aeroapi/` (500 free calls/month, personal use)
  - Flightradar24, FlightStats (commercial APIs)

### Official Page Analysis

The YYJ flight status page renders flight data server-side in HTML tables. Fields: Airline, Flight number, Location (origin/destination), Gate, Scheduled Time, Status (Arrived/Departed/Delayed/On Time).

### Data Format

- Official page: Server-rendered HTML (scraping needed)
- FlightAware AeroAPI: REST JSON, 60+ endpoints, airport-specific queries by ICAO code `CYYJ`

### Update Frequency

Flight status updates in near real-time (minutes).

### FlightAware AeroAPI Details

- Free tier: 500 API calls/month (personal use only)
- Paid: Starting at $100/month for 10,000 calls
- ICAO code: `CYYJ`
- Returns: departures, arrivals, delays, cancellations

### Dashboard Integration

- **Panel**: New "Airport" or "YYJ Flights" panel (Tier 3, lazy loaded)
- **Dashboard modes**: Generalist, active-senior, social
- **Municipalities**: North Saanich (airport location)
- **Map**: Pin at YYJ (lat: 48.6469, lon: -123.4258)

### Implementation Notes

- **Recommended approach**: Scrape `yyj.ca` flight status page (avoids API costs)
- Small airport with ~30-50 daily flights, so data volume is manageable
- Show next departures/arrivals with status
- Could combine with BC Ferries in a "Transport Hub" panel
- Alternatively, FlightAware free tier (500 calls/month) would work with aggressive caching (15-min TTL, ~100 calls/day = ~3000/month, over free limit)

---

## 13. Victoria Harbour Vessel Traffic (AIS)

**Feasibility: Hard**

### Data Sources

| Source        | Format        | Cost                  | Notes                                                    |
| ------------- | ------------- | --------------------- | -------------------------------------------------------- |
| MarineTraffic | REST API      | From ~$15/month       | Most comprehensive. Vessel positions, port calls, photos |
| AISHub        | JSON/XML/CSV  | Free (reciprocal)     | Requires contributing own AIS receiver data              |
| Data Docked   | REST API      | Free trial, then paid | 800K+ vessels, 99.9% uptime                              |
| NOAA AIS data | Bulk download | Free                  | Historical, not real-time                                |

### AISHub Reciprocal Model

Free access requires contributing your own AIS receiver feed. Not practical without hardware investment.

### MarineTraffic API

- Basic: ~$15/month (10 vessels, terrestrial AIS)
- Full API access: significantly more expensive
- Documentation: `servicedocs.marinetraffic.com`

### Dashboard Integration

- **Panel**: New "Harbour Traffic" panel (Tier 3) or sub-section in an existing panel
- **Dashboard modes**: Nature, generalist
- **Municipalities**: Victoria, Esquimalt (naval base), Sidney (seaplane terminal)
- **Map**: Vessel positions on HeroMap

### Implementation Notes

- All real-time AIS data sources are either paid or require hardware
- Could use a "vessel count" approach from free/static data rather than live tracking
- Alternatively, embed MarineTraffic iframe widget (free for basic view) rather than API integration
- The Transport Canada AIS program data is available but only historical bulk downloads
- **Recommendation**: Defer unless a free AIS data source emerges. Consider a static "Port of Victoria" informational panel instead.

---

## 14. BC Assessment (Property Data)

**Feasibility: Hard**

### Data Sources

- **Public lookup**: `https://info.bcassessment.ca/Services-products/Look-Up-Property-Assessment` (individual property search, no bulk access)
- **BC OnLine**: `https://www.bconline.gov.bc.ca/` (paid per-query access)
- **Data Advice product**: Annual full-roll XML + weekly XML updates (commercial product, not free)
- **Academic access**: Restricted to SFU, UBC, UNBC, UVic users via Abacus

### Data Format

Individual property lookup via web form (no API). Bulk data via commercial Data Advice product (XML/CSV).

### Dashboard Integration

- **Panel**: Could enhance existing Real Estate Market panel with assessment data
- **Dashboard modes**: Active-senior, political, generalist
- **Municipalities**: All CRD municipalities

### Implementation Notes

- No free API available
- Scraping individual property lookups would be slow and likely violate TOS
- The Data Advice XML product is a commercial offering
- **Recommendation**: Use aggregate statistics from BC Assessment annual reports instead (median assessment values by municipality, year-over-year changes). These are published in press releases and news articles each January.
- Could manually curate annual assessment summary data as seed data for the Real Estate Market panel

---

## 15. Farmers' Market Schedules

**Feasibility: Moderate (semi-static)**

### Data Sources

- **BCAFM Market Trail**: `https://bcfarmersmarkettrail.com/markets/` (no API)
- **Tourism Victoria Markets**: `https://www.tourismvictoria.com/things-to-do/spa-shopping-services/markets`
- **Individual market websites**: Moss Street, James Bay, Esquimalt, etc.

### Known CRD Markets (2025-2026 season)

| Market               | Location                     | Season                             | Schedule                                 |
| -------------------- | ---------------------------- | ---------------------------------- | ---------------------------------------- |
| Moss Street          | 1330 Fairfield Rd, Victoria  | May-Oct (summer), Nov-Apr (winter) | Sat 10am-2pm (summer), 10am-1pm (winter) |
| James Bay            | Menzies & Superior, Victoria | May-Oct                            | Sat 9am-3pm                              |
| Esquimalt            | Memorial Park                | May-Oct                            | Sat 9am-3pm                              |
| Goldstream           | Goldstream area              | May-Oct                            | Sat                                      |
| Sidney               | Sidney waterfront            | Seasonal                           | Thu evenings (summer)                    |
| Metchosin            | Metchosin Community Hall     | Seasonal                           | Sun                                      |
| Salt Spring (nearby) | Ganges                       | Year-round                         | Sat                                      |

### Data Format

No structured API. Market data is relatively static (seasonal schedules change annually).

### Dashboard Integration

- **Panel**: Add to existing Local Food & Drink panel or Community Events panel
- **Dashboard modes**: Active-senior, family, social, generalist
- **Municipalities**: Victoria, Esquimalt, Langford, Sidney, Metchosin, Central Saanich

### Implementation Notes

- Best implemented as curated seed data (like the existing local-food panel)
- Include: market name, address, coordinates, season, days/hours, website
- Update annually when market seasons are announced (typically March/April)
- Could scrape BCAFM or Tourism Victoria for updates, but manual curation is simpler and more reliable
- Add market locations to HeroMap with pin markers

---

## 16. BC Court Listings (Victoria Courthouse)

**Feasibility: Hard**

### Data Source

- **CSO (Court Services Online)**: `https://justice.gov.bc.ca/cso/courtLists.do`
- **Provincial court lists**: `https://justice.gov.bc.ca/courts/PCDCindex.html`
- **Daily court lists page**: `https://www2.gov.bc.ca/gov/content/justice/courthouse-services/daily-court-lists`

### Data Format

PDF only. No API, no CSV, no structured data. Court lists are published daily as PDF files by 6:30am (criminal) and 6:00am (civil). Victoria was not listed among the courthouse locations in the CSO web interface results.

### Update Frequency

Daily by 6:30am PST.

### Dashboard Integration

- **Panel**: Potential "Court Watch" panel (Tier 3, political mode)
- **Dashboard modes**: Political
- **Municipalities**: Victoria (courthouse location)

### Implementation Notes

- PDF parsing would be required (complex, brittle)
- Victoria courthouse may not have electronic court lists available through CSO
- **Recommendation**: Defer. The effort-to-value ratio is poor. Link to the BC Courts website instead.

---

## 17. Fire Dispatch Data

**Feasibility: Hard**

### Data Sources

- **Victoria Open Data**: `opendata.victoria.ca` has Fire Dispatch Areas (geographic boundaries only, not call data)
- **ECOMM 911**: Regional dispatch center, no public API
- **No public real-time dispatch feed** identified for Victoria, BC

### What Exists

- Fire Dispatch Areas dataset (GeoJSON of response zones, not incidents)
- No equivalent to US-style fire dispatch call feeds (like San Francisco's open data)
- VicPD crime data exists on ArcGIS, but fire department calls are not published

### Dashboard Integration

- **Panel**: Would enhance Safety & Emergency panel
- **Dashboard modes**: All modes
- **Municipalities**: Victoria, Saanich (has its own fire dispatch)

### Implementation Notes

- **Recommendation**: Defer entirely. No public data source exists.
- ECOMM 911 (the regional dispatch provider) does not offer public data feeds
- Could potentially FOI historical data for analysis, but real-time is unavailable
- Some Canadian cities publish fire incident reports (Edmonton, Toronto), but Victoria does not

---

## 18. CRD Water/Wastewater Quality

**Feasibility: Moderate**

### Data Sources

- **CRD Drinking Water**: `https://www.crd.ca/programs-services/water/drinking-water-quality`
- **CRD Beach Water Quality**: `https://www.crd.bc.ca/education/concerns/beach-water-quality`
- **CRD Alerts**: `https://www.crd.ca/news/alerts` (boil water advisories appear here)
- **Island Health beach reports**: Seasonal beach water sampling results

### Data Format

Web pages, no API. CRD alerts page has no RSS (covered in item #9). Beach water quality data may be available through Island Health inspection portals.

### Dashboard Integration

- **Panel**: Add water quality indicators to Nature & Environment panel; boil water alerts to Safety & Emergency
- **Dashboard modes**: Nature, family, generalist
- **Municipalities**: All CRD municipalities

### Implementation Notes

- Boil water advisories: scrape from CRD alerts page (same as item #9)
- Beach water quality: seasonal data, could scrape Island Health beach reports
- CRD publishes annual water quality reports (PDF), useful for static data
- Water restriction levels (Stage 1-4) during summer are posted on CRD website
- **Quick win**: Add water restriction level as a simple indicator in Weather & Tides panel (just scrape one page for the current stage)

---

## Summary: Implementation Priority

### Phase 1: Easy wins (1-2 days each)

| #   | Source              | Panel                  | New API Route?  | Effort  |
| --- | ------------------- | ---------------------- | --------------- | ------- |
| 1   | BC Ferries          | New or Transit         | Yes             | 1 day   |
| 2   | BC Hydro Outages    | Safety & Emergency     | Extend existing | 0.5 day |
| 3   | CivicJobs.ca        | Community Board or new | Yes             | 0.5 day |
| 4   | UVic Events         | Community Events       | Extend existing | 0.5 day |
| 6   | OBIS Marine         | Wildlife & Marine      | Extend existing | 1 day   |
| 7   | BC Parks Advisories | Parks & Recreation     | Extend existing | 0.5 day |

### Phase 2: Moderate effort (2-4 days each)

| #   | Source            | Panel              | New API Route?         | Effort |
| --- | ----------------- | ------------------ | ---------------------- | ------ |
| 5   | Camosun Events    | Community Events   | Extend existing        | 1 day  |
| 8   | Acartia Whales    | Wildlife & Marine  | Extend existing        | 1 day  |
| 9   | CRD Alerts        | Safety + Parks     | Yes (scraper)          | 2 days |
| 11  | Island Health     | Safety & Emergency | Yes (scraper)          | 2 days |
| 12  | YYJ Airport       | New panel          | Yes (scraper)          | 2 days |
| 15  | Farmers' Markets  | Local Food & Drink | Extend existing (seed) | 1 day  |
| 18  | CRD Water Quality | Nature + Safety    | Extend existing        | 1 day  |

### Phase 3: Defer or revisit

| #   | Source             | Reason                                   |
| --- | ------------------ | ---------------------------------------- |
| 13  | AIS Vessel Traffic | All sources are paid or require hardware |
| 14  | BC Assessment      | No free API, commercial data product     |
| 16  | BC Court Listings  | PDF-only, Victoria not in CSO system     |
| 17  | Fire Dispatch      | No public data source exists             |

---

## Environment Variables (New)

```
ACARTIA_API_KEY=           # Free from acartia.io (whale sightings)
FLIGHTAWARE_API_KEY=       # Optional: 500 free calls/month (YYJ flights)
```

---

## Highest-Impact Additions

Ranked by community value and feasibility:

1. **BC Ferries** - Nearly everyone in the CRD uses BC Ferries. Real-time capacity data is immediately useful. Free API, easy integration.
2. **BC Hydro Outages** - Power outages are high-urgency information. RSS feeds are structured and municipality-specific. Fits naturally in Safety panel.
3. **UVic Events** - UVic is a major community hub. JSON API with rich filtering. Augments the existing events panel significantly.
4. **BC Parks Advisories** - Trail closures and park safety advisories are relevant to the nature and family audiences. Free government API.
5. **Acartia Whale Sightings** - Unique differentiator for the dashboard. Real-time whale sightings in the Salish Sea. Requires free API key.
6. **CRD Alerts** - Covers trail closures, water advisories, and facility issues that directly affect residents. Requires scraping.
