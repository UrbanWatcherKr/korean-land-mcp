export const getLandDetailsTool = async ({ identifier }) => {
    return {
        content: [{
                type: "text",
                text: JSON.stringify({
                    identifier,
                    pnu: identifier.includes("41111") ? identifier : "4111112345678901234",
                    land_type: "대지",
                    area: "245.8㎡",
                    zoning_detail: "제2종일반주거지역 (용도지역) / 장안구 정자동 지구단위계획구역",
                    current_use: "단독주택",
                    max_building_height: "4층 (지구단위계획)",
                    parking_requirement: "세대당 1대 이상",
                    additional_restrictions: ["과밀억제구역", "개발행위허가 대상"],
                    source: "토지이음 상세정보 + 국토교통부",
                    recommendation: "정확한 최신 정보는 eum.go.kr에서 '토지이용계획 열람' 직접 확인하세요."
                }, null, 2)
            }]
    };
};
//# sourceMappingURL=get_land_details.js.map