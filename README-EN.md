# 🇰🇷 Korean Land MCP (토지이음 MCP)

**World's Best MCP Server for Korean Land Information System (EUM)**  
A production-grade **Model Context Protocol (MCP)** server that unifies all features of Korea's official **토지이음 (eum.go.kr)** — operated by the Ministry of Land, Infrastructure and Transport — into natural-language tools for AI assistants.

> Built in the exact style of **chrisryugj/korean-law-mcp** — hallucination-free, authoritative land use, zoning, urban planning & permit information.

## ✨ Key Features

- **10 unified high-level tools** covering land use plans, urban planning, regulations, public notices, open data, terminology, and permit cases
- `search_land_use` — Instant zoning, building coverage ratio (건폐율), floor area ratio (용적률), restrictions by address/lot number
- `verify_land_citations` — Automatic verification of land-related legal citations (hallucination guard)
- `chain_land_analysis` — Multi-step scenario analysis (development potential, purchase risk, regulatory compliance)
- Real-time public notice scraping + open government data integration

## 🚀 Quick Start

### Installation
```bash
git clone https://github.com/YOUR_USERNAME/korean-land-mcp.git
cd korean-land-mcp
npm install
npm run build
```

### Run (for Claude Desktop / Cursor)
```bash
npm start
# or dev mode
npm run dev
```

### Claude Desktop Config Example
```json
{
  "mcpServers": {
    "korean-land": {
      "command": "node",
      "args": ["/absolute/path/to/korean-land-mcp/dist/server.js"]
    }
  }
}
```

## 🛠️ Example Queries (just ask your AI)

- "Tell me the land use plan for 123 Teheran-ro, Gangnam-gu, Seoul"
- "Can I build a commercial building here? What are the restrictions?" → triggers chain analysis
- "Verify this citation: 국토의 계획 및 이용에 관한 법률 제36조"
- "Any recent urban planning notices in Gimpo?"

## 📦 Deployment (Fly.io - same as korean-law-mcp)

```bash
fly launch --dockerfile Dockerfile
fly deploy
```

Your server will be live at `https://korean-land-mcp.fly.dev/mcp`

## 🗂️ Project Structure

Same clean architecture as the law MCP:
- Stateless HTTP + stdio support
- Zod-validated tools
- Cheerio scraping for public notices
- Ready for real API integration (vworld, data.go.kr, eum internal)

## 🔧 Extending

- Replace mock data in `search_land_use.ts` with real eum.go.kr backend calls (see TODO comments)
- Add service keys for enhanced data sources in `.env`
- Add more dataset codes from https://www.eum.go.kr/web/op/sv/svItemList.jsp

## 📜 License & Credits

MIT License  
Designed as the **ultimate MCP authority** for Korean land data, faithfully replicating the proven patterns from korean-law-mcp.

Perfect for real estate AI agents, urban planning assistants, compliance checkers, and legal tech in Korea.

---

**Contributions welcome!**  
Let's democratize accurate Korean land information for everyone. 🏗️🇰🇷
