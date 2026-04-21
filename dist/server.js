import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import dotenv from "dotenv";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { resolveParcelTool } from "./tools/resolve_parcel.js";
import { getZoningTool } from "./tools/get_zoning.js";
import { getDistrictPlanTool } from "./tools/get_district_plan.js";
import { getUrbanFacilityTool } from "./tools/get_urban_facility.js";
import { getOtherLawDesignationsTool } from "./tools/get_other_law_designations.js";
import { getLandAttributesTool } from "./tools/get_land_attributes.js";
import { analyzeParcelTool } from "./tools/analyze_parcel.js";
dotenv.config();
const server = new McpServer({
    name: "korean-land-mcp",
    version: "2.0.0",
    description: "Korean parcel & zoning MCP backed by V-World. Resolves addresses/PNUs into spatial facts (필지, 용도지역/지구/구역, 지구단위계획, 도시계획시설, 다른 법령 지정사항). No mock fallback — failures are real errors. For 법령·조례 text, pair with korean-law MCP.",
});
const QUERY_SCHEMA = {
    query: z
        .string()
        .min(2)
        .describe("Korean address (e.g. '경기도 평택시 포승읍 내기리 680') or 19-digit PNU"),
};
server.tool("resolve_parcel", "Resolve address or PNU → canonical parcel: PNU, 지번, parsed 지목 (e.g. 공장용지), refined address, WGS84 coordinates, 공시지가, administrative hierarchy. Foundation for all other tools.", QUERY_SCHEMA, resolveParcelTool);
server.tool("get_zoning", "Return 용도지역 (도시/관리/농림/자연환경보전 + subclass), 용도지구 (경관/고도/방화/방재/보호/취락/개발진흥/특정용도제한), 용도구역 (개발제한/도시자연공원), and 토지거래허가구역 overlays. Empty array = no overlay at this point (not an error). Use the zone name with korean-law MCP to get 건폐율·용적률.", QUERY_SCHEMA, getZoningTool);
server.tool("get_district_plan", "Return 지구단위계획구역 membership and 개발행위허가제한지역 overlays. When district_plan is non-empty, 건폐율·용적률·용도 may be overridden by the plan (see 국토계획법 제52조). V-World only returns the geometric hit — actual plan text must come from 지자체 고시문.", QUERY_SCHEMA, getDistrictPlanTool);
server.tool("get_urban_facility", "Return 도시계획시설 overlaps: 도로, 교통시설, 공간시설(공원·녹지), 유통공급, 공공문화체육, 방재, 보건위생, 환경기초, 기타기반시설. Overlap with 도시계획시설 triggers 건축제한 (국계법 제64조) or 미집행 저촉 리스크. Exact 저촉 면적 needs geometric intersection, not returned here.", QUERY_SCHEMA, getUrbanFacilityTool);
server.tool("get_other_law_designations", "Return '다른 법령에 따른 지정사항' overlays — ~38 layers across 농지/산림/산업단지/수질·환경/축산/문화재/자연공원/특수지구/주거정비/재해/해양/항공. Each hit includes governing_law and a triggers_priority_delegation flag. When any flag is true, 국토계획법 제76조⑤ priority delegation applies and the governing_law's 행위제한 overrides the 국토계획법 시행령 별표 — look up those provisions via korean-law MCP first.", QUERY_SCHEMA, getOtherLawDesignationsTool);
server.tool("get_land_attributes", "Return detailed parcel attributes: parsed 지목 (28-type mapping), 지번 components, 공시지가, administrative breakdown, and 건축물 presence at the point. Note: 면적(land area) is NOT provided — V-World doesn't expose 토지대장 area field.", QUERY_SCHEMA, getLandAttributesTool);
server.tool("analyze_parcel", "One-shot comprehensive analysis — chains all the above tools and returns a single integrated record: parcel + zoning + district_plan + urban_facility + other_law_designations + priority_delegation_hint + buildings + next_steps. Use this when you want a complete 토지이용계획확인서-equivalent JSON in one call. next_steps tells you exactly which korean-law MCP queries to run afterward.", QUERY_SCHEMA, analyzeParcelTool);
server.tool("discover_tools", "List all currently wired tools in this MCP build.", {}, async () => ({
    content: [
        {
            type: "text",
            text: [
                "korean-land-mcp v2.0 — V-World backed, mock fallback REMOVED",
                "",
                "Tools:",
                "- resolve_parcel(query): address|PNU → canonical parcel",
                "- get_zoning(query): 용도지역·지구·구역 + 토지거래허가구역",
                "- get_district_plan(query): 지구단위계획 + 개발행위허가제한",
                "- get_urban_facility(query): 도시계획시설 9개 카테고리",
                "- get_other_law_designations(query): 38개 개별법령 지정 (국계법 76조⑤ 우선위임 힌트 포함)",
                "- get_land_attributes(query): 지목 파싱 + 공시지가 + 건물 유무",
                "- analyze_parcel(query): 위 전체를 1회 호출로 체이닝",
                "",
                "Legal citations (법령·조례 원문) are intentionally out of scope — use korean-law MCP.",
            ].join("\n"),
        },
    ],
}));
const transportType = process.env.MCP_TRANSPORT || "stdio";
if (transportType === "http") {
    const app = express();
    app.use(express.json());
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
    });
    await server.connect(transport);
    app.post("/mcp", async (req, res) => {
        await transport.handleRequest(req, res, req.body);
    });
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.error(`HTTP MCP on :${PORT}/mcp`);
    });
}
else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("korean-land-mcp v2.0 ready (stdio) — 7 tools wired");
}
//# sourceMappingURL=server.js.map