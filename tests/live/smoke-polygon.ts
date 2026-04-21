import "dotenv/config";
import { analyzeParcelTool } from "../../src/tools/analyze_parcel.js";
import { resolveToParcel } from "../../src/lib/resolve.js";

const query = process.argv[2] ?? "서울특별시 마포구 연남동 229-1";

async function main() {
  console.error(`[smoke] resolveToParcel: ${query}`);
  const rp = await resolveToParcel(query);
  console.error(
    `[smoke] parcel_wkt: ${rp.parcel_wkt ? rp.parcel_wkt.slice(0, 120) + "..." : "NULL (fallback to point)"}`
  );
  console.error(`[smoke] wkt length: ${rp.parcel_wkt?.length ?? 0} chars`);

  console.error(`[smoke] running analyzeParcelTool...`);
  const out = await analyzeParcelTool({ query });
  const parsed = JSON.parse(out.content[0].text);
  const compact = {
    precision: parsed.source?.precision,
    zone: parsed.zoning?.use_zone?.[0]?.name,
    land_transaction_permit_count: parsed.zoning?.land_transaction_permit?.length ?? 0,
    district_plan: parsed.district_plan?.map((d: { name: string }) => d.name) ?? [],
    other_law: parsed.other_law_designations?.map((d: { name: string; category: string }) => `${d.category}:${d.name}`) ?? [],
    urban_facility_count: parsed.urban_facility?.length ?? 0,
    priority_delegation_applies: parsed.priority_delegation_hint?.applies,
    buildings_present: parsed.buildings?.present,
    layer_error_count: parsed.layer_errors?.length ?? 0,
  };
  console.log(JSON.stringify(compact, null, 2));
}

main().catch((e) => {
  console.error("[smoke] FAIL:", e);
  process.exit(1);
});
