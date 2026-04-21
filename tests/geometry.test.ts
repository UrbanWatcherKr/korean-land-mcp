import { describe, it, expect } from "vitest";
import { geometryToWKT } from "../src/lib/geometry.js";

describe("geometryToWKT", () => {
  it("converts simple Polygon (outer ring only)", () => {
    const geom = {
      type: "Polygon",
      coordinates: [
        [
          [127.0, 37.5],
          [127.001, 37.5],
          [127.001, 37.501],
          [127.0, 37.501],
          [127.0, 37.5],
        ],
      ],
    };
    const wkt = geometryToWKT(geom);
    expect(wkt).toBe(
      "POLYGON((127 37.5,127.001 37.5,127.001 37.501,127 37.501,127 37.5))"
    );
  });

  it("preserves holes in Polygon", () => {
    const geom = {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
        [
          [3, 3],
          [7, 3],
          [7, 7],
          [3, 7],
          [3, 3],
        ],
      ],
    };
    const wkt = geometryToWKT(geom);
    expect(wkt).toContain("(0 0,10 0,10 10,0 10,0 0)");
    expect(wkt).toContain("(3 3,7 3,7 7,3 7,3 3)");
    expect(wkt?.startsWith("POLYGON(")).toBe(true);
  });

  it("picks largest polygon from MultiPolygon by bbox area", () => {
    const small: number[][][] = [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ];
    const large: number[][][] = [
      [
        [100, 100],
        [110, 100],
        [110, 110],
        [100, 110],
        [100, 100],
      ],
    ];
    const geom = { type: "MultiPolygon", coordinates: [small, large] };
    const wkt = geometryToWKT(geom);
    expect(wkt).toContain("100 100");
    expect(wkt).not.toContain("(0 0,1 0");
  });

  it("returns null for missing geometry", () => {
    expect(geometryToWKT(null)).toBeNull();
    expect(geometryToWKT(undefined)).toBeNull();
    expect(geometryToWKT({})).toBeNull();
    expect(geometryToWKT({ type: "Polygon" })).toBeNull();
  });

  it("returns null for unsupported geometry types", () => {
    expect(geometryToWKT({ type: "Point", coordinates: [127, 37] })).toBeNull();
    expect(geometryToWKT({ type: "LineString", coordinates: [[127, 37], [128, 38]] })).toBeNull();
  });

  it("returns null for malformed rings (too few points)", () => {
    const geom = {
      type: "Polygon",
      coordinates: [[[0, 0], [1, 1]]],
    };
    expect(geometryToWKT(geom)).toBeNull();
  });

  it("returns null when coordinates contain non-numeric values", () => {
    const geom = {
      type: "Polygon",
      coordinates: [[[0, 0], [1, "bad"], [2, 2], [0, 0]]],
    };
    expect(geometryToWKT(geom)).toBeNull();
  });

  it("truncates coordinates to 7 decimal places", () => {
    const geom = {
      type: "Polygon",
      coordinates: [
        [
          [127.12345678901234, 37.5],
          [127.2, 37.5],
          [127.2, 37.6],
          [127.12345678901234, 37.5],
        ],
      ],
    };
    const wkt = geometryToWKT(geom);
    expect(wkt).toContain("127.1234568 37.5");
    expect(wkt).not.toContain("127.12345678901234");
  });
});
