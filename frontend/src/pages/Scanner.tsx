import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, TextInput, Button, Paper, Stack, Text, Group, Box } from '@mantine/core';
import { useZxing } from 'react-zxing';
import { BarcodeFormat } from '@zxing/library';
import { lookup, records } from '../services/api';
import type { VinylRecord } from '../types';

export function Scanner() {
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<VinylRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const { ref } = useZxing({
    onResult: async (result) => {
      const code = result.getText();
      setBarcode(code);
      try {
        const response = await lookup.byBarcode(code);
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
      }
    },
    paused: !isScanning
  });

  const handleManualLookup = async () => {
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
    }
  };

  const handleAddToCollection = async () => {
    if (!record) return;
    
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
        notes: ''
      };
      
      console.log('Adding record to collection:', recordData);
      const response = await records.add(recordData);
      if (response.success) {
        setError('Added to collection!');
      } else {
        setError(response.error || 'Failed to add to collection');
      }
    } catch (err) {
      console.error('Error adding to collection:', err);
      setError('Failed to add to collection');
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
                  onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                />
              </Group>
              <Group grow>
                <Button onClick={() => handleManualLookup()} loading={loading}>
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
                  <Text fw={500} size="lg">{record.artist} - {record.album}</Text>
                  {record.genres && <Text size="sm">Genres: {record.genres.join(', ')}</Text>}
                  {record.styles && <Text size="sm">Styles: {record.styles.join(', ')}</Text>}
                  {record.musicians && <Text size="sm">Musicians: {record.musicians.join(', ')}</Text>}
                  {record.year && <Text size="sm">Original Release Year: {record.year}</Text>}
                  {record.release_year && <Text size="sm">Current Release Year: {record.release_year}</Text>}
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
                  <Button onClick={handleAddToCollection} loading={loading}>
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
