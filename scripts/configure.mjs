#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ENV_PATH = join(ROOT, ".env");
const DIST_SERVER = join(ROOT, "dist", "server.js");

function readEnv() {
  if (!existsSync(ENV_PATH)) return {};
  const content = readFileSync(ENV_PATH, "utf-8");
  const out = {};
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

function writeEnv(kv) {
  const order = ["VWORLD_API_KEY", "VWORLD_DOMAIN", "VWORLD_CACHE_TTL_SEC", "VWORLD_CACHE_MAX"];
  const known = new Set(order);
  const lines = [];
  for (const k of order) {
    if (kv[k] !== undefined && kv[k] !== "") lines.push(`${k}=${kv[k]}`);
  }
  for (const [k, v] of Object.entries(kv)) {
    if (!known.has(k) && v !== undefined && v !== "") lines.push(`${k}=${v}`);
  }
  writeFileSync(ENV_PATH, lines.join("\n") + "\n", { mode: 0o600 });
}

function mask(key) {
  if (!key || key.length < 8) return "***";
  return `${key.slice(0, 4)}***${key.slice(-4)}`;
}

function looksLikeVWorldKey(s) {
  return /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(s.trim());
}

async function main() {
  const current = readEnv();
  const rl = createInterface({ input: stdin, output: stdout, terminal: stdout.isTTY });

  const ask = async (prompt, def) => {
    const hint = def ? ` [${def}]` : "";
    const ans = (await rl.question(`${prompt}${hint}: `)).trim();
    return ans === "" ? def ?? "" : ans;
  };

  console.log("");
  console.log("  korean-land-mcp 설정");
  console.log("  ═══════════════════════════════════════════════");
  console.log("");
  console.log("  이 스크립트는 .env 파일에 V-World API 자격증명을 저장합니다.");
  console.log(`  저장 위치: ${ENV_PATH}`);
  console.log("  (.env 는 .gitignore 에 있어 Git 에 올라가지 않습니다)");
  console.log("");

  const existingKey = current.VWORLD_API_KEY;
  let apiKey = existingKey;
  if (existingKey && existingKey !== "your_vworld_key_here") {
    console.log(`  기존 V-World API 키 발견: ${mask(existingKey)}`);
    const keep = await ask("  유지할까요? (Y/n)", "Y");
    if (keep.toLowerCase() === "n") {
      apiKey = "";
    }
  }

  while (!apiKey || apiKey === "your_vworld_key_here") {
    console.log("");
    console.log("  V-World API 키 발급: https://www.vworld.kr/dev/v4api.do");
    console.log("  (로그인 → 오픈API → 인증키 발급)");
    const entered = await ask("  V-World API 키를 붙여넣으세요");
    if (!entered) {
      console.log("  ⚠ 키가 비어 있습니다. 다시 입력해주세요.");
      continue;
    }
    if (!looksLikeVWorldKey(entered)) {
      console.log(`  ⚠ 입력한 값이 V-World 키 형식(XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)이 아닙니다: ${mask(entered)}`);
      const force = await ask("  그래도 저장할까요? (y/N)", "N");
      if (force.toLowerCase() !== "y") continue;
    }
    apiKey = entered;
  }

  console.log("");
  const existingDomain = current.VWORLD_DOMAIN;
  const domainDefault = existingDomain || "localhost";
  console.log("  V-World 키는 발급 시 등록한 도메인에 바인딩됩니다.");
  console.log("  로컬 개발·MCP 용도면 보통 'localhost' 입니다.");
  const domain = await ask("  VWORLD_DOMAIN", domainDefault);

  const finalEnv = { ...current, VWORLD_API_KEY: apiKey, VWORLD_DOMAIN: domain };
  writeEnv(finalEnv);

  rl.close();

  console.log("");
  console.log(`  ✓ ${ENV_PATH} 저장 완료 (퍼미션 600)`);
  console.log("");
  console.log("  ── 다음 단계 ──────────────────────────────────");
  console.log("");
  console.log("  1) 빌드 확인:  npm run build");
  console.log("  2) 스모크:     npx tsx tests/live/smoke-polygon.ts");
  console.log("");
  console.log("  3) Claude Desktop / Claude Code 설정에 추가할 블록:");
  console.log("");
  console.log("  {");
  console.log('    "mcpServers": {');
  console.log('      "korean-land": {');
  console.log('        "command": "node",');
  console.log(`        "args": ["${DIST_SERVER}"],`);
  console.log('        "env": {');
  console.log(`          "VWORLD_API_KEY": "${mask(apiKey)}",`);
  console.log(`          "VWORLD_DOMAIN": "${domain}"`);
  console.log("        }");
  console.log("      }");
  console.log("    }");
  console.log("  }");
  console.log("");
  console.log("  (위 JSON의 VWORLD_API_KEY 는 마스킹됨 — 실제 설정엔 원본 키를 넣으세요.)");
  console.log("");
}

main().catch((e) => {
  console.error("");
  console.error("  ✗ 설정 실패:", e.message);
  process.exit(1);
});
