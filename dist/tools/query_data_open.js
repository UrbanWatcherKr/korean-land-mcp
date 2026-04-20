export const queryDataOpenTool = async ({ dataCd, params = {} }) => {
    const datasetMap = {
        "001": "개발행위허가정보 (전국)",
        "006": "토지이용규제 법령정보",
        "007": "토지이용규제 행위제한정보",
        // Add more from official list
    };
    return {
        content: [{
                type: "text",
                text: `📊 데이터개방 조회\nDataset: ${datasetMap[dataCd] || dataCd}\nParams: ${JSON.stringify(params)}\n\n` +
                    `결과: CSV/OpenAPI로 제공되는 공공데이터입니다.\n` +
                    `다운로드/조회: https://www.eum.go.kr/web/op/sv/svItemList.jsp\n\n` +
                    `※ 실제 API 호출을 원하시면 dataCd와 파라미터를 공식 문서에 맞춰 사용하세요.`
            }]
    };
};
//# sourceMappingURL=query_data_open.js.map