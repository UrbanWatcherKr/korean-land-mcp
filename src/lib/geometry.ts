export interface GeoJSONGeometry {
  type?: string;
  coordinates?: unknown;
}

const COORD_DECIMALS = 7;

function fmt(n: number): string {
  return Number(n.toFixed(COORD_DECIMALS)).toString();
}

function ringToWKT(ring: number[][]): string | null {
  if (!Array.isArray(ring) || ring.length < 3) return null;
  const parts: string[] = [];
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) return null;
    const [x, y] = pt as [number, number];
    if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }
    parts.push(`${fmt(x)} ${fmt(y)}`);
  }
  return `(${parts.join(",")})`;
}

function polygonToWKT(rings: number[][][]): string | null {
  if (!Array.isArray(rings) || rings.length === 0) return null;
  const ringWkts: string[] = [];
  for (const r of rings) {
    const w = ringToWKT(r);
    if (!w) return null;
    ringWkts.push(w);
  }
  return `POLYGON(${ringWkts.join(",")})`;
}

function bboxArea(ring: number[][]): number {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pt of ring) {
    const [x, y] = pt;
    if (typeof x !== "number" || typeof y !== "number") continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX)) return 0;
  return (maxX - minX) * (maxY - minY);
}

/**
 * Convert GeoJSON Polygon/MultiPolygon to a WKT POLYGON string suitable for
 * V-World's geomFilter parameter. MultiPolygon is reduced to its largest
 * bounding-box polygon because V-World geomFilter does not reliably accept
 * MULTIPOLYGON in all layers.
 *
 * Returns null when geometry is missing, malformed, or unsupported.
 */
export function geometryToWKT(geom: unknown): string | null {
  const g = geom as GeoJSONGeometry | undefined;
  if (!g || !g.type || !g.coordinates) return null;

  if (g.type === "Polygon") {
    return polygonToWKT(g.coordinates as number[][][]);
  }

  if (g.type === "MultiPolygon") {
    const polys = g.coordinates as number[][][][];
    if (!Array.isArray(polys) || polys.length === 0) return null;
    let bestIdx = 0;
    let bestArea = -1;
    for (let i = 0; i < polys.length; i++) {
      const outer = polys[i]?.[0];
      if (!outer) continue;
      const area = bboxArea(outer);
      if (area > bestArea) {
        bestArea = area;
        bestIdx = i;
      }
    }
    return polygonToWKT(polys[bestIdx]);
  }

  return null;
}
