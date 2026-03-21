// frontend/src/pages/analysis/VideoAnalysis.jsx
import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Video, Square, Camera, Upload, Smile } from "lucide-react";
import { analyzeVideoEmotion } from "../../services/api";
import EmotionResults from "../../components/analysis/EmotionResults";

/**
 * Video analysis page for real-time emotion detection from camera or uploaded images
 */
const VideoAnalysis = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  /**
   * Start camera and set up video stream
   */
  const startCamera = useCallback(async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      setError(
        "Camera access denied or not available. Please check permissions."
      );
    }
  }, []);

  /**
   * Stop camera and clean up
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCapturedImage(null);
  }, []);

  /**
   * Capture image from video stream
   */
  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const imageData = canvas.toDataURL("image/jpeg");
      setCapturedImage(imageData);

      return imageData;
    }
    return null;
  }, []);

  /**
   * Handle image file upload
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
        setError("");
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please select a valid image file (JPEG, PNG, etc.)");
    }
  };

  /**
   * Analyze captured/image emotion
   */
  const analyzeImage = async () => {
    if (!capturedImage) {
      setError("Please capture an image or upload one first");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const base64Data = capturedImage.split(",")[1]; // Remove data URL prefix
      const analysisResults = await analyzeVideoEmotion(base64Data);
      setResults(analysisResults);
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
          Video Emotion Analysis
        </h1>
        <p className="text-gray-600 mt-2">
          Use your camera or upload an image for real-time emotion detection
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera/Upload Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Capture Image
          </h2>

          {/* Camera Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              {!isCameraActive ? (
                <button
                  onClick={startCamera}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Square className="w-5 h-5" />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>

            {/* Video Feed */}
            {isCameraActive && (
              <div className="space-y-4">
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <button
                  onClick={captureImage}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span>Capture Image</span>
                </button>
              </div>
            )}

            {/* Captured Image Preview */}
            {capturedImage && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Captured Image:</h3>
                <img
                  src={capturedImage}
                  alt="Captured for analysis"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-lg transition-colors"
                >
                  {isAnalyzing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Smile className="w-5 h-5" />
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
              Or Upload Image
            </h3>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400">JPEG, PNG, WebP</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
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

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              💡 Tips for Best Results:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ensure good lighting on your face</li>
              <li>• Look directly at the camera</li>
              <li>• Maintain a neutral expression for accurate reading</li>
              <li>• Remove sunglasses or hats that obscure your face</li>
            </ul>
          </div>
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
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Analysis Yet</p>
                <p className="text-sm">
                  Capture an image or upload one to see emotion analysis results
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default VideoAnalysis;
