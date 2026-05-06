import { BrowserRouter as Router, Routes, Route } from "react-router";
import "./App.css";
import Navbar from "./components/Navbar";
import ErpChat from "./pages/ErpChat";
import Login from "./pages/Login";
import StudyMate from "./pages/StudyMate";

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        <Route path="/erp-chat" element={<ErpChat />} />
        <Route path="/studymate" element={<StudyMate />} />
      </Routes>
    </Router>
  );
};

export default App;
