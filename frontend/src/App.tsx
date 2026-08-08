import { Navigate, Route, Routes } from "react-router-dom";
import { InterviewSetupPage } from "./pages/InterviewSetupPage";
import { LandingPage } from "./pages/LandingPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/interview/setup" element={<InterviewSetupPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
