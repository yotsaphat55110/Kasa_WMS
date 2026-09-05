import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, X, AlertCircle, Volume2, CheckCircle2 } from 'lucide-react';

interface CameraBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
}

// Play a short pleasant beep sound using Web Audio API (no external asset needed)
const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore audio failures
  }
};

export const CameraBarcodeScanner: React.FC<CameraBarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'สแกนบาร์โค้ด / QR Code ผ่านกล้อง',
  subtitle = 'หันกล้องไปที่บาร์โค้ดหรือ QR Code ของสินค้า'
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);
  const readerElementId = 'kasa-barcode-reader-box';

  useEffect(() => {
    if (!isOpen) {
      cleanupScanner();
      setScannedResult(null);
      setScannerError(null);
      return;
    }

    let isMounted = true;

    const startCamera = async () => {
      setScannerError(null);
      setScannedResult(null);

      // Check available cameras
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 1) {
          setHasMultipleCameras(true);
        }
      } catch {
        // Camera enumeration might fail before permission
      }

      try {
        // Wait a tick for DOM element to exist
        await new Promise(r => setTimeout(r, 150));
        if (!isMounted) return;

        const elem = document.getElementById(readerElementId);
        if (!elem) {
          throw new Error('ไม่พบพื้นที่แสดงผลกล้อง');
        }

        // Clean up old instance if exists
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
            await scannerRef.current.clear();
          } catch {
            // Ignore
          }
          scannerRef.current = null;
        }

        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.DATA_MATRIX
          ],
          verbose: false
        });

        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode },
          config,
          (decodedText) => {
            if (isStoppingRef.current) return;
            isStoppingRef.current = true;
            playBeep();
            setScannedResult(decodedText);
            
            // Allow feedback animation then return
            setTimeout(() => {
              cleanupScanner();
              onScan(decodedText);
              onClose();
              isStoppingRef.current = false;
            }, 500);
          },
          () => {
            // Scan frame did not find barcode - silent ignore
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Camera Scanner Error:', err);
        setIsScanning(false);
        if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
          setScannerError('กรุณากดอนุญาตให้เว็บบราวเซอร์เข้าถึงกล้องถ่ายภาพของคุณ (Camera Permission)');
        } else if (err?.name === 'NotFoundError') {
          setScannerError('ไม่พบอุปกรณ์กล้องบนเครื่องนี้');
        } else {
          setScannerError('ไม่สามารถเปิดกล้องได้: ' + (err?.message || 'ข้อผิดพลาดเกี่ยวกับกล้อง'));
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      cleanupScanner();
    };
  }, [isOpen, facingMode]);

  const cleanupScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Cleanup error:', e);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleToggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleClose = () => {
    cleanupScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-snug">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[340px] overflow-hidden">
          
          {/* html5-qrcode target box */}
          <div
            id={readerElementId}
            className="w-full h-full min-h-[320px] max-w-[340px] flex items-center justify-center overflow-hidden [&_video]:rounded-xl [&_video]:object-cover"
          />

          {/* Reticle / Viewfinder Frame */}
          {isScanning && !scannedResult && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-64 border-2 border-emerald-400/60 rounded-xl">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                
                {/* Scanning laser line animation */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-bounce duration-1000" />
              </div>
            </div>
          )}

          {/* Success Flash */}
          {scannedResult && (
            <div className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center text-white p-6 z-20 animate-in zoom-in-95 duration-150">
              <CheckCircle2 className="w-16 h-16 text-emerald-200 mb-2 animate-bounce" />
              <p className="text-lg font-bold">สแกนสำเร็จ!</p>
              <div className="mt-2 px-3 py-1.5 bg-white/20 rounded-lg text-sm font-mono font-semibold max-w-[280px] truncate">
                {scannedResult}
              </div>
            </div>
          )}

          {/* Error Message */}
          {scannerError && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-6 z-20">
              <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
              <p className="text-sm font-medium text-white max-w-xs">{scannerError}</p>
              <button
                onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> ลองใหม่อีกครั้ง
              </button>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>มีเสียงแจ้งเตือนเมื่อสแกนติด</span>
          </div>

          <div className="flex items-center gap-2">
            {hasMultipleCameras && (
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                สลับกล้อง ({facingMode === 'environment' ? 'หลัง' : 'หน้า'})
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
