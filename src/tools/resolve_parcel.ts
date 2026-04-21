import { resolveToPoint } from "../lib/resolve.js";
import { parseJibun } from "../lib/jimok.js";
import { DISCLAIMER } from "../lib/disclaimer.js";

export const resolveParcelTool = async ({ query }: { query: string }) => {
  const r = await resolveToPoint(query);
  const parsed = parseJibun(r.jibun);
  const result = {
    pnu: r.pnu,
    jibun: r.jibun,
    jimok_code: parsed.jimok_code,
    jimok: parsed.jimok_full_name,
    is_mountain: parsed.is_mountain,
    address: r.address,
    point_wgs84: r.point_wgs84,
    land_price_won_per_m2: r.land_price_won_per_m2,
    land_price_gosi_date: r.land_price_gosi_date,
    administrative: r.administrative,
    source: {
      geocoder_layer: r.geocoder_layer,
      parcel_layer: "vworld LP_PA_CBND_BUBUN",
      resolved_at: new Date().toISOString(),
    },
    disclaimer: DISCLAIMER,
  };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
};
