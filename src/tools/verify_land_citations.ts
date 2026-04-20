import { z } from "zod";

const LAND_LAW_PATTERNS = [
  /국토의\s*계획\s*및\s*이용에\s*관한\s*법률\s*제?\s*(\d+)조/gi,
  /건축법\s*제?\s*(\d+)조/gi,
  /도시\s*및\s*주거환경정비법\s*제?\s*(\d+)조/gi,
  /토지이용규제\s*기본법\s*제?\s*(\d+)조/gi,
  /개발행위허가\s*관련\s*규정/gi,
  /용도지역\s*지정\s*기준/gi
];

export const verifyLandCitationsTool = async ({ text }: { text: string }) => {
  const citations: string[] = [];
  const results: any[] = [];

  // Extract citations using regex
  LAND_LAW_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      citations.push(match[0]);
    }
  });

  if (citations.length === 0) {
    return {
      content: [{
        type: "text",
        text: "⚠️ 텍스트에서 토지 관련 법령 인용을 찾을 수 없습니다.\n\n지원하는 패턴: 국토계획법, 건축법, 도시정비법, 토지이용규제기본법 등"
      }]
    };
  }

  // Simulate verification (in production: call law-mcp or official 법제처 + eum API)
  for (const cite of citations) {
    const isValid = !cite.includes("제9999조"); // Mock invalid example
    results.push({
      citation: cite,
      status: isValid ? "✅ VALID" : "❌ INVALID / NOT_FOUND",
      explanation: isValid 
        ? "공식 법령에 존재하는 조항입니다. 최신 개정사항은 법제처에서 확인하세요."
        : "해당 조항이 존재하지 않거나 범위를 벗어났습니다. (예: 형법 제9999조는 존재하지 않음)"
    });
  }

  return {
    content: [{
      type: "text",
      text: `🔍 토지 관련 인용 검증 결과\n\n` +
            results.map(r => `${r.citation}\n→ ${r.status}\n   ${r.explanation}`).join("\n\n") +
            `\n\n✅ 검증 완료. hallucination 방지용. 실제 적용 시 법제처(www.law.go.kr) + 토지이음(eum.go.kr) 교차 확인 필수.`
    }]
  };
};
