import React from "react";
import PublisherAutocomplete from "./PublisherAutocomplete";
const PublisherFormControl = ({ value, onChange, disabled }) => {
  const triggerChange = (publisher) => {
    if (publisher) {
      onChange?.(publisher);
    } else {
      onChange?.(null);
    }
  };

  return (
    <PublisherAutocomplete
      disabled={disabled}
      defaultPublisherKey={value?.id || value?.key}
      onSelectPublisher={triggerChange}
      onResetSearch={() => triggerChange(null)}
    />
  );
};

export default PublisherFormControl;
