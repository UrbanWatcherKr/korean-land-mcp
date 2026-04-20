import { z } from "zod";

export const chainLandAnalysisTool = async ({ query, scenario = "custom" }: { query: string; scenario?: string }) => {
  console.log(`[chain_land_analysis] Running chain for: ${query} | scenario: ${scenario}`);

  // This tool demonstrates MCP's power: AI can call multiple tools in sequence
  // In full implementation, the server or client handles chaining, but we provide structured guidance

  const steps = [
    "1. 주소/지번으로 토지이용계획 기본 조회 (search_land_use)",
    "2. 상세 규제사항 및 건폐율/용적률 확인 (get_land_details)",
    "3. 관련 도시계획 및 지구단위계획 검색 (search_urban_planning)",
    "4. 적용 법령 및 인용 검증 (verify_land_citations + get_regulation_laws)",
    "5. 인허가 사례 및 최근 고시 확인 (get_permit_examples + search_public_notices)"
  ];

  let analysis = `🏗️ **토지 분석 체인 실행 결과** (시나리오: ${scenario})\n\n`;
  analysis += `**쿼리**: ${query}\n\n`;
  analysis += `**분석 단계**:\n${steps.join("\n")}\n\n`;
  analysis += `**종합 의견** (예시):\n`;
  analysis += `• 해당 토지는 일반주거지역으로 주거용 건축 가능하나, 지구단위계획에 따른 높이/용도 제한 있음.\n`;
  analysis += `• 개발 시 개발행위허가 + 건축허가 필요. 최근 고시사항 없음.\n`;
  analysis += `• 추천: 정확한 PNU로 get_land_details 호출 후 상세 검토.\n\n`;
  analysis += `**다음 추천 액션**:\n`;
  analysis += `- "이 주소로 상세 토지 정보 알려줘" (get_land_details)\n`;
  analysis += `- "개발 가능성 더 자세히 분석해줘" (추가 chain)\n`;
  analysis += `- "인용된 법령 검증해줘" (verify_land_citations)\n\n`;
  analysis += `※ 실제 운영 시 MCP 클라이언트(Claude)가 자동으로 여러 도구를 순차 호출합니다.`;

  return {
    content: [{
      type: "text",
      text: analysis
    }]
  };
};
