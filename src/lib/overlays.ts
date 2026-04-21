import { getFeatures, VWorldError, VWorldFeature } from "./vworld.js";

export interface LayerDef {
  id: string;
  label: string;
}

export interface OverlayHit {
  layer: string;
  layer_label: string;
  name: string;
  code?: string;
  designation_year?: string;
  designation_number?: string;
  sido?: string;
  sigg?: string;
  properties: Record<string, string | number | null>;
}

export interface LayerQueryError {
  layer: string;
  layer_label: string;
  error_code: string;
  error_message: string;
}

export interface OverlayQueryResult {
  hits: OverlayHit[];
  errors: LayerQueryError[];
}

const NAME_KEYS = [
  "uname",
  "name",
  "zonename",
  "e_name",
  "dname",
  "title",
  "nm",
  "zone_name",
  "dan_name",
  "cat_nam",
  "dgm_nm",
  "upj_name",
];
const CODE_KEYS = ["ucode", "e_code", "code", "zone_cd", "cd"];

function pickField(props: Record<string, string | number | null>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = props[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") return String(v);
  }
  return undefined;
}

export function featureToHit(layer: LayerDef, feature: VWorldFeature): OverlayHit {
  const p = feature.properties || {};
  return {
    layer: layer.id,
    layer_label: layer.label,
    name: pickField(p, NAME_KEYS) ?? "(unnamed)",
    code: pickField(p, CODE_KEYS),
    designation_year: p.dyear !== undefined && p.dyear !== null ? String(p.dyear) : undefined,
    designation_number: p.dnum !== undefined && p.dnum !== null ? String(p.dnum) : undefined,
    sido: p.sido_name !== undefined && p.sido_name !== null ? String(p.sido_name) : undefined,
    sigg: p.sigg_name !== undefined && p.sigg_name !== null ? String(p.sigg_name) : undefined,
    properties: p,
  };
}

export interface QueryOverlaysOptions {
  perLayerSize?: number;
  radius_m?: number;
}

export function pointToBox(point: { x: number; y: number }, radius_m: number): string {
  const dLat = radius_m / 111_000;
  const dLon = radius_m / (111_000 * Math.cos((point.y * Math.PI) / 180));
  return `BOX(${point.x - dLon},${point.y - dLat},${point.x + dLon},${point.y + dLat})`;
}

export async function queryOverlays(
  layers: LayerDef[],
  point: { x: number; y: number },
  opts: QueryOverlaysOptions | number = {}
): Promise<OverlayQueryResult> {
  const options: QueryOverlaysOptions = typeof opts === "number" ? { perLayerSize: opts } : opts;
  const perLayerSize = options.perLayerSize ?? 5;
  const geomFilter = options.radius_m && options.radius_m > 0
    ? pointToBox(point, options.radius_m)
    : undefined;

  const results = await Promise.all(
    layers.map(async (layer) => {
      try {
        const feats = geomFilter
          ? await getFeatures({ layer: layer.id, geomFilter, size: perLayerSize })
          : await getFeatures({ layer: layer.id, point, size: perLayerSize });
        return { layer, feats, error: null as LayerQueryError | null };
      } catch (e) {
        const err: LayerQueryError =
          e instanceof VWorldError
            ? {
                layer: layer.id,
                layer_label: layer.label,
                error_code: e.code ?? "UNKNOWN",
                error_message: e.message,
              }
            : {
                layer: layer.id,
                layer_label: layer.label,
                error_code: "UNHANDLED",
                error_message: e instanceof Error ? e.message : String(e),
              };
        return { layer, feats: [] as VWorldFeature[], error: err };
      }
    })
  );

  const hits: OverlayHit[] = [];
  const errors: LayerQueryError[] = [];
  for (const r of results) {
    if (r.error) errors.push(r.error);
    for (const f of r.feats) hits.push(featureToHit(r.layer, f));
  }
  return { hits, errors };
}
