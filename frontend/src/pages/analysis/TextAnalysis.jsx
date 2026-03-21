// frontend/src/pages/analysis/TextAnalysis.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Send,
  BarChart3,
  PieChart,
  Smile,
  Frown,
  Laugh,
  Angry,
  Eye,
  Meh,
  Info,
  Download,
  Calendar,
  RefreshCw,
  History,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  analyzeTextEmotion,
  getUserSessions,
  getSessionDetails,
  exportTextAnalysisResults,
} from "../../services/api";

/**
 * INSTRUCTIONS:
 * 1. Enter text in the input area (minimum 10 characters required)
 * 2. Click "Analyze Text" to process the text for emotion detection
 * 3. View detailed emotion breakdown with confidence scores
 * 4. Use sample texts for quick testing
 * 5. Review session reports with graphical analytics
 * 6. Export results or view different chart visualizations
 *
 * Text analysis page for emotion detection from written text
 */

const TextAnalysis = () => {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [userSessions, setUserSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [chartType, setChartType] = useState("bar"); // "bar" or "pie"
  const [sessionChartType, setSessionChartType] = useState("bar"); // "bar" or "pie"
  const [topEmotionsChartType, setTopEmotionsChartType] = useState("bar"); // "bar" or "pie"
  const [userId] = useState("current_user");

  const textAreaRef = useRef(null);

  // Generate session ID when component mounts
  useEffect(() => {
    setCurrentSessionId(`session_${Date.now()}`);
    loadUserSessions();
  }, []);

  /**
   * Load user sessions with date-wise grouping
   */
  const loadUserSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const sessionsData = await getUserSessions(userId);
      const limitedSessions = sessionsData.sessions?.slice(0, 15) || []; // Limit to latest 15 sessions
      setUserSessions(limitedSessions);

      // Load latest session details by default
      if (limitedSessions.length > 0) {
        const latestSession = limitedSessions[0];
        await loadSessionDetails(
          latestSession.session_date,
          latestSession.session_id,
          0
        );
      } else {
        // Reset states if no sessions
        setSessionDetails(null);
        setSelectedSession(null);
      }
    } catch (err) {
      console.error("Failed to load user sessions:", err);
      setError("Failed to load session history: " + err.message);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  /**
   * Load detailed analysis for a specific session
   */
  const loadSessionDetails = async (
    sessionDate,
    sessionId = null,
    index = 0
  ) => {
    try {
      const details = await getSessionDetails(userId, sessionDate, sessionId);
      setSessionDetails(details);
      setSelectedSession({ sessionDate, sessionId });
      setCurrentSessionIndex(index);
    } catch (err) {
      console.error("Failed to load session details:", err);
      setError("Failed to load session details: " + err.message);
    }
  };

  /**
   * Navigate to previous session
   */
  const goToPreviousSession = () => {
    if (currentSessionIndex < userSessions.length - 1) {
      const newIndex = currentSessionIndex + 1;
      const session = userSessions[newIndex];
      loadSessionDetails(session.session_date, session.session_id, newIndex);
    }
  };

  /**
   * Navigate to next session
   */
  const goToNextSession = () => {
    if (currentSessionIndex > 0) {
      const newIndex = currentSessionIndex - 1;
      const session = userSessions[newIndex];
      loadSessionDetails(session.session_date, session.session_id, newIndex);
    }
  };

  /**
   * Analyze text emotion using AI service
   */
  const analyzeText = async () => {
    if (!text.trim()) {
      setError("Please enter some text to analyze");
      return;
    }

    if (text.length < 10) {
      setError("Please enter at least 10 characters for meaningful analysis");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const analysisResults = await analyzeTextEmotion(
        text,
        userId,
        currentSessionId
      );
      setResults(analysisResults);

      // Refresh sessions and load current session details
      await loadUserSessions();
    } catch (err) {
      setError(
        "Analysis failed: " + (err.message || "Please check your connection")
      );
      console.error("Text analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Handle sample text selection
   */
  const handleSampleText = (sampleText) => {
    setText(sampleText);
    setError("");
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  /**
   * Clear current analysis
   */
  const clearAnalysis = () => {
    setText("");
    setResults(null);
    setError("");
  };

  /**
   * Export analysis results
   */
  const exportResults = async () => {
    if (!results) return;

    try {
      const exportData = await exportTextAnalysisResults(userId, "json");

      // Create and trigger download
      const dataStr = JSON.stringify(exportData.content, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        exportData.filename ||
        `text-emotion-analysis-${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Export failed: " + err.message);
    }
  };

  // Sample texts for quick testing
  const sampleTexts = [
    {
      title: "Happy Moment",
      text: "I'm absolutely thrilled about the wonderful news! Today has been absolutely amazing and I feel so grateful for everything that's happening in my life.",
      emotion: "happy",
    },
    {
      title: "Sad Story",
      text: "I've been feeling really down lately. Everything seems so heavy and it's hard to find the motivation to do anything. The world feels gray.",
      emotion: "sad",
    },
    {
      title: "Angry Complaint",
      text: "I'm absolutely furious about this terrible service! How can they treat customers this way? This is completely unacceptable!",
      emotion: "angry",
    },
    {
      title: "Fearful Experience",
      text: "I'm really scared about what might happen next. The uncertainty is terrifying and I don't know how to prepare for the worst-case scenario.",
      emotion: "fearful",
    },
  ];

  // Emotion icons mapping
  const emotionIcons = {
    happy: Laugh,
    sad: Frown,
    angry: Angry,
    fearful: Eye,
    disgusted: Meh,
    surprised: Smile,
    neutral: Smile,
  };

  const emotionColors = {
    happy: "text-yellow-500 bg-yellow-50",
    sad: "text-blue-500 bg-blue-50",
    angry: "text-red-500 bg-red-50",
    fearful: "text-purple-500 bg-purple-50",
    disgusted: "text-green-500 bg-green-50",
    surprised: "text-orange-500 bg-orange-50",
    neutral: "text-gray-500 bg-gray-50",
  };

  const emotionChartColors = {
    happy: "#fbbf24",
    sad: "#3b82f6",
    angry: "#ef4444",
    fearful: "#8b5cf6",
    disgusted: "#10b981",
    surprised: "#f97316",
    neutral: "#6b7280",
  };

  // Text statistics
  const textStats = {
    wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
    characterCount: text.length,
    sentenceCount: text.trim()
      ? text.split(/[.!?]+/).filter(Boolean).length
      : 0,
  };

  // Chart Components
  const EmotionBarChart = ({ emotions, title }) => {
    const emotionEntries = Object.entries(emotions || {}).sort(
      ([, a], [, b]) => b - a
    );
    const maxValue = Math.max(...Object.values(emotions || {}));

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 text-center">{title}</h4>
        <div className="flex items-end justify-between space-x-2 h-48">
          {emotionEntries.map(([emotion, score]) => {
            const percentage = (score * 100).toFixed(1);
            const height = maxValue > 0 ? (score / maxValue) * 100 : 0;

            return (
              <div
                key={emotion}
                className="flex flex-col items-center flex-1 space-y-2"
              >
                {/* Confidence value above bar */}
                <div className="text-xs font-medium text-gray-600 h-4 flex items-center justify-center">
                  {percentage}%
                </div>

                {/* Bar container */}
                <div className="relative flex flex-col items-center flex-1 w-full">
                  <div
                    className="w-full rounded-t transition-all duration-500"
                    style={{
                      height: `${height}%`,
                      backgroundColor: emotionChartColors[emotion],
                      minHeight: "20px",
                    }}
                  ></div>
                </div>

                {/* Emotion label below bar */}
                <span className="text-xs font-medium capitalize text-gray-700 text-center h-4 flex items-center justify-center">
                  {emotion}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const EmotionPieChart = ({ emotions, title }) => {
    const emotionEntries = Object.entries(emotions || {}).sort(
      ([, a], [, b]) => b - a
    );
    const size = 120;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;

    let currentOffset = 0;

    return (
      <div className="flex flex-col items-center space-y-4">
        <h4 className="font-semibold text-gray-900 text-center">{title}</h4>
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {emotionEntries.map(([emotion, score]) => {
              const percentage = score * 100;
              const strokeDasharray =
                score * circumference + " " + circumference;
              const strokeDashoffset = -currentOffset;
              currentOffset += score * circumference;

              return (
                <circle
                  key={emotion}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={emotionChartColors[emotion]}
                  strokeWidth="10"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {emotionEntries[0]?.[1]
                  ? (emotionEntries[0][1] * 100).toFixed(0) + "%"
                  : "0%"}
              </div>
              <div className="text-xs text-gray-600 capitalize">
                {emotionEntries[0]?.[0] || "neutral"}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {emotionEntries.slice(0, 4).map(([emotion, score]) => (
            <div key={emotion} className="flex items-center space-x-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: emotionChartColors[emotion] }}
              ></div>
              <span className="capitalize">{emotion}</span>
              <span className="text-gray-600">{(score * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
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
          Text Emotion Analysis
        </h1>
        <p className="text-gray-600 mt-2">
          Analyze emotions from written text using advanced AI
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
              Text Analysis Guidelines
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Write naturally - the AI analyzes vocabulary, tone, and
                emotional cues in your text
              </li>
              <li>
                • Minimum 10 characters required for analysis (100+ characters
                recommended for best results)
              </li>
              <li>
                • The system detects 7 core emotions: Happy, Sad, Angry,
                Fearful, Disgusted, Surprised, and Neutral
              </li>
              <li>
                • Use sample texts for quick testing and to understand how
                different emotions are detected
              </li>
              <li>
                • Longer, more descriptive texts typically yield more accurate
                emotion detection
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Enter Text to Analyze
          </h2>

          {/* Text Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {textStats.wordCount}
              </div>
              <div className="text-xs text-gray-600">Words</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {textStats.characterCount}
              </div>
              <div className="text-xs text-gray-600">Characters</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {textStats.sentenceCount}
              </div>
              <div className="text-xs text-gray-600">Sentences</div>
            </div>
          </div>

          {/* Text Input */}
          <div className="space-y-4">
            <textarea
              ref={textAreaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here to analyze emotions... (Minimum 10 characters)"
              className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isAnalyzing}
            />

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {text.length < 10 ? (
                  <span className="text-red-500">
                    {10 - text.length} more characters needed
                  </span>
                ) : (
                  <span className="text-green-500">Ready for analysis</span>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={clearAnalysis}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isAnalyzing}
                >
                  Clear
                </button>
                <button
                  onClick={analyzeText}
                  disabled={isAnalyzing || text.length < 10}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
                >
                  {isAnalyzing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span>{isAnalyzing ? "Analyzing..." : "Analyze Text"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sample Texts */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Try Sample Texts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sampleTexts.map((sample, index) => {
                const colorClass = emotionColors[sample.emotion];

                return (
                  <button
                    key={index}
                    onClick={() => handleSampleText(sample.text)}
                    className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className={`w-2 h-2 rounded-full ${colorClass
                          .split(" ")[0]
                          .replace("text-", "bg-")}`}
                      ></div>
                      <span className="font-medium text-sm text-gray-900">
                        {sample.title}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs line-clamp-2">
                      {sample.text}
                    </p>
                  </button>
                );
              })}
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
                  onClick={exportResults}
                  className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              )}
              <button
                onClick={loadUserSessions}
                disabled={isLoadingSessions}
                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isLoadingSessions ? "animate-spin" : ""
                  }`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {results ? (
              <>
                <EmotionResults results={results} />

                {/* Emotion Visualization with Chart Selection */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Emotion Visualization
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setChartType("bar")}
                        className={`flex items-center space-x-2 px-3 py-1 text-sm rounded-lg transition-colors ${
                          chartType === "bar"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>Bar</span>
                      </button>
                      <button
                        onClick={() => setChartType("pie")}
                        className={`flex items-center space-x-2 px-3 py-1 text-sm rounded-lg transition-colors ${
                          chartType === "pie"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <PieChart className="w-4 h-4" />
                        <span>Pie</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    {chartType === "bar" ? (
                      <EmotionBarChart
                        emotions={results.emotions}
                        title="Current Analysis"
                      />
                    ) : (
                      <EmotionPieChart
                        emotions={results.emotions}
                        title="Current Analysis"
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Enter text and analyze to see results</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Advanced NLP analysis detects emotional tone
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Session Reports & Analytics - Bottom Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Session Reports & Analytics
          </h2>
          <div className="flex items-center space-x-4">
            {/* Session Navigation */}
            {userSessions.length > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousSession}
                  disabled={currentSessionIndex >= userSessions.length - 1}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  {currentSessionIndex + 1} of {userSessions.length}
                </span>
                <button
                  onClick={goToNextSession}
                  disabled={currentSessionIndex <= 0}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Latest 15 Sessions</span>
            </div>
          </div>
        </div>

        {/* Current Session Display */}
        {sessionDetails ? (
          <div className="space-y-6">
            {/* Session Header Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Session Analysis
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {new Date(sessionDetails.session_date).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-blue-200">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Session ID:{" "}
                    {sessionDetails.session_id?.substring(0, 8) || "N/A"}
                  </span>
                </div>
              </div>

              {/* Session Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">
                    {sessionDetails.summary.total_analyses}
                  </div>
                  <div className="text-sm text-blue-600">Total Analyses</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                  <div className="text-2xl font-bold text-green-600">
                    {(sessionDetails.summary.average_confidence * 100).toFixed(
                      1
                    )}
                    %
                  </div>
                  <div className="text-sm text-green-600">Avg Confidence</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">
                    {sessionDetails.summary.text_statistics.average_word_count.toFixed(
                      0
                    )}
                  </div>
                  <div className="text-sm text-purple-600">Avg Words</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-orange-100">
                  <div className="text-2xl font-bold text-orange-600 capitalize">
                    {Object.entries(
                      sessionDetails.summary.emotion_distribution
                    ).sort(([, a], [, b]) => b - a)[0]?.[0] || "neutral"}
                  </div>
                  <div className="text-sm text-orange-600">
                    Dominant Emotion
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Session Emotion Distribution */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Session Emotion Distribution
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSessionChartType("bar")}
                      className={`flex items-center space-x-2 px-3 py-1 text-sm rounded-lg transition-colors ${
                        sessionChartType === "bar"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Bar</span>
                    </button>
                    <button
                      onClick={() => setSessionChartType("pie")}
                      className={`flex items-center space-x-2 px-3 py-1 text-sm rounded-lg transition-colors ${
                        sessionChartType === "pie"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <PieChart className="w-4 h-4" />
                      <span>Pie</span>
                    </button>
                  </div>
                </div>

                {sessionChartType === "bar" ? (
                  <EmotionBarChart
                    emotions={Object.fromEntries(
                      Object.entries(
                        sessionDetails.summary.emotion_distribution
                      ).map(([emotion, count]) => [
                        emotion,
                        count / sessionDetails.summary.total_analyses,
                      ])
                    )}
                    title="Session Emotion Distribution"
                  />
                ) : (
                  <EmotionPieChart
                    emotions={Object.fromEntries(
                      Object.entries(
                        sessionDetails.summary.emotion_distribution
                      ).map(([emotion, count]) => [
                        emotion,
                        count / sessionDetails.summary.total_analyses,
                      ])
                    )}
                    title="Session Emotion Distribution"
                  />
                )}
              </div>

              {/* Top Emotions by Confidence */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Top Emotions by Confidence
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTopEmotionsChartType("bar")}
                      className={`flex items-center space-x-2 px-3 py-1 text-sm rounded-lg transition-colors ${
                        topEmotionsChartType === "bar"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Bar</span>
                    </button>
                    <button
                      onClick={() => setTopEmotionsChartType("pie")}
                      className={`flex items-center space-x-2 px-3 py-1 text-sm rounded-lg transition-colors ${
                        topEmotionsChartType === "pie"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <PieChart className="w-4 h-4" />
                      <span>Pie</span>
                    </button>
                  </div>
                </div>

                {topEmotionsChartType === "bar" ? (
                  <EmotionBarChart
                    emotions={Object.fromEntries(
                      Object.entries(
                        sessionDetails.summary.emotion_distribution
                      ).map(([emotion, count]) => [
                        emotion,
                        count / sessionDetails.summary.total_analyses,
                      ])
                    )}
                    title="Top Emotions by Confidence"
                  />
                ) : (
                  <EmotionPieChart
                    emotions={Object.fromEntries(
                      Object.entries(
                        sessionDetails.summary.emotion_distribution
                      ).map(([emotion, count]) => [
                        emotion,
                        count / sessionDetails.summary.total_analyses,
                      ])
                    )}
                    title="Top Emotions by Confidence"
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No session data available</p>
            <p className="text-sm">
              Start analyzing text to create your first session
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// EmotionResults component
const EmotionResults = ({ results }) => {
  if (!results) return null;

  const emotionIcons = {
    happy: Laugh,
    sad: Frown,
    angry: Angry,
    fearful: Eye,
    disgusted: Meh,
    surprised: Smile,
    neutral: Smile,
  };

  const emotionColors = {
    happy: "text-yellow-500 bg-yellow-50 border-yellow-200",
    sad: "text-blue-500 bg-blue-50 border-blue-200",
    angry: "text-red-500 bg-red-50 border-red-200",
    fearful: "text-purple-500 bg-purple-50 border-purple-200",
    disgusted: "text-green-500 bg-green-50 border-green-200",
    surprised: "text-orange-500 bg-orange-50 border-orange-200",
    neutral: "text-gray-500 bg-gray-50 border-gray-200",
  };

  return (
    <div className="space-y-4">
      {/* Dominant Emotion */}
      <div
        className={`p-4 rounded-xl border-2 ${
          emotionColors[results.dominant_emotion] || emotionColors.neutral
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white">
              {React.createElement(emotionIcons[results.dominant_emotion], {
                className: "w-6 h-6",
              })}
            </div>
            <div>
              <h3 className="text-lg font-bold capitalize">
                {results.dominant_emotion}
              </h3>
              <p className="text-sm text-gray-600">Dominant Emotion</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {(results.confidence * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Confidence</div>
          </div>
        </div>
      </div>

      {/* Emotion Breakdown */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Emotion Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(results.emotions)
            .sort(([, a], [, b]) => b - a)
            .map(([emotion, score]) => {
              const percentage = (score * 100).toFixed(1);
              const isDominant = emotion === results.dominant_emotion;

              return (
                <div
                  key={emotion}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isDominant
                          ? emotionColors[emotion]
                              .split(" ")[0]
                              .replace("text-", "bg-")
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="font-medium text-sm capitalize text-gray-700">
                      {emotion}
                    </span>
                    {isDominant && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        Dominant
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${emotionColors[emotion]
                          .split(" ")[0]
                          .replace("text-", "bg-")}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default TextAnalysis;
