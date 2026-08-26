/**
 * Renders one entry of an export request as the text of a tag.
 *
 * Every ExportRequest field is a scalar except `root`, which is a SimpleName.
 * That one was shown via `root.label` until backend ab3ed107f ("Ignore parent
 * and label props") put @JsonIgnore on SimpleName.getLabel() and dropped it
 * from the JSON. Reading the gone `label` fell through to the object itself
 * and printed "root: [object Object]".
 *
 * `label` is being restored to SimpleName, so it stays the preferred form -
 * these pills are plain text, and `labelHtml` would only bring markup that has
 * to be injected. Until that lands the bare `name` stands in, losing just the
 * authorship.
 */
export const formatRequestValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);
  if (value.label) return String(value.label);
  if (value.name) return String(value.name);
  // Not a SimpleName after all - show the payload rather than "[object Object]".
  return JSON.stringify(value);
};
