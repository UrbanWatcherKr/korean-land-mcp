import "dotenv/config";
import { analyzeParcelTool } from "../../src/tools/analyze_parcel.js";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAP_DIR = resolve(__dirname, "__snapshots__");

interface Fixture {
  id: string;
  query: string;
  description: string;
}

const FIXTURES: Fixture[] = [
  {
    id: "seoul-mapo-yeonnam-229-1",
    query: "서울특별시 마포구 연남동 229-1",
    description: "도시 주거지 + 지구단위계획 + 토지거래허가",
  },
  {
    id: "asan-baebang-sechul-63",
    query: "충청남도 아산시 배방읍 세출리 63",
    description: "농림지역 + 농업진흥구역 (국계법 76조⑤ 우선위임)",
  },
  {
    id: "asan-baebang-galmae-344-17",
    query: "충청남도 아산시 배방읍 갈매리 344-17",
    description: "복합 용도지역 + 도시개발구역",
  },
];

interface Snapshot {
  query: string;
  precision: string | undefined;
  zone: string | undefined;
  district_plan_names: string[];
  other_law: string[];
  urban_facility_count: number;
  priority_delegation_applies: boolean;
  priority_delegation_laws: string[];
  land_transaction_permit_count: number;
  buildings_present: boolean | undefined;
  layer_error_count: number;
}

function capture(parsed: any): Snapshot {
  const pd = parsed.priority_delegation_hint;
  const laws: string[] = pd?.applies
    ? (pd.candidates ?? []).map((c: any) => c.governing_law).filter(Boolean).sort()
    : [];
  return {
    query: parsed.query,
    precision: parsed.source?.precision,
    zone: parsed.zoning?.use_zone?.[0]?.name,
    district_plan_names: (parsed.district_plan ?? [])
      .map((d: any) => d.name)
      .sort(),
    other_law: (parsed.other_law_designations ?? [])
      .map((d: any) => `${d.category}:${d.name}`)
      .sort(),
    urban_facility_count: parsed.urban_facility?.length ?? 0,
    priority_delegation_applies: !!pd?.applies,
    priority_delegation_laws: laws,
    land_transaction_permit_count:
      parsed.zoning?.land_transaction_permit?.length ?? 0,
    buildings_present: parsed.buildings?.present,
    layer_error_count: parsed.layer_errors?.length ?? 0,
  };
}

function snapPath(id: string) {
  return resolve(SNAP_DIR, `${id}.json`);
}

async function run(
  fixture: Fixture,
  updateMode: boolean
): Promise<"pass" | "created" | "updated" | "fail"> {
  const out = await analyzeParcelTool({ query: fixture.query });
  const parsed = JSON.parse(out.content[0].text);
  const current = capture(parsed);
  const path = snapPath(fixture.id);

  if (!existsSync(path)) {
    if (!existsSync(SNAP_DIR)) mkdirSync(SNAP_DIR, { recursive: true });
    writeFileSync(path, JSON.stringify(current, null, 2) + "\n");
    console.log(`    snapshot created`);
    return "created";
  }

  const prev: Snapshot = JSON.parse(readFileSync(path, "utf-8"));
  const diffs: string[] = [];
  for (const key of Object.keys(current) as (keyof Snapshot)[]) {
    const a = JSON.stringify(prev[key]);
    const b = JSON.stringify(current[key]);
    if (a !== b) diffs.push(`      ${key}: ${a} → ${b}`);
  }

  if (diffs.length === 0) {
    console.log(`    pass`);
    return "pass";
  }

  if (updateMode) {
    writeFileSync(path, JSON.stringify(current, null, 2) + "\n");
    console.log(`    snapshot updated (${diffs.length} diffs accepted)`);
    diffs.forEach((d) => console.log(d));
    return "updated";
  }

  console.log(`    FAIL (${diffs.length} diffs)`);
  diffs.forEach((d) => console.log(d));
  return "fail";
}

async function main() {
  if (!process.env.VWORLD_API_KEY) {
    console.log("[smoke-fixtures] VWORLD_API_KEY not set — skipping.");
    process.exit(0);
  }
  const updateMode = process.argv.includes("--update");
  console.log(
    `[smoke-fixtures] ${updateMode ? "UPDATE" : "VERIFY"} mode — ${FIXTURES.length} fixtures`
  );

  let fails = 0;
  let created = 0;
  let updated = 0;
  for (const f of FIXTURES) {
    console.log(`\n  • ${f.id}`);
    console.log(`    ${f.description}`);
    console.log(`    "${f.query}"`);
    try {
      const status = await run(f, updateMode);
      if (status === "fail") fails++;
      else if (status === "created") created++;
      else if (status === "updated") updated++;
    } catch (e) {
      console.log(`    ERROR: ${e instanceof Error ? e.message : String(e)}`);
      fails++;
    }
  }

  console.log("");
  if (fails > 0) {
    console.log(
      `[smoke-fixtures] FAILED ${fails}/${FIXTURES.length} (created: ${created}, updated: ${updated})`
    );
    process.exit(1);
  }
  console.log(
    `[smoke-fixtures] OK ${FIXTURES.length}/${FIXTURES.length} (created: ${created}, updated: ${updated})`
  );
}

main().catch((e) => {
  console.error("[smoke-fixtures] unexpected error:", e);
  process.exit(1);
});
