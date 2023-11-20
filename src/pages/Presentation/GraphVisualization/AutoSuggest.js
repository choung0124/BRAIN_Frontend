// NodeAutosuggest.js
import React, { useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import PropTypes from "prop-types";
import MKInput from "components/MKInput";

const NodeAutosuggest = ({ nodes, onSuggestionSelected }) => {
  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState("");

  return (
    <Autocomplete
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue);
        onSuggestionSelected(newValue ? newValue.label : ""); // Corrected line
      }}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      options={nodes}
      renderInput={(params) => (
        <MKInput
          {...params}
          variant="standard"
          placeholder="Search for a node..."
          // ... any other MKInput props you need
        />
      )}
    />
  );
};

export default NodeAutosuggest;

NodeAutosuggest.propTypes = {
  nodes: PropTypes.array.isRequired,
  onSuggestionSelected: PropTypes.func.isRequired,
};
