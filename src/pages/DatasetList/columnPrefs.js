// Which dataset-list columns are shown, persisted per browser.
//
// localStorage stores the *excluded* keys - that is what the table filters on and
// what older releases already wrote, so the key and its shape stay as they were.
// The settings modal is checkbox driven and thinks in *visible* keys instead, so
// these two convert between the representations.
//
// Both sides intersect with the current column list, so keys left over from a
// release that had different columns simply drop out instead of accumulating.

export const HIDE_COLUMNS_STORAGE_KEY = "colplus_datasetlist_hide_columns";

export const excludedFrom = (allKeys, visibleKeys) =>
  allKeys.filter((k) => !visibleKeys.includes(k));

export const visibleFrom = (allKeys, excludedKeys) =>
  allKeys.filter((k) => !excludedKeys.includes(k));
