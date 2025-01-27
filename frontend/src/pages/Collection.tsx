import { useEffect, useState } from 'react';
import { Container, Title, Grid, Card, Text, Button, TextInput, Group, Stack } from '@mantine/core';
import { records } from '../services/api';
import type { VinylRecord } from '../types';

function Collection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRecords, setUserRecords] = useState<VinylRecord[]>([]);
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await records.getAll();
      if (response.success && response.data) {
        setUserRecords(response.data);
      } else {
        setError(response.error || 'Failed to load records');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotes = async (recordId: string) => {
    const notes = editingNotes[recordId];
    if (notes === undefined) return;

    setLoading(true);
    try {
      const response = await records.updateNotes(recordId, notes);
      if (response.success && response.data) {
        setUserRecords(userRecords.map(record => 
          record.id === recordId ? response.data : record
        ));
        setEditingNotes(prev => {
          const { [recordId]: _, ...rest } = prev;
          return rest;
        });
      } else {
        setError(response.error || 'Failed to update notes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    setLoading(true);
    try {
      const response = await records.delete(recordId);
      if (response.success) {
        setUserRecords(userRecords.filter(record => record.id !== recordId));
      } else {
        setError(response.error || 'Failed to delete record');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Title ta="center" mb="xl">Loading...</Title>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Title ta="center" mb="xl">Your Vinyl Collection</Title>

      {error && (
        <Text c="red" mb="md">{error}</Text>
      )}

      <Grid>
        {userRecords.map(record => (
          <Grid.Col key={record.id} span={12}>
            <Card withBorder shadow="sm" p="lg" radius="md">
              <Stack>
                <div>
                  <Text fw={500} size="lg">{record.album}</Text>
                  <Text c="dimmed">{record.artist}</Text>
                  <Text size="sm">Year: {record.year}</Text>
                  {record.label && <Text size="sm">Label: {record.label}</Text>}
                  {record.genres && <Text size="sm">Genres: {record.genres}</Text>}
                  {record.styles && <Text size="sm">Styles: {record.styles}</Text>}
                  {record.musicians && <Text size="sm">Musicians: {record.musicians}</Text>}
                  {record.release_year && <Text size="sm">Release Year: {record.release_year}</Text>}
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

                <div>
                  <Text fw={500} size="sm" mb="xs">Notes:</Text>
                  {editingNotes[record.id] !== undefined ? (
                    <Stack gap="xs">
                      <TextInput
                        value={editingNotes[record.id]}
                        onChange={(e) => setEditingNotes(prev => ({
                          ...prev,
                          [record.id]: e.target.value
                        }))}
                        placeholder="Add notes about this record..."
                      />
                      <Group>
                        <Button size="xs" onClick={() => handleUpdateNotes(record.id)}>
                          Save
                        </Button>
                        <Button 
                          size="xs" 
                          variant="light" 
                          onClick={() => setEditingNotes(prev => {
                            const { [record.id]: _, ...rest } = prev;
                            return rest;
                          })}
                        >
                          Cancel
                        </Button>
                      </Group>
                    </Stack>
                  ) : (
                    <Group justify="space-between" align="flex-start">
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {record.notes || 'No notes yet'}
                      </Text>
                      <Button 
                        size="xs" 
                        variant="light"
                        onClick={() => setEditingNotes(prev => ({
                          ...prev,
                          [record.id]: record.notes || ''
                        }))}
                      >
                        Edit Notes
                      </Button>
                    </Group>
                  )}
                </div>

                <Group justify="flex-end">
                  <Button 
                    color="red" 
                    size="xs"
                    variant="light"
                    onClick={() => handleDelete(record.id)}
                  >
                    Delete
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        ))}

        {userRecords.length === 0 && (
          <Grid.Col>
            <Text ta="center" c="dimmed">
              No records in your collection yet. Try scanning some vinyl records!
            </Text>
          </Grid.Col>
        )}
      </Grid>
    </Container>
  );
}

export default Collection; 
