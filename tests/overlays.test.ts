import { describe, it, expect } from "vitest";
import { pointToBox, featureToHit } from "../src/lib/overlays.js";

describe("pointToBox", () => {
  it("returns BOX WKT centered on the given point", () => {
    const box = pointToBox({ x: 127.0, y: 37.5 }, 100);
    expect(box).toMatch(/^BOX\(/);
    const m = box.match(/^BOX\(([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)\)$/);
    expect(m).not.toBeNull();
    if (!m) return;
    const [, minX, minY, maxX, maxY] = m.map(parseFloat);
    expect(minX).toBeLessThan(127.0);
    expect(maxX).toBeGreaterThan(127.0);
    expect(minY).toBeLessThan(37.5);
    expect(maxY).toBeGreaterThan(37.5);
    expect(maxY - minY).toBeCloseTo((2 * 100) / 111_000, 6);
  });

  it("produces a wider box in longitude than latitude at Korean latitudes", () => {
    const box = pointToBox({ x: 127.0, y: 37.5 }, 100);
    const m = box.match(/^BOX\(([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)\)$/)!;
    const [, minX, minY, maxX, maxY] = m.map(parseFloat);
    const dLon = maxX - minX;
    const dLat = maxY - minY;
    expect(dLon).toBeGreaterThan(dLat);
  });
});

describe("featureToHit", () => {
  const layer = { id: "LT_C_UQ111", label: "도시지역" };

  it("picks name from first available NAME_KEYS field", () => {
    const hit = featureToHit(layer, {
      properties: { uname: "제2종일반주거지역", sido_name: "서울" },
    });
    expect(hit.name).toBe("제2종일반주거지역");
    expect(hit.sido).toBe("서울");
  });

  it("falls back through NAME_KEYS aliases", () => {
    const hit = featureToHit(layer, {
      properties: { zone_name: "농업진흥구역" },
    });
    expect(hit.name).toBe("농업진흥구역");
  });

  it("returns (unnamed) when no known name field is present", () => {
    const hit = featureToHit(layer, { properties: { foo: "bar" } });
    expect(hit.name).toBe("(unnamed)");
  });

  it("extracts designation year and number from dyear/dnum", () => {
    const hit = featureToHit(layer, {
      properties: { name: "지정사항", dyear: 2023, dnum: "0435" },
    });
    expect(hit.designation_year).toBe("2023");
    expect(hit.designation_number).toBe("0435");
  });

  it("treats empty and null values as absent", () => {
    const hit = featureToHit(layer, {
      properties: { name: "", uname: null as unknown as string, zonename: "실지정" },
    });
    expect(hit.name).toBe("실지정");
  });
});
