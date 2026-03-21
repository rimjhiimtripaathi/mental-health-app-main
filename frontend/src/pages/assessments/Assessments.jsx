// frontend/src/pages/assessments/Assessments.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Heart, Smile, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Assessments page for mental health evaluations (PHQ-9, GAD-7, WHO-5)
 */
const Assessments = () => {
  const [activeTab, setActiveTab] = useState("phq9");
  const [scores, setScores] = useState({
    phq9: Array(9).fill(0),
    gad7: Array(7).fill(0),
    who5: Array(5).fill(0),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Assessment questions
  const assessments = {
    phq9: {
      title: "PHQ-9 Depression Assessment",
      icon: Brain,
      description: "Patient Health Questionnaire for depression screening",
      questions: [
        "Little interest or pleasure in doing things",
        "Feeling down, depressed, or hopeless",
        "Trouble falling or staying asleep, or sleeping too much",
        "Feeling tired or having little energy",
        "Poor appetite or overeating",
        "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
        "Trouble concentrating on things, such as reading the newspaper or watching television",
        "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
        "Thoughts that you would be better off dead or of hurting yourself in some way",
      ],
      options: [
        { value: 0, label: "Not at all" },
        { value: 1, label: "Several days" },
        { value: 2, label: "More than half the days" },
        { value: 3, label: "Nearly every day" },
      ],
    },
    gad7: {
      title: "GAD-7 Anxiety Assessment",
      icon: Heart,
      description: "Generalized Anxiety Disorder assessment",
      questions: [
        "Feeling nervous, anxious or on edge",
        "Not being able to stop or control worrying",
        "Worrying too much about different things",
        "Trouble relaxing",
        "Being so restless that it is hard to sit still",
        "Becoming easily annoyed or irritable",
        "Feeling afraid as if something awful might happen",
      ],
      options: [
        { value: 0, label: "Not at all" },
        { value: 1, label: "Several days" },
        { value: 2, label: "More than half the days" },
        { value: 3, label: "Nearly every day" },
      ],
    },
    who5: {
      title: "WHO-5 Wellbeing Index",
      icon: Smile,
      description: "World Health Organization wellbeing assessment",
      questions: [
        "I have felt cheerful and in good spirits",
        "I have felt calm and relaxed",
        "I have felt active and vigorous",
        "I woke up feeling fresh and rested",
        "My daily life has been filled with things that interest me",
      ],
      options: [
        { value: 0, label: "At no time" },
        { value: 1, label: "Some of the time" },
        { value: 2, label: "Less than half of the time" },
        { value: 3, label: "More than half of the time" },
        { value: 4, label: "Most of the time" },
        { value: 5, label: "All of the time" },
      ],
    },
  };

  const handleScoreChange = (questionIndex, value) => {
    setScores((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((score, idx) =>
        idx === questionIndex ? value : score
      ),
    }));
  };

  const calculateScore = () => {
    const currentScores = scores[activeTab];
    const total = currentScores.reduce((sum, score) => sum + score, 0);

    if (activeTab === "who5") {
      return total * 4; // Convert to percentage (0-100)
    }
    return total;
  };

  const getInterpretation = (score, type) => {
    if (type === "phq9") {
      if (score <= 4)
        return { level: "Minimal", color: "text-green-600", bg: "bg-green-50" };
      if (score <= 9)
        return { level: "Mild", color: "text-yellow-600", bg: "bg-yellow-50" };
      if (score <= 14)
        return {
          level: "Moderate",
          color: "text-orange-600",
          bg: "bg-orange-50",
        };
      if (score <= 19)
        return {
          level: "Moderately Severe",
          color: "text-red-600",
          bg: "bg-red-50",
        };
      return { level: "Severe", color: "text-red-700", bg: "bg-red-100" };
    }

    if (type === "gad7") {
      if (score <= 4)
        return { level: "Minimal", color: "text-green-600", bg: "bg-green-50" };
      if (score <= 9)
        return { level: "Mild", color: "text-yellow-600", bg: "bg-yellow-50" };
      if (score <= 14)
        return {
          level: "Moderate",
          color: "text-orange-600",
          bg: "bg-orange-50",
        };
      return { level: "Severe", color: "text-red-600", bg: "bg-red-50" };
    }

    if (type === "who5") {
      if (score >= 70)
        return {
          level: "Good Wellbeing",
          color: "text-green-600",
          bg: "bg-green-50",
        };
      if (score >= 50)
        return {
          level: "Poor Wellbeing",
          color: "text-yellow-600",
          bg: "bg-yellow-50",
        };
      return {
        level: "Very Poor Wellbeing",
        color: "text-red-600",
        bg: "bg-red-50",
      };
    }
  };

  const submitAssessment = async () => {
    if (!user) {
      alert("Please log in to save assessment results");
      return;
    }

    const totalScore = calculateScore();
    const interpretation = getInterpretation(totalScore, activeTab);

    setIsSubmitting(true);

    try {
      // For WHO-5, store raw score (0-25) in score field and percentage in calculated_score
      // For PHQ-9 and GAD-7, store the total score in both fields
      const rawScore = activeTab === "who5" ? totalScore / 4 : totalScore;
      const calculatedScore = totalScore;

      const assessmentData = {
        user_id: user.email,
        assessment_type: activeTab,
        score: rawScore, // Store raw score
        assessment_data: {
          interpretation: interpretation.level,
          individual_scores: scores[activeTab],
          calculated_score: calculatedScore, // Store calculated/display score
          timestamp: new Date().toISOString(),
        },
      };

      const response = await fetch(
        "http://localhost:8000/api/assessments/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assessmentData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit assessment");
      }

      const result = await response.json();

      alert(
        `Assessment completed! Score: ${
          activeTab === "who5" ? `${totalScore}%` : totalScore
        } - ${interpretation.level}\nResults saved successfully!`
      );

      // Reset scores for this assessment
      setScores((prev) => ({
        ...prev,
        [activeTab]: Array(scores[activeTab].length).fill(0),
      }));
    } catch (error) {
      console.error("Error submitting assessment:", error);
      alert(`Failed to save assessment results: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAssessment = assessments[activeTab];
  const totalScore = calculateScore();
  const interpretation = getInterpretation(totalScore, activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Mental Health Assessments
        </h1>
        <p className="text-gray-600 mt-2">
          Complete evidence-based assessments to track your mental wellbeing
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Assessment Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1 space-y-4"
        >
          {Object.entries(assessments).map(([key, assessment]) => {
            const Icon = assessment.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  activeTab === key
                    ? "bg-blue-50 border-2 border-blue-200"
                    : "bg-white border border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      activeTab === key ? "bg-blue-500" : "bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        activeTab === key ? "text-white" : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {assessment.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {assessment.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Assessment Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Assessment Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <currentAssessment.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentAssessment.title}
                  </h2>
                  <p className="text-gray-600">
                    {currentAssessment.description}
                  </p>
                </div>
              </div>

              {/* Score Display */}
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {activeTab === "who5" ? `${totalScore}%` : totalScore}
                </div>
                <div className={`text-sm font-medium ${interpretation.color}`}>
                  {interpretation.level}
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {currentAssessment.questions.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <h3 className="font-medium text-gray-900 mb-3">
                    {index + 1}. {question}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {currentAssessment.options.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          scores[activeTab][index] === option.value
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option.value}
                          checked={scores[activeTab][index] === option.value}
                          onChange={() =>
                            handleScoreChange(index, option.value)
                          }
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={submitAssessment}
                disabled={isSubmitting}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                {isSubmitting ? "Saving..." : "Save Assessment Results"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Assessments;
