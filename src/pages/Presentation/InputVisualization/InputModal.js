import React, { useState } from "react";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import MKButton from "components/MKButton";
import MKInput from "components/MKInput";
import PropTypes from "prop-types";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { MenuItem, Menu, Icon, Divider } from "@mui/material";

const entityTypeDropDownItems = [
  "Amino_acid_sequence",
  "Analytical_sample",
  "Biological_process",
  "Biological_sample",
  "Cellular_component",
  "Chromosome",
  "Clinical_variable",
  "Clinically_relevant_variant",
  "Complex",
  "Disease",
  "Drug",
  "Experiment",
  "Experimental_factor",
  "Food",
  "Functional_region",
  "GWAS_study",
  "Gene",
  "Known_variant",
  "Metabolite",
  "Modification",
  "Modified_protein",
  "Molecular_function",
  "Pathway",
  "Peptide",
  "Phenotype",
  "Project",
  "Protein",
  "Protein_structure",
  "Publication",
  "Subject",
  "Timepoint",
  "Tissue",
  "Transcript",
  "Units",
];

function EntityTypeDropDown({ setCurrentEntityType, currentEntityType }) {
  const [dropdown, setDropdown] = useState(null);
  const [selectedEntityType, setSelectedEntityType] = useState("Select the Entity type");
  const openDropdown = ({ currentTarget }) => setDropdown(currentTarget);
  const closeDropdown = () => setDropdown(null);

  const iconStyles = {
    ml: 1,
    fontWeight: "bold",
    transition: "transform 200ms ease-in-out",
  };

  const dropdownIconStyles = {
    transform: dropdown ? "rotate(180deg)" : "rotate(0)",
    ...iconStyles,
  };

  return (
    <MKBox>
      <MKButton
        variant="gradient"
        color="info"
        onClick={
          currentEntityType && currentEntityType !== "start_node"
            ? () => setCurrentEntityType(null)
            : openDropdown
        }
        sx={{ width: "100%", flexGrow: 1 }}
      >
        {selectedEntityType}{" "}
        <Icon sx={dropdownIconStyles}>
          {currentEntityType && currentEntityType !== "start_node" ? "close" : "expand_more"}
        </Icon>
      </MKButton>
      <Menu anchorEl={dropdown} open={Boolean(dropdown)} onClose={closeDropdown}>
        {entityTypeDropDownItems.map((entityType) => (
          <MenuItem
            key={entityType}
            onClick={() => {
              setCurrentEntityType(entityType);
              setSelectedEntityType(entityType);
              console.log(entityType);
              closeDropdown();
            }}
          >
            {entityType}
          </MenuItem>
        ))}
      </Menu>
    </MKBox>
  );
}

EntityTypeDropDown.propTypes = {
  setCurrentEntityType: PropTypes.func.isRequired,
  currentEntityType: PropTypes.string,
};

