import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import Spinner from '../ui/Spinner';

function playSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 note
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // Ignore audio errors
  }
}

function triggerHaptic() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([100, 50, 100]);
    } catch {
      // Ignore
    }
  }
}

export default function QrScannerModal({ isOpen, onClose, onScan, eventTitle }) {
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'manual'
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [scannerStatus, setScannerStatus] = useState('initializing'); // 'initializing' | 'scanning' | 'idle' | 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [continuousMode, setContinuousMode] = useState(true);

  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const manualInputRef = useRef(null);
  const autoResumeTimerRef = useRef(null);
  const scanContainerId = 'qr-reader-container';

  // Stop scanner safely
  async function stopScanner() {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        isRunningRef.current = false;
      }
    }
  }

  // Start scanner
  async function startScanner(cameraConfig) {
    await stopScanner();
    if (!isOpen) return;

    setScannerStatus('initializing');
    setErrorMessage('');

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scanContainerId);
      }

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edgeSize = Math.floor(minEdge * 0.72);
          return { width: edgeSize, height: edgeSize };
        },
      };

      await scannerRef.current.start(
        cameraConfig,
        config,
        async (decodedText) => {
          handleProcessCode(decodedText, 'QR_SCAN');
        },
        () => {
          // Frame error (no QR detected in frame, perfectly normal)
        }
      );

      isRunningRef.current = true;
      setScannerStatus('scanning');
    } catch (err) {
      console.error('Camera start error:', err);
      isRunningRef.current = false;
      setScannerStatus('error');
      setErrorMessage(
        err.message || 'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser Anda.'
      );
    }
  }

  // Unified code processing for both QR Scan and Manual Input
  async function handleProcessCode(codeText, sourceMethod = 'QR_SCAN') {
    if (!codeText) return;
    const cleanCode = codeText.trim();
    if (!cleanCode) return;

    // Clear any pending continuous timer
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }

    // If camera is running, pause it while processing result
    if (isRunningRef.current) {
      await stopScanner();
    }

    setScannerStatus('processing');
    playSuccessBeep();
    triggerHaptic();

    try {
      const result = await onScan(cleanCode, sourceMethod);
      setLastScannedResult({
        code: cleanCode,
        success: true,
        data: result,
        sourceMethod,
      });
      setScannerStatus('success');

      // If continuous mode ("Scan Cepat") is enabled, auto-ready for next attendee
      if (continuousMode) {
        autoResumeTimerRef.current = setTimeout(() => {
          if (isOpen) {
            handleNextAttendee();
          }
        }, 1800);
      }
    } catch (err) {
      setLastScannedResult({
        code: cleanCode,
        success: false,
        error: err?.response?.data?.message || err?.message || 'Gagal memproses kehadiran',
        sourceMethod,
      });
      setScannerStatus('error');
    }
  }

  // Advance to next attendee (reset state / resume camera or focus manual input)
  function handleNextAttendee() {
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    setLastScannedResult(null);
    setErrorMessage('');

    if (activeMode === 'camera') {
      resumeScanning();
    } else {
      setScannerStatus('idle');
      setManualCode('');
      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 50);
    }
  }

  // Resume camera scanning
  function resumeScanning() {
    setLastScannedResult(null);
    setErrorMessage('');
    const cameraConfig = selectedCameraId
      ? { deviceId: { exact: selectedCameraId } }
      : { facingMode };
    startScanner(cameraConfig);
  }

  // Switch mode between 'camera' and 'manual'
  async function switchMode(nextMode) {
    if (nextMode === activeMode) return;

    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    setLastScannedResult(null);
    setErrorMessage('');

    if (nextMode === 'manual') {
      await stopScanner();
      setActiveMode('manual');
      setScannerStatus('idle');
      setManualCode('');
      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 80);
    } else {
      setActiveMode('camera');
      setScannerStatus('initializing');
      setManualCode('');
      startScanner({ facingMode });
    }
  }

  // Switch between front/back camera
  function toggleCameraFacing() {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    setSelectedCameraId(null);
    startScanner({ facingMode: nextFacing });
  }

  // Submit manual form
  function handleManualFormSubmit(e) {
    if (e) e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessCode(manualCode.trim(), 'MANUAL');
  }

  // Lifecycle when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveMode('camera');
      setLastScannedResult(null);
      setErrorMessage('');
      setManualCode('');

      // Enumerate available cameras
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
          }
        })
        .catch((err) => console.warn('Could not enumerate cameras:', err));

      const timer = setTimeout(() => {
        startScanner({ facingMode });
      }, 150);

      return () => {
        document.body.style.overflow = '';
        clearTimeout(timer);
        if (autoResumeTimerRef.current) {
          clearTimeout(autoResumeTimerRef.current);
          autoResumeTimerRef.current = null;
        }
        stopScanner();
      };
    } else {
      document.body.style.overflow = '';
      if (autoResumeTimerRef.current) {
        clearTimeout(autoResumeTimerRef.current);
        autoResumeTimerRef.current = null;
      }
      stopScanner();
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      if (autoResumeTimerRef.current) {
        clearTimeout(autoResumeTimerRef.current);
        autoResumeTimerRef.current = null;
      }
      stopScanner();
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Global keydown shortcuts (Escape to close, Enter to continue on success)
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && scannerStatus === 'success') {
        e.preventDefault();
        handleNextAttendee();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scannerStatus, activeMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:p-6 bg-black lg:bg-slate-950/85 lg:backdrop-blur-sm animate-fadeIn">
      {/* Scoped CSS for full-bleed HTML5-QRCODE camera video */}
      <style>{`
        #qr-reader-container {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          padding: 0 !important;
          position: absolute !important;
          inset: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: #000 !important;
          overflow: hidden !important;
        }
        #qr-reader-container__scan_region {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        #qr-reader-container video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0 !important;
        }
        #qr-reader-container canvas {
          display: none !important;
        }
        #qr-reader-container img[alt="Info icon"],
        #qr-reader-container div[style*="text-align"],
        #qr-reader-container__dashboard,
        #qr-reader-container__header_message {
          display: none !important;
        }
      `}</style>

      {/* Main Scanner Container: 100% full screen on mobile phone (< 1024px), centered sleek phone frame on desktop */}
      <div className="relative w-full h-full h-[100dvh] lg:h-[700px] lg:max-h-[92vh] lg:max-w-md bg-black lg:rounded-3xl lg:border lg:border-slate-800 text-white overflow-hidden lg:shadow-2xl flex flex-col">
        {/* Floating Minimalist Top Bar */}
        <div
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))' }}
          className="absolute top-0 inset-x-0 z-30 px-4 pb-2 flex items-center justify-between pointer-events-none"
        >
          {/* Status / Title pill */}
          <div className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/20 px-3.5 py-1.5 rounded-full text-white shadow-xl max-w-[65%] sm:max-w-[75%]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate leading-tight tracking-wide text-white">
                {eventTitle || 'Scanner Presensi'}
              </p>
            </div>
            <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/15 text-slate-300 uppercase flex-shrink-0">
              {activeMode === 'camera' ? 'Kamera' : 'Manual'}
            </span>
          </div>

          {/* Controls: Camera Switch (if in camera mode) & Close button */}
          <div className="pointer-events-auto flex items-center gap-2">
            {activeMode === 'camera' && (
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 active:scale-90 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition shadow-xl text-xs"
                title={`Ganti kamera (${facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'})`}
              >
                <FontAwesomeIcon icon={['fa-solid', 'fa-camera']} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 active:scale-90 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition shadow-xl text-xs"
              title="Tutup Scanner"
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} />
            </button>
          </div>
        </div>

        {/* Viewport Center Area */}
        <div className="relative flex-1 w-full h-full bg-black overflow-hidden flex items-center justify-center">
          {/* CAMERA MODE: HTML5 QR Code Container (100% full-bleed edge-to-edge) */}
          <div
            id={scanContainerId}
            className={`absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center transition-opacity duration-300 ${
              activeMode === 'camera' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* CAMERA MODE: Minimalist Target Scan Overlay Frame */}
          {activeMode === 'camera' && scannerStatus === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 border border-white/20 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {/* 4 Crisp Minimalist Corner Accents */}
                <span className="absolute -top-1 -left-1 w-6 h-6 border-t-2.5 border-l-2.5 border-white rounded-tl-xl" />
                <span className="absolute -top-1 -right-1 w-6 h-6 border-t-2.5 border-r-2.5 border-white rounded-tr-xl" />
                <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2.5 border-l-2.5 border-white rounded-bl-xl" />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2.5 border-r-2.5 border-white rounded-br-xl" />

                {/* Animated Laser Scanning Line */}
                <motion.div
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_12px_rgba(255,255,255,0.95)]"
                  animate={{ y: [15, 235, 15] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <p className="mt-4 text-[11px] font-medium text-white/90 bg-black/60 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-white/15 tracking-wide shadow-lg">
                Arahkan QR Code ke dalam kotak
              </p>
            </div>
          )}

          {/* CAMERA MODE: Initializing Spinner */}
          {activeMode === 'camera' && scannerStatus === 'initializing' && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
              <Spinner label="Menyiapkan kamera..." />
              <p className="text-xs text-slate-400 max-w-xs">
                Izinkan akses kamera perangkat Anda apabila diminta oleh browser.
              </p>
            </div>
          )}

          {/* MANUAL MODE: Dedicated Minimalist Input Station */}
          {activeMode === 'manual' && (scannerStatus === 'idle' || scannerStatus === 'initializing') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-sm px-5 flex flex-col items-center text-center"
            >
              <div className="w-full bg-slate-950/85 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-lg shadow-inner">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-keyboard']} />
                </div>

                <h3 className="text-sm font-bold text-white mb-1 tracking-wide">
                  Input Presensi Manual
                </h3>
                <p className="text-[11px] text-slate-400 mb-5 leading-relaxed">
                  Ketik ID Pendaftaran atau scan barcode fisik, lalu tekan <span className="text-white font-semibold">Enter</span>.
                </p>

                <form onSubmit={handleManualFormSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      ref={manualInputRef}
                      type="text"
                      autoFocus
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: CKF-REG-..."
                      className="w-full bg-white/10 border border-white/25 focus:border-white text-white placeholder-slate-500 text-sm font-mono tracking-wider rounded-2xl px-4 py-3 text-center focus:outline-none transition shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="w-full py-3 px-4 bg-white hover:bg-slate-100 active:scale-98 disabled:opacity-30 disabled:pointer-events-none text-slate-900 rounded-2xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={['fa-solid', 'fa-check']} />
                    <span>Hadirkan Peserta</span>
                  </button>
                </form>

                {continuousMode && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Mode Scan Cepat Aktif (Auto-ready)</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* BOTH MODES: Processing State */}
          {scannerStatus === 'processing' && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <div className="w-12 h-12 rounded-full border-3 border-white border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-slate-200 tracking-wider uppercase">
                Memverifikasi data kehadiran...
              </p>
            </div>
          )}

          {/* BOTH MODES: Success Floating Card Overlay */}
          <AnimatePresence>
            {scannerStatus === 'success' && lastScannedResult && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute inset-x-4 bottom-24 z-30 bg-slate-950/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 flex flex-col items-center text-center shadow-2xl max-w-sm mx-auto"
              >
                <div className="w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center text-xl border border-white/20 mb-2.5 shadow-md">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-check']} />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 mb-1">
                  PRESENSI BERHASIL
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mt-0.5 leading-snug">
                  {lastScannedResult?.data?.attendance?.name || 'Peserta Hadir'}
                </h4>
                <div className="font-mono text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-lg border border-white/15 my-2 select-all">
                  {lastScannedResult.code}
                </div>
                {lastScannedResult?.data?.sourceForm && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">
                    Formulir: <span className="text-slate-200 font-medium">{lastScannedResult.data.sourceForm}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleNextAttendee}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 active:scale-98 text-slate-900 rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={activeMode === 'camera' ? ['fa-solid', 'fa-qrcode'] : ['fa-solid', 'fa-keyboard']} />
                  <span>
                    {activeMode === 'camera' ? 'Scan Peserta Berikutnya' : 'Input Peserta Berikutnya'}
                  </span>
                </button>

                {continuousMode && (
                  <p className="mt-2 text-[10px] text-slate-400">
                    Melanjutkan otomatis dalam hitungan detik...
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOTH MODES: Error Floating Card Overlay */}
          <AnimatePresence>
            {scannerStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute inset-x-4 bottom-24 z-30 bg-slate-950/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 flex flex-col items-center text-center shadow-2xl max-w-sm mx-auto"
              >
                <div className="w-12 h-12 bg-white/10 text-slate-300 rounded-full flex items-center justify-center text-xl border border-white/20 mb-2.5 shadow-md">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-triangle-exclamation']} />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 mb-1">
                  GAGAL PRESENSI
                </span>
                <p className="text-xs text-slate-300 max-w-xs mt-1.5 leading-relaxed">
                  {lastScannedResult?.error || errorMessage || 'Terjadi kesalahan saat memproses presensi.'}
                </p>
                <div className="flex flex-col gap-2 w-full mt-3.5">
                  <div className="flex items-center gap-2 w-full">
                    <button
                      type="button"
                      onClick={handleNextAttendee}
                      className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 active:scale-98 text-slate-900 rounded-2xl text-xs font-bold transition shadow-md"
                    >
                      {activeMode === 'camera' ? 'Ulangi Scan' : 'Ulangi Input'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/20 active:scale-98 text-white rounded-2xl text-xs font-semibold transition border border-white/20"
                    >
                      Tutup
                    </button>
                  </div>
                  {activeMode === 'camera' && (
                    <button
                      type="button"
                      onClick={() => switchMode('manual')}
                      className="w-full py-2 px-3 bg-white/10 hover:bg-white/15 text-white rounded-2xl text-xs font-medium transition border border-white/15 flex items-center justify-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={['fa-solid', 'fa-keyboard']} className="text-xs" />
                      <span>Beralih ke Input Manual</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Minimalist Bottom Control Bar (Mode Tabs + Scan Cepat Toggle) */}
        <div
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))' }}
          className="absolute bottom-0 inset-x-0 z-30 px-4 pt-3 flex flex-col items-center pointer-events-none"
        >
          <div className="pointer-events-auto flex items-center gap-1.5 bg-black/75 backdrop-blur-2xl border border-white/20 p-1.5 rounded-full shadow-2xl">
            {/* Tab: Scan QR (Camera) */}
            <button
              type="button"
              onClick={() => switchMode('camera')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeMode === 'camera'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 active:scale-95'
              }`}
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-camera']} className="text-xs" />
              <span>Scan QR</span>
            </button>

            {/* Tab: Input Manual */}
            <button
              type="button"
              onClick={() => switchMode('manual')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeMode === 'manual'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 active:scale-95'
              }`}
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-keyboard']} className="text-xs" />
              <span>Input Manual</span>
            </button>

            <div className="h-4 w-px bg-white/20 mx-0.5" />

            {/* Toggle: Continuous Scan / Scan Cepat */}
            <button
              type="button"
              onClick={() => setContinuousMode(!continuousMode)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                continuousMode ? 'text-white bg-white/15' : 'text-slate-400 hover:text-white'
              }`}
              title={
                activeMode === 'camera'
                  ? 'Scan QR otomatis tanpa jeda manual'
                  : 'Otomatis reset dan siap input berikutnya setelah presensi berhasil'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  continuousMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span>Scan Cepat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
