// frontend/src/pages/analysis/AudioAnalysis.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  Square,
  Play,
  Upload,
  Info,
  Download,
  Calendar,
  RefreshCw,
} from "lucide-react";
import EmotionResults from "../../components/analysis/EmotionResults";
import HistoricalReports from "../../components/analysis/HistoricalReports";
import VisualizationTabs from "../../components/analysis/VisualizationTabs";

/**
 * INSTRUCTIONS:
 * 1. Record audio using the microphone or upload an audio file
 * 2. Click "Analyze Emotions" to process the audio
 * 3. View results in charts and historical context
 * 4. Use mock-up data when backend is unavailable
 * 5. Export results or view historical reports
 *
 * Audio analysis page for emotion detection from voice recordings
 */

// Mock historical data for demonstration
const MOCK_HISTORICAL_DATA = [
  {
    id: 1,
    timestamp: "2024-01-15T10:30:00Z",
    dominant_emotion: "happy",
    confidence: 0.82,
    duration: 4.2,
    emotions: {
      happy: 0.82,
      sad: 0.05,
      angry: 0.03,
      fearful: 0.02,
      surprised: 0.04,
      disgusted: 0.01,
      neutral: 0.03,
    },
  },
  {
    id: 2,
    timestamp: "2024-01-14T15:45:00Z",
    dominant_emotion: "neutral",
    confidence: 0.76,
    duration: 3.8,
    emotions: {
      happy: 0.25,
      sad: 0.12,
      angry: 0.08,
      fearful: 0.05,
      surprised: 0.1,
      disgusted: 0.04,
      neutral: 0.76,
    },
  },
  {
    id: 3,
    timestamp: "2024-01-13T09:15:00Z",
    dominant_emotion: "sad",
    confidence: 0.68,
    duration: 5.1,
    emotions: {
      happy: 0.1,
      sad: 0.68,
      angry: 0.12,
      fearful: 0.15,
      surprised: 0.03,
      disgusted: 0.02,
      neutral: 0.2,
    },
  },
  {
    id: 4,
    timestamp: "2024-01-12T18:20:00Z",
    dominant_emotion: "angry",
    confidence: 0.71,
    duration: 4.5,
    emotions: {
      happy: 0.08,
      sad: 0.15,
      angry: 0.71,
      fearful: 0.1,
      surprised: 0.12,
      disgusted: 0.08,
      neutral: 0.16,
    },
  },
];

// Mock analysis data for immediate display
const MOCK_ANALYSIS_DATA = {
  emotions: {
    happy: 0.45,
    sad: 0.15,
    angry: 0.08,
    fearful: 0.12,
    surprised: 0.18,
    disgusted: 0.05,
    neutral: 0.25,
  },
  dominant_emotion: "happy",
  confidence: 0.78,
  duration: 4.2,
  timestamp: new Date().toISOString(),
  sample_data: true,
};

