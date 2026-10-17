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
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [scannerStatus, setScannerStatus] = useState('initializing'); // 'initializing' | 'scanning' | 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [continuousMode, setContinuousMode] = useState(true);
  const [showManualInput, setShowManualInput] = useState(false);

  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
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
          const edgeSize = Math.floor(minEdge * 0.75);
          return { width: edgeSize, height: edgeSize };
        },
      };

      await scannerRef.current.start(
        cameraConfig,
        config,
        async (decodedText) => {
          handleDetectedCode(decodedText);
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

  // Handle scanned QR code
  async function handleDetectedCode(codeText) {
    if (!codeText || isRunningRef.current === false) return;
    const cleanCode = codeText.trim();
    if (!cleanCode) return;

    // Pause scanner
    await stopScanner();
    setScannerStatus('processing');
    playSuccessBeep();
    triggerHaptic();

    try {
      const result = await onScan(cleanCode);
      setLastScannedResult({
        code: cleanCode,
        success: true,
        data: result,
      });
      setScannerStatus('success');

      // If continuous mode is enabled, resume scanning automatically after 2.2 seconds
      if (continuousMode) {
        setTimeout(() => {
          if (isOpen) {
            resumeScanning();
          }
        }, 2200);
      }
    } catch (err) {
      setLastScannedResult({
        code: cleanCode,
        success: false,
        error: err?.response?.data?.message || err?.message || 'Gagal memproses kehadiran',
      });
      setScannerStatus('error');
    }
  }

  // Resume scanning
  function resumeScanning() {
    setLastScannedResult(null);
    setErrorMessage('');
    const cameraConfig = selectedCameraId
      ? { deviceId: { exact: selectedCameraId } }
      : { facingMode };
    startScanner(cameraConfig);
  }

  // Switch between front/back camera
  function toggleCameraFacing() {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    setSelectedCameraId(null);
    startScanner({ facingMode: nextFacing });
  }

  // Manual code submit
  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDetectedCode(manualCode.trim());
    setManualCode('');
    setShowManualInput(false);
  }

  // Lifecycle when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setLastScannedResult(null);
      setErrorMessage('');
      setManualCode('');
      setShowManualInput(false);

      // Get available cameras
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
          }
        })
        .catch((err) => console.warn('Could not enumerate cameras:', err));

      // Small delay to ensure modal DOM is mounted
      const timer = setTimeout(() => {
        startScanner({ facingMode });
      }, 150);

      return () => {
        document.body.style.overflow = '';
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      document.body.style.overflow = '';
      stopScanner();
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
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
          </div>

          {/* Controls: Camera Switch & Close button */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 active:scale-90 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition shadow-xl text-xs"
              title={`Ganti kamera (${facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'})`}
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-camera']} />
            </button>
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

        {/* Camera Viewport & Overlays */}
        <div className="relative flex-1 w-full h-full bg-black overflow-hidden flex items-center justify-center">
          {/* HTML5 QR Code Container (100% full-bleed edge-to-edge) */}
          <div
            id={scanContainerId}
            className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center"
          />

          {/* Minimalist Target Scan Overlay Frame */}
          {scannerStatus === 'scanning' && (
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
            </div>
          )}

          {/* Initializing State */}
          {scannerStatus === 'initializing' && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
              <Spinner label="Menyiapkan kamera..." />
              <p className="text-xs text-slate-400 max-w-xs">
                Izinkan akses kamera perangkat Anda apabila diminta oleh browser.
              </p>
            </div>
          )}

          {/* Processing State */}
          {scannerStatus === 'processing' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <div className="w-12 h-12 rounded-full border-3 border-white border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-slate-200 tracking-wider uppercase">
                Memverifikasi data kehadiran...
              </p>
            </div>
          )}

          {/* Result / Success Floating Card Overlay */}
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
                  onClick={resumeScanning}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 active:scale-98 text-slate-900 rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={['fa-solid', 'fa-qrcode']} />
                  <span>Scan Peserta Berikutnya</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error / Failed Scan Overlay */}
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
                <div className="flex items-center gap-2 w-full mt-3.5">
                  <button
                    type="button"
                    onClick={resumeScanning}
                    className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 active:scale-98 text-slate-900 rounded-2xl text-xs font-bold transition shadow-md"
                  >
                    Ulangi Scan
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/20 active:scale-98 text-white rounded-2xl text-xs font-semibold transition border border-white/20"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Minimalist Bottom Control Bar */}
        <div
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))' }}
          className="absolute bottom-0 inset-x-0 z-30 px-4 pt-3 flex flex-col items-center pointer-events-none"
        >
          {/* Collapsible Manual Code Input Card */}
          <AnimatePresence>
            {showManualInput && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.96 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className="pointer-events-auto w-full max-w-sm mb-3 bg-black/85 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={['fa-solid', 'fa-id-card']} className="text-slate-400 text-xs" />
                    <span className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">
                      Input ID Pendaftaran
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualInput(false)}
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition"
                  >
                    <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} />
                  </button>
                </div>
                <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: CKF-REG-..."
                    className="flex-1 bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:border-white shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="py-2.5 px-4 bg-white hover:bg-slate-100 active:scale-95 disabled:opacity-30 text-slate-900 text-xs font-bold rounded-xl transition whitespace-nowrap shadow-md"
                  >
                    Hadirkan
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Minimalist Floating Pill (Actions) */}
          <div className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-2xl border border-white/20 p-1.5 rounded-full shadow-2xl">
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${showManualInput
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white hover:bg-white/10 active:scale-95'
                }`}
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-keyboard']} className="text-xs" />
              <span>Input Manual</span>
            </button>

            <div className="h-4 w-px bg-white/20" />

            <button
              type="button"
              onClick={() => setContinuousMode(!continuousMode)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${continuousMode
                  ? 'text-white bg-white/15'
                  : 'text-slate-400 hover:text-white'
                }`}
              title="Scan otomatis tanpa harus menutup scanner"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${continuousMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>Scan Cepat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
