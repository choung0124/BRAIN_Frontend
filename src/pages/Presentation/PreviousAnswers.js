import React, { useState, useEffect } from "react";
import axios from "axios";
import MKBox from "components/MKBox";
import MKInput from "components/MKInput";
import PreviousAnswerDropdown from "./PreviousAnswersDropdown";
import {
  AppBar,
  Tabs,
  Tab,
  Grid,
  Modal,
  Slide,
  Divider,
  Typography,
  Autocomplete,
} from "@mui/material";

import PropTypes from "prop-types";

const QuestionAutoComplete = ({ questions, handleQuestionChange }) => {
  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState("");

  return (
    <Autocomplete
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue);
        handleQuestionChange(newValue ? newValue : ""); // Corrected line
      }}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      options={questions}
      fullWidth
      renderInput={(params) => (
        <MKInput
          {...params}
          variant="standard"
          placeholder="Search for a question..."
          // ... any other MKInput props you need
        />
      )}
    />
  );
};
QuestionAutoComplete.propTypes = {
  questions: PropTypes.array.isRequired,
  handleQuestionChange: PropTypes.func.isRequired,
};

const PreviousAnswers = ({ toggleModal, show }) => {
  const [previousQuestions, setPreviousQuestions] = useState([]);
  const [question, setQuestion] = useState("");
  const [finalAnswer, setFinalAnswer] = useState([]);
  const [isAnswerLoading, setAnswerLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    getQuestions();
  }, []);

  useEffect(() => {
    console.log("Previous questions updated:", previousQuestions);
  }, [previousQuestions]);

  const getQuestions = async () => {
    const response = await axios.post("http://192.168.100.41:8000/previous_answers/", {});
    console.log("Response:", response);
    const { questions } = response.data;
    setPreviousQuestions(questions);
  };

  const getFinalAnswer = async (question) => {
    setAnswerLoading(true);
    const response = await axios.post("http://192.168.100.41:8000/fetch_final_answer/", {
      question,
    });
    const { answer } = response.data;
    console.log("Final answer:", answer);
    setFinalAnswer(answer);
    setAnswerLoading(false);
  };

  const handleQuestionChange = async (name) => {
    setQuestion(name);
    getFinalAnswer(name);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  return (
    <>
      {previousQuestions &&
        previousQuestions.map((mappedQuestion) => (
          <Modal
            key={mappedQuestion}
            open={show}
            onClose={toggleModal}
            sx={{ display: "grid", placeItems: "center" }}
          >
            <Slide direction="down" in={show}>
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
                <MKBox
                  display="flex"
                  style={{ minWidth: "97%" }}
                  flexWrap="none"
                  justifyContent="flex-end"
                  px={5}
                  paddingTop={4}
                  paddingBottom={2}
                >
                  <QuestionAutoComplete
                    questions={previousQuestions}
                    handleQuestionChange={handleQuestionChange}
                  />
                  <Divider sx={{ my: 0 }} />
                </MKBox>
                <Grid container item justifyContent="center" xs={12} lg={4} mx="auto">
                  <AppBar position="static">
                    <Tabs value={activeTab} onChange={handleTabChange}>
                      <Tab label="Final Answer" />
                      <Tab label="Sources" />
                    </Tabs>
                  </AppBar>
                </Grid>

                {!isAnswerLoading && activeTab === 0 && finalAnswer && (
                  <MKBox display="grid" p={7} py={4}>
                    <Typography variant="h4" gutterBottom align="center">
                      Final Answer
                    </Typography>
                    <Typography variant="body" textAlign="center">
                      {finalAnswer}
                    </Typography>
                  </MKBox>
                )}
                {!isAnswerLoading && activeTab === 1 && (
                  <MKBox>
                    <Grid container spacing={0} justifyContent="center">
                      <PreviousAnswerDropdown question={question} originalEntities={""} />
                    </Grid>
                  </MKBox>
                )}
              </MKBox>
            </Slide>
          </Modal>
        ))}
    </>
  );
};

PreviousAnswers.propTypes = {
  toggleModal: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default PreviousAnswers;