const InputModal = React.forwardRef(
  (
    {
      currentEntityType,
      clickedNode,
      setInputChildren,
      inputChildren,
      setEntityConstituents,
      updateGraph,
      constituentsDict,
      setConstituentsDict,
      pathsList,
      setPathsList,
      runGraphQA,
      entity,
      updateEntities,
    },
    ref
  ) => {
    const [updatedEntityType, setUpdatedEntityType] = useState(null);

    if (["Food", "Metabolite", "Drug"].includes(currentEntityType)) {
      return (
        <div ref={ref} tabIndex="-1" style={{ outline: "none" }}>
          <MKBox
            position="relative"
            width="40vh"
            maxHeight="90vh"
            overflow="auto"
            display="flex"
            flexDirection="column"
            borderRadius="xl"
            bgColor="white"
            shadow="xl"
            mx="auto"
            outline="none"
          >
            <MKBox display="flex" alignItems="center" justifyContent="center" p={4} py={2}>
              <MKTypography id="simple-modal-title" variant="h4">
                Change the Chemical Constituents of {clickedNode}
              </MKTypography>
            </MKBox>

            <MKBox display="flex" alignItems="center" justifyContent="center">
              <MKInput
                type="text"
                placeholder="Enter children"
                value={inputChildren}
                onChange={(e) => setInputChildren(e.target.value)}
                style={{ width: "90%" }}
              />
            </MKBox>

            <MKBox display="flex" alignItems="center" justifyContent="end" p={3} py={2}>
              <MKButton
                variant="gradient"
                color="info"
                onClick={() => {
                  const newChildren = inputChildren
                    .split(",")
                    .map((item) => item.trim()) // trim whitespace from each item
                    .filter((item) => item); // remove any empty strings
                  if (newChildren.length > 0) {
                    // ensure there's at least one non-empty string
                    updateGraph(newChildren, clickedNode); // Update the graph with the new children and the parent node name
                    setInputChildren(""); // Clear the input field
                    setEntityConstituents((prev) => [...prev, ...newChildren]); // Merge the newChildren array with the existing entityConstituents
                  }
                }}
              >
                Add
              </MKButton>
            </MKBox>
            <Divider sx={{ my: 0 }} />
            {Object.entries(constituentsDict).map(
              ([entity, constituents]) =>
                entity === clickedNode ? ( // Only render the constituents of the clicked entity
                  <MKBox
                    key={entity}
                    display="flex"
                    px={3}
                    flexWrap="wrap"
                    justifyContent="flex-end"
                    sx={{ paddingBottom: "0.5rem", paddingTop: "1rem" }}
                  >
                    {constituents
                      .filter((constituent) => constituent !== entity)
                      .map((constituent) => (
                        <MKButton
                          variant="gradient"
                          key={constituent}
                          color="error"
                          sx={{ marginLeft: "0.5rem", marginBottom: "0.5rem" }}
                          onClick={() => {
                            //remove constituent from constituentsDict
                            const newConstituents = constituents.filter(
                              (item) => item !== constituent
                            );
                            setConstituentsDict((prev) => ({
                              ...prev,
                              [entity]: newConstituents,
                            }));
                            //remove constituent from pathsList
                            const newPathsList = pathsList.filter(
                              (item) => item.nodes[1] !== constituent
                            );
                            setPathsList(newPathsList);
                            updateGraph([constituent], clickedNode, true);
                          }}
                        >
                          {constituent} {""} <RemoveCircleOutlineIcon />
                        </MKButton>
                      ))}
                  </MKBox>
                ) : null // Render nothing for other entities
            )}
          </MKBox>
        </div>
      );
    }

    if (currentEntityType === "start_node") {
      return (
        <div ref={ref} tabIndex="-1" style={{ outline: "none" }}>
          <MKBox
            position="relative"
            width="40vh"
            maxHeight="90vh"
            overflow="auto"
            display="flex"
            flexDirection="column"
            borderRadius="xl"
            bgColor="white"
            shadow="xl"
            mx="auto"
          >
            <MKBox display="flex" alignItems="center" justifyContent="center" p={4} py={2}>
              <MKTypography id="simple-modal-title" variant="h4">
                Add Start Entities
              </MKTypography>
            </MKBox>

            <MKBox display="flex" alignItems="center" justifyContent="center">
              <MKInput
                type="text"
                placeholder="Enter children"
                value={inputChildren}
                onChange={(e) => setInputChildren(e.target.value)}
                style={{ width: "90%" }}
              />
            </MKBox>
            <MKBox display="flex" alignItems="center" justifyContent="flex-end" p={3}>
              <MKBox sx={{ paddingLeft: "0.5rem", order: 2 }}>
                <MKButton
                  variant="gradient"
                  color="info"
                  onClick={() => {
                    const newChildren = inputChildren
                      .split(",")
                      .map((item) => item.trim()) // trim whitespace from each item
                      .filter((item) => item); // remove any empty strings
                    if (newChildren.length > 0) {
                      // ensure there's at least one non-empty string
                      console.log("new children", newChildren[0]);
                      console.log(updatedEntityType);
                      setUpdatedEntityType(updatedEntityType);
                      updateEntities(newChildren[0], updatedEntityType);
                      updateGraph(newChildren, clickedNode); // Update the graph with the new children and the parent node name
                      setInputChildren(""); // Clear the input field
                      setUpdatedEntityType(null);
                    }
                  }}
                >
                  Add
                </MKButton>
              </MKBox>
              <EntityTypeDropDown
                setCurrentEntityType={setUpdatedEntityType}
                currentEntityType={currentEntityType}
              />
            </MKBox>
            <Divider sx={{ my: 0 }} />
            {Object.entries(constituentsDict).map(
              ([entity, constituents]) =>
                entity === clickedNode ? ( // Only render the constituents of the clicked entity
                  <MKBox
                    key={entity}
                    display="flex"
                    px={3}
                    flexWrap="wrap"
                    justifyContent="flex-end"
                    sx={{ paddingBottom: "0.5rem", paddingTop: "1rem" }}
                  >
                    {constituents.map((constituent) => (
                      <MKButton
                        variant="gradient"
                        key={constituent}
                        color="error"
                        sx={{ marginLeft: "0.5rem", marginBottom: "0.5rem" }}
                        onClick={() => {
                          // First, update the constituentsDict.
                          setConstituentsDict((prevDict) => {
                            // Create a new dictionary without the constituent.
                            const newDict = { ...prevDict };
                            newDict[entity] = prevDict[entity].filter(
                              (item) => item !== constituent
                            );

                            // If the updated array is empty, delete the key from the dictionary.
                            if (newDict[entity].length === 0) {
                              delete newDict[entity];
                            }
                            return newDict;
                          });

                          // Then, update the pathsList.
                          setPathsList((prevPaths) =>
                            prevPaths.filter((path) => path.nodes[1] !== constituent)
                          );

                          // After that, handle the graph update.
                          updateGraph([constituent], clickedNode, true);

                          // Finally, update the entities.
                          updateEntities(constituent, null, true);
                        }}
                      >
                        {constituent} {""} <RemoveCircleOutlineIcon />
                      </MKButton>
                    ))}
                  </MKBox>
                ) : null // Render nothing for other entities
            )}
            <Divider sx={{ my: 0 }} />
            <MKBox display="flex" alignItems="center" justifyContent="flex-end" py={2}>
              <MKButton
                variant="gradient"
                color="primary"
                onClick={runGraphQA}
                sx={{ marginRight: "1.5rem" }}
              >
                Run GraphQA
              </MKButton>
            </MKBox>
          </MKBox>
        </div>
      );
    } else {
      return (
        <div ref={ref} tabIndex="-1" style={{ outline: "none" }}>
          <MKTypography variant="h6" gutterBottom>
            No constituents to input for {entity}
          </MKTypography>
        </div>
      );
    }
  }
);

export default InputModal;

InputModal.propTypes = {
  currentEntityType: PropTypes.string.isRequired,
  clickedNode: PropTypes.string.isRequired,
  setInputChildren: PropTypes.func.isRequired,
  inputChildren: PropTypes.string.isRequired,
  updateGraph: PropTypes.func.isRequired,
  constituentsDict: PropTypes.object.isRequired,
  setConstituentsDict: PropTypes.func.isRequired,
  pathsList: PropTypes.array.isRequired,
  setPathsList: PropTypes.func.isRequired,
  runGraphQA: PropTypes.func.isRequired,
  setEntityConstituents: PropTypes.func.isRequired,
  entity: PropTypes.string.isRequired,
  updateEntities: PropTypes.func.isRequired,
};
