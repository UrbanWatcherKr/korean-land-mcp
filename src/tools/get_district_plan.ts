import { resolveToPoint } from "../lib/resolve.js";
import { queryOverlays, LayerDef } from "../lib/overlays.js";
import { DISCLAIMER } from "../lib/disclaimer.js";

const LAYERS: LayerDef[] = [
  { id: "LT_C_UPISUQ161", label: "지구단위계획구역" },
  { id: "LT_C_UPISUQ171", label: "개발행위허가제한지역" },
];

export const getDistrictPlanTool = async ({ query }: { query: string }) => {
  const resolved = await resolveToPoint(query);
  const q = await queryOverlays(LAYERS, resolved.point_wgs84);

  const result = {
    query,
    pnu: resolved.pnu,
    point_wgs84: resolved.point_wgs84,
    district_plan: q.hits
      .filter((h) => h.layer === "LT_C_UPISUQ161")
      .map((h) => ({
        layer: h.layer,
        name: h.name,
        designation_year: h.designation_year,
        designation_number: h.designation_number,
        sido: h.sido,
        sigg: h.sigg,
        extra: h.properties,
      })),
    development_permit_restriction: q.hits
      .filter((h) => h.layer === "LT_C_UPISUQ171")
      .map((h) => ({
        layer: h.layer,
        name: h.name,
        designation_year: h.designation_year,
        designation_number: h.designation_number,
      })),
    layer_errors: q.errors.length > 0 ? q.errors : undefined,
    source: {
      resolved_at: new Date().toISOString(),
      layers: LAYERS.map((l) => l.id),
    },
    note:
      "When district_plan is non-empty, 건폐율/용적률 may be overridden by the 지구단위계획 (see 국토계획법 제52조). This tool returns the V-World geometric hit only — the actual plan text is NOT in V-World and must be fetched from the local 지자체 portal or 고시문.",
    disclaimer: DISCLAIMER,
  };

  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
};
