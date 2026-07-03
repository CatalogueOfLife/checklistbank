# Name Matcher: fixed nomenclatural code + higher taxa context

## Goal

Let the user set a single **nomenclatural code** and one or more **higher taxa**
(name + major rank) that are applied as matching hints to *every* input record of
the **Simple data entry** form and the **synchronous CSV/TSV upload**. This gives
the matcher classification context for lists that would otherwise be bare name
strings (e.g. a plain list of genera), improving match quality and disambiguating
homonyms.

The controls live in the right-hand column of the Simple data entry panel — the
space that currently only holds the "Paste or write names…" help text — and are
repeated at the top of the CSV/TSV upload panel.

## Scope

- **In scope:** Simple data entry (sync only) and synchronous CSV/TSV upload.
- **Out of scope (for now):** Asynchronous CSV upload (the file is POSTed verbatim
  to the backend job endpoint, so UI-side context cannot be injected without
  rewriting the file or new job parameters) and the "Choose dataset in
  ChecklistBank" path (those records already carry a full classification and code).

## Decisions

1. **Rank set:** the major Linnean ranks — `kingdom, phylum, class, order,
   family`. Genus is intentionally excluded (it is derivable from the binomial
   names, so hinting it adds nothing). These map to the match API hint params.
2. **CSV precedence:** *fill gaps only.* The fixed code / higher taxa are applied
   to a record only where that record does not already carry a value for that
   field (per-row CSV columns win). Simple-entry records are bare, so everything
   is filled there.
3. **UI:** repeatable rank+name rows. Starts with one row (rank dropdown + name
   input); an "Add higher taxon" link adds more; each row is removable. A rank
   already chosen in another row is disabled in the dropdown to avoid duplicates.
4. **Nomenclatural code:** a single-select dropdown (allow-clear) sourced from the
   `nomCode` enumeration already in `AppContext`.

## How it works

### State (in `NameMatch`)

The dormant `const [defaultCode] = useState(null)` becomes settable:

```js
const [defaultCode, setDefaultCode] = useState(null);
const [higherTaxa, setHigherTaxa] = useState([{ rank: undefined, name: "" }]);
```

`nomCode` is added to `mapContextToProps` and passed to the controls.

### Applying the context — at match time

`matchParams()` already forwards `code` and the classification hint ranks
(`API_HINT_PARAMS`, which include kingdom…genus) to the match API, so no change is
needed there. We merge the fixed context into each record just before matching:

```js
// Merge the fixed code + higher taxa into a record. Returns a NEW object so the
// base input array is never mutated; existing per-record values win (gap-fill).
const applyMatchContext = (rec) => {
  const merged = { ...rec };
  if (defaultCode && !merged.code) merged.code = defaultCode;
  higherTaxa.forEach(({ rank, name }) => {
    const n = (name || "").trim();
    if (rank && n && !merged[rank]) merged[rank] = n;
  });
  return merged;
};
```

`matchResult` maps this over the input and stores the merged records so the result
table and TSV download reflect the injected context:

```js
const matchResult = async (namesArg, { applyContext = true } = {}) => {
  setNumMatchedNames(0);
  let result = namesArg || names;
  if (applyContext) { result = result.map(applyMatchContext); setNames(result); }
  ...
};
```

The dataset-picker path opts out: `getSubjectDataAndMatch` calls
`matchResult(result, { applyContext: false })` (it already sets `code` itself and
higher-taxa hints are meaningless for a full-classification source).

### UI component

A new `src/pages/tools/NameMatchContext.jsx` renders the code select + repeatable
higher-taxa rows. Props: `code, onCodeChange, higherTaxa, onHigherTaxaChange,
nomCode, disabled`. Rendered:

- In the Simple data entry panel's right `Col span={8}`, below the existing help
  paragraph.
- At the top of the CSV/TSV upload panel, only when `!asyncMode`.

## Testing

Vitest has no renderer here, so verification is: (1) a unit test for
`applyMatchContext` gap-fill semantics if extracted as a pure helper, and (2) live
browser check — set code + a couple of higher taxa, run a simple-entry match,
confirm the request URL carries `&code=` and `&genus=` etc. and the result/TSV
reflect them.

## Known limitation

Re-matching the *same* list after changing the context re-derives merged records
from the already-merged array, so a previously gap-filled value is not overwritten
by a new one. The normal flow (set context → enter names → match once → download)
is unaffected; changing context then re-typing/re-uploading works cleanly.
