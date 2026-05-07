import { BrowserRouter as Router, Routes, Route } from "react-router";
import "./App.css";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ErpChat from "./pages/ErpChat";
import Login from "./pages/Login";
import StudyMate from "./pages/StudyMate";
import Homepage from "./pages/Homepage";
import Profile from "./pages/Profile";

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/erp-chat"
          element={
            <ProtectedRoute>
              <ErpChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studymate"
          element={
            <ProtectedRoute>
              <StudyMate />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
