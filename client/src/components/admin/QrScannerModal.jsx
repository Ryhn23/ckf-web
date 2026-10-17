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
        fps: 12,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edgeSize = Math.floor(minEdge * 0.72);
          return { width: edgeSize, height: edgeSize };
        },
        aspectRatio: 1.0,
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
  }

  // Lifecycle when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLastScannedResult(null);
      setErrorMessage('');
      setManualCode('');

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
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center text-sm shadow-xs">
              <FontAwesomeIcon icon={['fa-solid', 'fa-qrcode']} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Scanner Presensi QR</h3>
              <p className="text-[11px] text-slate-400 line-clamp-1">{eventTitle || 'Scan QR Code Peserta'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs"
          >
            <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} />
          </button>
        </div>

        {/* Modal Body / Camera Viewport */}
        <div className="relative flex-1 bg-black overflow-hidden flex flex-col items-center justify-center min-h-[320px]">
          {/* HTML5 QR Code Container */}
          <div
            id={scanContainerId}
            className="w-full h-full overflow-hidden flex items-center justify-center"
            style={{ minHeight: '300px' }}
          />

          {/* Target Scan Overlay Frame */}
          {scannerStatus === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-white/60 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                {/* Corner Accents */}
                <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-white rounded-br-lg" />

                {/* Animated Laser Scanning Line */}
                <motion.div
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                  animate={{ y: [10, 230, 10] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <p className="mt-4 text-xs font-medium text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-700 backdrop-blur-xs tracking-wide">
                Arahkan kamera ke QR Code pendaftaran
              </p>
            </div>
          )}

          {/* Initializing State */}
          {scannerStatus === 'initializing' && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Spinner label="Menyiapkan kamera..." />
              <p className="text-xs text-slate-400 max-w-xs">
                Izinkan akses kamera perangkat Anda apabila diminta oleh browser.
              </p>
            </div>
          )}

          {/* Processing State */}
          {scannerStatus === 'processing' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-3 border-white border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-slate-200 tracking-wider uppercase">
                Memverifikasi data kehadiran...
              </p>
            </div>
          )}

          {/* Result / Success Card Overlay */}
          <AnimatePresence>
            {scannerStatus === 'success' && lastScannedResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-3 bg-slate-900/98 border border-slate-700 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-2xl z-20"
              >
                <div className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center text-2xl border border-white/20 mb-3 shadow-lg">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-check']} />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 mb-1">
                  PRESENSI BERHASIL
                </span>
                <h4 className="text-base font-bold text-white mt-1">
                  {lastScannedResult?.data?.attendance?.name || 'Peserta Hadir'}
                </h4>
                <div className="font-mono text-xs text-slate-300 bg-slate-800 px-3 py-1 rounded-md border border-slate-700 my-2 select-all">
                  {lastScannedResult.code}
                </div>
                {lastScannedResult?.data?.sourceForm && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-4">
                    Formulir: <span className="text-slate-300 font-medium">{lastScannedResult.data.sourceForm}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={resumeScanning}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={['fa-solid', 'fa-qrcode']} />
                  <span>Scan Peserta Berikutnya</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error / Not Found Card Overlay */}
          <AnimatePresence>
            {scannerStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-3 bg-slate-900/98 border border-slate-700/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-2xl z-20"
              >
                <div className="w-14 h-14 bg-slate-800 text-slate-300 rounded-full flex items-center justify-center text-2xl border border-slate-700 mb-3 shadow-lg">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-triangle-exclamation']} />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 mb-1">
                  GAGAL PRESENSI
                </span>
                <p className="text-xs text-slate-300 max-w-xs mt-2 leading-relaxed">
                  {lastScannedResult?.error || errorMessage || 'Terjadi kesalahan saat memproses presensi.'}
                </p>
                <div className="flex items-center gap-2 w-full mt-4">
                  <button
                    type="button"
                    onClick={resumeScanning}
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-semibold transition"
                  >
                    Ulangi Scan
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition border border-slate-700"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Controls Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {/* Quick Manual Code Input */}
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Atau ketik ID Pendaftaran..."
                className="w-full bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-white"
              />
              <FontAwesomeIcon
                icon={['fa-solid', 'fa-id-card']}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="py-2 px-4 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-900 text-xs font-semibold rounded-xl transition shadow-xs whitespace-nowrap"
            >
              Hadirkan
            </button>
          </form>

          {/* Camera Controls & Mode Toggle */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="flex items-center gap-1.5 hover:text-white transition px-2 py-1 rounded-lg hover:bg-slate-800"
              title="Ganti kamera depan / belakang"
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-camera']} className="text-xs" />
              <span>Ganti Kamera ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</span>
            </button>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={continuousMode}
                onChange={(e) => setContinuousMode(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-white focus:ring-0 text-xs"
              />
              <span className="text-[11px]">Scan Berkelanjutan</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
