// frontend/src/components/analysis/VisualizationTabs.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, PieChart } from "lucide-react";

const VisualizationTabs = ({ results }) => {
  const [activeTab, setActiveTab] = useState("bar");

  const emotions = Object.entries(results?.emotions || {}).sort(
    ([, a], [, b]) => b - a
  );

  const BarChart = () => (
    <div className="space-y-4">
      {emotions.map(([emotion, value]) => (
        <div key={emotion} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="capitalize">{emotion}</span>
            <span className="font-medium">{(value * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${value * 100}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`h-3 rounded-full ${
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
            />
          </div>
        </div>
      ))}
    </div>
  );

  const PieChartVisual = () => (
    <div className="flex justify-center items-center py-4">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {
            emotions.reduce(
              (acc, [emotion, value], index) => {
                const startAngle = acc.currentAngle;
                const endAngle = startAngle + value * 360;
                const largeArcFlag = value > 0.5 ? 1 : 0;

                const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

                const pathData = [
                  `M 50 50`,
                  `L ${startX} ${startY}`,
                  `A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                  "Z",
                ].join(" ");

                acc.paths.push(
                  <motion.path
                    key={emotion}
                    d={pathData}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={
                      emotion === "happy"
                        ? "fill-green-500"
                        : emotion === "sad"
                        ? "fill-blue-500"
                        : emotion === "angry"
                        ? "fill-red-500"
                        : emotion === "fearful"
                        ? "fill-purple-500"
                        : emotion === "surprised"
                        ? "fill-yellow-500"
                        : emotion === "disgusted"
                        ? "fill-indigo-500"
                        : "fill-gray-500"
                    }
                  />
                );

                acc.currentAngle = endAngle;
                return acc;
              },
              { paths: [], currentAngle: 0 }
            ).paths
          }
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold capitalize">
              {results?.dominant_emotion}
            </div>
            <div className="text-sm text-gray-600">Dominant</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Tabs Header */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("bar")}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium ${
            activeTab === "bar"
              ? "bg-white text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Bar Chart</span>
        </button>
        <button
          onClick={() => setActiveTab("pie")}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium ${
            activeTab === "pie"
              ? "bg-white text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Pie Chart</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "bar" ? <BarChart /> : <PieChartVisual />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VisualizationTabs;
