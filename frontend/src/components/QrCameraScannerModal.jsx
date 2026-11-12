import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  X,
  RefreshCw,
  Zap,
  ZapOff,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building2,
  ScanLine
} from 'lucide-react';
import config from '../config';

/**
 * Intelligent helper to extract the QR ID (e.g. QR000001 or legacy QR-000001 / QR-tftxc-0001)
 * from either raw strings or scanned review URLs.
 */
export function extractQrIdFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();

  // 1. Check for standard QR000001 or legacy QR-000001 pattern anywhere in the scanned text/URL
  const matchStandard = clean.match(/QR-?(\d{4,8})/i);
  if (matchStandard) {
    return matchStandard[0].toUpperCase();
  }

  // 2. Check for legacy QR-<token>-<seq> pattern e.g. QR-gryhf-0001
  const matchLegacy = clean.match(/QR-([a-z0-9]+)-(\d{4,8})/i);
  if (matchLegacy) {
    return matchLegacy[0].toUpperCase();
  }

  // 3. Fallback to path segment if it's a URL
  try {
    const url = new URL(clean);
    const parts = url.pathname.split('/').filter(Boolean);
    for (const part of parts.reverse()) {
      const pMatch = part.match(/QR-?(\d{4,8})/i) || part.match(/QR-([a-z0-9]+)-(\d{4,8})/i);
      if (pMatch) {
        return pMatch[0].toUpperCase();
      }
    }
  } catch {
    // Not a URL
  }

  // 4. Return as-is if it starts with QR or QR-
  if (/^QR-?/i.test(clean)) {
    return clean.toUpperCase();
  }

  return clean;
}

/**
 * Audio feedback for successful scan using Web Audio API
 */
function playSuccessBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Audio context may be restricted by browser policy
  }
}

/**
 * Audio feedback for already assigned QR or warning
 */
function playWarningBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.setValueAtTime(220, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Audio context may be restricted by browser policy
  }
}

