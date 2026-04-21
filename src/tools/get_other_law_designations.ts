import { resolveToPoint } from "../lib/resolve.js";
import { queryOverlays, LayerDef, OverlayHit } from "../lib/overlays.js";
import { DISCLAIMER } from "../lib/disclaimer.js";

interface CategorizedLayer extends LayerDef {
  category: string;
  governing_law?: string;
  triggers_priority_delegation?: boolean; // 국계법 제76조⑤ 우선위임 후보
}

const LAYERS: CategorizedLayer[] = [
  // 농지 — 국계법 76조⑤ 우선위임 후보 (농지법)
  { id: "LT_C_AGRIXUE101", label: "농업진흥지역", category: "농지", governing_law: "농지법 제32조", triggers_priority_delegation: true },
  { id: "LT_C_AGRIXUE102", label: "영농여건불리농지", category: "농지", governing_law: "농지법" },

  // 산지·산림
  { id: "LT_C_UF151", label: "산림보호구역", category: "산림", governing_law: "산림보호법", triggers_priority_delegation: true },
  { id: "LT_C_UF602", label: "임업·산촌진흥권역", category: "산림", governing_law: "임업진흥법" },
  { id: "LT_C_UF901", label: "백두대간보호지역", category: "산림", governing_law: "백두대간법", triggers_priority_delegation: true },

  // 산업단지 — 국계법 76조⑤ 우선위임 (산업입지법)
  { id: "LT_C_WGISIEGUG", label: "국가산업단지", category: "산업단지", governing_law: "산업입지법 제12조", triggers_priority_delegation: true },
  { id: "LT_C_WGISIENONG", label: "농공단지", category: "산업단지", governing_law: "산업입지법", triggers_priority_delegation: true },
  { id: "LT_C_WGISIEILBAN", label: "일반산업단지", category: "산업단지", governing_law: "산업입지법", triggers_priority_delegation: true },
  { id: "LT_C_WGISIEDOSI", label: "첨단산업단지", category: "산업단지", governing_law: "산업입지법", triggers_priority_delegation: true },
  { id: "LT_C_DAMDAN", label: "산업단지 경계", category: "산업단지", governing_law: "산업입지법" },
  { id: "LT_C_DAMYOD", label: "산업단지 단지용도지역", category: "산업단지", governing_law: "산업입지법" },
  { id: "LT_C_DAMYOJ", label: "산업단지 단지시설용지", category: "산업단지", governing_law: "산업입지법" },
  { id: "LT_C_DAMYUCH", label: "산업단지 유치업종", category: "산업단지", governing_law: "산업입지법" },

  // 수질·상수원·환경
  { id: "LT_C_UM710", label: "상수원보호구역", category: "수질·환경", governing_law: "수도법", triggers_priority_delegation: true },
  { id: "LT_C_UM901", label: "습지보호지역", category: "수질·환경", governing_law: "습지보전법" },
  { id: "LT_C_UM301", label: "대기환경규제지역", category: "수질·환경", governing_law: "대기환경보전법" },
  { id: "LT_C_UM221", label: "야생동식물보호구역", category: "수질·환경", governing_law: "야생생물법" },
  { id: "LT_C_WGISARWET", label: "연안습지보호구역", category: "수질·환경", governing_law: "습지보전법" },

  // 축산
  { id: "LT_C_UM000", label: "가축사육제한구역", category: "축산", governing_law: "가축분뇨법 제8조" },

  // 문화재·보존
  { id: "LT_C_UO301", label: "국가유산보호구역", category: "문화재", governing_law: "국가유산법 / 자연유산법", triggers_priority_delegation: true },
  { id: "LT_C_UO501", label: "전통사찰보존지", category: "문화재", governing_law: "전통사찰법" },

  // 자연공원
  { id: "LT_C_WGISNPGUG", label: "국립공원", category: "자연공원", governing_law: "자연공원법", triggers_priority_delegation: true },
  { id: "LT_C_WGISNPGUN", label: "군립공원", category: "자연공원", governing_law: "자연공원법", triggers_priority_delegation: true },
  { id: "LT_C_WGISNPDO", label: "도립공원", category: "자연공원", governing_law: "자연공원법", triggers_priority_delegation: true },

  // 특수지구
  { id: "LT_C_UO101", label: "교육환경보호구역", category: "특수지구", governing_law: "교육환경법" },
  { id: "LT_C_UO601", label: "관광지·관광단지", category: "특수지구", governing_law: "관광진흥법" },
  { id: "LT_C_UJ401", label: "온천지구", category: "특수지구", governing_law: "온천법" },
  { id: "LT_C_UH501", label: "유통단지", category: "특수지구", governing_law: "유통산업발전법" },
  { id: "LT_C_UH402", label: "자유무역지역", category: "특수지구", governing_law: "자유무역지역법" },
  { id: "LT_C_UH701", label: "벤처기업육성지역", category: "특수지구", governing_law: "벤처기업법" },
  { id: "LT_C_UB901", label: "시장정비구역", category: "특수지구", governing_law: "재래시장법" },

  // 주거정비
  { id: "LT_C_UD601", label: "주거환경개선지구", category: "주거정비", governing_law: "도시정비법" },
  { id: "LT_C_UD610", label: "국민임대주택단지", category: "주거정비", governing_law: "주택법" },
  { id: "LT_C_UD620", label: "보금자리주택지구", category: "주거정비", governing_law: "보금자리주택법" },

  // 재해
  { id: "LT_C_UP201", label: "재해위험지구", category: "재해", governing_law: "자연재해대책법" },
  { id: "LT_C_UP401", label: "급경사재해예방지역", category: "재해", governing_law: "급경사지법" },

  // 해양
  { id: "LT_C_TFISMPA", label: "해양보호구역", category: "해양", governing_law: "해양생태계법", triggers_priority_delegation: true },
  { id: "LT_C_WGISREPLAN", label: "공유수면매립기본계획", category: "해양", governing_law: "공유수면법" },
  { id: "LT_C_WGISRECOMP", label: "공유수면매립준공", category: "해양", governing_law: "공유수면법" },

  // 항공
  { id: "LT_C_AISPRHC", label: "비행금지구역", category: "항공", governing_law: "항공안전법" },
  { id: "LT_C_AISALTC", label: "경계구역", category: "항공", governing_law: "항공안전법" },
  { id: "LT_C_AISMOAC", label: "군작전구역", category: "항공", governing_law: "군용항공기법" },
];

