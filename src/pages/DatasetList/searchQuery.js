// Pure helper that derives the next dataset-search query from an antd Table `onChange`.
//
// antd's `onChange(pagination, filters, sorter, extra)` reports the *current* sort/filter
// state of the **visible** columns. The active sort, however, may live on a column that is
// not currently visible (e.g. the default-hidden `issued` column the "COL Releases" shortcut
// sorts by). For such a hidden/inactive sort column antd returns `sorter.order === undefined`
// (see antd useSorter `generateSorterInfo` legacy-compat branch). Recomputing the sort on
// every change therefore silently drops it on pagination/filter actions.
//
// Fix: only a column-header sort interaction (`action === "sort"`) may rewrite sortBy/reverse.
// Pagination and filter changes preserve whatever sort is already in the query.
export const buildSearchQuery = (currentQuery, filters, sorter, action) => {
  const query = { ...currentQuery };

  Object.keys(filters || {}).forEach((key) => {
    if (filters[key] !== null) {
      query[key] = filters[key];
    } else {
      delete query[key];
    }
  });

  if (action === "sort") {
    if (sorter && sorter.order) {
      query.sortBy = sorter.columnKey || sorter.field;
      query.reverse = sorter.order === "descend";
    } else {
      delete query.sortBy;
      delete query.reverse;
    }
  }

  return query;
};
