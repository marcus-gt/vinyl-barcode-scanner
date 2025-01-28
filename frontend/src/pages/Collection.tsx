import { useEffect, useState, useMemo } from 'react';
import { Container, Title, TextInput, Button, Group, Stack, Text, ActionIcon, Modal, Tooltip, Popover } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { IconEdit, IconTrash, IconExternalLink, IconNotes, IconDownload } from '@tabler/icons-react';
import { records } from '../services/api';
import type { VinylRecord } from '../types';

const PAGE_SIZE = 15;

function Collection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRecords, setUserRecords] = useState<VinylRecord[]>([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecord, setEditingRecord] = useState<VinylRecord | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<VinylRecord>>({ columnAccessor: 'artist', direction: 'asc' });

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

  const handleUpdateNotes = async () => {
    if (!editingRecord?.id) return;
    
    setLoading(true);
    try {
      const response = await records.updateNotes(editingRecord.id, editingNotes);
      if (response.success && response.data) {
        setUserRecords(prevRecords => 
          prevRecords.map(record => 
            record.id === editingRecord.id ? response.data! : record
          )
        );
        setEditingRecord(null);
      } else {
        setError(response.error || 'Failed to update notes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record: VinylRecord) => {
    if (!record.id || !window.confirm('Are you sure you want to delete this record?')) return;

    setLoading(true);
    try {
      const response = await records.delete(record.id);
      if (response.success) {
        setUserRecords(userRecords.filter(r => r.id !== record.id));
      } else {
        setError(response.error || 'Failed to delete record');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  const handleSortStatusChange = (newSortStatus: DataTableSortStatus<VinylRecord>) => {
    if (
      sortStatus &&
      sortStatus.columnAccessor === newSortStatus.columnAccessor &&
      sortStatus.direction === 'desc'
    ) {
      // If clicking the same column that's already sorted desc, clear sorting
      setSortStatus({ columnAccessor: 'artist', direction: 'asc' });
    } else {
      // Otherwise, apply the new sort
      setSortStatus(newSortStatus);
    }
  };

  // Filter and sort records based on search query and sort status
  const filteredRecords = useMemo(() => {
    let records = [...userRecords];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      records = records.filter(record => 
        record.artist?.toLowerCase().includes(query) ||
        record.album?.toLowerCase().includes(query) ||
        record.label?.toLowerCase().includes(query) ||
        record.genres?.some(genre => genre.toLowerCase().includes(query)) ||
        record.styles?.some(style => style.toLowerCase().includes(query)) ||
        record.notes?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortStatus?.columnAccessor) {
      const { columnAccessor, direction } = sortStatus;
      records.sort((a, b) => {
        let aValue = a[columnAccessor as keyof VinylRecord];
        let bValue = b[columnAccessor as keyof VinylRecord];

        // Handle array fields
        if (Array.isArray(aValue)) aValue = aValue.join(', ');
        if (Array.isArray(bValue)) bValue = bValue.join(', ');

        // Handle undefined/null values
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        // Convert to strings for comparison
        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();

        // Special handling for numeric fields
        if (columnAccessor === 'year' || columnAccessor === 'current_release_year') {
          const aNum = Number(aValue) || 0;
          const bNum = Number(bValue) || 0;
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        return direction === 'asc' 
          ? aString.localeCompare(bString)
          : bString.localeCompare(aString);
      });
    }

    return records;
  }, [userRecords, searchQuery, sortStatus]);

  // Get paginated records
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredRecords.slice(start, end);
  }, [filteredRecords, page]);

  const handleDownloadCSV = () => {
    // Define CSV headers
    const headers = [
      'Artist',
      'Album',
      'Original Year',
      'Label',
      'Genres',
      'Styles',
      'Musicians',
      'Notes',
      'Added',
      'Scanned Release Year',
      'Master URL',
      'Release URL'
    ];

    // Convert records to CSV rows
    const rows = userRecords.map(record => [
      record.artist,
      record.album,
      record.year || '',
      record.label || '',
      record.genres?.join('; ') || '',
      record.styles?.join('; ') || '',
      record.musicians?.join('; ') || '',
      record.notes || '',
      record.created_at ? new Date(record.created_at).toLocaleString() : '',
      record.current_release_year || '',
      record.master_url || '',
      record.current_release_url || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          // Escape quotes and wrap in quotes if contains comma or newline
          typeof cell === 'string' && (cell.includes(',') || cell.includes('\n') || cell.includes('"')) 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      )
    ].join('\n');

    // Create blob and trigger save dialog
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const defaultFileName = `vinyl-collection-${new Date().toISOString().split('T')[0]}.csv`;
    
    const downloadFile = () => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    // Try to use the modern File System Access API
    if ('showSaveFilePicker' in window) {
      (window as any).showSaveFilePicker({
        suggestedName: defaultFileName,
        types: [{
          description: 'CSV File',
          accept: { 'text/csv': ['.csv'] },
        }],
      })
        .then((handle: any) => handle.createWritable())
        .then((writable: any) => writable.write(blob).then(() => writable.close()))
        .catch((err: Error) => {
          // Fallback to traditional method if user cancels or there's an error
          if (err.name !== 'AbortError') {
            downloadFile();
          }
        });
    } else {
      // Fallback for browsers that don't support showSaveFilePicker
      downloadFile();
    }
  };

  return (
    <Container size="xl" py="xl" mt={60}>
      <Stack>
        <Group justify="space-between" align="center" mb="md">
          <Title>Collection Overview</Title>
          <Group>
            <TextInput
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{ width: 300 }}
            />
            <Button
              variant="light"
              leftSection={<IconDownload size={16} />}
              onClick={handleDownloadCSV}
              disabled={userRecords.length === 0}
            >
              Export CSV
            </Button>
          </Group>
        </Group>

        {error && (
          <Text c="red">{error}</Text>
        )}

        <DataTable<VinylRecord>
          minHeight={150}
          records={paginatedRecords}
          sortStatus={sortStatus}
          onSortStatusChange={handleSortStatusChange}
          styles={{
            table: {
              '& tbody tr td': {
                height: '40px',
                maxHeight: '40px',
                overflow: 'hidden'
              }
            }
          }}
          columns={[
            { 
              accessor: 'artist', 
              title: 'Artist', 
              sortable: true,
              width: 200,
              render: (record) => (
                <Popover width={400} position="bottom-start" withArrow shadow="md">
                  <Popover.Target>
                    <Text size="sm" lineClamp={1} style={{ cursor: 'pointer' }} title={record.artist}>
                      {record.artist}
                    </Text>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                      {record.artist}
                    </Text>
                  </Popover.Dropdown>
                </Popover>
              )
            },
            { 
              accessor: 'album', 
              title: 'Album', 
              sortable: true,
              width: 250,
              render: (record) => (
                <Popover width={400} position="bottom-start" withArrow shadow="md">
                  <Popover.Target>
                    <Text size="sm" lineClamp={1} style={{ cursor: 'pointer' }} title={record.album}>
                      {record.album}
                    </Text>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                      {record.album}
                    </Text>
                  </Popover.Dropdown>
                </Popover>
              )
            },
            { accessor: 'year', title: 'Original Year', sortable: true, width: 80 },
            { 
              accessor: 'label', 
              title: 'Label', 
              sortable: true,
              width: 150,
              render: (record) => (
                <Popover width={400} position="bottom-start" withArrow shadow="md">
                  <Popover.Target>
                    <Text size="sm" lineClamp={1} style={{ cursor: 'pointer' }} title={record.label || '-'}>
                      {record.label || '-'}
                    </Text>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                      {record.label || '-'}
                    </Text>
                  </Popover.Dropdown>
                </Popover>
              )
            },
            { 
              accessor: 'genres', 
              title: 'Genres', 
              sortable: true,
              width: 150,
              render: (record) => {
                const genres = record.genres?.join(', ') || '-';
                return (
                  <Popover width={400} position="bottom-start" withArrow shadow="md">
                    <Popover.Target>
                      <Text size="sm" lineClamp={1} style={{ cursor: 'pointer' }} title={genres}>
                        {genres}
                      </Text>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                        {genres}
                      </Text>
                    </Popover.Dropdown>
                  </Popover>
                );
              }
            },
            { 
              accessor: 'styles', 
              title: 'Styles', 
              sortable: true,
              width: 180,
              render: (record) => {
                const styles = record.styles?.join(', ') || '-';
                return (
                  <Popover width={400} position="bottom-start" withArrow shadow="md">
                    <Popover.Target>
                      <Text size="sm" lineClamp={1} style={{ cursor: 'pointer' }} title={styles}>
                        {styles}
                      </Text>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                        {styles}
                      </Text>
                    </Popover.Dropdown>
                  </Popover>
                );
              }
            },
            { 
              accessor: 'musicians', 
              title: 'Musicians', 
              sortable: true,
              width: 200,
              render: (record) => {
                const musicians = record.musicians?.join(', ') || '-';
                return musicians === '-' ? (
                  <Text size="sm">-</Text>
                ) : (
                  <Popover width={400} position="bottom-start" withArrow shadow="md">
                    <Popover.Target>
                      <Text size="sm" lineClamp={1} style={{ cursor: 'pointer' }} title={musicians}>
                        {musicians}
                      </Text>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                        {musicians}
                      </Text>
                    </Popover.Dropdown>
                  </Popover>
                );
              }
            },
            { 
              accessor: 'notes', 
              title: 'Notes', 
              sortable: true,
              render: (record) => {
                const notes = record.notes || '-';
                return (
                  <Popover width={400} position="bottom-start" withArrow shadow="md">
                    <Popover.Target>
                      <Text size="sm" lineClamp={1} style={{ cursor: 'pointer' }} title={notes}>
                        {notes}
                      </Text>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                        {notes}
                      </Text>
                    </Popover.Dropdown>
                  </Popover>
                );
              }
            },
            { 
              accessor: 'created_at', 
              title: 'Added', 
              sortable: true,
              width: 150,
              render: (record) => record.created_at ? 
                new Date(record.created_at).toLocaleString() : '-'
            },
            { 
              accessor: 'current_release_year', 
              title: 'Scanned Release Year', 
              sortable: true, 
              width: 100,
              render: (record) => record.current_release_year || '-'
            },
            {
              accessor: 'links',
              title: 'Links',
              width: 130,
              render: (record) => (
                <Group gap="xs">
                  {record.master_url && (
                    <Tooltip label="View Master Release">
                      <ActionIcon 
                        component="a" 
                        href={record.master_url} 
                        target="_blank" 
                        variant="light" 
                        size="sm"
                      >
                        <IconExternalLink size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  {record.current_release_url && (
                    <Tooltip label="View Scanned Release">
                      <ActionIcon 
                        component="a" 
                        href={record.current_release_url} 
                        target="_blank" 
                        variant="light" 
                        size="sm"
                        color="blue"
                      >
                        <IconExternalLink size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              ),
            },
            {
              accessor: 'actions',
              title: 'Actions',
              width: 100,
              render: (record) => (
                <Group gap="xs">
                  <Tooltip label="Edit Notes">
                    <ActionIcon 
                      variant="light" 
                      size="sm"
                      onClick={() => {
                        setEditingRecord(record);
                        setEditingNotes(record.notes ?? '');
                      }}
                    >
                      <IconNotes size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <ActionIcon 
                      color="red" 
                      variant="light"
                      size="sm"
                      onClick={() => handleDelete(record)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              ),
            },
          ]}
          totalRecords={filteredRecords.length}
          recordsPerPage={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
          fetching={loading}
          noRecordsText={
            loading ? 
            "Loading records..." : 
            filteredRecords.length === 0 ? 
              searchQuery ? 
                "No records found matching your search." :
                "No records in your collection yet. Try scanning some vinyl records!" :
              ""
          }
          loadingText="Loading records..."
          horizontalSpacing="xs"
          verticalSpacing="xs"
          idAccessor="id"
          emptyState={
            <Text c="dimmed" size="sm">
              {loading ? 
                "Loading records..." : 
                filteredRecords.length === 0 ? 
                  searchQuery ? 
                    "No records found matching your search." :
                    "No records in your collection yet. Try scanning some vinyl records!" :
                  ""
              }
            </Text>
          }
        />

        <Modal
          opened={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          title="Edit Notes"
        >
          <Stack>
            {editingRecord && (
              <Text size="sm" fw={500}>
                {editingRecord.artist} - {editingRecord.album}
              </Text>
            )}
            <TextInput
              label="Notes"
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              placeholder="Add notes about this record..."
            />
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setEditingRecord(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateNotes} loading={loading}>
                Save
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}

export default Collection; 
