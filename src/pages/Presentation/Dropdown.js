import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import GraphContainer from "./GraphVisualization/GraphVisualization";
import {
  Container,
  Typography,
  Grid,
  MenuItem,
  Menu,
  Icon,
  Modal,
  Slide,
  Divider,
} from "@mui/material";

import { firebaseAuth } from "firebaseConfig";

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

function Dropdown({ question, originalEntities }) {
  const dropdown = useRef(null);
  const [answerNames, setAnswerNames] = useState([]);
  const [detailedAnswer, setDetailedAnswer] = useState(null);
  const [graphRels, setGraphRels] = useState([]);
  const dropdownButtonRef = React.useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedAnswerName, setSelectedAnswerName] = useState("All Sources");
  const [show, setShow] = useState(false);
  const toggleModal = () => setShow(!show);

  const openDropdown = () => setDropdownOpen(true);
  const closeDropdown = () => setDropdownOpen(false);

  const uid = firebaseAuth.currentUser.uid;

  const loadAnswerNames = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/load_answers/`, {
        question,
        uid,
      });
      setAnswerNames(response.data.answer_names);
      console.log(response.data.answer_names);
    } catch (error) {
      console.error("Error loading answer names:", error);
    }
  };

  const handleAnswerNameChange = async (name) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/retrieve_answer/`, {
        answer_name: name,
        uid,
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
    <MKBox component="section" py={6}>
      <Container>
        {answerNames && answerNames.length > 0 ? (
          <Grid container item spacing={3} justifyContent="center" xs={12}>
            <MKButton variant="gradient" color="info" onClick={toggleModal}>
              Sources
            </MKButton>
          </Grid>
        ) : (
          <Typography variant="body2" textAlign="center">
            No Supporting Sources
          </Typography>
        )}
        <Modal open={show} onClose={toggleModal} sx={{ display: "grid", placeItems: "center" }}>
          <Slide direction="down" in={show}>
            <MKBox
              position="relative"
              width="80vh"
              maxHeight="90vh"
              overflow="auto"
              display="flex"
              flexDirection="column"
              borderRadius="xl"
              bgColor="white"
              shadow="xl"
              mx="auto"
            >
              <MKBox display="flex" alignItems="center" justifyContent="center" p={4} py={4}>
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
            </MKBox>
          </Slide>
        </Modal>
      </Container>
    </MKBox>
  );
}

Dropdown.propTypes = {
  question: PropTypes.string.isRequired,
  originalEntities: PropTypes.array.isRequired,
};

export default Dropdown;
