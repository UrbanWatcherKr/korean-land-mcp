import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express"; // Note: add express to deps if using full HTTP
import dotenv from "dotenv";
import { z } from "zod";

// Import tools
import { searchLandUseTool } from "./tools/search_land_use.js";
import { getLandDetailsTool } from "./tools/get_land_details.js";
import { searchUrbanPlanningTool } from "./tools/search_urban_planning.js";
import { getRegulationLawsTool } from "./tools/get_regulation_laws.js";
import { searchPublicNoticesTool } from "./tools/search_public_notices.js";
import { queryDataOpenTool } from "./tools/query_data_open.js";
import { verifyLandCitationsTool } from "./tools/verify_land_citations.js";
import { chainLandAnalysisTool } from "./tools/chain_land_analysis.js";
import { getTerminologyTool } from "./tools/get_terminology.js";
import { getPermitExamplesTool } from "./tools/get_permit_examples.js";

dotenv.config();

const server = new McpServer({
  name: "korean-land-mcp",
  version: "1.0.0",
  description: "MCP Server for 토지이음 (EUM) - Korean Land Use Planning, Zoning & Urban Information System. Provides unified, hallucination-resistant access to official Korean government land data."
});

// Register all tools
server.tool(
  "search_land_use",
  "Search land use plan (토지이용계획) by address, lot number (지번), road name or building name. Returns zoning (용도지역/지구/구역), building-to-land ratio (건폐율), floor area ratio (용적률), restrictions, and regulatory info. Primary tool for property research.",
  {
    address: z.string().describe("Full address, e.g. '경기 수원시 장안구 정자동 1-1' or '서울특별시 강남구 테헤란로 123'"),
    include_map: z.boolean().optional().default(true).describe("Include map/image links if available")
  },
  searchLandUseTool
);

server.tool(
  "get_land_details",
  "Get detailed parcel information including PNU (고유번호), ownership type, current use, appraisal value hints, and full regulatory overlay.",
  {
    identifier: z.string().describe("PNU code (19 digits) or full address")
  },
  getLandDetailsTool
);

server.tool(
  "search_urban_planning",
  "Search urban/city planning information (도시계획), district unit plans, development projects by keyword or region.",
  {
    query: z.string().describe("Search keyword e.g. '강남구 지구단위계획' or city name"),
    region: z.string().optional().describe("Optional region filter e.g. '서울'")
  },
  searchUrbanPlanningTool
);

server.tool(
  "get_regulation_laws",
  "Retrieve regulatory law collection (규제법령집) related to land use, zoning restrictions, and relevant ordinances.",
  {
    keyword: z.string().optional().describe("Optional keyword e.g. '용도지역' or '개발행위허가'")
  },
  getRegulationLawsTool
);

server.tool(
  "search_public_notices",
  "Search recent public notices (고시정보) for urban planning decisions, land use changes, development projects.",
  {
    keyword: z.string().optional().describe("Filter by keyword"),
    limit: z.number().int().min(1).max(20).optional().default(5)
  },
  searchPublicNoticesTool
);

server.tool(
  "query_data_open",
  "Query open datasets (데이터개방) from 토지이음 including development permits, land use regulation CSV/API data. Use dataCd from official list (e.g. '001' for 개발행위허가정보).",
  {
    dataCd: z.string().describe("Dataset code e.g. '001', '006', '007'"),
    params: z.record(z.any()).optional().describe("Additional query parameters")
  },
  queryDataOpenTool
);

server.tool(
  "verify_land_citations",
  "Hallucination prevention tool. Extracts land-related legal citations (e.g. '국토의 계획 및 이용에 관한 법률 제36조', '건축법 제11조') from text and verifies against official sources. Returns VALID / INVALID / NOT_FOUND with explanation.",
  {
    text: z.string().min(10).describe("Text containing potential land law citations or regulatory references")
  },
  verifyLandCitationsTool
);

server.tool(
  "chain_land_analysis",
  "Comprehensive multi-step land research chain. Analyzes development potential, purchase risks, regulatory compliance, or custom scenarios. Automatically chains relevant tools and provides actionable insights with legal basis.",
  {
    query: z.string().describe("Natural language query e.g. '서울 강남구 아파트 부지 개발 가능성 분석' or '이 토지에 상가 건축 시 규제는?'"),
    scenario: z.enum(["development", "purchase", "regulation_check", "custom"]).optional().default("custom")
  },
  chainLandAnalysisTool
);

server.tool(
  "get_terminology",
  "Search the official land terminology dictionary (용어사전) for definitions of planning, zoning, and real estate terms.",
  {
    term: z.string().describe("Term to look up e.g. '용도지역', '건폐율', '지구단위계획'")
  },
  getTerminologyTool
);

server.tool(
  "get_permit_examples",
  "Retrieve easy-to-understand permit case examples (쉬운 인허가 사례) for common land development and building permit scenarios.",
  {
    type: z.string().optional().describe("Permit type e.g. '개발행위허가', '건축허가', '용도변경'")
  },
  getPermitExamplesTool
);

// Add discover tool for completeness
server.tool(
  "discover_tools",
  "List all available tools with descriptions and usage examples. Helps AI discover capabilities dynamically.",
  {},
  async () => ({
    content: [{
      type: "text",
      text: `Available tools in korean-land-mcp v1.0:
- search_land_use: Primary land search by address
- get_land_details: Detailed parcel info
- search_urban_planning, get_regulation_laws, search_public_notices
- query_data_open, verify_land_citations (hallucination guard)
- chain_land_analysis (smart chaining), get_terminology, get_permit_examples

Use natural language with Claude/Cursor to invoke. All data sourced from official eum.go.kr / 국토교통부.`
    }]
  })
);

console.log("🚀 Korean Land MCP Server (토지이음 MCP) initialized with 10+ unified tools");

// Start server - supports both stdio (for Claude Desktop) and HTTP
const transportType = process.env.MCP_TRANSPORT || "stdio";

if (transportType === "http") {
  const app = express();
  app.use(express.json());
  
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });
  
  await server.connect(transport);
  
  app.post("/mcp", async (req, res) => {
    await transport.handleRequest(req, res, req.body);
  });
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🌐 HTTP MCP Server listening on port ${PORT}`);
    console.log(`   Endpoint: http://localhost:${PORT}/mcp`);
  });
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("📡 MCP Server running in stdio mode (ready for Claude Desktop / Cursor)");
}
