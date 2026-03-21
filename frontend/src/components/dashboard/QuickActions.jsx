// frontend/src/components/dashboard/QuickActions.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const QuickActions = ({ action, delay = 0 }) => {
  const { title, description, icon: Icon, path, color } = action;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link
        to={path}
        className={`block p-4 rounded-lg text-white transition-transform hover:scale-105 ${color}`}
      >
        <div className="flex items-center space-x-3">
          <Icon className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm opacity-90">{description}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default QuickActions;
