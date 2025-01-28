import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Box, Text, Button } from '@mantine/core';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isScanning: boolean;
}

interface CameraDevice {
  id: string;
  label: string;
}

export function BarcodeScanner({ onScan, isScanning }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const initializeScanner = async () => {
      if (isScanning && !scannerRef.current) {
        console.log("Initializing scanner...");
        try {
          // Create scanner instance
          scannerRef.current = new Html5Qrcode("reader");
          console.log("Scanner created");

          // Get list of cameras
          const devices = await Html5Qrcode.getCameras();
          console.log("Available cameras:", devices);
          setCameras(devices);

          if (devices && devices.length > 0) {
            // Start scanning with the first available camera
            const cameraId = devices[0].id;
            console.log("Starting camera:", cameraId);

            await scannerRef.current.start(
              cameraId,
              {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0
              },
              (decodedText) => {
                console.log("Barcode detected:", decodedText);
                onScan(decodedText);
                if (scannerRef.current && isRunning) {
                  scannerRef.current.pause();
                }
              },
              (errorMessage) => {
                console.log("Raw scanner error:", errorMessage);
                if (!errorMessage.includes("QR code parse error")) {
                  console.log("Scanner error:", errorMessage);
                }
              }
            );
            setIsRunning(true);
            console.log("Camera started");
          } else {
            setError("No cameras found. Please make sure your device has a camera and it's not in use.");
          }
        } catch (err) {
          console.error("Failed to initialize scanner:", err);
          if (err instanceof Error && err.message.includes("NotAllowedError")) {
            setError("Camera access was denied. Please allow camera access in your browser settings.");
          } else if (err instanceof Error && err.message.includes("NotFoundError")) {
            setError("No camera found. Please make sure your device has a camera and it's not in use.");
          } else if (err instanceof Error && err.message.includes("NotReadableError")) {
            setError("Camera is in use by another application. Please close other apps using the camera.");
          } else {
            setError("Failed to initialize scanner. Please try again.");
          }
        }
      }
    };

    initializeScanner();

    // Cleanup when isScanning becomes false or on unmount
    return () => {
      console.log("Cleaning up scanner...");
      if (scannerRef.current && isRunning) {
        scannerRef.current.stop()
          .then(() => {
            console.log("Scanner stopped");
            scannerRef.current = null;
            setIsRunning(false);
            setError(null);
          })
          .catch((err) => {
            console.error("Error stopping scanner:", err);
          });
      }
    };
  }, [isScanning, onScan]);

  if (error) {
    return (
      <Box 
        pos="relative"
        style={{ 
          width: '100%', 
          height: '300px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <Text c="red" mb="md" ta="center">{error}</Text>
        <Button 
          onClick={() => {
            console.log("Retrying scanner...");
            setError(null);
            if (scannerRef.current && isRunning) {
              scannerRef.current.stop()
                .then(() => {
                  console.log("Scanner stopped");
                  scannerRef.current = null;
                  setIsRunning(false);
                })
                .catch((err) => {
                  console.error("Error stopping scanner:", err);
                });
            }
          }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box 
      pos="relative"
      style={{ 
        width: '100%', 
        height: '300px',
        backgroundColor: '#f0f0f0',
        overflow: 'hidden'
      }}
    >
      <div 
        id="reader" 
        style={{
          width: '100%',
          height: '100%'
        }}
      />
      {cameras.length > 0 && isRunning && (
        <Text 
          pos="absolute" 
          bottom={10} 
          left="50%" 
          style={{ 
            transform: 'translateX(-50%)',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '5px 10px',
            borderRadius: '4px'
          }}
        >
          Camera active - Center the barcode in view
        </Text>
      )}
    </Box>
  );
} 
