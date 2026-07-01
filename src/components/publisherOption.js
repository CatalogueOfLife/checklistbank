// Display label for a publisher suggestion: "<name> (<count>)", count optional.
export const publisherOptionLabel = ({ key, count }) =>
  count != null ? `${key} (${count})` : `${key}`;
