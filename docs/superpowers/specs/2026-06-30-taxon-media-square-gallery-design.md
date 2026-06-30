# Taxon page: compact square media gallery with description modal

**Date:** 2026-06-30
**Component:** `src/pages/Taxon/TaxonMedia.jsx`
**Status:** Approved design

## Problem

Media items (mostly images) on taxon pages currently take up a lot of vertical
space. The existing `TaxonMedia.jsx` renders a 2-column grid of full-height
(`height={260}`, native aspect-ratio) images, each followed by a multi-line text
caption (title, © rightsHolder, capturedBy, captured date, link, license,
remarks). Long descriptions make the section sprawl, and the images cannot be
stepped through (each opens an independent antd `Image` preview, not a
`PreviewGroup`).

Reference taxon pages with heavy/long-caption media:
- https://www.checklistbank.org/dataset/29915/taxon/03858796EA19FF998DEAFE40FBBBF8E6.taxon
- https://www.checklistbank.org/dataset/23025/taxon/039CA20DFFAEFFD3FE8BA8D41688FE9C.taxon
- https://www.checklistbank.org/dataset/314569/nameusage/Q19939

## Goal

Replace the sprawling grid with a **compact square thumbnail gallery**. Each
square shows a short one/two-line piece of metadata and a link to the source
site underneath. Clicking a thumbnail opens a **custom modal** showing the full
image alongside its full description, with keyboard navigation to step through
all gallery items.

## Data shape

The media array comes straight from the `/dataset/{key}/taxon/{id}/info`
endpoint (no client-side transform). Each image item carries:

- `type` — filtered to `"image"`
- `url` — full-size original image URL
- `thumbnail` — resized thumbnail URL, already served via the GBIF image cache
- `title`
- `rightsHolder`
- `capturedBy` (e.g. `"Eric Snively;Anthony P. Russell"`)
- `captured` (date, e.g. `"2007-12-31"`)
- `link` — external source page (e.g. `"https://doi.org/10.5281/zenodo.3748378"`)
- `license` — CC license string (e.g. `"cc by"`)
- `remarks`

## Design

### Component structure

Rewrite `src/pages/Taxon/TaxonMedia.jsx` into focused pieces in the same file:

- **`TaxonMedia`** — default export, `({ media })`. Filters to
  `type === "image" && !!url`, renders the square grid, owns the open-item index
  state and the existing "Show more / Show fewer" pager, renders the modal.
- **`MediaThumb`** — one square thumbnail + its caption line + source-link icon.
  Click sets the open index.
- **`MediaModal`** — the custom lightbox: image left, description right,
  `‹ ›` arrows + keyboard nav.
- **`cachedImage(url, size)`** helper — routes a URL through the GBIF image cache.

### GBIF cache helper

```js
const cachedImage = (url, size) =>
  `https://api.gbif.org/v1/image/unsafe/${size}/${url}`;
```

Mirrors the existing `UsageExtension.jsx` `CachedImage` pattern
(`unsafe/x360/${url}`). Used so all images are served via the cache. The
pre-supplied `i.thumbnail` is already a cache URL and is used directly for the
grid; the modal image is cached at a larger size.

### The square grid

- A flex-wrap grid of **180px** squares with a small gap (responsive: as many per
  row as fit; fewer on narrow screens). Replaces the antd `Row`/`Col span={12}`
  layout.
- Thumbnail `src` = `i.thumbnail`, falling back to `cachedImage(i.url, "x360")`
  when `thumbnail` is absent. `objectFit: "cover"` crops to a square.
  `onError` falls back to `i.url`, then to the existing data-URI `fallback`
  placeholder. Reuse the `Skeleton.Image` placeholder while loading.
- **Caption line** beneath each square — compact, muted (`type="secondary"` /
  small font), at most ~two lines:
  - Primary: `capturedBy` · `captured` date · small `LicenseIcon`.
  - Fallback when none of those present: abbreviated `title`, then `remarks`
    (use `truncate` from `src/components/util`).
  - A `LinkOutlined` icon linking to `i.link` is shown **whenever `i.link`
    exists**, regardless of which text is shown.
- Keep the **"Show more / Show fewer"** pager with `PAGE_SIZE = 10` and the same
  local `limit` state. The pager slices `media` before mapping, exactly as today.

### The modal (custom, keyboard-navigable)

- antd `Modal`, ~900px wide, `footer={null}`, opened when an item index is set
  (`open={openIndex != null}`), closed by setting the index to `null`.
- Layout: a flex row.
  - **Left:** the full image via `cachedImage(i.url, "fit-in/1200x1200")`,
    `objectFit: "contain"`, capped to the modal's max height. `onError` falls
    back to `i.url`.
  - **Right:** a text column with `title`, `© rightsHolder`, `captured by` +
    `captured` date, `LicenseIcon` + `license`, `remarks`, the full description
    text, and an "open original ↗" link to `i.link`.
  - On narrow screens (CSS / antd `Grid` breakpoint) the right column stacks
    **below** the image.
- **Navigation:**
  - `‹` (`LeftOutlined`) / `›` (`RightOutlined`) buttons step `openIndex`.
  - Keyboard **← / →** move between items; **Esc** closes (antd `Modal` default).
    Add a `keydown` listener while the modal is open; clean it up on close.
  - **No wrap-around:** the `‹` button is disabled at index 0 and `›` is disabled
    at the last filtered item; the arrow keys are no-ops at the ends.
  - A small footer/label shows `"{n} / {total}"`.
- Indexing operates over the **filtered** image list (the same list rendered as
  thumbnails), so navigation and counts stay consistent with what's visible.
  Note the open index is into the full filtered list, not the `limit`-sliced
  page — opening from a thumbnail passes that item's index in the filtered list.

## Out of scope (YAGNI)

- Zoom / pan / rotate inside the modal — detail inspection is served by the
  "open original ↗" link. (This is the deliberate trade-off vs. the native antd
  preview viewer.)
- Non-image media types (audio/video) — current behavior filters to images only;
  unchanged.
- Any change to the `/info` API or the media data shape.

## Testing

Per repo convention (Vitest, no renderer — see `MEMORY.md`), unit-test pure
logic only:
- `cachedImage(url, size)` builds the expected GBIF cache URL.
- The caption-text selection helper (capturedBy/captured/license →
  title → remarks fallback) returns the right value for representative inputs.

Rendering, modal layout, and keyboard navigation are verified live in the
browser against the reference taxon pages above.
