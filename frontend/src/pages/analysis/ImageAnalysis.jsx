// frontend/src/pages/analysis/ImageAnalysis.jsx
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  Upload,
  Camera,
  Download,
  BarChart3,
  Smile,
  Frown,
  Laugh,
  Angry,
  Eye,
  Meh,
  X,
  Circle,
  Info,
} from "lucide-react";
import { analyzeImageEmotion } from "../../services/api";

/**
 * Image analysis page for emotion detection from images
 */
const ImageAnalysis = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [analysisType, setAnalysisType] = useState("facial");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraFacingMode, setCameraFacingMode] = useState("user"); // 'user' for front camera, 'environment' for back

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Emotion icons mapping
  const emotionIcons = {
    happy: Laugh,
    sad: Frown,
    angry: Angry,
    fearful: Eye,
    disgust: Meh,
    surprised: Smile,
    neutral: Smile,
  };

  const emotionColors = {
    happy: "text-yellow-500 bg-yellow-50",
    sad: "text-blue-500 bg-blue-50",
    angry: "text-red-500 bg-red-50",
    fearful: "text-purple-500 bg-purple-50",
    disgust: "text-green-500 bg-green-50",
    surprised: "text-orange-500 bg-orange-50",
    neutral: "text-gray-500 bg-gray-50",
  };

  /**
   * Handle image file selection
   */
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (JPEG, PNG, etc.)");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      setError("");
      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Start camera stream
   */
  const startCamera = async (facingMode = "user") => {
    try {
      setError("");

      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 1.7777777778 }, // 16:9
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCameraActive(true);
      setCameraFacingMode(facingMode);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait for video to load and play
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(console.error);
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);

      // Try with simpler constraints if ideal fails
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
          audio: false,
        });

        setStream(fallbackStream);
        setIsCameraActive(true);
        setCameraFacingMode(facingMode);

        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(console.error);
        }
      } catch (fallbackErr) {
        setError(
          "Camera access denied. Please check permissions and try again, or upload an image file."
        );
      }
    }
  };

  /**
   * Switch between front and back camera
   */
  const switchCamera = () => {
    const newFacingMode = cameraFacingMode === "user" ? "environment" : "user";
    startCamera(newFacingMode);
  };

  /**
   * Stop camera stream
   */
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  /**
   * Capture image from camera
   */
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Set canvas dimensions to match video
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Ensure minimum dimensions for face detection
      const minDimension = 400;
      let captureWidth = videoWidth;
      let captureHeight = videoHeight;

      if (videoWidth < minDimension || videoHeight < minDimension) {
        // Scale up if video is too small
        const scale = Math.max(
          minDimension / videoWidth,
          minDimension / videoHeight
        );
        captureWidth = videoWidth * scale;
        captureHeight = videoHeight * scale;
      }

      canvas.width = captureWidth;
      canvas.height = captureHeight;

      // Draw video frame to canvas with high quality
      context.imageSmoothingQuality = "high";
      context.drawImage(video, 0, 0, captureWidth, captureHeight);

      // Convert canvas to blob and create file
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Failed to capture image. Please try again.");
            return;
          }

          const file = new File([blob], `face-capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });

          setSelectedImage(file);

          // Create preview from canvas
          const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
          setImagePreview(dataUrl);

          // Stop camera after capture
          stopCamera();

          // Auto-analyze if facial analysis is selected
          if (analysisType === "facial") {
            setTimeout(() => {
              analyzeImage();
            }, 500);
          }
        },
        "image/jpeg",
        0.95
      ); // High quality JPEG
    }
  };

  /**
   * Analyze image emotion using AI service
   */
  const analyzeImage = async () => {
    if (!selectedImage) {
      setError("Please select or capture an image first");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);

      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(",")[1];
          const analysisResults = await analyzeImageEmotion(
            base64Data,
            null,
            analysisType
          );
          setResults(analysisResults);

          // Add to history
          const newAnalysis = {
            id: Date.now(),
            imagePreview: imagePreview,
            timestamp: new Date().toISOString(),
            dominantEmotion: analysisResults.dominant_emotion,
            confidence: analysisResults.confidence,
            analysisType: analysisType,
            fullResults: analysisResults,
          };

          setAnalysisHistory((prev) => [newAnalysis, ...prev.slice(0, 4)]); // Keep last 5
        } catch (err) {
          setError(
            "Analysis failed: " +
              (err.message || "Please check your connection")
          );
          console.error("Image analysis error:", err);
        }
      };

      reader.onerror = () => {
        setError("Failed to process image file");
      };
    } catch (err) {
      setError("Analysis failed: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Clear current analysis
   */
  const clearAnalysis = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResults(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    stopCamera();
  };

  /**
   * Trigger file input click
   */
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  /**
   * Trigger camera
   */
  const triggerCamera = () => {
    startCamera("user"); // Start with front camera by default for face capture
  };

  /**
   * Export analysis results
   */
  const exportResults = () => {
    if (!results) return;

    const data = {
      analysis: results,
      analysisType: analysisType,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `image-emotion-analysis-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clean up camera on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Sample image descriptions for guidance
  const sampleGuidelines = [
    {
      title: "Facial Analysis",
      description: "Best for portraits and close-up face images",
      tips: [
        "Clear face visibility",
        "Good lighting",
        "Front-facing angle",
        "Fill the frame with your face",
      ],
    },
    {
      title: "General Analysis",
      description: "Analyzes overall emotional tone from scenes",
      tips: [
        "Scene composition",
        "Color tones",
        "Overall mood",
        "Good contrast and lighting",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Image Emotion Analysis
        </h1>
        <p className="text-gray-600 mt-2">
          Analyze emotions from images using advanced computer vision AI
        </p>
      </motion.div>

      {/* Quick Guidelines Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
      >
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800 mb-2">
              Quick Start Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-700">
                  <strong>Choose Analysis Type:</strong> Facial for faces,
                  General for scenes
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-700">
                  <strong>Upload or Capture:</strong> Use camera for real-time
                  face capture
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-700">
                  <strong>Get Results:</strong> View emotion breakdown and
                  confidence scores
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Camera Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
              <h3 className="text-lg font-semibold text-white">
                Capture Your Face
              </h3>
              <button
                onClick={stopCamera}
                className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Camera Preview - Larger container */}
            <div className="flex-1 flex items-center justify-center relative bg-black min-h-[60vh]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full max-h-[70vh] object-contain"
              />

              {/* Face capture guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-80 border-2 border-white border-opacity-50 rounded-2xl flex items-center justify-center">
                  <div className="text-white text-opacity-70 text-sm text-center">
                    Position face here
                  </div>
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Camera Controls */}
            <div className="p-6 bg-black bg-opacity-50 flex flex-col items-center space-y-4">
              {/* Instructions */}
              <div className="text-center">
                <p className="text-white text-sm mb-2">
                  Position your face within the frame and ensure good lighting
                </p>
                <p className="text-white text-opacity-70 text-xs">
                  Make sure your entire face is visible and well-lit
                </p>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center space-x-6">
                {/* Switch Camera Button */}
                <button
                  onClick={switchCamera}
                  className="p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                  title="Switch Camera"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>

                {/* Capture Button */}
                <button
                  onClick={captureImage}
                  className="p-6 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <Circle
                    className="w-12 h-12 text-gray-700"
                    fill="currentColor"
                  />
                </button>

                {/* Empty space for balance */}
                <div className="w-12 h-12"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload or Capture Image
            </h2>

            {/* Analysis Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Analysis Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setAnalysisType("facial")}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    analysisType === "facial"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    Facial Analysis
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Detect emotions from faces
                  </div>
                </button>
                <button
                  onClick={() => setAnalysisType("general")}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    analysisType === "general"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    General Analysis
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Overall emotional tone
                  </div>
                </button>
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview ? (
              <div className="mb-6">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={clearAnalysis}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedImage?.name || "Captured image"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {analysisType === "facial"
                      ? "Facial Analysis"
                      : "General Analysis"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No image selected</p>
                  <p className="text-sm text-gray-400">
                    Upload an image or use your camera
                  </p>
                </div>
              </div>
            )}

            {/* Upload Controls */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={triggerFileInput}
                  className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                </button>
                <button
                  onClick={triggerCamera}
                  className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span>Use Camera</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Analyze Button */}
              {imagePreview && (
                <button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
                >
                  {isAnalyzing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <BarChart3 className="w-5 h-5" />
                  )}
                  <span>{isAnalyzing ? "Analyzing..." : "Analyze Image"}</span>
                </button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Analysis Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              📸 Analysis Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sampleGuidelines.map((guide, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 border border-blue-100"
                >
                  <h4 className="font-semibold text-blue-800 mb-2">
                    {guide.title}
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    {guide.description}
                  </p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    {guide.tips.map((tip, tipIndex) => (
                      <li key={tipIndex}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Results Panel - Same as before */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          {/* Current Results */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Analysis Results
              </h2>
              {results && (
                <button
                  onClick={exportResults}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              )}
            </div>

            {results ? (
              <div className="space-y-4">
                {/* Dominant Emotion */}
                <div
                  className={`p-4 rounded-xl border-2 ${
                    emotionColors[results.dominant_emotion] ||
                    emotionColors.neutral
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-white">
                        {React.createElement(
                          emotionIcons[results.dominant_emotion],
                          {
                            className: "w-6 h-6",
                          }
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold capitalize">
                          {results.dominant_emotion}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Dominant Emotion
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {(results.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Confidence</div>
                    </div>
                  </div>
                </div>

                {/* Emotion Breakdown */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Emotion Breakdown
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(results.emotions)
                      .sort(([, a], [, b]) => b - a)
                      .map(([emotion, score]) => {
                        const percentage = (score * 100).toFixed(1);
                        const isDominant = emotion === results.dominant_emotion;

                        return (
                          <div
                            key={emotion}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  isDominant ? "bg-blue-500" : "bg-gray-300"
                                }`}
                              ></div>
                              <span
                                className={`font-medium capitalize ${
                                  isDominant ? "text-gray-900" : "text-gray-600"
                                }`}
                              >
                                {emotion}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    isDominant ? "bg-blue-500" : "bg-gray-400"
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span
                                className={`text-sm font-medium w-12 ${
                                  isDominant ? "text-gray-900" : "text-gray-600"
                                }`}
                              >
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Analysis Metadata */}
                {results.metadata && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Analysis Details
                    </h3>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Analysis Type:</span>
                        <span className="font-medium capitalize">
                          {analysisType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Faces Detected:</span>
                        <span className="font-medium">
                          {results.metadata.faces_detected || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Image Size:</span>
                        <span className="font-medium">
                          {results.metadata.image_size || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Model:</span>
                        <span className="font-medium">
                          {results.metadata.analysis_model || "AI Model"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Upload an image and analyze to see results</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Advanced computer vision analysis
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Analysis */}
          {analysisHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Recent Analysis
              </h3>
              <div className="space-y-3">
                {analysisHistory.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(item.imagePreview);
                      setResults(item.fullResults);
                      setAnalysisType(item.analysisType);
                    }}
                  >
                    <img
                      src={item.imagePreview}
                      alt="History preview"
                      className="w-12 h-12 object-cover rounded border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {item.dominantEmotion}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500 capitalize">
                          {item.analysisType}
                        </span>
                        <span className="text-xs font-medium text-blue-600">
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ImageAnalysis;
