// frontend/src/components/dashboard/AssessmentChart.jsx
import React from "react";
import { motion } from "framer-motion";

/**
 * Chart component to display assessment progress over time
 */
const AssessmentChart = () => {
  // Mock data - in real app, this would come from API
  const chartData = [
    { date: "Jan 1", phq9: 10, gad7: 8, who5: 60 },
    { date: "Jan 8", phq9: 9, gad7: 7, who5: 65 },
    { date: "Jan 15", phq9: 8, gad7: 6, who5: 70 },
    { date: "Jan 22", phq9: 7, gad7: 5, who5: 75 },
    { date: "Jan 29", phq9: 6, gad7: 4, who5: 80 },
  ];

  const maxScore = Math.max(...chartData.flatMap((d) => [d.phq9, d.gad7]));
  const maxWellbeing = Math.max(...chartData.map((d) => d.who5));

  return (
    <div className="space-y-6">
      {/* PHQ-9 and GAD-7 Scores */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">
          Assessment Scores (Lower is Better)
        </h4>
        <div className="relative h-32">
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-r border-gray-200" />
            ))}
          </div>

          {/* Data lines */}
          <svg className="w-full h-full">
            {/* PHQ-9 line */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              d={chartData
                .map(
                  (point, i) =>
                    `${i === 0 ? "M" : "L"} ${
                      (i / (chartData.length - 1)) * 100
                    }% ${100 - (point.phq9 / maxScore) * 100}%`
                )
                .join(" ")}
              stroke="#3b82f6"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />

            {/* GAD-7 line */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.4 }}
              d={chartData
                .map(
                  (point, i) =>
                    `${i === 0 ? "M" : "L"} ${
                      (i / (chartData.length - 1)) * 100
                    }% ${100 - (point.gad7 / maxScore) * 100}%`
                )
                .join(" ")}
              stroke="#10b981"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">PHQ-9</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">GAD-7</span>
          </div>
        </div>
      </div>

      {/* Wellbeing Score */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">
          Wellbeing Score (Higher is Better)
        </h4>
        <div className="relative h-20 bg-gradient-to-r from-red-50 via-yellow-50 to-green-50 rounded-lg overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${(chartData[chartData.length - 1].who5 / 100) * 100}%`,
            }}
            transition={{ duration: 1.5, delay: 0.6 }}
            className="h-full bg-gradient-to-r from-green-400 to-green-500"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900">
              {chartData[chartData.length - 1].who5}%
            </span>
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-500">
        {chartData.map((point, i) => (
          <span key={i}>{point.date}</span>
        ))}
      </div>
    </div>
  );
};

export default AssessmentChart;
