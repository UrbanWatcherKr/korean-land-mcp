import { resolveToPoint } from "../lib/resolve.js";
import { queryOverlays, LayerDef, OverlayHit } from "../lib/overlays.js";
import { DISCLAIMER } from "../lib/disclaimer.js";

const USE_ZONE_LAYERS: LayerDef[] = [
  { id: "LT_C_UQ111", label: "도시지역" },
  { id: "LT_C_UQ112", label: "관리지역" },
  { id: "LT_C_UQ113", label: "농림지역" },
  { id: "LT_C_UQ114", label: "자연환경보전지역" },
];

const USE_DISTRICT_LAYERS: LayerDef[] = [
  { id: "LT_C_UQ121", label: "경관지구" },
  { id: "LT_C_UQ123", label: "고도지구" },
  { id: "LT_C_UQ124", label: "방화지구" },
  { id: "LT_C_UQ125", label: "방재지구" },
  { id: "LT_C_UQ126", label: "보호지구" },
  { id: "LT_C_UQ128", label: "취락지구" },
  { id: "LT_C_UQ129", label: "개발진흥지구" },
  { id: "LT_C_UQ130", label: "특정용도제한지구" },
];

const USE_AREA_LAYERS: LayerDef[] = [
  { id: "LT_C_UD801", label: "개발제한구역" },
  { id: "LT_C_UQ162", label: "도시자연공원구역" },
];

const EXTRA_OVERLAYS: LayerDef[] = [
  { id: "LT_C_UQ141", label: "토지거래허가구역" },
];

export const getZoningTool = async ({ query }: { query: string }) => {
  const resolved = await resolveToPoint(query);
  const point = resolved.point_wgs84;

  const [zoneQ, districtQ, areaQ, extraQ] = await Promise.all([
    queryOverlays(USE_ZONE_LAYERS, point),
    queryOverlays(USE_DISTRICT_LAYERS, point),
    queryOverlays(USE_AREA_LAYERS, point),
    queryOverlays(EXTRA_OVERLAYS, point),
  ]);

  const collect = (hits: OverlayHit[]) =>
    hits.map((h) => ({
      layer: h.layer,
      layer_label: h.layer_label,
      zone_name: h.name,
      designation_year: h.designation_year,
      designation_number: h.designation_number,
      sido: h.sido,
      sigg: h.sigg,
    }));

  const allErrors = [...zoneQ.errors, ...districtQ.errors, ...areaQ.errors, ...extraQ.errors];
  const result = {
    query,
    pnu: resolved.pnu,
    point_wgs84: point,
    use_zone: collect(zoneQ.hits),
    use_district: collect(districtQ.hits),
    use_area: collect(areaQ.hits),
    land_transaction_permit: collect(extraQ.hits),
    source: {
      resolved_at: new Date().toISOString(),
      use_zone_layers: USE_ZONE_LAYERS.map((l) => l.id),
      use_district_layers: USE_DISTRICT_LAYERS.map((l) => l.id),
      use_area_layers: USE_AREA_LAYERS.map((l) => l.id),
      extra_layers: EXTRA_OVERLAYS.map((l) => l.id),
    },
    layer_errors: allErrors.length > 0 ? allErrors : undefined,
    note:
      "Empty array = no overlay at this point (not an error). Exactly one use_zone should be populated (도시/관리/농림/자연환경보전). For 건폐율/용적률 limits, look up 시·군 도시계획조례 via korean-law MCP using the returned zone_name.",
    disclaimer: DISCLAIMER,
  };

  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
};
