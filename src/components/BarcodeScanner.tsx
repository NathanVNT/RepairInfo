'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, X, Scan, Keyboard } from 'lucide-react';
import { Button } from './ui';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose?: () => void;
  title?: string;
}

export function BarcodeScanner({ onScan, onClose, title = 'Scanner un code' }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown');
  const scannerRegionId = useRef(`barcode-scanner-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    checkCameraPermission();

    return () => {
      void stopScanning();
    };
  }, []);

  // Démarrer le scanner une fois que le DOM est prêt
  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      const timer = setTimeout(() => {
        void startScanning();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  const checkCameraPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' as any });
        setCameraPermission(result.state as 'granted' | 'denied');
      }
    } catch (err) {
      console.warn('Cannot check camera permission:', err);
    }
  };

  const startScanning = async () => {
    setError(null);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      const scanner = new Html5Qrcode(scannerRegionId.current, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.AZTEC,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.PDF_417,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 12,
          // Full-frame scan is more reliable for 1D barcodes on iPhone.
          qrbox: undefined,
          aspectRatio: isIOS ? 16 / 9 : 1,
        },
        async (decodedText: string) => {
          onScan(decodedText.trim());
          await stopScanning();
          if (onClose) onClose();
        },
        () => {
          // Ignore les erreurs de frame
        }
      );
    } catch (err: any) {
      setIsScanning(false);
      
      const errorMsg = err?.message || String(err);
      console.error('Camera error:', err);
      
      if (errorMsg.includes('streaming') || errorMsg.includes('supported')) {
        setError(
          isIOS
            ? 'Le scan camera iPhone peut etre instable selon le navigateur. Essayez en HTTPS et utilisez la saisie manuelle si besoin.'
            : 'Votre navigateur ne supporte pas le scanner. Utilisez la saisie manuelle.'
        );
      } else if (errorMsg.includes('Permission') || errorMsg.includes('permission denied')) {
        setError(
          isIOS
            ? 'Permission caméra refusée. Essayez la saisie manuelle ou réactivez la permission.'
            : 'Permission caméra refusée. Veuillez autoriser l\'accès à la caméra dans les paramètres du navigateur.'
        );
      } else if (errorMsg.includes('NotAllowedError')) {
        setError(
          'Accès à la caméra non autorisé. Vérifiez les permissions de votre navigateur.'
        );
      } else if (errorMsg.includes('NotFoundError') || errorMsg.includes('no devices')) {
        setError('Aucune caméra détectée sur cet appareil.');
      } else {
        setError(`Impossible d'accéder à la caméra: ${errorMsg}`);
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Scanner stop warning:', err);
      }
      try {
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner clear warning:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
      if (onClose) onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between border-b border-gray-800">
        <h2 className="text-lg font-semibold flex items-center">
          <Scan className="h-5 w-5 mr-2" />
          {title}
        </h2>
        <button
          onClick={() => {
            stopScanning();
            if (onClose) onClose();
          }}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Permission Info */}
        {!isScanning && isIOS && (
          <div className="w-full max-w-md mb-4 p-4 bg-blue-900 bg-opacity-50 text-blue-200 rounded-lg text-sm border border-blue-700">
            <p className="font-semibold mb-2">📱 Scanner sur iPhone</p>
            <p className="mb-3">Le scan fonctionne mieux avec un bon contraste et en HTTPS:</p>
            <ul className="text-xs space-y-1 mb-2">
              <li>✓ La <strong>saisie manuelle</strong> ci-dessous (recommandée)</li>
              <li>✓ Rapprocher puis eloigner legerement la camera pour faire la mise au point</li>
              <li>✓ Bien centrer le code-barres ou le QR code dans la zone visible</li>
              <li>✓ Utiliser HTTPS si possible</li>
            </ul>
          </div>
        )}

        {/* Scanner container */}
        <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-black">
          <div
            id={scannerRegionId.current}
            className={`scanner-host absolute inset-0 bg-black ${isScanning ? 'block' : 'hidden'}`}
          />

          {isScanning ? (
            <div className="absolute inset-0 pointer-events-none">
              {/* Masque assombri */}
              <div className="absolute inset-x-0 top-0 h-[33%] bg-black/45" />
              <div className="absolute inset-x-0 bottom-0 h-[33%] bg-black/45" />
              <div className="absolute left-0 top-[33%] bottom-[33%] w-[6%] bg-black/45" />
              <div className="absolute right-0 top-[33%] bottom-[33%] w-[6%] bg-black/45" />

              {/* Cadre de visée */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] h-[34%] min-h-[128px] border-2 border-cyan-300 rounded-2xl shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_28px_rgba(34,211,238,0.25)]">
                <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-md"></div>
                <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-md"></div>
                <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-md"></div>
                <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-md"></div>

                <div className="scanline absolute left-2 right-2 h-[3px] rounded-full bg-cyan-300/90 shadow-[0_0_18px_rgba(34,211,238,0.9)]"></div>
              </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
              <p className="text-white text-sm bg-black/55 inline-block px-4 py-2 rounded-full border border-white/20">
                Centrez le QR code ou le code-barres dans le cadre
              </p>
            </div>
          ) : null}
        </div>

        {!isScanning ? (
          <div className="text-center max-w-md w-full mt-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-800 rounded-full mb-6">
              <Camera className="h-12 w-12 text-gray-400" />
            </div>
            {error && (
              <div className="mb-6 p-4 bg-red-900 bg-opacity-50 text-red-200 rounded-lg text-sm border border-red-700">
                <p className="font-semibold mb-1">⚠️ Erreur caméra:</p>
                <p>{error}</p>
              </div>
            )}
            <h3 className="text-white text-xl font-semibold mb-2">
              Scanner un code-barres ou QR code
            </h3>
            <p className="text-gray-400 mb-6 text-sm">
              Utilisez votre caméra pour scanner un code
            </p>
          </div>
        ) : null}
      </div>

      {/* Manual Input - Always visible */}
      <div className="bg-gray-900 border-t border-gray-800 p-4">
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Ou entrez le code manuellement..."
              className="flex-1 px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
              autoFocus
            />
            <Button 
              type="submit" 
              disabled={!manualInput.trim()}
              size="lg"
            >
              OK
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {isScanning ? (
              <Button
                type="button"
                onClick={() => {
                  void stopScanning();
                }}
                variant="danger"
                className="md:col-span-2"
                size="lg"
              >
                Arrêter le scan
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => setIsScanning(true)}
                  size="lg"
                  className="w-full flex items-center justify-center"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Caméra
                </Button>
                <Button
                  type="button"
                  onClick={() => inputRef.current?.focus()}
                  variant="secondary"
                  size="lg"
                  className="w-full flex items-center justify-center"
                >
                  <Keyboard className="h-5 w-5 mr-2" />
                  Manuel
                </Button>
              </>
            )}
          </div>
        </form>
      </div>

      <style jsx>{`
        .scanline {
          animation: scanlineMove 2.2s ease-in-out infinite;
        }

        :global(.scanner-host > div) {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }

        :global(.scanner-host video),
        :global(.scanner-host canvas) {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        :global(.scanner-host [id*='qr-shaded-region']),
        :global(.scanner-host [id*='qr-reader__dashboard']) {
          display: none !important;
        }

        @keyframes scanlineMove {
          0% {
            top: 10%;
            opacity: 0.65;
          }
          50% {
            top: calc(100% - 10%);
            opacity: 1;
          }
          100% {
            top: 10%;
            opacity: 0.65;
          }
        }
      `}</style>
    </>
  );
}

// Composant bouton pour ouvrir le scanner
interface ScanButtonProps {
  onScan: (result: string) => void;
  buttonText?: string;
  className?: string;
}

export function ScanButton({ onScan, buttonText = 'Scanner', className = '' }: ScanButtonProps) {
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (result: string) => {
    onScan(result);
    setShowScanner(false);
  };

  return (
    <>
      <Button
        onClick={() => setShowScanner(true)}
        className={className}
        variant="secondary"
      >
        <Scan className="h-5 w-5 mr-2" />
        {buttonText}
      </Button>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}

// Hook personnalisé pour le scanner
export function useBarcodeScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const handleScan = (result: string) => {
    setLastScanned(result);
    close();
  };

  return {
    isOpen,
    open,
    close,
    lastScanned,
    handleScan,
    Scanner: isOpen ? (
      <BarcodeScanner onScan={handleScan} onClose={close} />
    ) : null,
  };
}
