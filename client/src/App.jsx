import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";

import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import StudentPage from "./pages/StudentPage";
import TestPage from "./pages/TestPage";
import ResultPage from "./pages/ResultPage";

import StartTestPage from "./pages/StartTestPage";
import TestEntryRoute from "./routes/TestEntryRoute"; // 🔥 NEW
import ExamSubmitted from "./pages/ExamSubmitted";
function App(){

  return(
    <>
      {/* 🔥 3D Splash Screen Animation */}
      <SplashScreen />
      <BrowserRouter>
        
      <Routes>

        <Route path="/" element={<AuthPage/>} />

        <Route path="/admin/*" element={<AdminPage/>} />
        <Route path="/student/*" element={<StudentPage/>} />

        {/* 🔥 SMART ENTRY */}
        <Route path="/test/:id" element={<TestEntryRoute />} />

        {/* 🔥 FORM PAGE */}
        <Route path="/start/:id" element={<StartTestPage />} />

        {/* 🔥 EXAM PAGE */}
        <Route path="/exam/:id" element={<TestPage />} />

        <Route path="/result/:id" element={<ResultPage />} />
        <Route path="/exam-submitted"element={<ExamSubmitted />}/>

      </Routes>

      </BrowserRouter>
    </>
  );

}

export default App;