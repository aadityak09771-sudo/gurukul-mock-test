import React from "react";
import { useNavigate } from "react-router-dom";
import "./ExamSubmitted.css";

const ExamSubmitted = () => {

  const navigate = useNavigate();

  // ✅ CHECK IF STUDENT LOGGED IN
  const authData = JSON.parse(localStorage.getItem("auth") || "{}");
  const isLoggedIn = !!authData?.user;

  const goBack = () => {

    if (isLoggedIn) {

      navigate("/student");

    } else {

      navigate("/");

    }

  };

  return (

    <div className="submitted-page">

      <div className="submitted-card">

        <div className="success-icon">
          🎉
        </div>

        <h1>
          Thank You!
        </h1>

        <h2>
          Your Exam Has Been Submitted Successfully
        </h2>

        <p>
          Your responses have been recorded securely.
          Please wait for your instructor/admin
          to publish the result.
        </p>

        <button
          className="back-btn"
          onClick={goBack}
        >
          Back
        </button>

      </div>

    </div>

  );

};

export default ExamSubmitted;