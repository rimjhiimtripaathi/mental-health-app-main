// frontend/src/pages/analysis/VideoAnalysis.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Square,
  Play,
  Upload,
  Camera,
  BarChart3,
  Download,
  Circle,
  TrendingUp,
  Activity,
  History,
  PieChart,
  Info,
  Calendar,
} from "lucide-react";
import { analyzeVideoEmotion } from "../../services/api";
import EmotionResults from "../../components/analysis/EmotionResults";
import VisualizationTabs from "../../components/analysis/VisualizationTabs";
import HistoricalReports from "../../components/analysis/HistoricalReports";

/**
 * INSTRUCTIONS:
 * 1. Start camera to begin video capture
 * 2. Use "Analyze Single Frame" for specific moments or "Start Live Analysis" for continuous monitoring
 * 3. View real-time results with emotion charts and breakdowns
 * 4. Use mock-up data when backend is unavailable
 * 5. Export results or view historical reports
 *
 * Video analysis page for real-time emotion detection from video stream
 */

/**
 * Mock sample data for demonstration when backend data is not available
 */
const MOCK_SAMPLE_DATA = {
  sessionSummary: {
    totalFrames: 150,
    sessionDuration: "2 minutes 30 seconds",
    averageConfidence: 78.5,
    mostCommonEmotion: "happy",
    analysisDate: "2024-01-15T10:30:00Z",
  },
  emotionDistribution: {
    happy: 45,
    neutral: 35,
    surprised: 20,
    sad: 15,
    angry: 10,
    fearful: 15,
    disgust: 10,
  },
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
  timelineData: [
    { timestamp: "10:30:15", emotion: "happy", confidence: 82 },
    { timestamp: "10:30:30", emotion: "neutral", confidence: 76 },
    { timestamp: "10:30:45", emotion: "surprised", confidence: 89 },
    { timestamp: "10:31:00", emotion: "happy", confidence: 85 },
    { timestamp: "10:31:15", emotion: "sad", confidence: 71 },
    { timestamp: "10:31:30", emotion: "happy", confidence: 88 },
    { timestamp: "10:31:45", emotion: "neutral", confidence: 79 },
    { timestamp: "10:32:00", emotion: "surprised", confidence: 92 },
  ],
  historicalReports: [
    {
      id: 1,
      date: "2024-01-14",
      duration: "3 minutes",
      totalFrames: 180,
      dominantEmotion: "neutral",
      averageConfidence: 72.3,
      emotions: {
        happy: 0.4,
        sad: 0.2,
        angry: 0.15,
        fearful: 0.1,
        surprised: 0.25,
        disgusted: 0.05,
        neutral: 0.65,
      },
    },
    {
      id: 2,
      date: "2024-01-13",
      duration: "4 minutes",
      totalFrames: 240,
      dominantEmotion: "happy",
      averageConfidence: 81.7,
      emotions: {
        happy: 0.85,
        sad: 0.25,
        angry: 0.2,
        fearful: 0.15,
        surprised: 0.35,
        disgusted: 0.15,
        neutral: 0.45,
      },
    },
    {
      id: 3,
      date: "2024-01-12",
      duration: "2 minutes",
      totalFrames: 120,
      dominantEmotion: "surprised",
      averageConfidence: 75.2,
      emotions: {
        happy: 0.3,
        sad: 0.15,
        angry: 0.1,
        fearful: 0.25,
        surprised: 0.55,
        disgusted: 0.1,
        neutral: 0.35,
      },
    },
  ],
};

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

