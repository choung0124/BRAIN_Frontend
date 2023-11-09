import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import GraphContainer from "./GraphVisualization/GraphVisualization";
import { Typography, Grid, MenuItem, Menu, Icon, Divider } from "@mui/material";

import MKBox from "components/MKBox";
import MKButton from "components/MKButton";

import PropTypes from "prop-types";

function MenuComponent({ dropdownOpen, anchorEl, onClose, answerNames, handleAnswerNameChange }) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={dropdownOpen}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
    >
      {answerNames.map((name) => (
        <MenuItem
          onClick={() => {
            handleAnswerNameChange(name);
            onClose();
          }}
          key={name}
        >
          {name}
        </MenuItem>
      ))}
    </Menu>
  );
}

//props validation
MenuComponent.propTypes = {
  dropdownOpen: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  answerNames: PropTypes.array.isRequired,
  handleAnswerNameChange: PropTypes.func.isRequired,
};

function PreviousAnswerDropdown({ question, originalEntities }) {
  const dropdown = useRef(null);
  const [answerNames, setAnswerNames] = useState([]);
  const [detailedAnswer, setDetailedAnswer] = useState(null);
  const [graphRels, setGraphRels] = useState([]);
  const dropdownButtonRef = React.useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedAnswerName, setSelectedAnswerName] = useState(null); // Add this line

  const openDropdown = () => setDropdownOpen(true);
  const closeDropdown = () => setDropdownOpen(false);

  const loadAnswerNames = async () => {
    try {
      const response = await axios.post("http://192.168.100.41:8000/load_answers/", { question });
      setAnswerNames(response.data.answer_names);
    } catch (error) {
      console.error("Error loading answer names:", error);
    }
  };

  const handleAnswerNameChange = async (name) => {
    try {
      const response = await axios.post("http://192.168.100.41:8000/retrieve_answer/", {
        answer_name: name,
      });
      setDetailedAnswer(response.data.answer);
      setGraphRels(response.data.graph_rels);
      setSelectedAnswerName(name); // Add this line
    } catch (error) {
      console.error("Error retrieving answer:", error);
    }
  };

  const iconStyles = {
    ml: 1,
    fontWeight: "bold",
    transition: "transform 200ms ease-in-out",
  };

  const dropdownIconStyles = {
    transform: dropdown ? "rotate(180deg)" : "rotate(0)",
    ...iconStyles,
  };

  useEffect(() => {
    loadAnswerNames();
  }, []);

  return (
    <MKBox component="section" py={0}>
      <MKBox
        position="relative"
        width="100vh"
        maxHeight="90vh"
        overflow="auto"
        display="flex"
        flexDirection="column"
        borderRadius="xl"
        bgColor="white"
        shadow="xl"
        mx="auto"
      >
        {answerNames.length > 0 ? (
          <>
            <MKBox display="flex" alignItems="center" justifyContent="center" p={2} py={2}>
              <MKButton
                variant="gradient"
                color="info"
                onClick={openDropdown}
                ref={dropdownButtonRef}
              >
                {selectedAnswerName} <Icon sx={dropdownIconStyles}>expand_more</Icon>
              </MKButton>
              <MenuComponent
                dropdownOpen={dropdownOpen}
                anchorEl={dropdownButtonRef.current}
                onClose={closeDropdown}
                answerNames={answerNames}
                handleAnswerNameChange={handleAnswerNameChange}
              />
            </MKBox>
            <Divider sx={{ my: 0 }} />
            {detailedAnswer && (
              <MKBox display="flex" p={5} py={4}>
                <Typography variant="body2" textAlign="center">
                  {detailedAnswer}
                </Typography>
              </MKBox>
            )}
            <Divider sx={{ my: 0 }} />
            {graphRels.length > 0 && (
              <Grid item xs={12}>
                <div style={{ position: "relative" }}>
                  {" "}
                  <GraphContainer
                    relations={graphRels}
                    originalEntities={originalEntities}
                    style={{ position: "relative", zIndex: 1 }} // Set SVG position and z-index
                  />
                </div>
              </Grid>
            )}
          </>
        ) : (
          <MKBox px={6} py={5}>
            <Typography variant="body2" textAlign="center">
              No Supporting Evidence
            </Typography>
          </MKBox>
        )}
      </MKBox>
    </MKBox>
  );
}

PreviousAnswerDropdown.propTypes = {
  question: PropTypes.string.isRequired,
  originalEntities: PropTypes.array.isRequired,
};

export default PreviousAnswerDropdown;
