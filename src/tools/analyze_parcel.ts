import { resolveToParcel } from "../lib/resolve.js";
import { parseJibun } from "../lib/jimok.js";
import { queryOverlays, LayerDef } from "../lib/overlays.js";
import { getFeatures, VWorldError } from "../lib/vworld.js";
import { DISCLAIMER } from "../lib/disclaimer.js";

const USE_ZONE: LayerDef[] = [
  { id: "LT_C_UQ111", label: "도시지역" },
  { id: "LT_C_UQ112", label: "관리지역" },
  { id: "LT_C_UQ113", label: "농림지역" },
  { id: "LT_C_UQ114", label: "자연환경보전지역" },
];

const USE_DISTRICT: LayerDef[] = [
  { id: "LT_C_UQ121", label: "경관지구" },
  { id: "LT_C_UQ123", label: "고도지구" },
  { id: "LT_C_UQ124", label: "방화지구" },
  { id: "LT_C_UQ125", label: "방재지구" },
  { id: "LT_C_UQ126", label: "보호지구" },
  { id: "LT_C_UQ128", label: "취락지구" },
  { id: "LT_C_UQ129", label: "개발진흥지구" },
  { id: "LT_C_UQ130", label: "특정용도제한지구" },
];

const USE_AREA: LayerDef[] = [
  { id: "LT_C_UD801", label: "개발제한구역" },
  { id: "LT_C_UQ162", label: "도시자연공원구역" },
];

const DISTRICT_PLAN: LayerDef[] = [
  { id: "LT_C_UPISUQ161", label: "지구단위계획구역" },
  { id: "LT_C_UPISUQ171", label: "개발행위허가제한지역" },
];

