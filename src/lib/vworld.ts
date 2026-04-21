import axios from "axios";

const VWORLD_BASE = "https://api.vworld.kr/req";

export class VWorldError extends Error {
  constructor(message: string, public readonly code?: string, public readonly meta?: unknown) {
    super(message);
    this.name = "VWorldError";
  }
}

function getKey(): string {
  const key = process.env.VWORLD_API_KEY;
  if (!key || key === "your_vworld_key_here") {
    throw new VWorldError(
      "VWORLD_API_KEY is not configured. Set it in the MCP env block or .env file.",
      "NO_API_KEY"
    );
  }
  return key;
}

function getDomain(): string {
  const dom = process.env.VWORLD_DOMAIN;
  if (!dom || dom.trim() === "") {
    throw new VWorldError(
      "VWORLD_DOMAIN is not configured. Set it to the domain your V-World key is bound to (e.g. 'localhost' for local dev, or your deployed host).",
      "NO_DOMAIN"
    );
  }
  return dom;
}

const CACHE_TTL_MS = Math.max(0, parseInt(process.env.VWORLD_CACHE_TTL_SEC ?? "600", 10) || 600) * 1000;
const CACHE_MAX_ENTRIES = Math.max(100, parseInt(process.env.VWORLD_CACHE_MAX ?? "2000", 10) || 2000);

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const featureCache = new Map<string, CacheEntry<VWorldFeature[]>>();
const geocodeCache = new Map<string, CacheEntry<GeocodeResult>>();

