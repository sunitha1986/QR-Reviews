import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import jsQR from 'jsqr';
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  ZapOff,
  Upload,
  CheckCircle2,
  ScanLine,
  Volume2
} from 'lucide-react';
import { extractQrIdFromText } from './QrCameraScannerModal';
import config from '../config';

/**
 * High-precision audio feedback for successful scan using Web Audio API
 * Produces an authentic supermarket-style high chime beep
 */
function playInstantScannerBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone rising chirp (880Hz -> 1760Hz) for instant confirmation
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 note
    osc.frequency.exponentialRampToValueAtTime(1567.98, ctx.currentTime + 0.08); // G6 note

    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch (e) {
    // Audio context may be restricted by browser policy before first interaction
  }
}

export default function QuickReviewScannerModal({
  isOpen,
  onClose,
  onNavigateToReview
}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) | 'user' (front)
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [detectedTarget, setDetectedTarget] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const fileInputRef = useRef(null);
  const isScanningRef = useRef(false);
  const hasNavigatedRef = useRef(false);

  // Cleanly stop video stream
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch { }
      });
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
    setHasTorch(false);
  }, []);

  // Process detected QR code: make sound & navigate immediately!
  const handleDecodedData = useCallback(async (rawData) => {
    if (!rawData || hasNavigatedRef.current) return;
    isScanningRef.current = false;

    // 1. Play instant scanner beep sound!
    playInstantScannerBeep();

    // 2. Trigger haptic vibration on mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([60, 40, 80]);
      } catch { }
    }

    // 3. Extract QR ID or URL slug
    const cleanId = extractQrIdFromText(rawData) || rawData.trim();
    setDetectedTarget(cleanId);

    // 4. Quick lookup to see if there is an active custom slug for this QR
    let targetPath = cleanId;
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/public/qr-info/${encodeURIComponent(cleanId)}`);
      const data = await res.json();
      if (data && data.valid) {
        if (data.slug) {
          targetPath = data.slug;
        } else if (data.client?.slug) {
          targetPath = data.client.slug;
        } else if (data.qrId) {
          targetPath = data.qrId;
        }
      }
    } catch {
      // Use cleanId directly if network check fails
    }

    hasNavigatedRef.current = true;

    // 5. Instant navigation (short 250ms visual confirmation delay)
    setTimeout(() => {
      stopCamera();
      if (onNavigateToReview) {
        onNavigateToReview(targetPath);
      } else {
        window.location.href = `/${targetPath}`;
      }
    }, 280);
  }, [onNavigateToReview, stopCamera]);

  // Fast frame scanning loop
  const scanLoop = useCallback(() => {
    if (!isScanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        handleDecodedData(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanLoop);
  }, [handleDecodedData]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setError(null);
    setDetectedTarget(null);
    hasNavigatedRef.current = false;
    isScanningRef.current = true;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by this browser. You can upload a photo of the QR code instead.');
      }

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          setHasTorch(true);
        }
      }

      setCameraActive(true);
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err) {
      console.warn('Quick scanner camera error:', err);
      let msg = 'Failed to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera permissions in your browser settings to scan standees.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device. You can upload an image of the QR code below.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      setCameraActive(false);
    }
  }, [facingMode, scanLoop, stopCamera]);

  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track && hasTorch) {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      }
    } catch (err) {
      console.error('Torch error:', err);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          handleDecodedData(code.data);
        } else {
          setUploadError('Could not detect a QR code in this image. Please take a clearer photo.');
        }
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '92%',
          padding: '22px',
          background: '#0B0F19',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 30px rgba(139, 92, 246, 0.2)',
          borderRadius: '18px',
          color: '#F8FAFC'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2))',
              color: '#A78BFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(139, 92, 246, 0.4)'
            }}>
              <ScanLine size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.12rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Instant QR Scanner
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Volume2 size={12} style={{ color: '#10B981' }} />
                <span>Auto-navigates on scan with sound</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', padding: '6px', width: '32px', height: '32px' }}
            title="Close Scanner"
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewfinder Window */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          background: '#020617',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: cameraActive ? 'block' : 'none'
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Scanning Box & Laser */}
          {cameraActive && !detectedTarget && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle, transparent 45%, rgba(0,0,0,0.7) 90%)'
              }} />

              <div style={{
                position: 'relative',
                width: '210px',
                height: '210px',
                border: '2px solid rgba(139, 92, 246, 0.6)',
                borderRadius: '16px',
                boxShadow: '0 0 25px rgba(139, 92, 246, 0.35)',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '22px', height: '22px', borderTop: '4px solid #8B5CF6', borderLeft: '4px solid #8B5CF6', borderTopLeftRadius: '10px' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '22px', height: '22px', borderTop: '4px solid #8B5CF6', borderRight: '4px solid #8B5CF6', borderTopRightRadius: '10px' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '22px', height: '22px', borderBottom: '4px solid #8B5CF6', borderLeft: '4px solid #8B5CF6', borderBottomLeftRadius: '10px' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderBottom: '4px solid #8B5CF6', borderRight: '4px solid #8B5CF6', borderBottomRightRadius: '10px' }} />

                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, #10B981, transparent)',
                  boxShadow: '0 0 12px #10B981',
                  animation: 'scanLaser 1.8s linear infinite'
                }} />
              </div>

              <div style={{
                position: 'absolute',
                bottom: '12px',
                padding: '4px 14px',
                borderRadius: '20px',
                background: 'rgba(0,0,0,0.75)',
                color: '#E2E8F0',
                fontSize: '0.74rem',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <ScanLine size={13} style={{ color: '#10B981' }} />
                <span>Point at any standee QR to open instantly</span>
              </div>
            </div>
          )}

          {/* Success Flash & Immediate Navigation Notice */}
          {detectedTarget && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(16, 185, 129, 0.4)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              zIndex: 30
            }}>
              <CheckCircle2 size={56} style={{ color: '#34D399', marginBottom: '8px' }} />
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                Standee Scanned!
              </div>
              <code style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#F8FAFC',
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 12px',
                borderRadius: '8px',
                marginTop: '6px'
              }}>
                {detectedTarget}
              </code>
              <div style={{ fontSize: '0.78rem', color: '#E2E8F0', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={12} className="animate-spin" />
                <span>Redirecting to review form...</span>
              </div>
            </div>
          )}

          {/* Camera Error Display */}
          {error && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#FCA5A5' }}>
              <Camera size={36} style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
              <p style={{ fontSize: '0.84rem', margin: 0, lineHeight: 1.4 }}>{error}</p>
            </div>
          )}
        </div>

        {/* Camera Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={toggleCameraFacing}
              title="Flip camera (rear/front)"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}
            >
              <RefreshCw size={13} />
              <span>Flip</span>
            </button>

            {hasTorch && (
              <button
                type="button"
                className={`btn btn-sm ${torchOn ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleTorch}
                title="Toggle Flashlight"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}
              >
                {torchOn ? <ZapOff size={13} /> : <Zap size={13} />}
                <span>Flash</span>
              </button>
            )}
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}
            >
              <Upload size={13} />
              <span>Upload QR</span>
            </button>
          </div>
        </div>

        {uploadError && (
          <div style={{ marginTop: '8px', color: '#F87171', fontSize: '0.76rem', textAlign: 'center' }}>
            {uploadError}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

