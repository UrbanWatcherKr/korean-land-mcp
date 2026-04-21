const JIMOK_CODE_MAP: Record<string, string> = {
  전: "전",
  답: "답",
  과: "과수원",
  목: "목장용지",
  임: "임야",
  광: "광천지",
  염: "염전",
  대: "대",
  장: "공장용지",
  학: "학교용지",
  차: "주차장",
  주: "주유소용지",
  창: "창고용지",
  도: "도로",
  철: "철도용지",
  제: "제방",
  천: "하천",
  구: "구거",
  유: "유지",
  양: "양어장",
  수: "수도용지",
  공: "공원",
  체: "체육용지",
  원: "유원지",
  종: "종교용지",
  사: "사적지",
  묘: "묘지",
  잡: "잡종지",
};

export interface ParsedJibun {
  raw: string;
  is_mountain: boolean;
  number_part: string | null;
  jimok_code: string | null;
  jimok_full_name: string | null;
}

export function parseJibun(raw: string | null | undefined): ParsedJibun {
  const src = String(raw ?? "").trim();
  const is_mountain = /^산\s?\d/.test(src);

  const m = src.match(/(\d+(?:[-\s]\d+)?)\s*([가-힣])?\s*$/);
  const number_part = m?.[1] ?? null;
  const jimok_code = m?.[2] ?? null;
  const jimok_full_name = jimok_code ? JIMOK_CODE_MAP[jimok_code] ?? null : null;

  return { raw: src, is_mountain, number_part, jimok_code, jimok_full_name };
}
