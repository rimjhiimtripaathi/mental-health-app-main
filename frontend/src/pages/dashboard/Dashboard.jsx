// frontend/src/pages/dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Heart,
  FileText,
  ImageIcon,
  Mic,
  Video,
  TrendingUp,
  Calendar,
  Smile,
  Frown,
} from "lucide-react";
import StatCard from "../../components/dashboard/StatCard";
import AssessmentChart from "../../components/dashboard/AssessmentChart";
import QuickActions from "../../components/dashboard/QuickActions";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Dashboard page showing overview and quick access to features
 */
const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Mock data as fallback
  const mockStats = [
    {
      title: "PHQ-9 Score",
      value: "8",
      change: "-2",
      trend: "improving",
      icon: Brain,
      color: "blue",
    },
    {
      title: "GAD-7 Score",
      value: "6",
      change: "-1",
      trend: "improving",
      icon: Heart,
      color: "green",
    },
    {
      title: "Wellbeing",
      value: "72%",
      change: "+5%",
      trend: "improving",
      icon: Smile,
      color: "purple",
    },
    {
      title: "Sessions",
      value: "12",
      change: "+3",
      trend: "improving",
      icon: Calendar,
      color: "orange",
    },
  ];

  const mockActivity = [
    {
      activity: "Completed PHQ-9 Assessment",
      time: "2 hours ago",
      type: "assessment",
    },
    {
      activity: "Audio Emotion Analysis",
      time: "1 day ago",
      type: "analysis",
    },
    {
      activity: "Video Session Completed",
      time: "2 days ago",
      type: "session",
    },
  ];

  const quickActions = [
    {
      title: "Take Clinical Assessment",
      description: "Complete mental health assessments",
      icon: Brain,
      path: "/assessments",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Text Analysis",
      description: "Analyze emotions from text",
      icon: FileText,
      path: "/text-analysis",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Image Analysis",
      description: "Analyze emotions from Image",
      icon: ImageIcon,
      path: "/Image-analysis",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Audio Analysis",
      description: "Analyze emotions from voice",
      icon: Mic,
      path: "/audio-analysis",
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
    {
      title: "Video Analysis",
      description: "Real-time emotion detection",
      icon: Video,
      path: "/video-analysis",
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setStats(mockStats);
        setRecentActivity(mockActivity);
        setLoading(false);
        return;
      }

      try {
        // Fetch user's assessments
        const response = await fetch(
          `http://localhost:8000/api/assessments/user/${user.email}`
        );

        if (response.ok) {
          const assessments = await response.json();

          if (assessments && assessments.length > 0) {
            // Process real data
            processRealData(assessments);
          } else {
            // No data found, use mock data
            setStats(mockStats);
            setRecentActivity(mockActivity);
          }
        } else {
          // API error, use mock data
          setStats(mockStats);
          setRecentActivity(mockActivity);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Fallback to mock data
        setStats(mockStats);
        setRecentActivity(mockActivity);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const processRealData = (assessments) => {
    // Get latest assessment of each type
    const latestAssessments = {};
    assessments.forEach((assessment) => {
      if (
        !latestAssessments[assessment.assessment_type] ||
        new Date(assessment.created_at) >
          new Date(latestAssessments[assessment.assessment_type].created_at)
      ) {
        latestAssessments[assessment.assessment_type] = assessment;
      }
    });

    // Calculate stats from real data
    const realStats = [];
    const realActivity = [];

    // PHQ-9 Score
    if (latestAssessments.phq9) {
      const phq9 = latestAssessments.phq9;
      const phq9Score = phq9.assessment_data?.calculated_score || phq9.score;
      realStats.push({
        title: "PHQ-9 Score",
        value: phq9Score.toString(),
        change: getTrend(assessments, "phq9"),
        trend: "improving",
        icon: Brain,
        color: "blue",
      });
      realActivity.push({
        activity: `Completed PHQ-9 Assessment (Score: ${phq9Score})`,
        time: formatTimeAgo(phq9.created_at),
        type: "assessment",
      });
    }

    // GAD-7 Score
    if (latestAssessments.gad7) {
      const gad7 = latestAssessments.gad7;
      const gad7Score = gad7.assessment_data?.calculated_score || gad7.score;
      realStats.push({
        title: "GAD-7 Score",
        value: gad7Score.toString(),
        change: getTrend(assessments, "gad7"),
        trend: "improving",
        icon: Heart,
        color: "green",
      });
      realActivity.push({
        activity: `Completed GAD-7 Assessment (Score: ${gad7Score})`,
        time: formatTimeAgo(gad7.created_at),
        type: "assessment",
      });
    }

    // WHO-5 Wellbeing
    if (latestAssessments.who5) {
      const who5 = latestAssessments.who5;
      // WHO-5 score is stored as percentage in calculated_score or raw score in score field
      let who5Score = who5.assessment_data?.calculated_score;
      if (!who5Score) {
        // Convert raw score to percentage (raw score * 4)
        who5Score = who5.score * 4;
      }
      realStats.push({
        title: "Wellbeing",
        value: `${who5Score}%`,
        change: getTrend(assessments, "who5", true),
        trend: "improving",
        icon: Smile,
        color: "purple",
      });
      realActivity.push({
        activity: `Completed WHO-5 Assessment (Score: ${who5Score}%)`,
        time: formatTimeAgo(who5.created_at),
        type: "assessment",
      });
    }

    // Session count
    realStats.push({
      title: "Sessions",
      value: assessments.length.toString(),
      change: `+${assessments.length}`,
      trend: "improving",
      icon: Calendar,
      color: "orange",
    });

    // Fill remaining slots with mock data if needed
    while (realStats.length < 4) {
      realStats.push(mockStats[realStats.length]);
    }

    while (realActivity.length < 3) {
      realActivity.push(mockActivity[realActivity.length]);
    }

    setStats(realStats);
    setRecentActivity(realActivity);
  };

  const getTrend = (assessments, type, isPercentage = false) => {
    const typeAssessments = assessments
      .filter((a) => a.assessment_type === type)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (typeAssessments.length < 2) {
      return isPercentage ? "+0%" : "+0";
    }

    const latest = typeAssessments[typeAssessments.length - 1];
    const previous = typeAssessments[typeAssessments.length - 2];

    // Get scores from assessment_data or fallback to score field
    const latestScore =
      latest.assessment_data?.calculated_score || latest.score;
    const previousScore =
      previous.assessment_data?.calculated_score || previous.score;

    // For WHO-5, if we have raw scores, convert to percentage for trend calculation
    let latestValue = latestScore;
    let previousValue = previousScore;

    if (type === "who5" && latestScore <= 25) {
      // This is likely a raw score (0-25), convert to percentage
      latestValue = latestScore * 4;
      previousValue = previousScore * 4;
    }

    const diff = latestValue - previousValue;

    if (diff === 0) return isPercentage ? "+0%" : "+0";
    return diff > 0 ? `+${isPercentage ? diff + "%" : diff}` : `${diff}`;
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's your AI powered mental health overview.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <StatCard key={stat.title} stat={stat} delay={index * 0.1} />
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Progress Overview
            </h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <AssessmentChart assessments={stats} />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="space-y-4">
            {quickActions.map((action, index) => (
              <QuickActions
                key={action.title}
                action={action}
                delay={index * 0.1}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {recentActivity.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    item.type === "assessment"
                      ? "bg-blue-500"
                      : item.type === "analysis"
                      ? "bg-green-500"
                      : "bg-purple-500"
                  }`}
                ></div>
                <span className="text-gray-700">{item.activity}</span>
              </div>
              <span className="text-sm text-gray-500">{item.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
