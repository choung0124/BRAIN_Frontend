import React, { useState, useEffect } from "react";
import axios from "axios";
import MKBox from "components/MKBox";
import MKInput from "components/MKInput";
import MKTypography from "components/MKTypography";
import PreviousAnswerDropdown from "./PreviousAnswersDropdown";
import {
  CircularProgress,
  AppBar,
  Switch,
  Tabs,
  Tab,
  Grid,
  Modal,
  Typography,
  Autocomplete,
} from "@mui/material";

import PropTypes from "prop-types";

const QuestionAutoComplete = ({
  questions,
  handleQuestionChange,
  toggleStatus,
  setAnswerLoaded,
}) => {
  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState("");

  // useEffect to clear the input value when toggleStatus changes
  useEffect(() => {
    setValue(null); // Clear the selected value
    setInputValue(""); // Clear the input field
  }, [toggleStatus]); // Depend on toggleStatus

  useEffect(() => {
    if (inputValue === "") {
      setAnswerLoaded(false);
    }
  }, [inputValue, setAnswerLoaded]);

  return (
    <Autocomplete
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue);
        if (newValue === null) {
          setAnswerLoaded(false);
        }
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
          variant="outlined"
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
  toggleStatus: PropTypes.bool.isRequired,
  setAnswerLoaded: PropTypes.func.isRequired,
};

function Toggle({ handleToggleChange }) {
  const [checked, setChecked] = useState(false);

  const toggleChecked = (newChecked) => {
    setChecked(newChecked);
    handleToggleChange(newChecked);
  };

  return (
    <MKBox display="flex">
      <MKTypography
        variant="button"
        color="text"
        fontWeight="regular"
        mr={0}
        paddingTop={1}
        sx={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => toggleChecked(false)}
      >
        Complete
      </MKTypography>
      <Switch checked={checked} onChange={() => toggleChecked(!checked)} />
      <MKTypography
        variant="button"
        color="text"
        fontWeight="regular"
        ml={0}
        paddingTop={1}
        sx={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => toggleChecked(true)}
      >
        Running
      </MKTypography>
    </MKBox>
  );
}

Toggle.propTypes = {
  handleToggleChange: PropTypes.func.isRequired,
};

const PreviousAnswers = ({ toggleModal, show }) => {
  const [previousQuestions, setPreviousQuestions] = useState([]);
  const [question, setQuestion] = useState("");
  const [finalAnswer, setFinalAnswer] = useState([]);
  const [answerLoaded, setAnswerLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [runningMode, setRunningMode] = useState(false); // [false, true
  const [runningQuestions, setRunningQuestions] = useState([]);

  const getCurrentQuestions = () => (runningMode ? runningQuestions : previousQuestions);

  useEffect(() => {
    const getQuestions = async () => {
      const response = await axios.post("http://192.168.100.41:8000/previous_answers/", {});
      console.log("Response:", response);
      setPreviousQuestions(response.data.questions);
      if (response.data.running_questions.length === 0) {
        setRunningQuestions(["No running questions found."]);
      } else {
        setRunningQuestions(response.data.running_questions);
      }
    };
    getQuestions();
  }, []);

  const getFinalAnswer = async (question) => {
    const response = await axios.post("http://192.168.100.41:8000/fetch_final_answer/", {
      question,
    });
    const { answer } = response.data;
    console.log("Final answer:", answer);
    setAnswerLoaded(true);
    setFinalAnswer(answer);
  };

  const handleQuestionChange = async (name) => {
    setQuestion(name);
    if (name) {
      getFinalAnswer(name);
    } else {
      setAnswerLoaded(false); // Reset when question is cleared
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleToggleChange = (checked) => {
    setAnswerLoaded(false);
    if (checked) {
      console.log("Toggle changed, new value:", checked);
      setRunningMode(true);
    } else {
      setRunningMode(false);
    }
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
            <MKBox
              position="relative"
              width="100vh"
              maxHeight="90vh"
              overflow="auto"
              display="flex"
              flexDirection="column"
              borderRadius="xl"
              bgColor="white"
              mx="auto"
            >
              <MKBox
                display="flex"
                style={{ minWidth: "97%" }}
                flexWrap="none"
                justifyContent="flex-end"
                px={6}
                paddingTop={5}
                paddingBottom={0}
              >
                <QuestionAutoComplete
                  questions={getCurrentQuestions()}
                  handleQuestionChange={handleQuestionChange}
                  toggleStatus={runningMode}
                  setAnswerLoaded={setAnswerLoaded}
                />
              </MKBox>
              <MKBox
                display="flex"
                justifyContent="flex-end"
                marginRight={7}
                marginTop={0.5}
                marginBottom={answerLoaded ? 0 : 1}
              >
                <Toggle handleToggleChange={handleToggleChange} />
              </MKBox>
              {!runningMode ? (
                answerLoaded ? (
                  <MKBox>
                    <Grid container item justifyContent="center" xs={12} lg={4} mx="auto">
                      <AppBar position="static">
                        <Tabs value={activeTab} onChange={handleTabChange}>
                          <Tab label="Final Answer" />
                          <Tab label="Sources" />
                        </Tabs>
                      </AppBar>
                    </Grid>

                    {activeTab === 0 && finalAnswer && (
                      <MKBox display="grid" p={7} py={4} marginBottom={2}>
                        <Typography variant="h4" gutterBottom align="center">
                          Final Answer
                        </Typography>
                        <Typography variant="body" textAlign="center">
                          {finalAnswer}
                        </Typography>
                      </MKBox>
                    )}
                    {activeTab === 1 && (
                      <MKBox>
                        <Grid container spacing={0} justifyContent="center">
                          <PreviousAnswerDropdown
                            key={question}
                            question={question}
                            originalEntities={""}
                          />
                        </Grid>
                      </MKBox>
                    )}
                  </MKBox>
                ) : (
                  <></>
                )
              ) : answerLoaded ? (
                <MKBox>
                  <MKBox display="flex" paddingBottom={6} justifyContent="center">
                    <MKTypography variant="h4" marginRight={2}>
                      {" "}
                      Processing...
                    </MKTypography>
                    <CircularProgress color="inherit" />
                  </MKBox>
                  <MKBox></MKBox>
                </MKBox>
              ) : (
                <></>
              )}
            </MKBox>
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
