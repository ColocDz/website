'use client';

let faceapiInstance: any = null;
let modelsLoaded = false;

export async function ensureModelsLoaded() {
  if (typeof window === 'undefined') return null;
  if (faceapiInstance && modelsLoaded) return faceapiInstance;
  
  if (!faceapiInstance) {
    faceapiInstance = await import('face-api.js');
  }
  
  if (!modelsLoaded) {
    await Promise.all([
      faceapiInstance.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapiInstance.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapiInstance.nets.faceRecognitionNet.loadFromUri('/models'),
    ]);
    modelsLoaded = true;
  }
  
  return faceapiInstance;
}
