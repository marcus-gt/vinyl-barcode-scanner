import { useState } from 'react';
import { Container, Title, TextInput, Button, Paper, Stack, Text, Group, Alert, Loader, Box } from '@mantine/core';
import { lookup, records } from '../services/api';
import type { VinylRecord } from '../types';
import { BarcodeScanner } from '../components/BarcodeScanner';

export function Scanner() {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [record, setRecord] = useState<VinylRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerKey, setScannerKey] = useState(0); // Used to reset scanner state

  const handleScan = async (scannedBarcode: string) => {
    setBarcode(scannedBarcode);
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await lookup.byBarcode(scannedBarcode);
      if (response.success && response.data) {
        setRecord(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to find record');
        setRecord(null);
      }
    } catch (err) {
      setError('Failed to lookup barcode');
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async () => {
    if (!barcode.trim()) {
      setError('Please enter a barcode');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await lookup.byBarcode(barcode);
      if (response.success && response.data) {
        setRecord(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to find record');
        setRecord(null);
      }
    } catch (err) {
      setError('Failed to lookup barcode');
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async () => {
    if (!record) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const recordData = {
        artist: record.artist,
        album: record.album,
        year: record.year,
        release_year: record.release_year,
        barcode: record.barcode,
        genres: record.genres || [],
        styles: record.styles || [],
        musicians: record.musicians || [],
        master_url: record.master_url,
        release_url: record.release_url,
        label: record.label,
        notes: ''
      };
      
      const response = await records.add(recordData);
      if (response.success) {
        setSuccess('Added to collection!');
        // Reset for next scan
        setRecord(null);
        setBarcode('');
        // Reset scanner state to allow new scan
        setScannerKey(prev => prev + 1);
      } else {
        setError(response.error || 'Failed to add to collection');
      }
    } catch (err) {
      console.error('Error adding to collection:', err);
      setError('Failed to add to collection');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setRecord(null);
    setBarcode('');
    setError(null);
    setSuccess(null);
    // Reset scanner state to allow new scan
    setScannerKey(prev => prev + 1);
  };

  return (
    <Container size="sm">
      <Title ta="center" mb="xl">Scan Vinyl Record</Title>

      <Paper withBorder shadow="md" p="xl" radius="md">
        <Stack>
          {isScanning ? (
            <>
              <BarcodeScanner 
                key={scannerKey}
                onScan={handleScan} 
                isScanning={isScanning} 
                isLoading={loading}
              />
              {barcode && (
                <>
                  <Text ta="center" size="sm" fw={500} mt="xs">
                    Captured barcode: {barcode}
                  </Text>
                  {loading && (
                    <Box mt="xs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <Loader size="sm" />
                      <Text size="sm" c="dimmed">
                        Looking up record in Discogs...
                      </Text>
                    </Box>
                  )}
                </>
              )}
              <Button 
                color="red" 
                onClick={() => {
                  setIsScanning(false);
                  setError(null);
                  setSuccess(null);
                }}
              >
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
                  onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                  disabled={loading}
                />
              </Group>
              <Group grow>
                <Button 
                  onClick={handleManualLookup} 
                  loading={loading}
                  disabled={!barcode.trim()}
                >
                  Look up Record
                </Button>
                <Button 
                  onClick={() => {
                    setIsScanning(true);
                    setError(null);
                    setSuccess(null);
                  }} 
                  variant="light"
                  disabled={loading}
                >
                  Start Camera
                </Button>
              </Group>
            </>
          )}

          {error && (
            <Alert color="red" title="Error" variant="light">
              {error}
            </Alert>
          )}

          {success && (
            <Alert color="green" title="Success" variant="light">
              {success}
            </Alert>
          )}

          {record && (
            <Paper withBorder p="md">
              <Stack>
                <div>
                  <Text fw={500} size="lg">{record.artist} - {record.album}</Text>
                  {record.genres && <Text size="sm">Genres: {record.genres.join(', ')}</Text>}
                  {record.styles && <Text size="sm">Styles: {record.styles.join(', ')}</Text>}
                  {record.musicians && <Text size="sm">Musicians: {record.musicians.join(', ')}</Text>}
                  {record.year && <Text size="sm">Original Release Year: {record.year}</Text>}
                  {record.release_year && <Text size="sm">Current Release Year: {record.release_year}</Text>}
                  {record.label && <Text size="sm">Label: {record.label}</Text>}
                  <Group gap="xs" mt="xs">
                    {record.master_url && (
                      <Button 
                        component="a" 
                        href={record.master_url} 
                        target="_blank" 
                        variant="light" 
                        size="xs"
                      >
                        View Master
                      </Button>
                    )}
                    {record.release_url && (
                      <Button 
                        component="a" 
                        href={record.release_url} 
                        target="_blank" 
                        variant="light" 
                        size="xs"
                      >
                        View Release
                      </Button>
                    )}
                  </Group>
                </div>

                <Group>
                  <Button 
                    onClick={handleAddToCollection} 
                    loading={loading}
                  >
                    Add to Collection
                  </Button>
                  <Button 
                    variant="light" 
                    onClick={handleClear}
                    disabled={loading}
                  >
                    {isScanning ? 'New Scan' : 'Clear'}
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
