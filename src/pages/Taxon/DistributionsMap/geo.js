// Pure GeoJSON helpers shared by the MapLibre maps.

export const computeBounds = (features) => {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  const visit = (coords) => {
    if (typeof coords[0] === "number") {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else {
      for (let i = 0; i < coords.length; i++) visit(coords[i]);
    }
  };
  for (let i = 0; i < features.length; i++) {
    const g = features[i]?.geometry;
    if (g?.coordinates) visit(g.coordinates);
  }
  if (minLng === Infinity) return null;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
};

export const flattenFeatures = (geojson) => {
  if (!geojson) return [];
  if (geojson.type === "FeatureCollection") return geojson.features || [];
  return [geojson];
};

const geometryParts = (geometry) => {
  switch (geometry?.type) {
    case "Polygon":
      return [geometry.coordinates];
    case "MultiPolygon":
      return geometry.coordinates;
    case "MultiLineString":
    case "LineString":
    case "MultiPoint":
    case "Point":
      return [geometry.coordinates];
    case "GeometryCollection":
      return (geometry.geometries || []).flatMap(geometryParts);
    default:
      return [];
  }
};

// Like computeBounds, but shapes that cross the antimeridian (Russia, Fiji) fit
// to their actual extent rather than to the whole world. Finds the widest stretch
// of longitude that no part of the shape covers, and starts the bounds after it.
// The eastern bound may exceed 180, which MapLibre accepts for fitBounds.
export const computeWrappedBounds = (features) => {
  const extents = features
    .flatMap((f) => geometryParts(f?.geometry))
    .map((part) => computeBounds([{ geometry: { coordinates: part } }]))
    .filter(Boolean);
  if (extents.length === 0) return null;

  const minLat = Math.min(...extents.map(([sw]) => sw[1]));
  const maxLat = Math.max(...extents.map(([, ne]) => ne[1]));
  const sorted = extents
    .map(([sw, ne]) => [sw[0], ne[0]])
    .sort((a, b) => a[0] - b[0]);

  // the gap around the back of the globe, from the last part to the first
  let reach = Math.max(...sorted.map(([, east]) => east));
  let widestGap = sorted[0][0] + 360 - reach;
  let west = sorted[0][0];
  let east = reach;
  let covered = sorted[0][1];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i][0] - covered;
    if (gap > widestGap) {
      widestGap = gap;
      west = sorted[i][0];
      east = covered + 360;
    }
    covered = Math.max(covered, sorted[i][1]);
  }
  return [
    [west, minLat],
    [east, maxLat],
  ];
};