const URBAN_FAC: LayerDef[] = [
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

interface LawLayerDef extends LayerDef {
  category: string;
  governing_law?: string;
  triggers_priority_delegation?: boolean;
}

const OTHER_LAW: LawLayerDef[] = [
  { id: "LT_C_AGRIXUE101", label: "농업진흥지역", category: "농지", governing_law: "농지법 제32조", triggers_priority_delegation: true },
  { id: "LT_C_AGRIXUE102", label: "영농여건불리농지", category: "농지", governing_law: "농지법" },
  { id: "LT_C_UF151", label: "산림보호구역", category: "산림", governing_law: "산림보호법", triggers_priority_delegation: true },
  { id: "LT_C_UF602", label: "임업·산촌진흥권역", category: "산림", governing_law: "임업진흥법" },
  { id: "LT_C_UF901", label: "백두대간보호지역", category: "산림", governing_law: "백두대간법", triggers_priority_delegation: true },
  { id: "LT_C_WGISIEGUG", label: "국가산업단지", category: "산업단지", governing_law: "산업입지법 제12조", triggers_priority_delegation: true },
  { id: "LT_C_WGISIENONG", label: "농공단지", category: "산업단지", governing_law: "산업입지법", triggers_priority_delegation: true },
  { id: "LT_C_WGISIEILBAN", label: "일반산업단지", category: "산업단지", governing_law: "산업입지법", triggers_priority_delegation: true },
  { id: "LT_C_WGISIEDOSI", label: "첨단산업단지", category: "산업단지", governing_law: "산업입지법", triggers_priority_delegation: true },
  { id: "LT_C_DAMDAN", label: "산업단지 경계", category: "산업단지", governing_law: "산업입지법" },
  { id: "LT_C_DAMYOD", label: "산업단지 단지용도지역", category: "산업단지", governing_law: "산업입지법" },
  { id: "LT_C_DAMYOJ", label: "산업단지 단지시설용지", category: "산업단지", governing_law: "산업입지법" },
  { id: "LT_C_DAMYUCH", label: "산업단지 유치업종", category: "산업단지", governing_law: "산업입지법" },
  { id: "LT_C_UM710", label: "상수원보호구역", category: "수질·환경", governing_law: "수도법", triggers_priority_delegation: true },
  { id: "LT_C_UM901", label: "습지보호지역", category: "수질·환경", governing_law: "습지보전법" },
  { id: "LT_C_UM301", label: "대기환경규제지역", category: "수질·환경", governing_law: "대기환경보전법" },
  { id: "LT_C_UM221", label: "야생동식물보호구역", category: "수질·환경", governing_law: "야생생물법" },
  { id: "LT_C_WGISARWET", label: "연안습지보호구역", category: "수질·환경", governing_law: "습지보전법" },
  { id: "LT_C_UM000", label: "가축사육제한구역", category: "축산", governing_law: "가축분뇨법 제8조" },
  { id: "LT_C_UO301", label: "국가유산보호구역", category: "문화재", governing_law: "국가유산법 / 자연유산법", triggers_priority_delegation: true },
  { id: "LT_C_UO501", label: "전통사찰보존지", category: "문화재", governing_law: "전통사찰법" },
  { id: "LT_C_WGISNPGUG", label: "국립공원", category: "자연공원", governing_law: "자연공원법", triggers_priority_delegation: true },
  { id: "LT_C_WGISNPGUN", label: "군립공원", category: "자연공원", governing_law: "자연공원법", triggers_priority_delegation: true },
  { id: "LT_C_WGISNPDO", label: "도립공원", category: "자연공원", governing_law: "자연공원법", triggers_priority_delegation: true },
  { id: "LT_C_UO101", label: "교육환경보호구역", category: "특수지구", governing_law: "교육환경법" },
  { id: "LT_C_UO601", label: "관광지·관광단지", category: "특수지구", governing_law: "관광진흥법" },
  { id: "LT_C_UJ401", label: "온천지구", category: "특수지구", governing_law: "온천법" },
  { id: "LT_C_UH501", label: "유통단지", category: "특수지구", governing_law: "유통산업발전법" },
  { id: "LT_C_UH402", label: "자유무역지역", category: "특수지구", governing_law: "자유무역지역법" },
  { id: "LT_C_UH701", label: "벤처기업육성지역", category: "특수지구", governing_law: "벤처기업법" },
  { id: "LT_C_UB901", label: "시장정비구역", category: "특수지구", governing_law: "재래시장법" },
  { id: "LT_C_UD601", label: "주거환경개선지구", category: "주거정비", governing_law: "도시정비법" },
  { id: "LT_C_UD610", label: "국민임대주택단지", category: "주거정비", governing_law: "주택법" },
  { id: "LT_C_UD620", label: "보금자리주택지구", category: "주거정비", governing_law: "보금자리주택법" },
  { id: "LT_C_UP201", label: "재해위험지구", category: "재해", governing_law: "자연재해대책법" },
  { id: "LT_C_UP401", label: "급경사재해예방지역", category: "재해", governing_law: "급경사지법" },
  { id: "LT_C_TFISMPA", label: "해양보호구역", category: "해양", governing_law: "해양생태계법", triggers_priority_delegation: true },
  { id: "LT_C_WGISREPLAN", label: "공유수면매립기본계획", category: "해양", governing_law: "공유수면법" },
  { id: "LT_C_WGISRECOMP", label: "공유수면매립준공", category: "해양", governing_law: "공유수면법" },
  { id: "LT_C_AISPRHC", label: "비행금지구역", category: "항공", governing_law: "항공안전법" },
  { id: "LT_C_AISALTC", label: "경계구역", category: "항공", governing_law: "항공안전법" },
  { id: "LT_C_AISMOAC", label: "군작전구역", category: "항공", governing_law: "군용항공기법" },
];

const EXTRA: LayerDef[] = [{ id: "LT_C_UQ141", label: "토지거래허가구역" }];

export const analyzeParcelTool = async ({ query }: { query: string }) => {
  const resolved = await resolveToParcel(query);
  const point = resolved.point_wgs84;
  const parsed = parseJibun(resolved.jibun);

  const wkt = resolved.parcel_wkt;
  const precision: "polygon" | "point" = wkt ? "polygon" : "point";
  const overlayOpts = wkt ? { geomFilter: wkt } : {};

  const [zoneQ, districtQ, areaQ, extraQ, planQ, facQ, lawQ, bldFeats] = await Promise.all([
    queryOverlays(USE_ZONE, point, overlayOpts),
    queryOverlays(USE_DISTRICT, point, overlayOpts),
    queryOverlays(USE_AREA, point, overlayOpts),
    queryOverlays(EXTRA, point, overlayOpts),
    queryOverlays(DISTRICT_PLAN, point, overlayOpts),
    queryOverlays(URBAN_FAC, point, overlayOpts),
    queryOverlays(OTHER_LAW, point, overlayOpts),
    getFeatures(
      wkt
        ? { layer: "LT_C_BLDGINFO", geomFilter: wkt, size: 10 }
        : { layer: "LT_C_BLDGINFO", point, size: 5 }
    ).catch((e) => {
      if (e instanceof VWorldError) return [];
      throw e;
    }),
  ]);

  const byLawLayer = new Map(OTHER_LAW.map((l) => [l.id, l]));
  const lawDesignations = lawQ.hits.map((h) => {
    const def = byLawLayer.get(h.layer);
    return {
      category: def?.category,
      name: h.name,
      governing_law: def?.governing_law,
      triggers_priority_delegation: def?.triggers_priority_delegation,
      designation_year: h.designation_year,
      designation_number: h.designation_number,
    };
  });
  const priorityHits = lawDesignations.filter((d) => d.triggers_priority_delegation);

  const priorityDelegation = priorityHits.length > 0
    ? {
        applies: true,
        rationale:
          "국토계획법 제76조⑤에 따라 다음 개별 법령이 국토계획법 시행령 별표보다 우선 적용됩니다.",
        candidates: priorityHits.map((h) => ({ name: h.name, governing_law: h.governing_law })),
      }
    : { applies: false };

  const nextSteps: string[] = [];
  const zone = zoneQ.hits[0];
  if (zone) {
    nextSteps.push(
      `[korean-law MCP] '${zone.name}'의 건폐율·용적률 조문 조회: 국토계획법 시행령 제84조·85조 + ${resolved.administrative.sigg ?? "해당 시·군"} 도시계획조례.`
    );
  }
  if (planQ.hits.some((h) => h.layer === "LT_C_UPISUQ161")) {
    nextSteps.push(
      "[외부] 지구단위계획구역이 포함됨 — 지자체 고시문 원문 확보 필수 (건폐율·용적률·용도 덮어쓰기 가능)."
    );
  }
  if (priorityHits.length > 0) {
    nextSteps.push(
      `[korean-law MCP] 국계법 76조⑤ 우선위임: ${priorityHits.map((h) => h.governing_law).join(", ")} 행위제한 조항 조회 — 국토계획법 시행령 별표보다 먼저 적용.`
    );
  }
  if (facQ.hits.length > 0) {
    nextSteps.push(
      "[전문가] 도시계획시설 저촉 — 정확한 저촉 면적은 측량·건축사 확인 필요 (국계법 제64조)."
    );
  }

  const result = {
    query,
    parcel: {
      pnu: resolved.pnu,
      jibun: resolved.jibun,
      jimok_code: parsed.jimok_code,
      jimok: parsed.jimok_full_name,
      is_mountain_register: parsed.is_mountain,
      address: resolved.address,
      point_wgs84: point,
      land_price_won_per_m2: resolved.land_price_won_per_m2,
      land_price_gosi_date: resolved.land_price_gosi_date,
      administrative: resolved.administrative,
    },
    zoning: {
      use_zone: zoneQ.hits.map((h) => ({ layer: h.layer, name: h.name, dyear: h.designation_year, dnum: h.designation_number })),
      use_district: districtQ.hits.map((h) => ({ layer: h.layer, name: h.name })),
      use_area: areaQ.hits.map((h) => ({ layer: h.layer, name: h.name })),
      land_transaction_permit: extraQ.hits.map((h) => ({ layer: h.layer, name: h.name, dyear: h.designation_year, dnum: h.designation_number })),
    },
    district_plan: planQ.hits.map((h) => ({ layer: h.layer, layer_label: byLabel(h.layer), name: h.name })),
    urban_facility: facQ.hits.map((h) => ({ layer: h.layer, category: h.layer_label, name: h.name })),
    other_law_designations: lawDesignations,
    priority_delegation_hint: priorityDelegation,
    buildings: { present: bldFeats.length > 0, count: bldFeats.length },
    next_steps: nextSteps,
    layer_errors: [
      ...zoneQ.errors,
      ...districtQ.errors,
      ...areaQ.errors,
      ...extraQ.errors,
      ...planQ.errors,
      ...facQ.errors,
      ...lawQ.errors,
    ],
    source: {
      resolved_at: new Date().toISOString(),
      total_layers_queried:
        USE_ZONE.length + USE_DISTRICT.length + USE_AREA.length + EXTRA.length + DISTRICT_PLAN.length + URBAN_FAC.length + OTHER_LAW.length + 1,
      precision,
      precision_note:
        precision === "polygon"
          ? "Overlays were filtered by parcel polygon (WKT) — 필지 경계와 교차하는 레이어만 반환."
          : "Polygon unavailable (parcel geometry missing); fell back to point-based lookup — 경계에 걸친 overlay는 누락 가능.",
    },
    disclaimer: DISCLAIMER,
  };

  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
};

function byLabel(layerId: string): string {
  const all = [...DISTRICT_PLAN, ...URBAN_FAC, ...OTHER_LAW, ...USE_ZONE, ...USE_DISTRICT, ...USE_AREA, ...EXTRA];
  return all.find((l) => l.id === layerId)?.label ?? layerId;
}
