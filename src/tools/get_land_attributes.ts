import { resolveToPoint } from "../lib/resolve.js";
import { parseJibun } from "../lib/jimok.js";
import { getFeatures, VWorldError } from "../lib/vworld.js";
import { DISCLAIMER } from "../lib/disclaimer.js";

export const getLandAttributesTool = async ({ query }: { query: string }) => {
  const resolved = await resolveToPoint(query);
  const parsed = parseJibun(resolved.jibun);

  let buildings_present: boolean | null = null;
  let building_count: number | null = null;
  let building_sample: Record<string, string | number | null>[] = [];
  let building_layer_error: string | null = null;
  try {
    const feats = await getFeatures({
      layer: "LT_C_BLDGINFO",
      point: resolved.point_wgs84,
      size: 10,
    });
    buildings_present = feats.length > 0;
    building_count = feats.length;
    building_sample = feats.slice(0, 3).map((f) => f.properties);
  } catch (e) {
    building_layer_error = e instanceof VWorldError ? `${e.code}: ${e.message}` : String(e);
  }

  const result = {
    query,
    pnu: resolved.pnu,
    jibun_raw: resolved.jibun,
    jibun_number: parsed.number_part,
    jimok_code: parsed.jimok_code,
    jimok: parsed.jimok_full_name,
    is_mountain_register: parsed.is_mountain,
    address: resolved.address,
    point_wgs84: resolved.point_wgs84,
    land_price_won_per_m2: resolved.land_price_won_per_m2,
    land_price_gosi_date: resolved.land_price_gosi_date,
    administrative: resolved.administrative,
    buildings: {
      present: buildings_present,
      count: building_count,
      sample: building_sample,
      layer_error: building_layer_error,
    },
    source: {
      resolved_at: new Date().toISOString(),
      parcel_layer: "vworld LP_PA_CBND_BUBUN",
      building_layer: "vworld LT_C_BLDGINFO",
    },
    note:
      "지목 is derived from jibun suffix (e.g. '680장' → 공장용지). 면적(land area) is NOT in this response — V-World's LP_PA_CBND_BUBUN provides no area field and 토지대장 (cadastral register) is a separate API not covered here. For official 면적, cross-check with 건축물대장 PDF or 정부24 토지대장.",
    disclaimer: DISCLAIMER,
  };

  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
};
