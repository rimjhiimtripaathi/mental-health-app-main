// frontend/src/services/api.js
import axios from "axios";

// API base URL - adjust based on your environment
const API_BASE_URL = "http://localhost:8000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API calls
 */
export const authAPI = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   */
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - User login credentials
   */
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },
};

/**
 * Assessments API calls
 */
export const assessmentsAPI = {
  /**
   * Get user's assessments
   * @param {string} userId - User ID
   */
  getUserAssessments: async (userId) => {
    const response = await api.get(`/assessments/user/${userId}`);
    return response.data;
  },

  /**
   * Get user's assessments by type
   * @param {string} userId - User ID
   * @param {string} assessmentType - Type of assessment (phq9, gad7, who5)
   */
  getUserAssessmentsByType: async (userId, assessmentType) => {
    const response = await api.get(
      `/assessments/user/${userId}/${assessmentType}`
    );
    return response.data;
  },

  /**
   * Get specific assessment by ID
   * @param {number} assessmentId - Assessment ID
   */
  getAssessment: async (assessmentId) => {
    const response = await api.get(`/assessments/${assessmentId}`);
    return response.data;
  },

  /**
   * Submit a new assessment
   * @param {Object} assessmentData - Assessment data
   */
  submit: async (assessmentData) => {
    const response = await api.post("/assessments/submit", assessmentData);
    return response.data;
  },

  /**
   * Delete an assessment
   * @param {number} assessmentId - Assessment ID
   */
  deleteAssessment: async (assessmentId) => {
    const response = await api.delete(`/assessments/${assessmentId}`);
    return response.data;
  },
};

/**
 * AI Analysis API calls
 */
export const aiAnalysisAPI = {
  /**
   * Analyze emotions from audio
   * @param {string} audioData - Base64 encoded audio data
   * @param {string} userId - User ID
   */
  analyzeAudio: async (audioData, userId = null) => {
    const response = await api.post("/audio/analyze-audio", {
      audio_data: audioData,
      user_id: userId || localStorage.getItem("userId") || "current_user",
      sample_rate: 22050,
      duration: 5.0,
    });
    return response.data;
  },

  /**
   * Analyze emotions from text
   * @param {string} text - Text to analyze
   * @param {string} userId - User ID
   * @param {string} language - Language code (default: "en")
   */
  analyzeText: async (text, userId = null, language = "en") => {
    const response = await api.post("/text/analyze-text", {
      text: text,
      user_id: userId || localStorage.getItem("userId") || "current_user",
      language: language,
    });
    return response.data;
  },

  /**
   * Analyze emotions from video frame
   * @param {string} imageData - Base64 encoded image data
   * @param {string} userId - User ID
   * @param {number} frameCount - Number of frames (default: 1)
   */
  analyzeVideoFrame: async (imageData, userId = null, frameCount = 1) => {
    const response = await api.post("/video/analyze-video-frame", {
      video_data: imageData,
      user_id: userId || localStorage.getItem("userId") || "current_user",
      frame_count: frameCount,
    });
    return response.data;
  },

  /**
   * Analyze emotions from image
   * @param {string} imageData - Base64 encoded image data
   * @param {string} userId - User ID
   * @param {string} analysisType - Type of analysis: "facial" or "general"
   */
  analyzeImage: async (imageData, userId = null, analysisType = "facial") => {
    const response = await api.post("/image/analyze-image", {
      image_data: imageData,
      user_id: userId || localStorage.getItem("userId") || "current_user",
      analysis_type: analysisType,
    });
    return response.data;
  },

  /**
   * Get AI models status
   */
  getModelsStatus: async () => {
    const response = await api.get("/ai/models-status");
    return response.data;
  },

  /**
   * Get text analysis model status
   */
  getTextModelStatus: async () => {
    const response = await api.get("/text/text-model-status");
    return response.data;
  },

  /**
   * Get audio analysis model status
   */
  getAudioModelStatus: async () => {
    const response = await api.get("/audio/audio-model-status");
    return response.data;
  },

  /**
   * Get video analysis model status
   */
  getVideoModelStatus: async () => {
    const response = await api.get("/video/video-model-status");
    return response.data;
  },

  /**
   * Get image analysis model status
   */
  getImageModelStatus: async () => {
    const response = await api.get("/image/image-model-status");
    return response.data;
  },
};

