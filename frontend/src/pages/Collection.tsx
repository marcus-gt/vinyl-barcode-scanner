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

  return (
    <Container size="xl">
      <Title ta="center" mb="xl">Your Vinyl Collection</Title>
      
      {error && (
        <Text c="red" ta="center" mb="md">
          {error}
        </Text>
      )}

      <Grid>
        {userRecords.map(record => (
          <Grid.Col key={record.id} xs={12} sm={6} lg={4}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack gap="md">
                <div>
                  <Text fw={500} size="lg">{record.album}</Text>
                  <Text c="dimmed">{record.artist}</Text>
                  <Text size="sm">Year: {record.year}</Text>
                  {record.label && <Text size="sm">Label: {record.label}</Text>}
                  {record.genres && <Text size="sm">Genres: {record.genres}</Text>}
                  {record.styles && <Text size="sm">Styles: {record.styles}</Text>}
                </div>

                <div>
                  <Text fw={500} size="sm">Notes:</Text>
                  {editingNotes[record.id] !== undefined ? (
                    <Stack gap="xs">
                      <TextInput
                        value={editingNotes[record.id]}
                        onChange={(e) => setEditingNotes(prev => ({
                          ...prev,
                          [record.id]: e.target.value
                        }))}
                        placeholder="Add your notes here..."
                      />
                      <Group>
                        <Button
                          size="xs"
                          onClick={() => handleUpdateNotes(record.id)}
                          loading={loading}
                        >
                          Save
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
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
                    <Stack gap="xs">
                      <Text size="sm">{record.notes || 'No notes yet'}</Text>
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
                    </Stack>
                  )}
                </div>

                <Button
                  color="red"
                  variant="light"
                  size="xs"
                  onClick={() => handleDelete(record.id)}
                  loading={loading}
                >
                  Delete Record
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
}

export default Collection; 
