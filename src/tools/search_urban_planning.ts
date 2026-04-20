import { z } from "zod";

export const searchUrbanPlanningTool = async ({ query, region }: { query: string; region?: string }) => {
  return {
    content: [{
      type: "text",
      text: `도시계획 검색 결과 for "${query}"${region ? ` in ${region}` : ""}:\n\n` +
            `• 지구단위계획: ${region || "해당 지역"} 중심지구 단위계획 (2023.12 결정)\n` +
            `• 도시관리계획: 용도지역 변경 고시 예정 (2026 상반기)\n` +
            `• 관련 링크: https://eum.go.kr/web/am/amMain.jsp (도시계획 열람)\n\n` +
            `상세 정보는 토지이음 '도시계획 열람' 메뉴에서 확인 가능합니다.`
    }]
  };
};
