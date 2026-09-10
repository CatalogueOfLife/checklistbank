import React, {useEffect} from 'react';
import NameAutocomplete from '../pages/project/Assembly/NameAutocomplete';

const TaxonFormControl = ({ value, onChange, datasetKey, minRank, accepted = true, disabled = false }) => {
  
useEffect(() => {}, [datasetKey])
  const triggerChange = (name) => {
      if(name){
        // the backend copies name and authorship from the linked usage
        onChange?.({ id: name.key });
      } else {
        onChange?.(null);
      }
    
  };

  return (
    <NameAutocomplete
            disabled={disabled}
            autoFocus={false}
            minRank={minRank}
            accepted={accepted}
            datasetKey={datasetKey}
            defaultTaxonKey={value?.id}
            onSelectName={triggerChange}
            onResetSearch={() => triggerChange(null)}
          />
  );
};

export default TaxonFormControl;