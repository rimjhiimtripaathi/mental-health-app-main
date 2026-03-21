// frontend/src/components/dashboard/StatCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

const StatCard = ({ stat, delay = 0 }) => {
  const { title, value, change, trend, icon: Icon, color } = stat;

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <div
            className={`flex items-center space-x-1 mt-2 ${
              trend === "improving" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend === "improving" ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{change}</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]} bg-opacity-10`}>
          <Icon
            className={`w-6 h-6 ${
              color === "blue"
                ? "text-blue-600"
                : color === "green"
                ? "text-green-600"
                : color === "purple"
                ? "text-purple-600"
                : "text-orange-600"
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
