'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface FaceVerificationProps {
  onVerified: (faceImage: string) => void;
  isAlreadyVerified: boolean;
}

export default function FaceVerification({ onVerified, isAlreadyVerified }: FaceVerificationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [faceApi, setFaceApi] = useState<any>(null);

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    setIsLoadingModel(true);
    setErrorMsg('');
    try {
      const faceapi = await import('face-api.js');
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      setFaceApi(faceapi);
      setIsLoadingModel(false);
    } catch (err) {
      console.error('Failed to load face detection model:', err);
      setErrorMsg('Failed to load face detection model. Please refresh and try again.');
      setIsLoadingModel(false);
    }
  }, []);

  // Start camera
  const startCamera = async () => {
    setErrorMsg('');
    setCapturedImage(null);
    try {
      if (!faceApi) {
        await loadModels();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera access was denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera found on this device.');
      } else {
        setErrorMsg('Failed to access camera. Please ensure you have a camera and try again.');
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setFaceDetected(false);
  };

  // Face detection loop
  useEffect(() => {
    if (!cameraActive || !faceApi || !videoRef.current || !overlayCanvasRef.current) return;

    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    const ctx = overlay.getContext('2d');

    const detectFace = async () => {
      if (!video || video.paused || video.ended || !ctx) {
        animFrameRef.current = requestAnimationFrame(detectFace);
        return;
      }

      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;

      try {
        const detections = await faceApi.detectAllFaces(
          video,
          new faceApi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
        );

        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (detections.length === 1) {
          setFaceDetected(true);
          const det = detections[0];
          const box = det.box;

          // Draw face bounding box
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Draw corner accents
          const cornerLen = 20;
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#22c55e';
          
          // Top-left
          ctx.beginPath();
          ctx.moveTo(box.x, box.y + cornerLen);
          ctx.lineTo(box.x, box.y);
          ctx.lineTo(box.x + cornerLen, box.y);
          ctx.stroke();
          // Top-right
          ctx.beginPath();
          ctx.moveTo(box.x + box.width - cornerLen, box.y);
          ctx.lineTo(box.x + box.width, box.y);
          ctx.lineTo(box.x + box.width, box.y + cornerLen);
          ctx.stroke();
          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(box.x, box.y + box.height - cornerLen);
          ctx.lineTo(box.x, box.y + box.height);
          ctx.lineTo(box.x + cornerLen, box.y + box.height);
          ctx.stroke();
          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(box.x + box.width - cornerLen, box.y + box.height);
          ctx.lineTo(box.x + box.width, box.y + box.height);
          ctx.lineTo(box.x + box.width, box.y + box.height - cornerLen);
          ctx.stroke();

          // Label
          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('Face Detected', box.x, box.y - 8);

        } else if (detections.length > 1) {
          setFaceDetected(false);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          ctx.fillRect(0, 0, overlay.width, overlay.height);
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Multiple faces detected — only one face allowed', overlay.width / 2, 30);
          ctx.textAlign = 'start';
        } else {
          setFaceDetected(false);
        }
      } catch (err) {
        // Detection error, silently retry
      }

      animFrameRef.current = requestAnimationFrame(detectFace);
    };

    // Wait for video to be ready
    const onPlay = () => {
      detectFace();
    };

    if (video.readyState >= 2) {
      detectFace();
    } else {
      video.addEventListener('loadeddata', onPlay);
    }

    return () => {
      video.removeEventListener('loadeddata', onPlay);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cameraActive, faceApi]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture face
  const captureFace = () => {
    if (!faceDetected) return;

    setIsCapturing(true);
    setCountdown(3);

    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);

        // Take snapshot
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Mirror the image (since webcam is mirrored)
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedImage(dataUrl);
            stopCamera();
          }
        }
        setIsCapturing(false);
      }
    }, 1000);
  };

  // Submit verification
  const submitVerification = () => {
    if (capturedImage) {
      onVerified(capturedImage);
    }
  };

  // Retake
  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  if (isAlreadyVerified) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex items-center gap-4">
        <div className="bg-emerald-100 p-3 rounded-full">
          <CheckCircle size={28} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="font-bold text-emerald-800 text-lg">Face Verified</h3>
          <p className="text-emerald-700 text-sm">Your identity has been verified via face detection. You can now access all features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
        <Camera size={24} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-blue-800 mb-1">Face Verification</h3>
          <p className="text-blue-700 text-sm">
            We&apos;ll use your camera to verify your identity. Position your face clearly in the frame and we&apos;ll take a snapshot. 
            This helps keep our community safe and trustworthy.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <XCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Camera View */}
      {!capturedImage && (
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
          {!cameraActive ? (
            <div className="flex flex-col items-center justify-center py-24 px-8">
              <div className="bg-gray-800 p-6 rounded-full mb-6">
                <Camera size={48} className="text-gray-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Ready to Verify</h3>
              <p className="text-gray-400 text-sm text-center mb-8 max-w-sm">
                Click the button below to start your camera. Make sure you&apos;re in a well-lit area.
              </p>
              <button
                onClick={startCamera}
                disabled={isLoadingModel}
                className="px-8 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isLoadingModel ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Loading Model...
                  </>
                ) : (
                  <>
                    <Camera size={20} />
                    Start Camera
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* Video feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-[480px] object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* Detection overlay */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                  <div className="text-white text-8xl font-bold animate-pulse">
                    {countdown}
                  </div>
                </div>
              )}

              {/* Status bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${faceDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-white text-sm font-medium">
                      {faceDetected ? 'Face detected — ready to capture' : 'Position your face in the frame'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg text-sm hover:bg-white/30 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={captureFace}
                      disabled={!faceDetected || isCapturing}
                      className="px-6 py-2 bg-white text-gray-900 rounded-lg font-bold text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isCapturing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Camera size={16} />
                      )}
                      Capture
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Captured Image Review */}
      {capturedImage && (
        <div className="space-y-4">
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
            <img
              src={capturedImage}
              alt="Captured face"
              className="w-full h-auto max-h-[480px] object-cover"
            />
            <div className="absolute top-4 left-4 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
              <CheckCircle size={16} />
              Face Captured
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={retake}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Retake
            </button>
            <button
              onClick={submitVerification}
              className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Verify My Identity
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