export default function QrCameraScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  availableQrs = [],
  title = 'Scan Dynamic QR Standee'
}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const fileInputRef = useRef(null);
  const isScanningRef = useRef(false);

  // Stop camera stream tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
    setHasTorch(false);
  }, []);

  // Process decoded QR text & verify assignment status
  const handleDecodedData = useCallback(async (rawData) => {
    if (!rawData) return;
    isScanningRef.current = false;

    const qrId = extractQrIdFromText(rawData);
    if (!qrId) {
      isScanningRef.current = true;
      return;
    }

    // 1. Check if the scanned standee is in availableQrs (unassigned list)
    const isExplicitlyUnassigned = Array.isArray(availableQrs) && availableQrs.length > 0 &&
      availableQrs.some(q => q.qrId && q.qrId.toUpperCase() === qrId.toUpperCase());

    if (isExplicitlyUnassigned) {
      playSuccessBeep();
      setScannedResult({ raw: rawData, qrId, isAssigned: false });
      setTimeout(() => {
        stopCamera();
        if (onScanSuccess) {
          onScanSuccess(qrId, rawData, { isAssigned: false });
        }
      }, 700);
      return;
    }

    // 2. Query backend to verify if this standee is already assigned to a business
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/public/qr-info/${encodeURIComponent(qrId)}`);
      const data = await res.json();

      if (data && data.valid && data.isAssigned) {
        // ALREADY ASSIGNED!
        playWarningBeep();
        stopCamera();
        setScannedResult({
          raw: rawData,
          qrId: data.qrId || qrId,
          isAssigned: true,
          client: data.client,
          clientName: data.client?.name || 'Onboarded Business',
          clientPhone: data.client?.phone || '',
          clientSlug: data.slug || data.client?.slug || ''
        });
        return;
      }
    } catch (err) {
      console.warn('Error checking QR assignment status:', err);
    }

    // 3. Fallback: unassigned or newly recognized QR
    playSuccessBeep();
    setScannedResult({ raw: rawData, qrId, isAssigned: false });
    setTimeout(() => {
      stopCamera();
      if (onScanSuccess) {
        onScanSuccess(qrId, rawData, { isAssigned: false });
      }
    }, 700);
  }, [availableQrs, onScanSuccess, stopCamera]);

  // Continuous animation frame scanning loop
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
    setScannedResult(null);
    isScanningRef.current = true;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by this browser. Please use the image upload option below.');
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

      // Check if torch/flashlight is supported
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
      console.warn('Camera initialization error:', err);
      let msg = 'Failed to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera permissions in your browser or device settings, or upload an image below.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device. You can upload an image of the QR code below.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is currently in use by another application.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      setCameraActive(false);
    }
  }, [facingMode, scanLoop, stopCamera]);

  // Flip camera between environment (rear) and user (front)
  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Reset and scan another standee after assigned notification
  const handleScanAgain = useCallback(() => {
    setScannedResult(null);
    setUploadError(null);
    startCamera();
  }, [startCamera]);

  // Toggle flashlight / torch
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
      console.error('Torch toggle failed:', err);
    }
  };

  // Decode QR from uploaded image file
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
          setUploadError('Could not detect a clear QR code in this image. Please upload a sharper photo or use the camera.');
        }
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Lifecycle when modal opens / closes
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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '24px',
          background: '#0F172A',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          borderRadius: '16px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.2)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Camera size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#F8FAFC', margin: 0 }}>{title}</h3>
              <p style={{ fontSize: '0.76rem', color: '#94A3B8', margin: 0 }}>
                Point camera at physical standee to assign instantly
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', padding: '6px', width: '32px', height: '32px' }}
            title="Close Camera"
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewfinder Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          background: '#020617',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Active Video Stream */}
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: cameraActive ? 'block' : 'none'
            }}
          />

          {/* Hidden Canvas for QR Analysis */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Camera Scanning Reticle Overlay */}
          {cameraActive && !scannedResult && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              {/* Darkened vignette surround */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.65) 85%)'
              }} />

              {/* Viewfinder Box */}
              <div style={{
                position: 'relative',
                width: '220px',
                height: '220px',
                border: '2px solid rgba(99, 102, 241, 0.5)',
                borderRadius: '16px',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
                overflow: 'hidden'
              }}>
                {/* 4 Corner Markers */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '24px', height: '24px', borderTop: '4px solid #6366F1', borderLeft: '4px solid #6366F1', borderTopLeftRadius: '12px' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '24px', height: '24px', borderTop: '4px solid #6366F1', borderRight: '4px solid #6366F1', borderTopRightRadius: '12px' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '24px', height: '24px', borderBottom: '4px solid #6366F1', borderLeft: '4px solid #6366F1', borderBottomLeftRadius: '12px' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '24px', height: '24px', borderBottom: '4px solid #6366F1', borderRight: '4px solid #6366F1', borderBottomRightRadius: '12px' }} />

                {/* Animated Scanning Laser Line */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, #10B981, transparent)',
                  boxShadow: '0 0 10px #10B981',
                  animation: 'scanLaser 2s linear infinite'
                }} />
              </div>

              {/* Subtle instruction pill */}
              <div style={{
                position: 'absolute',
                bottom: '14px',
                padding: '4px 12px',
                borderRadius: '20px',
                background: 'rgba(0,0,0,0.7)',
                color: '#E2E8F0',
                fontSize: '0.74rem',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ScanLine size={13} style={{ color: '#10B981' }} />
                <span>Align QR code within frame</span>
              </div>
            </div>
          )}

          {/* Already Assigned Standee Warning Overlay */}
          {scannedResult && scannedResult.isAssigned ? (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              textAlign: 'center',
              color: '#FFFFFF',
              zIndex: 25
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid rgba(239, 68, 68, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <AlertTriangle size={32} style={{ color: '#EF4444' }} />
              </div>

              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F87171', marginBottom: '4px' }}>
                Already Assigned!
              </div>

              <p style={{ fontSize: '0.84rem', color: '#CBD5E1', maxWidth: '320px', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                This QR standee (<code style={{ color: '#FCD34D', fontWeight: 700 }}>{scannedResult.qrId}</code>) is already active and linked to:
              </p>

              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '10px',
                padding: '10px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                maxWidth: '92%',
                textAlign: 'left'
              }}>
                <Building2 size={24} style={{ color: 'var(--primary, #6366F1)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#FFFFFF' }}>
                    {scannedResult.clientName}
                  </div>
                  {scannedResult.clientPhone && (
                    <div style={{ fontSize: '0.76rem', color: '#94A3B8' }}>
                      Phone: {scannedResult.clientPhone}
                    </div>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '0.74rem', color: '#F87171', margin: '0 0 16px 0', fontWeight: 600 }}>
                This standee cannot be assigned to another client.
              </p>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleScanAgain}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={13} />
                  <span>Scan Another Standee</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <X size={13} />
                  <span>Close</span>
                </button>
              </div>
            </div>
          ) : scannedResult ? (
            /* Success Overlay Flash for Available / Unassigned Standee */
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(16, 185, 129, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              zIndex: 10
            }}>
              <CheckCircle2 size={54} style={{ color: '#34D399', marginBottom: '8px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                Available Standee Ready!
              </div>
              <code style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#FFFFFF',
                background: 'rgba(0,0,0,0.5)',
                padding: '4px 14px',
                borderRadius: '8px',
                marginTop: '6px',
                letterSpacing: '0.05em'
              }}>
                {scannedResult.qrId}
              </code>
            </div>
          ) : null}

          {/* Error / Inactive State */}
          {error && !cameraActive && (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: '#F87171',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CameraOff size={40} style={{ color: '#EF4444' }} />
              <div style={{ fontSize: '0.85rem', lineHeight: 1.5, maxWidth: '320px' }}>
                {error}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={startCamera}
                style={{ marginTop: '6px' }}
              >
                <RefreshCw size={14} />
                <span>Try Camera Again</span>
              </button>
            </div>
          )}
        </div>

        {/* Camera Quick Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '14px',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Flip Camera button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={toggleCameraFacing}
              title={`Switch camera (current: ${facingMode === 'environment' ? 'Rear' : 'Front'})`}
              style={{ fontSize: '0.78rem' }}
            >
              <RefreshCw size={14} />
              <span>Flip Camera</span>
            </button>

            {/* Flashlight button (if device supports) */}
            {hasTorch && (
              <button
                type="button"
                className={`btn btn-sm ${torchOn ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleTorch}
                title="Toggle Flashlight / Torch"
                style={{ fontSize: '0.78rem' }}
              >
                {torchOn ? <ZapOff size={14} /> : <Zap size={14} />}
                <span>{torchOn ? 'Torch Off' : 'Torch On'}</span>
              </button>
            )}
          </div>

          {/* Fallback File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              title="Upload photo of QR code"
              style={{ fontSize: '0.78rem' }}
            >
              <Upload size={14} />
              <span>Upload Image</span>
            </button>
          </div>
        </div>

        {uploadError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#F87171',
            fontSize: '0.78rem',
            marginTop: '12px'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Footer info banner */}
        <div style={{
          marginTop: '14px',
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          fontSize: '0.76rem',
          color: '#94A3B8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>Available Unassigned Pool:</span>
          <strong style={{ color: '#10B981' }}>{availableQrs.length} Standees</strong>
        </div>
      </div>

      {/* Laser Animation Keyframes */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>,
    document.body
  );
}