function cacheGet<T>(store: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet<T>(store: Map<string, CacheEntry<T>>, key: string, value: T): void {
  if (CACHE_TTL_MS === 0) return;
  if (store.size >= CACHE_MAX_ENTRIES) {
    const firstKey = store.keys().next().value;
    if (firstKey !== undefined) store.delete(firstKey);
  }
  store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

const BREAKER_WINDOW_MS = 60_000;
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 60_000;

interface BreakerState {
  failures: number[];
  openedUntil?: number;
}

const breakers = new Map<string, BreakerState>();

function breakerIsOpen(layer: string): boolean {
  const st = breakers.get(layer);
  if (!st || !st.openedUntil) return false;
  if (Date.now() >= st.openedUntil) {
    st.openedUntil = undefined;
    st.failures = [];
    return false;
  }
  return true;
}

function breakerRecordFailure(layer: string): void {
  const now = Date.now();
  const st = breakers.get(layer) ?? { failures: [] };
  st.failures = st.failures.filter((t) => now - t < BREAKER_WINDOW_MS);
  st.failures.push(now);
  if (st.failures.length >= BREAKER_THRESHOLD) {
    st.openedUntil = now + BREAKER_COOLDOWN_MS;
    st.failures = [];
  }
  breakers.set(layer, st);
}

function breakerRecordSuccess(layer: string): void {
  const st = breakers.get(layer);
  if (!st) return;
  st.failures = [];
  st.openedUntil = undefined;
}

const BACKOFF_MS = [300, 1000, 3000];

export interface GeocodeResult {
  address_input: string;
  address_refined: string;
  point_wgs84: { x: number; y: number };
  structure: {
    level1: string;
    level2: string;
    level3?: string;
    level4L?: string;
    level4LC?: string;
    level4A?: string;
    level4AC?: string;
    level5?: string;
    detail?: string;
  };
}

export async function geocodeAddress(
  address: string,
  type: "parcel" | "road" = "parcel"
): Promise<GeocodeResult> {
  const cacheKey = `${type}::${address.trim()}`;
  const cached = cacheGet(geocodeCache, cacheKey);
  if (cached) return cached;

  const url = `${VWORLD_BASE}/address`;
  const { data } = await axios.get(url, {
    params: {
      service: "address",
      request: "getCoord",
      version: "2.0",
      crs: "epsg:4326",
      address,
      refine: "true",
      simple: "false",
      format: "json",
      type,
      key: getKey(),
    },
    timeout: 10_000,
  });

  const resp = data?.response;
  if (resp?.status !== "OK") {
    throw new VWorldError(
      `Geocoder failed for "${address}" (type=${type}): ${resp?.error?.text || resp?.status}`,
      resp?.error?.code || "GEOCODE_FAILED",
      resp?.error
    );
  }

  const result: GeocodeResult = {
    address_input: address,
    address_refined: resp.refined?.text || address,
    point_wgs84: {
      x: parseFloat(resp.result.point.x),
      y: parseFloat(resp.result.point.y),
    },
    structure: resp.refined?.structure || {},
  };
  cacheSet(geocodeCache, cacheKey, result);
  return result;
}

export interface FeatureQueryOptions {
  layer: string;
  point?: { x: number; y: number };
  attrFilter?: string;
  geomFilter?: string;
  size?: number;
  includeGeometry?: boolean;
}

export interface VWorldFeature {
  properties: Record<string, string | number | null>;
  geometry?: unknown;
}

function featureCacheKey(opts: FeatureQueryOptions, effectiveGeomFilter: string | undefined): string {
  const geomKey = effectiveGeomFilter
    ? `g:${effectiveGeomFilter}`
    : opts.point
    ? `p:${opts.point.x.toFixed(6)},${opts.point.y.toFixed(6)}`
    : "none";
  return JSON.stringify({
    l: opts.layer,
    geom: geomKey,
    attr: opts.attrFilter ?? null,
    size: opts.size ?? 10,
    inclGeom: opts.includeGeometry ? 1 : 0,
  });
}

export async function getFeatures(opts: FeatureQueryOptions): Promise<VWorldFeature[]> {
  const geomFilter =
    opts.geomFilter ??
    (opts.point ? `POINT(${opts.point.x} ${opts.point.y})` : undefined);

  if (!geomFilter && !opts.attrFilter) {
    throw new VWorldError(
      `getFeatures(${opts.layer}) requires point, geomFilter, or attrFilter`,
      "MISSING_FILTER"
    );
  }

  if (breakerIsOpen(opts.layer)) {
    throw new VWorldError(
      `Layer ${opts.layer} circuit breaker is open (recent failures exceeded threshold). Retry after cooldown.`,
      "BREAKER_OPEN"
    );
  }

  const key = featureCacheKey(opts, geomFilter);
  const cached = cacheGet(featureCache, key);
  if (cached) return cached;

  const params: Record<string, string | number> = {
    service: "data",
    request: "GetFeature",
    data: opts.layer,
    key: getKey(),
    domain: getDomain(),
    format: "json",
    size: opts.size ?? 10,
    geometry: opts.includeGeometry ? "true" : "false",
  };
  if (geomFilter) params.geomFilter = geomFilter;
  if (opts.attrFilter) params.attrFilter = opts.attrFilter;

  const doRequest = () =>
    axios.get(`${VWORLD_BASE}/data`, { params, timeout: 10_000, validateStatus: () => true });

  let res = await doRequest();
  for (let attempt = 0; attempt < BACKOFF_MS.length && res.status >= 500 && res.status < 600; attempt++) {
    await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
    res = await doRequest();
  }

  if (res.status >= 400) {
    breakerRecordFailure(opts.layer);
    throw new VWorldError(
      `HTTP ${res.status} on layer ${opts.layer}`,
      `HTTP_${res.status}`,
      res.data
    );
  }

  const data = res.data;
  const resp = data?.response;
  if (resp?.status === "NOT_FOUND") {
    breakerRecordSuccess(opts.layer);
    cacheSet(featureCache, key, []);
    return [];
  }
  if (resp?.status !== "OK") {
    breakerRecordFailure(opts.layer);
    throw new VWorldError(
      `Feature query failed on layer ${opts.layer}: ${resp?.error?.text || resp?.status}`,
      resp?.error?.code || "FEATURE_QUERY_FAILED",
      resp?.error
    );
  }

  breakerRecordSuccess(opts.layer);
  const features = (resp.result?.featureCollection?.features ?? []) as VWorldFeature[];
  cacheSet(featureCache, key, features);
  return features;
}

export function isPnu(s: string): boolean {
  return /^\d{19}$/.test(s.trim());
}

export function __resetVWorldStateForTests(): void {
  featureCache.clear();
  geocodeCache.clear();
  breakers.clear();
}
