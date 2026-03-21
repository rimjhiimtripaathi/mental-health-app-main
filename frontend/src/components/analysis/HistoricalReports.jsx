// frontend/src/components/analysis/HistoricalReports.jsx
import React from "react";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, Clock } from "lucide-react";

const HistoricalReports = ({ historicalData, isLoading, currentResult }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const displayData = currentResult
    ? [currentResult, ...historicalData]
    : historicalData;

  return (
    <div className="space-y-4">
      {displayData.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No historical data available</p>
        </div>
      ) : (
        displayData.slice(0, 5).map((report, index) => (
          <motion.div
            key={report.id || report.timestamp}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border ${
              index === 0 && currentResult
                ? "bg-blue-50 border-blue-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                {index === 0 && currentResult && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Current
                  </span>
                )}
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {new Date(report.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    report.dominant_emotion === "happy"
                      ? "bg-green-100 text-green-800"
                      : report.dominant_emotion === "sad"
                      ? "bg-blue-100 text-blue-800"
                      : report.dominant_emotion === "angry"
                      ? "bg-red-100 text-red-800"
                      : report.dominant_emotion === "fearful"
                      ? "bg-purple-100 text-purple-800"
                      : report.dominant_emotion === "surprised"
                      ? "bg-yellow-100 text-yellow-800"
                      : report.dominant_emotion === "disgusted"
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {report.dominant_emotion}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confidence:</span>
                <span className="font-medium">
                  {(report.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Duration:</span>
                <span>{report.duration}s</span>
              </div>

              {/* Emotion distribution bar */}
              <div className="pt-2">
                <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
                  {Object.entries(report.emotions)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([emotion, value]) => (
                      <div
                        key={emotion}
                        className={`h-full ${
                          emotion === "happy"
                            ? "bg-green-500"
                            : emotion === "sad"
                            ? "bg-blue-500"
                            : emotion === "angry"
                            ? "bg-red-500"
                            : emotion === "fearful"
                            ? "bg-purple-500"
                            : emotion === "surprised"
                            ? "bg-yellow-500"
                            : emotion === "disgusted"
                            ? "bg-indigo-500"
                            : "bg-gray-500"
                        }`}
                        style={{ width: `${value * 100}%` }}
                      />
                    ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Top emotions</span>
                  <span>{(report.confidence * 100).toFixed(0)}% match</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};

export default HistoricalReports;
