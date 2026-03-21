// frontend/src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Assessments from "./pages/assessments/Assessments";
import AudioAnalysis from "./pages/analysis/AudioAnalysis";
import VideoAnalysis from "./pages/analysis/VideoAnalysis";
import TextAnalysis from "./pages/analysis/TextAnalysis"; // New import
import ImageAnalysis from "./pages/analysis/ImageAnalysis";
import Profile from "./pages/profile/Profile";
import "./styles/globals.css";

/**
 * Main application component with routing and layout
 */
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        {user ? (
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Navbar />
              <main className="flex-1 overflow-y-auto p-6">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/assessments" element={<Assessments />} />
                  <Route path="/audio-analysis" element={<AudioAnalysis />} />
                  <Route path="/video-analysis" element={<VideoAnalysis />} />
                  <Route path="/image-analysis" element={<ImageAnalysis />} />
                  <Route
                    path="/text-analysis"
                    element={<TextAnalysis />}
                  />{" "}
                  {/* New route */}
                  <Route path="/profile" element={<Profile />} />
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </main>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </Router>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
