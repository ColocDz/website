'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';

function MobileVerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [status, setStatus] = useState<'idle' | 'camera' | 'captured' | 'submitting' | 'done' | 'error'>('idle');
  const [faceDetected, setFaceDetected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [faceApi, setFaceApi] = useState<any>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 text-sm">This verification link is invalid or has expired. Please scan a new QR code from the desktop.</p>
        </div>
      </div>
    );
  }

  const loadModels = useCallback(async () => {
    setIsLoadingModel(true);
    try {
      const faceapi = await import('face-api.js');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      setFaceApi(faceapi);
    } catch (err) {
      setErrorMsg('Failed to load face detection models.');
    } finally {
      setIsLoadingModel(false);
    }
  }, []);

  const startCamera = async () => {
    setErrorMsg('');
    setCapturedImage(null);
    setCapturedDescriptor(null);
    try {
      if (!faceApi) await loadModels();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 640 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('camera');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera access denied. Please allow camera permissions.');
      } else {
        setErrorMsg('Failed to access camera.');
      }
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setFaceDetected(false);
  };

  // Face detection loop
  useEffect(() => {
    if (status !== 'camera' || !faceApi || !videoRef.current || !overlayCanvasRef.current) return;
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    const ctx = overlay.getContext('2d');

    const detect = async () => {
      if (!video || video.paused || video.ended || !ctx) { animFrameRef.current = requestAnimationFrame(detect); return; }
      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;
      try {
        const dets = await faceApi.detectAllFaces(video, new faceApi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }));
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        if (dets.length === 1) {
          setFaceDetected(true);
          const box = dets[0].box;
          ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          ctx.fillStyle = '#22c55e'; ctx.font = 'bold 14px sans-serif';
          ctx.fillText('Face Detected ✓', box.x, box.y - 8);
        } else {
          setFaceDetected(false);
          if (dets.length > 1) {
            ctx.fillStyle = '#ef4444'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('Only one face allowed', overlay.width / 2, 30);
            ctx.textAlign = 'start';
          }
        }
      } catch (e) {}
      animFrameRef.current = requestAnimationFrame(detect);
    };

    if (video.readyState >= 2) detect();
    else video.addEventListener('loadeddata', detect);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [status, faceApi]);

  useEffect(() => { return () => { stopCamera(); }; }, []);

  const captureFace = () => {
    if (!faceDetected) return;
    setIsCapturing(true);
    setCountdown(3);
    let count = 3;
    const timer = setInterval(async () => {
      count--;
      if (count > 0) { setCountdown(count); } else {
        clearInterval(timer);
        setCountdown(null);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && faceApi) {
          canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            try {
              const det = await faceApi.detectSingleFace(video, new faceApi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks().withFaceDescriptor();
              if (det) {
                setCapturedDescriptor(Array.from(det.descriptor as Float32Array));
                setCapturedImage(dataUrl);
                stopCamera();
                setStatus('captured');
              } else {
                setErrorMsg('Face lost during capture. Try again.');
              }
            } catch (e) { setErrorMsg('Failed to compute face features.'); }
          }
        }
        setIsCapturing(false);
      }
    }, 1000);
  };

  const submitToDesktop = async () => {
    if (!capturedImage || !capturedDescriptor) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/face/verify-token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, descriptor: capturedDescriptor, faceImage: capturedImage }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('done');
      } else {
        setErrorMsg(data.error || 'Verification failed.');
        setStatus('error');
      }
    } catch (e) {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Shield size={24} className="text-indigo-600" />
        <h1 className="text-lg font-bold text-gray-900">ColocDZ Face Verification</h1>
      </div>

      <div className="flex-1 p-6 space-y-6 max-w-lg mx-auto w-full">
        {status === 'done' ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-emerald-100 p-5 rounded-full mb-6">
              <CheckCircle size={48} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verified!</h2>
            <p className="text-gray-600 text-sm">Your face has been verified. You can close this page and return to your desktop — it will update automatically.</p>
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-red-100 p-5 rounded-full mb-6">
              <XCircle size={48} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-red-600 text-sm mb-6">{errorMsg}</p>
            <button onClick={() => { setStatus('idle'); setErrorMsg(''); setCapturedImage(null); setCapturedDescriptor(null); }}
              className="px-8 py-3 bg-black text-white rounded-xl font-bold">Try Again</button>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <XCircle size={20} className="text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-sm">{errorMsg}</p>
              </div>
            )}

            {status === 'idle' && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-indigo-100 p-5 rounded-full mb-6">
                  <Camera size={48} className="text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verify Your Face</h2>
                <p className="text-gray-600 text-sm mb-8 max-w-sm">Position your face in the camera frame and take a snapshot to complete verification.</p>
                <button onClick={startCamera} disabled={isLoadingModel}
                  className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {isLoadingModel ? <><Loader2 size={20} className="animate-spin" /> Loading...</> : <><Camera size={20} /> Start Camera</>}
                </button>
              </div>
            )}

            {status === 'camera' && (
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" style={{ transform: 'scaleX(-1)' }} />
                <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                    <div className="text-white text-8xl font-bold animate-pulse">{countdown}</div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${faceDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                      <span className="text-white text-xs">{faceDetected ? 'Ready' : 'Position face'}</span>
                    </div>
                    <button onClick={captureFace} disabled={!faceDetected || isCapturing}
                      className="px-5 py-2 bg-white text-gray-900 rounded-lg font-bold text-sm disabled:opacity-40">
                      {isCapturing ? <Loader2 size={14} className="animate-spin" /> : 'Capture'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {status === 'captured' && capturedImage && (
              <div className="space-y-4">
                <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
                  <img src={capturedImage} alt="Captured" className="w-full" />
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <CheckCircle size={12} /> Captured
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setCapturedImage(null); setCapturedDescriptor(null); startCamera(); }}
                    className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-700">Retake</button>
                  <button onClick={submitToDesktop}
                    className="flex-1 py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Verify
                  </button>
                </div>
              </div>
            )}

            {status === 'submitting' && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
                <p className="text-gray-600 text-sm">Verifying your face...</p>
              </div>
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default function VerifyMobilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-gray-400" /></div>}>
      <MobileVerifyContent />
    </Suspense>
  );
}
