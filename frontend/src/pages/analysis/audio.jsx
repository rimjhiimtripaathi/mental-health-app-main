// frontend/src/pages/analysis/AudioAnalysis.jsx
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Play, Upload } from "lucide-react";
import { analyzeAudioEmotion } from "../../services/api"; // Fixed import
import EmotionResults from "../../components/analysis/EmotionResults";

/**
 * Audio analysis page for emotion detection from voice recordings
 */
const AudioAnalysis = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  /**
   * Start audio recording using browser MediaRecorder API
   */
  const startRecording = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied or not available");
    }
  };

  /**
   * Stop audio recording
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  /**
   * Handle file upload for audio analysis
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioBlob(file);
      setError("");
    } else {
      setError("Please select a valid audio file");
    }
  };

  /**
   * Analyze audio emotion using AI service
   */
  const analyzeAudio = async () => {
    if (!audioBlob) {
      setError("Please record or upload an audio file first");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(",")[1]; // Remove data URL prefix
          const analysisResults = await analyzeAudioEmotion(base64Data);
          setResults(analysisResults);
        } catch (err) {
          setError("Analysis failed: " + err.message);
        }
      };

      reader.onerror = () => {
        setError("Failed to process audio file");
      };
    } catch (err) {
      setError("Analysis failed: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
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
          Audio Emotion Analysis
        </h1>
        <p className="text-gray-600 mt-2">
          Record your voice or upload an audio file to analyze emotions
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recording Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Record Audio
          </h2>

          {/* Recording Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Square className="w-5 h-5" />
                  <span>Stop Recording</span>
                </button>
              )}
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="flex items-center justify-center space-x-2 text-red-500">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Recording...</span>
              </div>
            )}

            {/* Audio Preview */}
            {audioBlob && !isRecording && (
              <div className="space-y-2">
                <audio
                  controls
                  src={URL.createObjectURL(audioBlob)}
                  className="w-full"
                />
                <button
                  onClick={analyzeAudio}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
                >
                  {isAnalyzing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  <span>
                    {isAnalyzing ? "Analyzing..." : "Analyze Emotions"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Or Upload Audio File
            </h3>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400">WAV, MP3, FLAC, M4A</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="audio/*"
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

        {/* Results Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Analysis Results
          </h2>

          {results ? (
            <EmotionResults results={results} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Mic className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Record or upload audio to see analysis results</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AudioAnalysis;
