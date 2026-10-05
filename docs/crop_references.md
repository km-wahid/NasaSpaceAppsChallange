# Bangladesh starter reference dataset v1

Source verification: 2026-10-04. This is a limited, source-checked screening baseline, **not independent agronomist review or a farm-specific prescription**. The imported workbook remains unverified for prices, soil effects and crop requirements and does not supply these engine values.

The seed is `app/database/seeders/bangladesh_crop_seeder.ts`; the versioned records and per-field citations live in `app/database/reference_data/bangladesh_crops.ts`. Sources and field provenance are saved in PostgreSQL and copied into each recommendation snapshot.

| Crop | Establishment window | Duration reference | Water reference | Soil opportunity |
|---|---|---|---|---|
| Aman rice | July, month-level BAMIS baseline | FAO indicative 90–150 days; midpoint 120 | FAO 450–700 mm ET; midpoint 575 | Quantified effect unknown |
| Lentil | November, month-level Bogura BAMIS baseline | BAMIS 119 days | Unknown | Potential nitrogen-fixing legume |
| Rape & Mustard | November, month-level Dhaka BAMIS baseline | BAMIS 80–100 days; midpoint 90 | Unknown | Quantified effect unknown |
| Wheat | November 15–30, national BAMIS practices | FAO indicative 120–150 days; midpoint 135 | FAO 450–650 mm ET; midpoint 550 | Quantified effect unknown |
| Mug (mung bean) | April, month-level Bogura BAMIS baseline | BAMIS 65–70 days; rounded midpoint 68 | Unknown | Potential nitrogen-fixing legume |

Windows normalized from calendar months are planning approximations, **not officially stated optimal sowing deadlines**. For example, BAMIS national advisories also favor mid-October to mid-November mustard sowing; the Dhaka calendar depicts later November establishment. The screening window is not proof that late planting is suitable for another region. Aman uses the FAO generic duration range rather than the Bogura calendar's 133-day cultivar-specific cycle. Confirm actual variety duration and nursery versus field occupancy before planting. Ten land-preparation days are a configurable planning allowance, not a measured local turnaround.

Sources:

- [BAMIS Aman calendar, Bogura](https://www.bamis.gov.bd/res/public/calendars/2019/08/04/4336.pdf)
- [BAMIS lentil calendar, Bogura](https://www.bamis.gov.bd/res/public/calendars/2019/11/07/8367.pdf)
- [BAMIS mustard calendar, Dhaka](https://www.bamis.gov.bd/res/public/calendars/2019/12/30/10981.pdf)
- [BAMIS mung calendar, Bogura](https://www.bamis.gov.bd/res/public/calendars/2019/12/30/10927.pdf)
- [BAMIS national wheat practices](https://www.bamis.gov.bd/en/croppnp/1/all/9/)
- [FAO crop water needs, tables 4–5](https://www.fao.org/4/s2022e/s2022e02.htm)
- [FAO Ecocrop rice data sheet](https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=1574)
- [FAO pulses and soils](https://www.fao.org/newsroom/story/Pulses-and-soils-a-dynamic-duo/en)

## Missing values and scoring policy

No market price, production cost, yield forecast or fabricated profitability records are seeded. If any candidate lacks a valid economic reference, the **entire search** receives economic component 50, so incomplete economic coverage cannot favor one crop. Total profit is unknown if any crop's profit or farm size is unknown. Income-heavy priorities cannot discriminate among these starter plans; the UI warns about that limitation.

Unknown water need is null, scores 50, skips the water coverage check and makes total rotation demand unknown. Known ET references exclude gross irrigation losses; paddy also requires land-preparation and seepage water. No annual rainfall value is repurposed as seasonal rainfall. Unknown temperature/rainfall components score 50 and do not imply suitability. Unknown pH and nutrient thresholds are not enforced. Unknown hazard tolerances receive neutral components, not claimed resilience.

Legumes receive **+20 soil-effect policy points** (normalized crop-effect score 60); this is a transparent qualitative opportunity mapping, not a published measurement. Other crops' quantified effects are unknown (neutral component 50). No nitrogen credit in kg/ha, fertilizer substitution, or crop-to-crop bonus is invented. Undocumented transitions retain neutral compatibility with warnings. Residue retention, rhizobia, nutrients, grain export and local management determine actual benefits.

Only five of the 72 workbook crop names are initially covered. Boro rice, potato and jute matter locally but are not included until suitable calendars and missing requirements are curated. Do not claim this list covers all crops or districts. Soil nutrient cut-offs still require a reviewed lab-method/unit-specific source; farmers can use the priorities-only planner without a soil test.

## Running safely

After a first workbook import, restart the app to seed references. Existing installations should rebuild the app; startup applies the forward migration and seed automatically. Do not rerun the destructive workbook import to fix missing references. Seeder reruns preserve curated values and create no duplicate calendars. Snapshot provenance makes past plans inspectable even when references later change.
# Demo preview

When no calculated rotations are available, the dashboard displays three frontend-only dummy plans. Crops, dates, water labels and soil notes are illustrative, not derived from NASA observations, farm inputs or verified agronomic calendars. They are never stored as recommendations and cannot be applied to a farm. Downloaded previews are also labeled demo only. Actual backend results replace the preview when generation succeeds.