const VideoAnalysis = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStreamAnalyzing, setIsStreamAnalyzing] = useState(false);
  const [results, setResults] = useState(MOCK_ANALYSIS_DATA);
  const [error, setError] = useState("");
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [streamResults, setStreamResults] = useState([]);
  const [fps, setFps] = useState(0);
  const [analysisFps, setAnalysisFps] = useState(0);
  const [totalFramesAnalyzed, setTotalFramesAnalyzed] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [showMockData, setShowMockData] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState("current");
  const [historicalData, setHistoricalData] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const analysisFrameRef = useRef(null);
  const frameCountRef = useRef(0);
  const analysisCountRef = useRef(0);
  const startTimeRef = useRef(0);
  const analysisStartTimeRef = useRef(0);

  // Load historical data on component mount
  useEffect(() => {
    loadHistoricalData();
  }, []);

  /**
   * Load historical analysis data
   */
  const loadHistoricalData = async () => {
    try {
      // Try to fetch from backend first
      const response = await fetch(
        "http://localhost:8000/api/video/history?user_id=current_user"
      );

      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data.history || []);
      } else {
        // Fallback to mock data
        setHistoricalData(MOCK_SAMPLE_DATA.historicalReports);
      }
    } catch (err) {
      console.error("Failed to load historical data, using mock data:", err);
      setHistoricalData(MOCK_SAMPLE_DATA.historicalReports);
    }
  };

  /**
   * Start video recording and capture
   */
  const startVideoCapture = async () => {
    try {
      setError("");
      setResults(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Start FPS calculation
      startTimeRef.current = performance.now();
      frameCountRef.current = 0;
      calculateFPS();

      setIsRecording(true);
      setSessionStartTime(new Date());
      setShowMockData(false);
    } catch (err) {
      setError("Camera access denied or not available");
      console.error("Camera error:", err);
    }
  };

  /**
   * Calculate FPS for video stream
   */
  const calculateFPS = useCallback(() => {
    if (!isRecording) return;

    frameCountRef.current++;
    const currentTime = performance.now();
    const elapsed = currentTime - startTimeRef.current;

    if (elapsed >= 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / elapsed));
      frameCountRef.current = 0;
      startTimeRef.current = currentTime;
    }

    animationFrameRef.current = requestAnimationFrame(calculateFPS);
  }, [isRecording]);

  /**
   * Calculate Analysis FPS
   */
  const calculateAnalysisFPS = useCallback(() => {
    if (!isStreamAnalyzing) return;

    analysisCountRef.current++;
    const currentTime = performance.now();
    const elapsed = currentTime - analysisStartTimeRef.current;

    if (elapsed >= 1000) {
      setAnalysisFps(Math.round((analysisCountRef.current * 1000) / elapsed));
      analysisCountRef.current = 0;
      analysisStartTimeRef.current = currentTime;
    }
  }, [isStreamAnalyzing]);

  /**
   * Capture frame from video for analysis
   */
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 for analysis
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  /**
   * Analyze single captured video frame
   */
  const analyzeVideo = async () => {
    const frame = captureFrame();
    if (!frame) {
      setError("Please start camera first");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      // Extract base64 data (remove data URL prefix)
      const base64Data = frame.split(",")[1];

      const analysisResults = await analyzeVideoEmotion(base64Data);
      setResults(analysisResults);
      setShowMockData(false);

      // Add to history
      const newAnalysis = {
        id: Date.now(),
        type: "single_frame",
        timestamp: new Date().toISOString(),
        dominantEmotion: analysisResults.dominant_emotion,
        confidence: analysisResults.confidence,
        fullResults: analysisResults,
      };

      setAnalysisHistory((prev) => [newAnalysis, ...prev.slice(0, 9)]);
    } catch (err) {
      setError(
        "Analysis failed: " + (err.message || "Please check your connection")
      );
      console.error("Video analysis error:", err);
      // Show mock data if backend fails
      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("connection")
      ) {
        setShowMockData(true);
        setResults(MOCK_ANALYSIS_DATA);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Start continuous stream analysis
   */
  const startStreamAnalysis = useCallback(async () => {
    if (!isRecording) {
      setError("Please start camera first");
      return;
    }

    setIsStreamAnalyzing(true);
    setStreamResults([]);
    setAnalysisFps(0);
    analysisCountRef.current = 0;
    analysisStartTimeRef.current = performance.now();
    setTotalFramesAnalyzed(0);
    setShowMockData(false);

    const analyzeFrame = async () => {
      if (!isStreamAnalyzing) return;

      try {
        const frame = captureFrame();
        if (frame) {
          const base64Data = frame.split(",")[1];
          const analysisResults = await analyzeVideoEmotion(base64Data);

          setStreamResults((prev) => {
            const newResults = [...prev, analysisResults];
            return newResults.slice(-100);
          });

          setResults(analysisResults);
          setTotalFramesAnalyzed((prev) => prev + 1);
          analysisCountRef.current++;

          // Add to history every 10 frames
          if (totalFramesAnalyzed % 10 === 0) {
            const newAnalysis = {
              id: Date.now(),
              type: "stream_frame",
              timestamp: new Date().toISOString(),
              dominantEmotion: analysisResults.dominant_emotion,
              confidence: analysisResults.confidence,
              fullResults: analysisResults,
            };
            setAnalysisHistory((prev) => [newAnalysis, ...prev.slice(0, 19)]);
          }
        }
      } catch (err) {
        console.error("Stream analysis error:", err);
        if (streamResults.length === 0) {
          setShowMockData(true);
          setResults(MOCK_ANALYSIS_DATA);
        }
      }

      // Continue analysis
      if (isStreamAnalyzing) {
        analysisFrameRef.current = setTimeout(analyzeFrame, 200);
      }
    };

    analyzeFrame();
  }, [
    isRecording,
    isStreamAnalyzing,
    captureFrame,
    totalFramesAnalyzed,
    streamResults.length,
  ]);

  /**
   * Stop continuous stream analysis
   */
  const stopStreamAnalysis = () => {
    setIsStreamAnalyzing(false);
    if (analysisFrameRef.current) {
      clearTimeout(analysisFrameRef.current);
    }
  };

  /**
   * Stop video capture
   */
  const stopVideoCapture = () => {
    stopStreamAnalysis();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsRecording(false);
    setFps(0);
    setAnalysisFps(0);
  };

  /**
   * Handle file upload for video analysis
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setError("");

      // Create a preview
      const videoUrl = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = videoUrl;
        setIsRecording(true);
      }
    } else {
      setError("Please select a valid video file");
    }
  };

  /**
   * Export analysis results
   */
  const exportResults = () => {
    if (!results && streamResults.length === 0) return;

    const data = {
      sessionStart: sessionStartTime,
      sessionEnd: new Date().toISOString(),
      totalFramesAnalyzed: totalFramesAnalyzed,
      streamResults: streamResults,
      latestResult: results,
      emotionSummary: getEmotionSummary(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-emotion-analysis-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Clear current analysis
   */
  const clearAnalysis = () => {
    setResults(MOCK_ANALYSIS_DATA);
    setStreamResults([]);
    setAnalysisHistory([]);
    setTotalFramesAnalyzed(0);
    setError("");
  };

  /**
   * Show mock sample data
   */
  const showSampleData = () => {
    setShowMockData(true);
    setActiveReportTab("historical");
  };

  /**
   * Get emotion summary for charts
   */
  const getEmotionSummary = () => {
    if (showMockData && activeReportTab === "historical") {
      return MOCK_SAMPLE_DATA.emotionDistribution;
    }

    const emotionCounts = {};
    const allResults =
      streamResults.length > 0 ? streamResults : results ? [results] : [];

    allResults.forEach((result) => {
      const dominantEmotion = result.dominant_emotion;
      emotionCounts[dominantEmotion] =
        (emotionCounts[dominantEmotion] || 0) + 1;
    });

    return emotionCounts;
  };

  /**
   * Get dominant emotion from stream results
   */
  const getStreamDominantEmotion = () => {
    if (showMockData && activeReportTab === "historical") {
      return MOCK_SAMPLE_DATA.sessionSummary.mostCommonEmotion;
    }

    if (streamResults.length === 0) return null;

    const emotionCounts = {};
    streamResults.forEach((result) => {
      const emotion = result.dominant_emotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });

    return Object.keys(emotionCounts).reduce((a, b) =>
      emotionCounts[a] > emotionCounts[b] ? a : b
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisFrameRef.current) {
        clearTimeout(analysisFrameRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const emotionSummary = getEmotionSummary();
  const streamDominantEmotion = getStreamDominantEmotion();
  const totalFrames = streamResults.length || (results ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Real-Time Video Emotion Analysis
        </h1>
        <p className="text-gray-600 mt-2">
          Continuous emotion detection from live video stream using advanced AI
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
              Video Analysis Guidelines
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Ensure good lighting on your face for clear video capture
              </li>
              <li>
                • Position face clearly in the frame and maintain stable camera
              </li>
              <li>
                • Use single frame analysis for specific moments or live
                analysis for continuous monitoring
              </li>
              <li>• Optimal session length: 2-5 minutes for best results</li>
              <li>
                • Ensure camera permissions are granted for video recording
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Video Capture Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Live Video Stream
          </h2>

          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-64 object-cover"
            />

            {/* Status Overlays */}
            {isRecording && (
              <>
                <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                  {fps} FPS
                </div>

                {isStreamAnalyzing && (
                  <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                    Analysis: {analysisFps} FPS
                  </div>
                )}

                <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isRecording ? "bg-red-500" : "bg-gray-500"
                    } animate-pulse`}
                  ></div>
                  <span className="text-white text-sm bg-black bg-opacity-70 px-2 py-1 rounded">
                    {isRecording ? "Live" : "Offline"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Control Buttons */}
          <div className="space-y-4">
            {/* Camera Controls */}
            <div className="flex items-center justify-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={startVideoCapture}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <button
                  onClick={stopVideoCapture}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Square className="w-5 h-5" />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>

            {/* Analysis Controls */}
            {isRecording && (
              <div className="grid grid-cols-2 gap-4">
                {/* Single Frame Analysis */}
                <div className="space-y-2">
                  <button
                    onClick={analyzeVideo}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
                  >
                    {isAnalyzing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                    <span>
                      {isAnalyzing ? "Analyzing..." : "Analyze Single Frame"}
                    </span>
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Capture and analyze current frame
                  </p>
                </div>

                {/* Stream Analysis */}
                <div className="space-y-2">
                  {!isStreamAnalyzing ? (
                    <button
                      onClick={startStreamAnalysis}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      <span>Start Live Analysis</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopStreamAnalysis}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                    >
                      <Square className="w-5 h-5" />
                      <span>Stop Live Analysis</span>
                    </button>
                  )}
                  <p className="text-xs text-gray-500 text-center">
                    Continuous real-time analysis (5 FPS)
                  </p>
                </div>
              </div>
            )}

            {/* Sample Data Button */}
            {!isRecording && !results && streamResults.length === 0 && (
              <div className="text-center">
                <button
                  onClick={showSampleData}
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors mx-auto"
                >
                  <History className="w-5 h-5" />
                  <span>View Sample Reports</span>
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Explore sample analysis data and historical reports
                </p>
              </div>
            )}

            {/* Analysis Status */}
            {isStreamAnalyzing && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Live Analysis Active
                    </span>
                  </div>
                  <div className="text-sm text-green-700">
                    {totalFramesAnalyzed} frames analyzed
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Or Upload Video File
            </h3>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400">MP4, WebM, MOV</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="video/*"
                onChange={handleFileUpload}
              />
            </label>
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
              {(results || streamResults.length > 0) && (
                <button
                  onClick={exportResults}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              )}
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

            {/* Session Statistics */}
            {(isStreamAnalyzing || streamResults.length > 0) && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Session Statistics
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Total Frames:</span>
                    <span className="ml-2 font-medium">
                      {totalFramesAnalyzed}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Analysis Rate:</span>
                    <span className="ml-2 font-medium">{analysisFps} FPS</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dominant Emotion:</span>
                    <span className="ml-2 font-medium capitalize">
                      {streamDominantEmotion}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Session Duration:</span>
                    <span className="ml-2 font-medium">
                      {sessionStartTime
                        ? Math.round((new Date() - sessionStartTime) / 1000) +
                          "s"
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
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
          isLoading={false}
          currentResult={results}
        />
      </motion.div>
    </div>
  );
};

export default VideoAnalysis;
