import { z } from "zod";

export const getPermitExamplesTool = async ({ type = "" }: { type?: string }) => {
  return {
    content: [{
      type: "text",
      text: `📝 쉬운 인허가 사례 (${type || "일반"})\n\n` +
            `1. 단독주택 신축: 제2종일반주거지역, 건폐율 60% 이내, 주차장 확보 필수\n` +
            `2. 상가 용도변경: 기존 주택 → 근린생활시설, 건축법 제19조 적용\n` +
            `3. 개발행위허가: 500㎡ 이상 토지 형질변경 시 국토계획법 제56조\n\n` +
            `더 많은 사례: https://eum.go.kr/web/gd/ec/ecGuideMastDet.jsp\n` +
            `※ 실제 신청 전 토지이음 또는 관할 지자체 확인 필수`
    }]
  };
};
