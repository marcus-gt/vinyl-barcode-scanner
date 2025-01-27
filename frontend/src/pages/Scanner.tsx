import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, TextInput, Button, Paper, Stack, Text, Group, Box } from '@mantine/core';
import { useZxing } from 'react-zxing';
import { BarcodeFormat } from '@zxing/library';
import { lookup, records } from '../services/api';
import type { VinylRecord } from '../types';

function Scanner() {
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<VinylRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const { ref } = useZxing({
    onResult(result) {
      setBarcode(result.getText());
      setIsScanning(false);
      handleLookup(result.getText());
    },
    onError(_error) {
      // Suppress continuous error logging
    },
    paused: !isScanning,
    constraints: {
      video: {
        facingMode: 'environment',
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 }
      }
    },
    formats: [BarcodeFormat.EAN_13, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.EAN_8],
    timeBetweenScans: 500
  });

  const handleLookup = async (code: string = barcode) => {
    if (!code) return;

    setLoading(true);
    setError(null);
    try {
      const response = await lookup.byBarcode(code);
      if (response.success && response.data) {
        setRecord(response.data);
      } else {
        setError(response.error || 'No record found for this barcode');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup record');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!record) return;

    setLoading(true);
    setError(null);
    try {
      const response = await records.add(record);
      if (response.success) {
        navigate('/collection');
      } else {
        setError(response.error || 'Failed to add record');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm">
      <Title ta="center" mb="xl">Scan Vinyl Record</Title>

      <Paper withBorder shadow="md" p="xl" radius="md">
        <Stack>
          {isScanning ? (
            <>
              <Box 
                pos="relative"
                style={{ 
                  width: '100%', 
                  height: '300px',
                  backgroundColor: '#f0f0f0',
                  overflow: 'hidden'
                }}
              >
                <video
                  ref={ref}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <Box
                  pos="absolute"
                  top="50%"
                  left="50%"
                  style={{
                    transform: 'translate(-50%, -50%)',
                    border: '2px solid #ff4444',
                    width: '80%',
                    height: '100px',
                    boxSizing: 'border-box',
                    zIndex: 1
                  }}
                />
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
                  Center the barcode in the box
                </Text>
              </Box>
              <Button color="red" onClick={() => setIsScanning(false)}>
                Stop Scanning
              </Button>
            </>
          ) : (
            <>
              <Group grow>
                <TextInput
                  label="Barcode"
                  placeholder="Enter or scan barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                />
              </Group>
              <Group grow>
                <Button onClick={() => handleLookup()} loading={loading}>
                  Look up Record
                </Button>
                <Button onClick={() => setIsScanning(true)} variant="light">
                  Start Camera
                </Button>
              </Group>
            </>
          )}

          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}

          {record && (
            <Paper withBorder p="md">
              <Stack>
                <div>
                  <Text fw={500} size="lg">{record.album}</Text>
                  <Text c="dimmed">{record.artist}</Text>
                  <Text size="sm">Year: {record.year}</Text>
                  {record.label && <Text size="sm">Label: {record.label}</Text>}
                  {record.genres && <Text size="sm">Genres: {record.genres}</Text>}
                  {record.styles && <Text size="sm">Styles: {record.styles}</Text>}
                </div>

                <Group>
                  <Button onClick={handleAdd} loading={loading}>
                    Add to Collection
                  </Button>
                  <Button variant="light" onClick={() => setRecord(null)}>
                    Clear
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}

export default Scanner; 
