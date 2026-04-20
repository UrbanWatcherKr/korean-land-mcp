import { z } from "zod";

export const getRegulationLawsTool = async ({ keyword = "" }: { keyword?: string }) => {
  const laws = [
    "「국토의 계획 및 이용에 관한 법률」 (전부개정 2024)",
    "「건축법」 시행령·시행규칙",
    "「토지이용규제 기본법」",
    "「도시 및 주거환경정비법」",
    "「개발행위허가에 관한 규정」 (국토교통부 고시)"
  ].filter(l => !keyword || l.includes(keyword));

  return {
    content: [{
      type: "text",
      text: `📜 규제법령집 (${laws.length}건)\n\n` + laws.map((l, i) => `${i+1}. ${l}`).join("\n") +
            "\n\n전문은 토지이음 '규제법령집' 또는 법제처에서 확인하세요."
    }]
  };
};