const AudioAnalysis = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(MOCK_ANALYSIS_DATA); // Start with mock data
  const [error, setError] = useState("");
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Load historical data on component mount
  useEffect(() => {
    loadHistoricalData();
  }, []);

  /**
   * Load historical analysis data
   */
  const loadHistoricalData = async () => {
    setIsLoadingHistory(true);
    try {
      // Try to fetch from backend first
      const response = await fetch(
        "http://localhost:8000/api/audio/history?user_id=current_user"
      );

      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data.history || []);
      } else {
        // Fallback to mock data
        setHistoricalData(MOCK_HISTORICAL_DATA);
      }
    } catch (err) {
      console.error("Failed to load historical data, using mock data:", err);
      setHistoricalData(MOCK_HISTORICAL_DATA);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  /**
   * Start audio recording using browser MediaRecorder API
   */
  const startRecording = async () => {
    try {
      setError("");
      setResults(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 22050,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audioBlob);
        // Don't set results here - wait for analysis
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied or not available");
    }
  };

  /**
   * Stop audio recording
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  /**
   * Handle file upload for audio analysis
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioBlob(file);
      setResults(null);
      setError("");
    } else {
      setError("Please select a valid audio file (WAV, MP3, FLAC, M4A, WEBM)");
    }
  };

  /**
   * Trigger file input click
   */
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  /**
   * Analyze audio emotion using backend API
   */
  const analyzeAudio = async () => {
    if (!audioBlob) {
      setError("Please record or upload an audio file first");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio_file", audioBlob);
      formData.append("user_id", "current_user"); // Replace with actual user ID
      formData.append("sample_rate", "22050");

      const response = await fetch("http://localhost:8000/api/audio/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `Analysis failed: ${response.statusText}`
        );
      }

      const analysisResults = await response.json();
      setResults(analysisResults);

      // Refresh historical data after new analysis
      loadHistoricalData();
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Analysis failed: " + err.message);

      // Fallback to sample data if backend is not available
      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("Network")
      ) {
        setError("Backend connection failed. Showing sample data.");
        const sampleData = generateSampleData();
        setResults(sampleData);

        // Add to historical data for demonstration
        const newHistoricalEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          dominant_emotion: sampleData.dominant_emotion,
          confidence: sampleData.confidence,
          duration: sampleData.duration,
          emotions: sampleData.emotions,
          sample_data: true,
        };
        setHistoricalData((prev) => [newHistoricalEntry, ...prev.slice(0, 9)]);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Generate sample data for demonstration
   */
  const generateSampleData = () => {
    const emotions = [
      "happy",
      "sad",
      "angry",
      "fearful",
      "surprised",
      "disgusted",
      "neutral",
    ];
    const dominantEmotion =
      emotions[Math.floor(Math.random() * emotions.length)];

    const emotionData = {};
    emotions.forEach((emotion) => {
      if (emotion === dominantEmotion) {
        emotionData[emotion] = Math.random() * 0.3 + 0.6; // Higher value for dominant
      } else {
        emotionData[emotion] = Math.random() * 0.3;
      }
    });

    // Normalize to sum to 1
    const sum = Object.values(emotionData).reduce((a, b) => a + b, 0);
    Object.keys(emotionData).forEach((key) => {
      emotionData[key] = parseFloat((emotionData[key] / sum).toFixed(3));
    });

    return {
      emotions: emotionData,
      dominant_emotion: dominantEmotion,
      confidence: Math.random() * 0.3 + 0.7,
      duration: (Math.random() * 7 + 3).toFixed(1),
      timestamp: new Date().toISOString(),
      sample_data: true,
    };
  };

  /**
   * Download analysis results as JSON
   */
  const downloadResults = () => {
    if (!results) return;

    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `emotion-analysis-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Reset the analysis
   */
  const resetAnalysis = () => {
    setAudioBlob(null);
    setResults(MOCK_ANALYSIS_DATA); // Reset to mock data
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Audio Emotion Analysis
        </h1>
        <p className="text-gray-600 mt-2">
          Record your voice or upload an audio file to analyze emotions using
          advanced AI
        </p>
      </motion.div>

      {/* Guidelines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4"
      >
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900">
              Recording Guidelines
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Speak clearly and at a normal volume for best results</li>
              <li>
                • Record in a quiet environment with minimal background noise
              </li>
              <li>• Optimal recording length: 3-10 seconds</li>
              <li>• Supported formats: WAV, MP3, FLAC, M4A, WEBM</li>
              <li>• Ensure microphone permissions are granted for recording</li>
            </ul>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Recording Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Record Audio
          </h2>

          {/* Recording Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={isAnalyzing}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Square className="w-5 h-5" />
                  <span>Stop Recording</span>
                </button>
              )}
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="flex items-center justify-center space-x-2 text-red-500">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Recording... Speak now</span>
              </div>
            )}

            {/* Audio Preview and Analyze Button */}
            {audioBlob && !isRecording && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <strong>Audio ready for analysis:</strong>
                </div>
                <audio
                  controls
                  src={URL.createObjectURL(audioBlob)}
                  className="w-full"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={analyzeAudio}
                    disabled={isAnalyzing}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
                  >
                    {isAnalyzing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                    <span>
                      {isAnalyzing ? "Analyzing..." : "Analyze Emotions"}
                    </span>
                  </button>
                  <button
                    onClick={resetAnalysis}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Show mock data info when no recording is made */}
            {!audioBlob && !isRecording && (
              <div className="text-center text-gray-500 py-4">
                <p className="text-sm">
                  Record audio or upload a file to analyze emotions
                </p>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Or Upload Audio File
            </h3>
            <div
              onClick={triggerFileInput}
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400">
                  WAV, MP3, FLAC, M4A, WEBM
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="audio/*"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </motion.div>

        {/* Right Column - Analysis Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Analysis Results
            </h2>
            <div className="flex space-x-2">
              {results && (
                <button
                  onClick={downloadResults}
                  className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              )}
              <button
                onClick={loadHistoricalData}
                disabled={isLoadingHistory}
                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isLoadingHistory ? "animate-spin" : ""
                  }`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {results?.sample_data && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-700 text-sm text-center">
                  📊 Showing sample data (backend connection unavailable)
                </p>
              </div>
            )}

            {/* Enhanced Visualization Section */}
            <div className="space-y-4">
              <EmotionResults results={results} />
              <VisualizationTabs results={results} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Historical Reports - Bottom Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Historical Reports
          </h2>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>

        <HistoricalReports
          historicalData={historicalData}
          isLoading={isLoadingHistory}
          currentResult={results}
        />
      </motion.div>
    </div>
  );
};

export default AudioAnalysis;
