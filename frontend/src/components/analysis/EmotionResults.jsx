// frontend/src/components/analysis/EmotionResults.jsx
import React from "react";
import { motion } from "framer-motion";
import {
  Smile,
  Frown,
  Laugh,
  Angry,
  Eye,
  Meh,
  Zap,
  Heart,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Enhanced component to display emotion analysis results with multiple visualization options
 */
const EmotionResults = ({ results }) => {
  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <AlertTriangle className="w-12 h-12 mb-4 text-gray-300" />
        <p>No analysis results available</p>
        <p className="text-sm text-gray-400 mt-2">
          Please analyze an audio file to see results
        </p>
      </div>
    );
  }

  // Handle both old and new result formats
  const emotions = results.emotions || {};
  const dominantEmotion =
    results.dominant_emotion || results.dominantEmotion || "";
  const confidence = results.confidence || 0;
  const duration = results.duration || 0;
  const timestamp = results.timestamp || new Date().toISOString();
  const isSampleData = results.sample_data || false;

  // Enhanced emotion icons with fallbacks
  const emotionIcons = {
    happy: Laugh,
    sad: Frown,
    angry: Angry,
    fearful: Eye,
    disgust: Meh,
    disgusted: Meh,
    surprised: Zap,
    neutral: Smile,
    joy: Laugh,
    sadness: Frown,
    anger: Angry,
    fear: Eye,
    love: Heart,
    excitement: Zap,
    calm: Smile,
    // Fallback for any unknown emotion
    default: Smile,
  };

  const emotionColors = {
    happy: "#10B981",
    sad: "#3B82F6",
    angry: "#EF4444",
    fearful: "#8B5CF6",
    disgust: "#84CC16",
    disgusted: "#84CC16",
    surprised: "#F59E0B",
    neutral: "#6B7280",
    joy: "#10B981",
    sadness: "#3B82F6",
    anger: "#EF4444",
    fear: "#8B5CF6",
    love: "#EC4899",
    excitement: "#F59E0B",
    calm: "#6B7280",
    default: "#9CA3AF",
  };

  const emotionBgColors = {
    happy: "bg-green-50 border-green-200",
    sad: "bg-blue-50 border-blue-200",
    angry: "bg-red-50 border-red-200",
    fearful: "bg-purple-50 border-purple-200",
    disgust: "bg-lime-50 border-lime-200",
    disgusted: "bg-lime-50 border-lime-200",
    surprised: "bg-amber-50 border-amber-200",
    neutral: "bg-gray-50 border-gray-200",
    joy: "bg-green-50 border-green-200",
    sadness: "bg-blue-50 border-blue-200",
    anger: "bg-red-50 border-red-200",
    fear: "bg-purple-50 border-purple-200",
    love: "bg-pink-50 border-pink-200",
    excitement: "bg-amber-50 border-amber-200",
    calm: "bg-gray-50 border-gray-200",
    default: "bg-gray-50 border-gray-200",
  };

  const getEmotionIcon = (emotion) => {
    const normalizedEmotion = emotion.toLowerCase();
    return emotionIcons[normalizedEmotion] || emotionIcons.default;
  };

  const getEmotionColor = (emotion) => {
    const normalizedEmotion = emotion.toLowerCase();
    return emotionColors[normalizedEmotion] || emotionColors.default;
  };

  const getEmotionBgColor = (emotion) => {
    const normalizedEmotion = emotion.toLowerCase();
    return emotionBgColors[normalizedEmotion] || emotionBgColors.default;
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence > 0.8)
      return { level: "High", color: "text-green-700 bg-green-100" };
    if (confidence > 0.6)
      return { level: "Medium", color: "text-yellow-700 bg-yellow-100" };
    if (confidence > 0.4)
      return { level: "Low", color: "text-orange-700 bg-orange-100" };
    return { level: "Very Low", color: "text-red-700 bg-red-100" };
  };

  // Prepare data for charts
  const emotionData = Object.entries(emotions)
    .map(([emotion, value]) => ({
      emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      value: Math.round((value || 0) * 100),
      rawValue: value || 0,
      color: getEmotionColor(emotion),
    }))
    .sort((a, b) => b.value - a.value);

  const confidenceInfo = getConfidenceLevel(confidence);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Confidence:{" "}
            <span className="font-semibold">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Sample Data Warning */}
      {isSampleData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <p className="text-yellow-700 text-sm">
              Showing sample data for demonstration purposes
            </p>
          </div>
        </div>
      )}

      {/* Dominant Emotion Card */}
      {dominantEmotion && (
        <div
          className={`p-6 rounded-xl border-2 ${getEmotionBgColor(
            dominantEmotion
          )} transition-all duration-300`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-white shadow-sm">
                {React.createElement(getEmotionIcon(dominantEmotion), {
                  className: "w-8 h-8",
                  style: { color: getEmotionColor(dominantEmotion) },
                })}
              </div>
              <div>
                <h3 className="text-2xl font-bold capitalize">
                  {dominantEmotion}
                </h3>
                <p className="text-gray-600">Dominant Emotion Detected</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {(confidence * 100).toFixed(1)}%
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${confidenceInfo.color}`}
              >
                {confidenceInfo.level} Confidence
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualization Toggle */}
      <div className="flex space-x-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
          Bar Chart
        </button>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
          Pie Chart
        </button>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
          Progress Bars
        </button>
      </div>

      {/* Bar Chart Visualization */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Emotion Confidence Scores
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={emotionData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="emotion"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {emotionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart Visualization */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Emotion Distribution
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={emotionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ emotion, value }) => `${emotion}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {emotionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Progress Bars */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Detailed Emotion Breakdown
        </h4>
        <div className="space-y-4">
          {emotionData.map((item) => {
            const isDominant =
              item.emotion.toLowerCase() === dominantEmotion.toLowerCase();
            const IconComponent = getEmotionIcon(item.emotion);

            return (
              <div
                key={item.emotion}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <IconComponent
                    className="w-5 h-5"
                    style={{ color: getEmotionColor(item.emotion) }}
                  />
                  <span
                    className={`font-medium capitalize w-20 ${
                      isDominant ? "text-gray-900" : "text-gray-600"
                    }`}
                  >
                    {item.emotion}
                  </span>
                  <div className="flex-1 max-w-md">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-1000"
                        style={{
                          width: `${item.value}%`,
                          backgroundColor: getEmotionColor(item.emotion),
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-right">
                    <span
                      className={`font-semibold ${
                        isDominant ? "text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {item.value}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis Metadata */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">
          Analysis Information
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Dominant Emotion:</span>
            <span className="ml-2 font-medium capitalize">
              {dominantEmotion || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Overall Confidence:</span>
            <span className="ml-2 font-medium">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
          {duration > 0 && (
            <div>
              <span className="text-gray-500">Duration:</span>
              <span className="ml-2 font-medium">{duration.toFixed(1)}s</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Emotions Detected:</span>
            <span className="ml-2 font-medium">
              {Object.keys(emotions).length}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Analysis Time:</span>
            <span className="ml-2 font-medium">
              {new Date(timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Raw Data Debug (optional - can be removed in production) */}
      {process.env.NODE_ENV === "development" && (
        <details className="mt-4">
          <summary className="text-sm text-gray-500 cursor-pointer">
            Debug Data
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </details>
      )}
    </motion.div>
  );
};

export default EmotionResults;
