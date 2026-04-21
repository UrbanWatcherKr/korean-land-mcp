import { resolveToPoint } from "../lib/resolve.js";
import { queryOverlays, LayerDef } from "../lib/overlays.js";
import { DISCLAIMER } from "../lib/disclaimer.js";

const LAYERS: LayerDef[] = [
  { id: "LT_C_UPISUQ151", label: "도로" },
  { id: "LT_C_UPISUQ152", label: "교통시설" },
  { id: "LT_C_UPISUQ153", label: "공간시설" },
  { id: "LT_C_UPISUQ154", label: "유통공급시설" },
  { id: "LT_C_UPISUQ155", label: "공공문화체육시설" },
  { id: "LT_C_UPISUQ156", label: "방재시설" },
  { id: "LT_C_UPISUQ157", label: "보건위생시설" },
  { id: "LT_C_UPISUQ158", label: "환경기초시설" },
  { id: "LT_C_UPISUQ159", label: "기타기반시설" },
];

export const getUrbanFacilityTool = async ({
  query,
  radius_m,
}: {
  query: string;
  radius_m?: number;
}) => {
  const resolved = await resolveToPoint(query);
  const effectiveRadius = typeof radius_m === "number" ? radius_m : 50;

  const [overlapQ, proximityQ] = await Promise.all([
    queryOverlays(LAYERS, resolved.point_wgs84, { perLayerSize: 10, radius_m: 0 }),
    effectiveRadius > 0
      ? queryOverlays(LAYERS, resolved.point_wgs84, { perLayerSize: 10, radius_m: effectiveRadius })
      : Promise.resolve({ hits: [], errors: [] }),
  ]);

  const overlapIds = new Set(overlapQ.hits.map((h) => `${h.layer}:${h.name}:${h.properties?.present_sn ?? ""}`));
  const nearbyOnly = proximityQ.hits.filter(
    (h) => !overlapIds.has(`${h.layer}:${h.name}:${h.properties?.present_sn ?? ""}`)
  );

  const shape = (h: typeof overlapQ.hits[number], relation: "overlap" | "nearby") => ({
    relation,
    layer: h.layer,
    category: h.layer_label,
    facility_name: h.name,
    grade: h.properties?.grad_se ?? undefined,
    facility_number: h.properties?.road_no ?? undefined,
    execution_status: h.properties?.exc_nam ?? undefined,
    designation_year: h.designation_year,
    designation_number: h.designation_number,
    sido: h.sido,
    sigg: h.sigg,
  });

  const overlays = [
    ...overlapQ.hits.map((h) => shape(h, "overlap")),
    ...nearbyOnly.map((h) => shape(h, "nearby")),
  ];

  const result = {
    query,
    pnu: resolved.pnu,
    point_wgs84: resolved.point_wgs84,
    radius_m: effectiveRadius,
    overlap_count: overlapQ.hits.length,
    nearby_count: nearbyOnly.length,
    facilities: overlays,
    layer_errors: [...overlapQ.errors, ...proximityQ.errors],
    source: {
      resolved_at: new Date().toISOString(),
      layers: LAYERS.map((l) => l.id),
    },
    note:
      "relation='overlap' = 필지와 저촉 (점 기반 판정), 'nearby' = 반경 radius_m 이내 접함 후보. 정확한 저촉·접함 구분은 필지 폴리곤 교차로 재검증 필요 (국계법 제64조 저촉 vs 접함 구분은 인허가 영향 상이). radius_m=0을 넘기면 접함 후보는 비활성화.",
    disclaimer: DISCLAIMER,
  };

  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
};
