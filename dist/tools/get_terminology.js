export const getTerminologyTool = async ({ term }) => {
    const definitions = {
        "용도지역": "국토의 계획 및 이용에 관한 법률에 따라 토지의 이용 목적을 구분한 지역 (주거지역, 상업지역, 공업지역, 녹지지역 등)",
        "건폐율": "대지면적에 대한 건축면적의 비율 (%)",
        "용적률": "대지면적에 대한 건축물의 연면적 비율 (%)",
        "지구단위계획": "도시의 특정 지역에 대해 상세한 토지이용계획을 수립하는 계획",
        "개발행위허가": "토지의 형질변경, 건축물의 건축 등 개발행위를 하기 위해 받는 허가"
    };
    const def = definitions[term] || `${term}에 대한 정의: 토지이음 용어사전 참조 (eum.go.kr/web/in/... )`;
    return {
        content: [{
                type: "text",
                text: `📖 용어사전\n\n**${term}**\n${def}\n\n출처: 토지이음 용어사전`
            }]
    };
};
//# sourceMappingURL=get_terminology.js.map