interface Designation {
  category: string;
  layer: string;
  name: string;
  code?: string;
  designation_year?: string;
  designation_number?: string;
  sido?: string;
  sigg?: string;
  governing_law?: string;
  triggers_priority_delegation?: boolean;
}

export const getOtherLawDesignationsTool = async ({ query }: { query: string }) => {
  const resolved = await resolveToPoint(query);
  const q = await queryOverlays(LAYERS, resolved.point_wgs84);

  const byLayer = new Map(LAYERS.map((l) => [l.id, l]));
  const designations: Designation[] = q.hits.map((h: OverlayHit) => {
    const def = byLayer.get(h.layer);
    return {
      category: def?.category ?? "(unknown)",
      layer: h.layer,
      name: h.name,
      code: h.code,
      designation_year: h.designation_year,
      designation_number: h.designation_number,
      sido: h.sido,
      sigg: h.sigg,
      governing_law: def?.governing_law,
      triggers_priority_delegation: def?.triggers_priority_delegation,
    };
  });

  const priorityHits = designations.filter((d) => d.triggers_priority_delegation);
  const priorityDelegation = priorityHits.length > 0
    ? {
        applies: true,
        rationale:
          "국토계획법 제76조⑤에 따라 아래 지정사항이 있는 경우, 국토계획법 시행령 별표(용도지역 행위제한)가 적용 제외되고 해당 개별 법령이 우선 적용됩니다.",
        candidates: priorityHits.map((h) => ({
          name: h.name,
          governing_law: h.governing_law,
          layer: h.layer,
        })),
      }
    : { applies: false };

  const result = {
    query,
    pnu: resolved.pnu,
    point_wgs84: resolved.point_wgs84,
    designations_count: designations.length,
    designations,
    priority_delegation_hint: priorityDelegation,
    layer_errors: q.errors.length > 0 ? q.errors : undefined,
    source: {
      resolved_at: new Date().toISOString(),
      layers_queried: LAYERS.length,
      layer_ids: LAYERS.map((l) => l.id),
    },
    note:
      "These are '다른 법령 지정사항' overlays — each may trigger priority delegation per 국토계획법 제76조⑤. When triggers_priority_delegation=true, look up the governing_law's 행위제한 provisions via korean-law MCP BEFORE applying 국토계획법 시행령 별표. Absence of overlay is informational, not dispositive — local 조례 may add 제한.",
    disclaimer: DISCLAIMER,
  };

  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
};
