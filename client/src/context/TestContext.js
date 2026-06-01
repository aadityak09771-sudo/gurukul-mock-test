import { createContext, useState } from "react";

export const TestContext = createContext();

export const TestProvider = ({ children }) => {
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});

  return (
    <TestContext.Provider value={{ test, setTest, answers, setAnswers }}>
      {children}
    </TestContext.Provider>
  );
};