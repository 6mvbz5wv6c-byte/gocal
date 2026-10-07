# Fayetteville civic crawl — October 7, 2026

Scope: ZIP 72701 as a Fayetteville discovery seed, October 7–December 31, 2026. City and Washington County jurisdictions are distinguished; no voter precinct is inferred from ZIP.

## Result

105 candidates prepared and sent to pending review: 100 city public-meeting/closure notices, 2 county Planning/ZBA meetings, 2 voting notices, and 1 city Lease Literacy workshop. 13 pass the current completeness gate; 92 have flags, mostly the city’s explicit “Tentative” designation. Completeness does not constitute approval. Existing 126 approved and 21 rejected records were preserved. The public calendar and its ribbons read approved records only.

Government sources are in `crawler/sources/fayetteville-government.json`. The seed detail plus 101 related city detail pages were examined. The city’s “Test Integration Event” and a December 2027 meeting were excluded. The importer compared every existing moderation status and inserted unmatched records only; temporary ingest tokens were revoked.

## Voting notices ready for human approval

- [Early voting — official county dates and locations](https://www.washingtoncountyar.gov/government/departments-a-e/election-commission/early-vote-sites-for-the-november-3-2026-election): October 19–November 2, 2026. The single calendar event represents **Washington County Courthouse, 280 North College, Fayetteville AR 72701**. Weekdays October 19–30: 8am–6pm; Saturdays October 24/31: 10am–4pm; Sundays closed; November 2: 8am–5pm at the courthouse only. Thirteen opening dates are stored under one event. Other sites have different schedules; follow the county link for them.
- [Election Day — official county information](https://www.washingtoncountyar.gov/government/departments-a-e/election-commission/november-3-2026-general-election-information): November 3, 2026, 7:30am–7:30pm Central. The county page currently marks site details TBD. This notice links to official location information and supplies no invented polling street address.

The ribbon says “POLLS OPEN” only during that event’s reviewed opening hours, using America/Chicago, including the November DST change. Outside those hours it displays the corresponding closed/upcoming state. No Sunday event chips. This is schedule-based information; emergency changes require fresh official evidence and review.

## Hearings and public participation

- City planning meetings include October 12/26, November 9/23 and December 14. The city marks these tentative. The October 8 agenda session and October 12 meeting’s official CivicClerk overview pages said agenda information would appear once published. Specific rezoning case numbers, parcel addresses and hearing items were **not verified** and were not invented.
- [Washington County Planning/ZBA meetings](https://www.washingtoncountyar.gov/government/departments-f-z/planning/meetings): October 29 and December 3, 5pm, Quorum Court Room, courthouse second floor, 280 N College. These are county board dates, not an assertion that a particular city rezoning application will be heard. Agenda details still need review.
- City Council, housing, transportation, food, parks, environmental, historic district, public health and other public notices are itemized below. Approximate starts and missing locations remain flagged.
- [Lease Literacy workshop](https://fayetteville-ar.gov/CivicSend/ViewMessage/message/302002): October 15, 6–7pm, Crisis Brewing Company, 210 S Nelson Hackett Blvd. Free drop-in renter workshop; advance registration encouraged by the organizer.

County direct HTTP reads returned 403. Exact official indexed text supplied the county facts, with that acquisition method recorded in the review traces. These were not live successful direct crawls. City detail pages and the workshop were captured directly; the two agenda portals were inspected in a browser. No private/social account data was accessed.

## Candidate inventory

Scores measure supported field coverage, not calibrated confidence. An absent optional end time does not block approval. All entries below require a human decision before public display.

| Date | Start (Central) | Event / official source | Evidence score | Review flags |
|---|---|---|---:|---|
| 2026-10-07 | 16:00 | [Urban Forestry Advisory Board](https://www.fayetteville-ar.gov/m/calendar/event/detail/12142) | 75/100 | Ready for review |
| 2026-10-08 | 16:30 | [Planning Commission Agenda Session and Tour](https://www.fayetteville-ar.gov/m/calendar/event/detail/12143) | 75/100 | Ready for review |
| 2026-10-08 | 17:30 | [Historic District Commission](https://www.fayetteville-ar.gov/m/calendar/event/detail/12144) | 75/100 | Ready for review |
| 2026-10-12 | 08:30 | [Tentative: Advertising and Promotion Commission](https://www.fayetteville-ar.gov/m/calendar/event/detail/12145) | 50/100 | date, venue |
| 2026-10-12 | 14:00 | [Tentative: Civil Service Commission - Police Officer List Certification](https://www.fayetteville-ar.gov/m/calendar/event/detail/12635) | 63/100 | date |
| 2026-10-12 | 17:30 | [Tentative: Planning Commission Meeting](https://www.fayetteville-ar.gov/m/calendar/event/detail/12147) | 63/100 | date |
| 2026-10-13 | 16:30 | [Tentative: City Council Agenda Session](https://www.fayetteville-ar.gov/m/calendar/event/detail/12146) | 63/100 | date |
| 2026-10-13 | 17:30 | [Tentative: Water, Sewer & Solid Waste Committee (Immediately Following City Council Agenda Session)](https://www.fayetteville-ar.gov/m/calendar/event/detail/12148) | 50/100 | date, time |
| 2026-10-13 | 18:00 | [Tentative: Food Commission](https://www.fayetteville-ar.gov/m/calendar/event/detail/12215) | 63/100 | date |
| 2026-10-14 | 09:00 | [Tentative: Technical Plat Review Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12149) | 63/100 | date |
| 2026-10-14 | 16:30 | [Tentative: City Board Of Health](https://www.fayetteville-ar.gov/m/calendar/event/detail/12150) | 38/100 | address, date, venue |
| 2026-10-14 | 17:30 | [Tentative: Active Transportation Advisory Committee - Bike Tour](https://www.fayetteville-ar.gov/m/calendar/event/detail/12151) | 50/100 | date, venue |
| 2026-10-15 | 10:30 | [Tentative: TAC Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12481) | 38/100 | address, date, venue |
| 2026-10-15 | 14:00 | [Tentative: Airport Board](https://www.fayetteville-ar.gov/m/calendar/event/detail/12152) | 50/100 | date, venue |
| 2026-10-15 | 18:00 | [Tenant Toolkit: Lease Literacy Workshop](https://fayetteville-ar.gov/CivicSend/ViewMessage/message/302002) | 100/100 | Ready for review |
| 2026-10-15 | 18:00 | [Tentative: Fayetteville Youth Advisory Council](https://www.fayetteville-ar.gov/m/calendar/event/detail/12639) | 63/100 | date |
| 2026-10-15 | 18:30 | [Tentative: Black Heritage Preservation Commission](https://www.fayetteville-ar.gov/m/calendar/event/detail/12155) | 63/100 | date |
| 2026-10-16 | 10:00 | [Tentative: Maple Street Ribbon Cutting](https://www.fayetteville-ar.gov/m/calendar/event/detail/12595) | 50/100 | date, venue |
| 2026-10-19 → 2026-11-02 | 08:00 | [Early voting — Washington County Courthouse](https://www.washingtoncountyar.gov/government/departments-a-e/election-commission/early-vote-sites-for-the-november-3-2026-election) | 100/100 | Ready for review |
| 2026-10-19 | 16:00 | [Tentative: Fayetteville Public Library Board Of Trustees](https://www.fayetteville-ar.gov/m/calendar/event/detail/12154) | 50/100 | date |
| 2026-10-19 | 16:00 | [Tentative: Friends of YRCC](https://www.fayetteville-ar.gov/m/calendar/event/detail/12156) | 50/100 | date |
| 2026-10-19 | 17:30 | [Tentative: Environmental Action Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12157) | 63/100 | date |
| 2026-10-20 | 17:30 | [Tentative: City Council Meeting](https://www.fayetteville-ar.gov/m/calendar/event/detail/12474) | 63/100 | date |
| 2026-10-21 | 13:30 | [Tentative: Fourth Judicial District Drug Task Force](https://www.fayetteville-ar.gov/m/calendar/event/detail/12158) | 38/100 | address, date, venue |
| 2026-10-21 | 14:00 | [Tentative: Bid Opening: Bid 26-55, Construction – Fire Station #6 Pavement Rehab Rebid #2](https://www.fayetteville-ar.gov/m/calendar/event/detail/12638) | 63/100 | date |
| 2026-10-21 | 17:00 | [Tentative: Washington County Regional Ambulance Authority Executive Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12153) | 50/100 | date, venue |
| 2026-10-21 | 18:00 | [Tentative: Fayetteville Arts Council](https://www.fayetteville-ar.gov/m/calendar/event/detail/12159) | 63/100 | date |
| 2026-10-22 | 16:30 | [Tentative: Planning Commission Agenda Session and Tour](https://www.fayetteville-ar.gov/m/calendar/event/detail/12160) | 63/100 | date |
| 2026-10-22 | 17:00 | [Tentative: Housing Authority Board Of Commissioners](https://www.fayetteville-ar.gov/m/calendar/event/detail/12163) | 38/100 | address, date, venue |
| 2026-10-22 | 17:00 | [Tentative: Long Range Planning (Immediately Following Planning Commission Agenda Session)](https://www.fayetteville-ar.gov/m/calendar/event/detail/12161) | 50/100 | date, time |
| 2026-10-26 | 15:00 | [Tentative: Town And Gown Advisory Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12164) | 38/100 | address, date, venue |
| 2026-10-26 | 17:00 | [Tentative: 2027 City Council Budget Workshop](https://www.fayetteville-ar.gov/m/calendar/event/detail/12588) | 63/100 | date |
| 2026-10-26 | 17:30 | [Tentative: Planning Commission Meeting](https://www.fayetteville-ar.gov/m/calendar/event/detail/12165) | 63/100 | date |
| 2026-10-27 | 16:30 | [Tentative: City Council Agenda Session](https://www.fayetteville-ar.gov/m/calendar/event/detail/12166) | 63/100 | date |
| 2026-10-27 | 17:30 | [Tentative: Transportation Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12167) | 63/100 | date |
| 2026-10-28 | 09:00 | [Tentative: Technical Plat Review Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12168) | 63/100 | date |
| 2026-10-28 | 13:30 | [Tentative: RPC / Policy Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12169) | 38/100 | address, date, venue |
| 2026-10-28 | 17:30 | [Tentative: Community Development and Assistance Programs Advisory Board](https://www.fayetteville-ar.gov/m/calendar/event/detail/12170) | 63/100 | date |
| 2026-10-29 | 17:00 | [Washington County Planning Board & Zoning Board of Adjustment](https://www.washingtoncountyar.gov/government/departments-f-z/planning/meetings) | 88/100 | Ready for review |
| 2026-10-29 | 18:00 | [Tentative: Fayetteville Youth Advisory Council](https://www.fayetteville-ar.gov/m/calendar/event/detail/12171) | 63/100 | date |
| 2026-11-02 | 15:45 | [Tentative: Board Of Adjustments](https://www.fayetteville-ar.gov/m/calendar/event/detail/12172) | 63/100 | date |
| 2026-11-02 | 17:30 | [Tentative: Parks and Recreation Advisory Board](https://www.fayetteville-ar.gov/m/calendar/event/detail/12173) | 63/100 | date |
| 2026-11-02 | 18:00 | [Tentative: Animal Services Advisory Board](https://www.fayetteville-ar.gov/m/calendar/event/detail/12174) | 38/100 | address, date, venue |
| 2026-11-03 | 07:30 | [Election Day — November 3](https://www.washingtoncountyar.gov/government/departments-a-e/election-commission/november-3-2026-general-election-information) | 63/100 | Ready for review |
| 2026-11-04 | 16:00 | [Tentative: Urban Forestry Advisory Board](https://www.fayetteville-ar.gov/m/calendar/event/detail/12175) | 63/100 | date |
| 2026-11-05 | 17:30 | [Tentative: City Council Meeting](https://www.fayetteville-ar.gov/m/calendar/event/detail/12478) | 63/100 | date |
| 2026-11-09 | 17:30 | [Tentative: Planning Commission Meeting](https://www.fayetteville-ar.gov/m/calendar/event/detail/12010) | 63/100 | date |
| 2026-11-10 | 16:30 | [Tentative: City Council Agenda Session](https://www.fayetteville-ar.gov/m/calendar/event/detail/12011) | 63/100 | date |
| 2026-11-10 | 17:30 | [Tentative: Water, Sewer & Solid Waste Committee (Immediately Following City Council Agenda Session)](https://www.fayetteville-ar.gov/m/calendar/event/detail/12012) | 50/100 | date, time |
| 2026-11-10 | 18:00 | [Tentative: Food Commission](https://www.fayetteville-ar.gov/m/calendar/event/detail/12216) | 63/100 | date |
| 2026-11-11 | All day | [Veteran's Day](https://www.fayetteville-ar.gov/m/calendar/event/detail/11290) | 63/100 | Ready for review |
| 2026-11-12 | 17:30 | [Tentative: Historic District Commission](https://www.fayetteville-ar.gov/m/calendar/event/detail/12013) | 63/100 | date |
| 2026-11-12 | 18:00 | [Tentative: Fayetteville Youth Advisory Council](https://www.fayetteville-ar.gov/m/calendar/event/detail/12009) | 63/100 | date |
| 2026-11-13 | 13:00 | [Tentative: Audit Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12014) | 63/100 | date |
| 2026-11-16 | 14:00 | [Tentative: Advertising and Promotion Commission](https://www.fayetteville-ar.gov/m/calendar/event/detail/12015) | 50/100 | date, venue |
| 2026-11-16 | 16:00 | [Tentative: Friends of YRCC](https://www.fayetteville-ar.gov/m/calendar/event/detail/12016) | 50/100 | date |
| 2026-11-16 | 17:30 | [Tentative: Environmental Action Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12017) | 63/100 | date |
| 2026-11-17 | 17:30 | [Tentative: City Council Meeting](https://www.fayetteville-ar.gov/m/calendar/event/detail/12475) | 63/100 | date |
| 2026-11-18 | 09:00 | [Tentative: Technical Plat Review Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12018) | 63/100 | date |
| 2026-11-18 | 17:00 | [Tentative: Washington County Regional Ambulance Authority Executive Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12181) | 50/100 | date, venue |
| 2026-11-18 | 18:00 | [Tentative: Fayetteville Arts Council](https://www.fayetteville-ar.gov/m/calendar/event/detail/12177) | 63/100 | date |
| 2026-11-19 | 10:30 | [Tentative: TAC Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12482) | 38/100 | address, date, venue |
| 2026-11-19 | 14:00 | [Tentative: Airport Board](https://www.fayetteville-ar.gov/m/calendar/event/detail/12178) | 50/100 | date, venue |
| 2026-11-19 | 16:30 | [Tentative: Planning Commission Agenda Session and Tour](https://www.fayetteville-ar.gov/m/calendar/event/detail/12179) | 63/100 | date |
| 2026-11-19 | 17:00 | [Tentative: Housing Authority Board Of Commissioners](https://www.fayetteville-ar.gov/m/calendar/event/detail/12180) | 38/100 | address, date, venue |
| 2026-11-19 | 17:00 | [Tentative: Long Range Planning (Immediately Following Planning Commission Agenda Session)](https://www.fayetteville-ar.gov/m/calendar/event/detail/12182) | 50/100 | date, time |
| 2026-11-19 | 18:00 | [Tentative: Fayetteville Youth Advisory Council](https://www.fayetteville-ar.gov/m/calendar/event/detail/12183) | 63/100 | date |
| 2026-11-19 | 18:30 | [Tentative: Black Heritage Preservation Commission](https://www.fayetteville-ar.gov/m/calendar/event/detail/12184) | 50/100 | date, venue |
| 2026-11-23 | 17:30 | [Tentative: Planning Commission Meeting](https://www.fayetteville-ar.gov/m/calendar/event/detail/12185) | 63/100 | date |
| 2026-11-24 | 16:30 | [Tentative: City Council Agenda Session](https://www.fayetteville-ar.gov/m/calendar/event/detail/12186) | 63/100 | date |
| 2026-11-24 | 17:30 | [Tentative: Transportation Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12187) | 63/100 | date |
| 2026-11-26 | All day | [Thanksgiving Day](https://www.fayetteville-ar.gov/m/calendar/event/detail/11291) | 63/100 | Ready for review |
| 2026-11-27 | All day | [Thanksgiving Day (Observed)](https://www.fayetteville-ar.gov/m/calendar/event/detail/11292) | 63/100 | Ready for review |
| 2026-12-01 | 17:30 | [Tentative: City Council Meeting](https://www.fayetteville-ar.gov/m/calendar/event/detail/12479) | 63/100 | date |
| 2026-12-02 | 13:30 | [Tentative: RPC / Policy Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12189) | 38/100 | address, date, venue |
| 2026-12-02 | 16:00 | [Tentative: Urban Forestry Advisory Board](https://www.fayetteville-ar.gov/m/calendar/event/detail/12190) | 63/100 | date |
| 2026-12-03 | 17:00 | [Washington County Planning Board & Zoning Board of Adjustment](https://www.washingtoncountyar.gov/government/departments-f-z/planning/meetings) | 88/100 | Ready for review |
| 2026-12-03 | 18:00 | [Tentative: Fayetteville Youth Advisory Council](https://www.fayetteville-ar.gov/m/calendar/event/detail/12191) | 63/100 | date |
| 2026-12-07 | 15:45 | [Tentative: Board Of Adjustments](https://www.fayetteville-ar.gov/m/calendar/event/detail/12192) | 63/100 | date |
| 2026-12-07 | 17:30 | [Tentative: Parks and Recreation Advisory Board](https://www.fayetteville-ar.gov/m/calendar/event/detail/12193) | 63/100 | date |
| 2026-12-08 | 16:30 | [Tentative: City Council Agenda Session](https://www.fayetteville-ar.gov/m/calendar/event/detail/12194) | 63/100 | date |
| 2026-12-08 | 17:30 | [Tentative: Water, Sewer & Solid Waste Committee (Immediately Following City Council Agenda Session)](https://www.fayetteville-ar.gov/m/calendar/event/detail/12195) | 50/100 | date, time |
| 2026-12-08 | 18:00 | [Tentative: Food Commission](https://www.fayetteville-ar.gov/m/calendar/event/detail/12217) | 63/100 | date |
| 2026-12-09 | 17:30 | [Tentative: Active Transportation Advisory Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12196) | 63/100 | date |
| 2026-12-10 | 16:30 | [Tentative: Planning Commission Agenda Session and Tour](https://www.fayetteville-ar.gov/m/calendar/event/detail/12197) | 63/100 | date |
| 2026-12-10 | 17:30 | [Tentative: Historic District Commission](https://www.fayetteville-ar.gov/m/calendar/event/detail/12198) | 63/100 | date |
| 2026-12-14 | 14:00 | [Tentative: Advertising and Promotion Commission](https://www.fayetteville-ar.gov/m/calendar/event/detail/12199) | 50/100 | date, venue |
| 2026-12-14 | 17:30 | [Tentative: Planning Commission Meeting](https://www.fayetteville-ar.gov/m/calendar/event/detail/12200) | 63/100 | date |
| 2026-12-15 | 17:30 | [Tentative: City Council Meeting](https://www.fayetteville-ar.gov/m/calendar/event/detail/12476) | 63/100 | date |
| 2026-12-16 | 09:00 | [Tentative: Technical Plat Review Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12201) | 63/100 | date |
| 2026-12-16 | 17:00 | [Tentative: Washington County Regional Ambulance Authority Executive Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12206) | 50/100 | date, venue |
| 2026-12-16 | 18:00 | [Tentative: Fayetteville Arts Council](https://www.fayetteville-ar.gov/m/calendar/event/detail/12203) | 63/100 | date |
| 2026-12-17 | 10:30 | [Tentative: TAC Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12483) | 38/100 | address, date, venue |
| 2026-12-17 | 14:00 | [Tentative: Airport Board](https://www.fayetteville-ar.gov/m/calendar/event/detail/12204) | 50/100 | date, venue |
| 2026-12-17 | 17:00 | [Tentative: Housing Authority Board Of Commissioners](https://www.fayetteville-ar.gov/m/calendar/event/detail/12205) | 38/100 | address, date, venue |
| 2026-12-17 | 18:30 | [Tentative: Black Heritage Preservation Commission](https://www.fayetteville-ar.gov/m/calendar/event/detail/12207) | 63/100 | date |
| 2026-12-21 | 16:00 | [Tentative: Fayetteville Public Library Board Of Trustees](https://www.fayetteville-ar.gov/m/calendar/event/detail/12212) | 50/100 | date |
| 2026-12-21 | 16:00 | [Tentative: Friends of YRCC](https://www.fayetteville-ar.gov/m/calendar/event/detail/12213) | 50/100 | date |
| 2026-12-21 | 17:30 | [Tentative: Environmental Action Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12211) | 63/100 | date |
| 2026-12-24 | All day | [Christmas Eve](https://www.fayetteville-ar.gov/m/calendar/event/detail/11293) | 63/100 | Ready for review |
| 2026-12-25 | All day | [Christmas Day](https://www.fayetteville-ar.gov/m/calendar/event/detail/11294) | 63/100 | Ready for review |
| 2026-12-29 | 16:30 | [Tentative: City Council Agenda Session](https://www.fayetteville-ar.gov/m/calendar/event/detail/12209) | 63/100 | date |
| 2026-12-29 | 17:30 | [Tentative: Transportation Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12208) | 63/100 | date |
| 2026-12-30 | 09:00 | [Tentative: Technical Plat Review Committee](https://www.fayetteville-ar.gov/m/calendar/event/detail/12210) | 63/100 | date |
| 2026-12-31 | 18:00 | [Tentative: Fayetteville Youth Advisory Council](https://www.fayetteville-ar.gov/m/calendar/event/detail/12057) | 63/100 | date |

The precise current workflow and future regional test contract are documented in [CRAWL_PROCESS.md](../CRAWL_PROCESS.md).
