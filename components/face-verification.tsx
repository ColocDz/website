'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, Loader2, RefreshCw, QrCode, Smartphone } from 'lucide-react';

interface FaceVerificationProps {
  onVerified: (faceImage: string, descriptor?: number[]) => void;
  isAlreadyVerified: boolean;
  initialPhone?: string;
}

export default function FaceVerification({ onVerified, isAlreadyVerified, initialPhone = '' }: FaceVerificationProps) {
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
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [faceApi, setFaceApi] = useState<any>(null);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [noCameraMode, setNoCameraMode] = useState(false);
  
  // Phone & QR fallback state
  const [phone, setPhone] = useState(initialPhone);
  const [phoneStep, setPhoneStep] = useState<'input' | 'qr' | null>(null);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Load face-api.js models — now includes landmarks & recognition for descriptors
  const loadModels = useCallback(async () => {
    setIsLoadingModel(true);
    setErrorMsg('');
    try {
      const faceapi = await import('face-api.js');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      setFaceApi(faceapi);
      setIsLoadingModel(false);
    } catch (err) {
      console.error('Failed to load face detection models:', err);
      setErrorMsg('Failed to load face detection models. Please refresh and try again.');
      setIsLoadingModel(false);
    }
  }, []);

  // Start camera
  const startCamera = async () => {
    setErrorMsg('');
    setCapturedImage(null);
    setCapturedDescriptor(null);
    setDuplicateCheckResult(null);
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
        setErrorMsg('Camera access was denied. Please allow camera permissions or use the QR code option below.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera found on this device. Use the QR code option to verify via your phone.');
        setNoCameraMode(true);
      } else {
        setErrorMsg('Failed to access camera. You can use the QR code option as an alternative.');
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

  // Face detection loop with bounding box
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

    const onPlay = () => { detectFace(); };

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
    return () => { stopCamera(); };
  }, []);

  // Capture face — compute descriptor + image
  const captureFace = () => {
    if (!faceDetected) return;

    setIsCapturing(true);
    setCountdown(3);

    let count = 3;
    const timer = setInterval(async () => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && faceApi) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Mirror the image
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            // Compute face descriptor from original video (not mirrored canvas)
            try {
              const detection = await faceApi
                .detectSingleFace(video, new faceApi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

              if (detection) {
                const descriptor = Array.from(detection.descriptor as Float32Array);
                setCapturedDescriptor(descriptor);
                setCapturedImage(dataUrl);
                stopCamera();
              } else {
                setErrorMsg('Face lost during capture. Please try again.');
                setIsCapturing(false);
                return;
              }
            } catch (err) {
              console.error('Descriptor computation failed:', err);
              setErrorMsg('Failed to compute face features. Please try again.');
              setIsCapturing(false);
              return;
            }
          }
        }
        setIsCapturing(false);
      }
    }, 1000);
  };

  // Submit verification — check duplicate first, then save
  const submitVerification = async () => {
    if (!capturedImage || !capturedDescriptor) return;

    setIsCheckingDuplicate(true);
    setDuplicateCheckResult(null);
    setErrorMsg('');

    try {
      // Step 1: Check for duplicate face
      const checkRes = await fetch('/api/face/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor: capturedDescriptor }),
      });

      const checkData = await checkRes.json();

      if (checkData.duplicate) {
        setDuplicateCheckResult(checkData.message || 'Duplicate face detected.');
        setIsCheckingDuplicate(false);
        return;
      }

      // Step 2: Save face data
      onVerified(capturedImage, capturedDescriptor);
    } catch (err) {
      console.error('Verification error:', err);
      setErrorMsg('Verification failed. Please try again.');
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  // Retake
  const retake = () => {
    setCapturedImage(null);
    setCapturedDescriptor(null);
    setDuplicateCheckResult(null);
    setErrorMsg('');
    startCamera();
  };

  // ─── QR Code Fallback ───
  const startQrVerification = async () => {
    setErrorMsg('');
    try {
      const res = await fetch('/api/face/verify-token', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to create verification token');
      }
      const { token } = await res.json();
      setQrToken(token);

      // Generate QR code data URL
      const baseUrl = window.location.origin;
      const verifyUrl = `${baseUrl}/verify-mobile?token=${token}`;
      
      // Dynamically import qrcode client-side to generate local base64 QR code image
      const QRCodeModule = await import('qrcode');
      const qrUrl = await QRCodeModule.toDataURL(verifyUrl, { width: 250, margin: 2 });
      
      setQrDataUrl(qrUrl);
      setIsPolling(true);
      setPhoneStep('qr');
    } catch (err: any) {
      console.error('QR generation failed:', err);
      setErrorMsg('Failed to generate QR code. Please try again.');
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Validate phone number: 9 digits starting with 5, 6 or 7
    const cleanedPhone = phone.trim();
    if (!/^(5|6|7)\d{8}$/.test(cleanedPhone)) {
      setErrorMsg('Please enter a valid 9-digit Algerian phone number (e.g. 550123456)');
      return;
    }

    setIsSavingPhone(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanedPhone })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update phone number');
      }

      // Now proceed to generate QR code
      await startQrVerification();
    } catch (err: any) {
      console.error('Failed to save phone number:', err);
      setErrorMsg(err.message || 'Failed to save phone number. Please try again.');
    } finally {
      setIsSavingPhone(false);
    }
  };

  // Poll for QR verification completion
  useEffect(() => {
    if (!isPolling || !qrToken) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/face/verify-token?token=${qrToken}`);
        const data = await res.json();

        if (data.status === 'verified' && data.faceImage) {
          clearInterval(interval);
          setIsPolling(false);
          setQrToken(null);
          setQrDataUrl(null);
          onVerified(data.faceImage, data.descriptor);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIsPolling(false);
          setErrorMsg('Verification failed from mobile device. Duplicate face detected.');
        }
      } catch (err) {
        // Polling error — silently retry
      }
    }, 2500);

    // Timeout after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsPolling(false);
      setQrToken(null);
      setQrDataUrl(null);
      setErrorMsg('QR verification timed out. Please try again.');
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isPolling, qrToken, onVerified]);

  // ─── Already Verified State ───
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

  // ─── Phone Number Input Step ───
  if (phoneStep === 'input') {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
          <Smartphone size={24} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-blue-800 mb-1 font-sans">Verify Your Phone Number First</h3>
            <p className="text-blue-700 text-sm">
              Please enter your 9-digit Algerian phone number. This is required before generating the verification QR code.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <XCircle size={20} className="text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Algerian Mobile Number</label>
            <div className="flex gap-2">
              <span className="flex items-center px-4 border border-gray-300 bg-gray-50 rounded-xl text-gray-500 text-sm font-medium">
                +213
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="w-full px-4 py-3 border border-gray-300 bg-white rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm font-sans"
                placeholder="e.g. 550123456"
                disabled={isSavingPhone}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Enter the 9 digits without the leading 0.</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setPhoneStep(null); setErrorMsg(''); }}
              disabled={isSavingPhone}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingPhone || !phone}
              className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSavingPhone ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Generate QR Code'
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── QR Code View ───
  if (phoneStep === 'qr' && qrDataUrl) {
    return (
      <div className="space-y-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-start gap-4">
          <Smartphone size={24} className="text-indigo-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-indigo-800 mb-1">Verify on Your Phone</h3>
            <p className="text-indigo-700 text-sm">
              Scan this QR code with your phone camera to open the verification page. Complete face detection on your phone and this page will update automatically.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <XCircle size={20} className="text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm">{errorMsg}</p>
          </div>
        )}

        <div className="flex flex-col items-center gap-4 py-8">
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
            <img src={qrDataUrl} alt="QR Code for mobile verification" className="w-[250px] h-[250px]" />
          </div>
          
          {isPolling && (
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm font-medium">Waiting for verification from your phone...</span>
            </div>
          )}
        </div>

        <button
          onClick={() => { setQrDataUrl(null); setQrToken(null); setIsPolling(false); setPhoneStep(null); }}
          className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  // ─── Main Camera View ───
  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
        <Camera size={24} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-blue-800 mb-1">Face Verification</h3>
          <p className="text-blue-700 text-sm">
            We&apos;ll use your camera to verify your identity. Position your face clearly in the frame and we&apos;ll take a snapshot. 
            Your face features are computed locally and compared against registered users to prevent duplicate accounts.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <XCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-sm">{errorMsg}</p>
        </div>
      )}

      {duplicateCheckResult && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
          <XCircle size={20} className="text-orange-500 flex-shrink-0" />
          <div>
            <p className="text-orange-700 text-sm font-semibold">Duplicate Face Detected</p>
            <p className="text-orange-600 text-xs mt-1">{duplicateCheckResult}</p>
          </div>
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
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  onClick={startCamera}
                  disabled={isLoadingModel}
                  className="px-8 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoadingModel ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Loading Models...
                    </>
                  ) : (
                    <>
                      <Camera size={20} />
                      Start Camera
                    </>
                  )}
                </button>

                {/* QR Fallback Button */}
                <button
                  onClick={() => { setPhoneStep('input'); setErrorMsg(''); }}
                  className="px-8 py-3 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 border border-gray-700"
                >
                  <QrCode size={18} />
                  No camera? Verify via phone
                </button>
              </div>
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
            {capturedDescriptor && (
              <div className="absolute top-4 right-4 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                128-pt descriptor computed
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={retake}
              disabled={isCheckingDuplicate}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Retake
            </button>
            <button
              onClick={submitVerification}
              disabled={isCheckingDuplicate || !capturedDescriptor}
              className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isCheckingDuplicate ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Verify My Identity
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
