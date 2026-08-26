/**
 * Renders one entry of an export request for display.
 *
 * Every ExportRequest field is a scalar except `root`, which is a SimpleName.
 * That one used to be shown via `root.label`, but the API no longer serves it:
 * backend ab3ed107f ("Ignore parent and label props") put @JsonIgnore on
 * SimpleName.getLabel(), leaving `labelHtml` as the only rendered form. Reading
 * the gone `label` fell back to the object itself and printed
 * "root: [object Object]".
 *
 * `labelHtml` carries markup - names at genus rank and below are italicised -
 * so it is returned as `html`, to be injected. Anything without markup comes
 * back as `text`.
 *
 * @returns {{text: string} | {html: string}}
 */
export const formatRequestValue = (value) => {
  if (value === null || value === undefined) return { text: "" };
  if (typeof value !== "object") return { text: String(value) };
  if (value.labelHtml) return { html: value.labelHtml };
  if (value.name) return { text: String(value.name) };
  // Not a SimpleName after all - show the payload rather than "[object Object]".
  return { text: JSON.stringify(value) };
};
