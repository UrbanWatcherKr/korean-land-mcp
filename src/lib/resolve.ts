import { geocodeAddress, getFeatures, isPnu, VWorldError } from "./vworld.js";
import { geometryToWKT } from "./geometry.js";

export interface ResolvedPoint {
  pnu: string | null;
  jibun: string | null;
  address: string | null;
  point_wgs84: { x: number; y: number };
  land_price_won_per_m2: number | null;
  land_price_gosi_date: string | null;
  administrative: {
    sido?: string;
    sigg?: string;
    emd_dong?: string;
    emd_dong_code?: string;
  };
  geocoder_layer: string;
}

export interface ResolvedParcel extends ResolvedPoint {
  parcel_geometry: unknown | null;
  parcel_wkt: string | null;
}

function toNumberOrNull(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function centroidFromGeometry(geom: unknown): { x: number; y: number } | null {
  const g = geom as { type?: string; coordinates?: unknown } | undefined;
  if (!g || !g.coordinates) return null;
  const flat = (g.coordinates as unknown[]).flat(Infinity) as unknown[];
  const coords: number[] = flat.filter((v) => typeof v === "number") as number[];
  if (coords.length < 2) return null;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let i = 0; i + 1 < coords.length; i += 2) {
    sx += coords[i];
    sy += coords[i + 1];
    n++;
  }
  if (n === 0) return null;
  return { x: sx / n, y: sy / n };
}

async function resolveParcelCore(
  query: string,
  includeParcelGeometry: boolean
): Promise<ResolvedPoint & { _parcel_geometry?: unknown }> {
  const trimmed = query.trim();

  let point: { x: number; y: number };
  let geocoderLayer: string;
  let admin: ResolvedPoint["administrative"] = {};

  if (isPnu(trimmed)) {
    const feats = await getFeatures({
      layer: "LP_PA_CBND_BUBUN",
      attrFilter: `pnu:=:${trimmed}`,
      includeGeometry: true,
      size: 1,
    });
    if (feats.length === 0) {
      throw new VWorldError(`PNU ${trimmed} not found in LP_PA_CBND_BUBUN`, "PNU_NOT_FOUND");
    }
    const centroid = centroidFromGeometry(feats[0].geometry);
    if (!centroid) {
      throw new VWorldError(`PNU ${trimmed}: could not derive centroid`, "COORD_PARSE_FAILED");
    }
    point = centroid;
    geocoderLayer = "LP_PA_CBND_BUBUN (attrFilter pnu, centroid)";

    const p = feats[0].properties;
    const jiga = toNumberOrNull(p.jiga);
    const gosiYear = p.gosi_year ? String(p.gosi_year) : null;
    const gosiMonth = p.gosi_month ? String(p.gosi_month) : null;
    const gosiDate = gosiYear && gosiMonth ? `${gosiYear}-${gosiMonth.padStart(2, "0")}` : null;

    return {
      pnu: p.pnu ? String(p.pnu) : null,
      jibun: p.jibun ? String(p.jibun) : null,
      address: p.addr ? String(p.addr) : null,
      point_wgs84: point,
      land_price_won_per_m2: jiga,
      land_price_gosi_date: gosiDate,
      administrative: admin,
      geocoder_layer: geocoderLayer,
      _parcel_geometry: feats[0].geometry,
    };
  }

  let geo;
  try {
    geo = await geocodeAddress(trimmed, "parcel");
  } catch (e) {
    if (e instanceof VWorldError) geo = await geocodeAddress(trimmed, "road");
    else throw e;
  }
  point = geo.point_wgs84;
  geocoderLayer = "vworld geocoder /req/address";
  admin = {
    sido: geo.structure.level1,
    sigg: geo.structure.level2,
    emd_dong: geo.structure.level4L || geo.structure.level4A,
    emd_dong_code: geo.structure.level4LC || geo.structure.level4AC,
  };

  const parcelFeats = await getFeatures({
    layer: "LP_PA_CBND_BUBUN",
    point,
    size: 1,
    includeGeometry: includeParcelGeometry,
  });

  if (parcelFeats.length === 0) {
    return {
      pnu: null,
      jibun: null,
      address: null,
      point_wgs84: point,
      land_price_won_per_m2: null,
      land_price_gosi_date: null,
      administrative: admin,
      geocoder_layer: geocoderLayer,
      _parcel_geometry: undefined,
    };
  }

  const p = parcelFeats[0].properties;
  const jiga = toNumberOrNull(p.jiga);
  const gosiYear = p.gosi_year ? String(p.gosi_year) : null;
  const gosiMonth = p.gosi_month ? String(p.gosi_month) : null;
  const gosiDate = gosiYear && gosiMonth ? `${gosiYear}-${gosiMonth.padStart(2, "0")}` : null;

  return {
    pnu: p.pnu ? String(p.pnu) : null,
    jibun: p.jibun ? String(p.jibun) : null,
    address: p.addr ? String(p.addr) : null,
    point_wgs84: point,
    land_price_won_per_m2: jiga,
    land_price_gosi_date: gosiDate,
    administrative: admin,
    geocoder_layer: geocoderLayer,
    _parcel_geometry: includeParcelGeometry ? parcelFeats[0].geometry : undefined,
  };
}

export async function resolveToPoint(query: string): Promise<ResolvedPoint> {
  const r = await resolveParcelCore(query, false);
  const { _parcel_geometry, ...rest } = r;
  void _parcel_geometry;
  return rest;
}

export async function resolveToParcel(query: string): Promise<ResolvedParcel> {
  const r = await resolveParcelCore(query, true);
  const { _parcel_geometry, ...rest } = r;
  const wkt = geometryToWKT(_parcel_geometry);
  return { ...rest, parcel_geometry: _parcel_geometry ?? null, parcel_wkt: wkt };
}
