import { truncate } from "../../components/util";

// Serve images through the GBIF image cache so we control size and benefit from
// caching. Mirrors the CachedImage pattern in NameIndex/UsageExtension.jsx
// (`unsafe/x360/${url}`). `size` is a thumbor-style spec, e.g. "x360" or
// "fit-in/1200x1200".
export const cachedImage = (url, size) =>
  `https://api.gbif.org/v1/image/unsafe/${size}/${url}`;

// The compact one-line caption shown under a thumbnail: capturedBy · captured
// date. Falls back to an abbreviated title, then remarks, when neither is
// present. The license is rendered separately as an icon, and the source link
// is always offered when present, so neither is part of this text.
export const captionText = (i) => {
  const bits = [];
  if (i.capturedBy) bits.push(i.capturedBy);
  if (i.captured) bits.push(i.captured);
  if (bits.length || i.license) {
    return bits.join(" · ");
  }
  return truncate(i.title || i.remarks, 48) || "";
};
