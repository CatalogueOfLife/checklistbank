import React from 'react';
import DatasetAutocomplete from '../pages/catalogue/Assembly/DatasetAutocomplete';

const DatasetFormControl = ({ value, onChange }) => {

  const triggerChange = (dataset) => {
      if(dataset){
        onChange?.(dataset?.key)
      } else {
        onChange?.(null);
      }
    
  };

  return (
    <DatasetAutocomplete
        defaultDatasetKey={value}
        onSelectDataset={triggerChange}
        onResetSearch={() => triggerChange(null)}
          />
  );
};

export default DatasetFormControl;