import { useState, useEffect } from "react";
import axios from "axios";

const PreviousAnswers = () => {
    const [previousQuestions, setPreviousQuestions] = useState([]);

    const response = await axios.post("http://192.168.100.41:8000/question/", {
        question: initialQuestion,
      });