/**
 * User profile API calls
 */
export const userAPI = {
  /**
   * Get user profile
   * @param {string} userId - User ID
   */
  getProfile: async (userId) => {
    const response = await api.get(`/users/profile/${userId}`);
    return response.data;
  },

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Updated profile data
   */
  updateProfile: async (userId, profileData) => {
    const response = await api.put(`/users/profile/${userId}`, profileData);
    return response.data;
  },
};

/**
 * Dashboard API calls
 */
export const dashboardAPI = {
  /**
   * Get dashboard data
   * @param {string} userId - User ID
   */
  getDashboardData: async (userId) => {
    const response = await api.get(`/dashboard/${userId}`);
    return response.data;
  },

  /**
   * Get user statistics
   * @param {string} userId - User ID
   */
  getUserStats: async (userId) => {
    const response = await api.get(`/dashboard/stats/${userId}`);
    return response.data;
  },
};

// Individual named exports for easier imports
export const analyzeAudioEmotion = aiAnalysisAPI.analyzeAudio;
export const analyzeVideoEmotion = aiAnalysisAPI.analyzeVideoFrame;
//export const analyzeTextEmotion = aiAnalysisAPI.analyzeText;
export const analyzeImageEmotion = aiAnalysisAPI.analyzeImage;

// Export specific model status checkers
export const getTextAnalysisStatus = aiAnalysisAPI.getTextModelStatus;
export const getAudioAnalysisStatus = aiAnalysisAPI.getAudioModelStatus;
export const getVideoAnalysisStatus = aiAnalysisAPI.getVideoModelStatus;
export const getImageAnalysisStatus = aiAnalysisAPI.getImageModelStatus;

//===Text Analysis APIs start======

// frontend/src/services/api.js

// Text Analysis API calls
export const analyzeTextEmotion = async (
  text,
  userId = "current_user",
  sessionId = null
) => {
  const response = await fetch("http://localhost:8000/api/text/analyze-text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text,
      user_id: userId,
      language: "en",
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Text analysis failed");
  }

  return await response.json();
};

// Get user sessions with date-wise grouping
export const getUserSessions = async (
  userId = "current_user",
  startDate = null,
  endDate = null
) => {
  let url = `http://localhost:8000/api/text/sessions?user_id=${userId}`;

  if (startDate) {
    url += `&start_date=${startDate}`;
  }
  if (endDate) {
    url += `&end_date=${endDate}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to fetch sessions");
  }

  return await response.json();
};

// Get detailed session analysis
export const getSessionDetails = async (
  userId = "current_user",
  sessionDate,
  sessionId = null
) => {
  let url = `http://localhost:8000/api/text/session-details?user_id=${userId}&session_date=${sessionDate}`;

  if (sessionId) {
    url += `&session_id=${sessionId}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to fetch session details");
  }

  return await response.json();
};

// Get historical results with pagination
export const getTextAnalysisHistory = async (
  userId = "current_user",
  page = 1,
  pageSize = 10
) => {
  const response = await fetch(
    `http://localhost:8000/api/text/results?user_id=${userId}&page=${page}&page_size=${pageSize}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to fetch history");
  }

  return await response.json();
};

// Get summary report
export const getTextAnalysisSummary = async (
  userId = "current_user",
  days = 30
) => {
  const response = await fetch(
    `http://localhost:8000/api/text/summary?user_id=${userId}&days=${days}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to fetch summary");
  }

  return await response.json();
};

// Export results
export const exportTextAnalysisResults = async (
  userId = "current_user",
  format = "json"
) => {
  const response = await fetch(
    `http://localhost:8000/api/text/export?user_id=${userId}&format=${format}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Export failed");
  }

  return await response.json();
};

// Get model status
export const getTextModelStatus = async () => {
  const response = await fetch(
    "http://localhost:8000/api/text/text-model-status"
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to get model status");
  }

  return await response.json();
};

//====Text Analysis APIs end=====================

export default api;
