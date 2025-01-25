// Create configuration object
const config = {
    fps: 10,
    qrbox: {
        width: 250,
        height: 150
    },
    aspectRatio: 1.0
};

// Track the last scanned code and timestamp
let lastScannedCode = null;
let lastScanTime = 0;
const SCAN_DELAY = 3000; // 3 seconds delay between scans
let scanner = null; // Store scanner instance globally

// Initialize scan history from localStorage
let scanHistory = JSON.parse(localStorage.getItem('scanHistory') || '[]');

// Function to save scan history to localStorage
function saveScanHistory() {
    localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
}

// Function to add a new record to the history
function addToHistory(data) {
    // Split title into artist and album if not already split
    let artist = data.artist || 'N/A';
    let album = data.album || 'N/A';
    if (!data.artist && data.title && data.title.includes(' - ')) {
        [artist, album] = data.title.split(' - ');
    }
    
    const record = {
        id: Date.now(), // Use timestamp as unique ID
        artist: artist,
        album: album,
        year: data.year || 'N/A',
        release_year: data.release_year || 'N/A',
        label: data.label || 'N/A',
        genres: data.genres || 'N/A',
        styles: data.styles || 'N/A',
        musicians: data.musicians || 'N/A',
        web_url: data.web_url || '',
        release_url: data.release_url || ''
    };
    
    scanHistory.unshift(record); // Add to beginning of array
    saveScanHistory();
    updateHistoryTable();
}

// Function to delete a record from history
function deleteRecord(id) {
    scanHistory = scanHistory.filter(record => record.id !== id);
    saveScanHistory();
    updateHistoryTable();
}

// Function to update the history table
function updateHistoryTable() {
    const tbody = document.getElementById('history-tbody');
    tbody.innerHTML = '';
    
    scanHistory.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-content="${record.artist}">${record.artist}</td>
            <td data-content="${record.album}">${record.album}</td>
            <td data-content="${record.year}">${record.year}</td>
            <td data-content="${record.label}">${record.label}</td>
            <td data-content="${record.genres}">${record.genres}</td>
            <td data-content="${record.styles}">${record.styles}</td>
            <td data-content="${record.musicians}">${record.musicians}</td>
            <td data-content="${record.web_url}">${record.web_url ? `<a href="${record.web_url}" target="_blank">View</a>` : ''}</td>
            <td data-content="${record.release_url}">${record.release_url ? `<a href="${record.release_url}" target="_blank">View</a>` : ''}</td>
            <td data-content="${record.release_year}">${record.release_year}</td>
            <td>
                <button class="delete-btn" onclick="deleteRecord(${record.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Initialize HTML5 QR code scanner
function initializeScanner() {
    try {
        const html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { 
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                formatsToSupport: [ Html5QrcodeSupportedFormats.EAN_13 ],
                videoConstraints: {
                    facingMode: "environment",
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    focusMode: "continuous",
                    advanced: [{
                        focusMode: "continuous",
                        zoom: 2.0
                    }]
                }
            }
        );
        scanner = html5QrcodeScanner;
        html5QrcodeScanner.render(onScanSuccess, onScanError);
        
        // Add error handler for camera permissions
        html5QrcodeScanner.getState().then((state) => {
            if (state !== Html5QrcodeScannerState.SCANNING) {
                showError("Please allow camera access to scan barcodes");
            }
        }).catch((err) => {
            console.error("Error getting scanner state:", err);
            showError("Camera access failed. Please make sure you're using HTTPS or localhost, and that camera permissions are granted.");
        });
    } catch (err) {
        console.error("Error initializing scanner:", err);
        showError("Failed to initialize barcode scanner. Please refresh the page or try a different browser.");
    }
}

async function lookupBarcode(barcode) {
    console.log('Looking up barcode:', barcode);
    try {
        console.log('Making request to:', `/lookup/${barcode}`);
        const response = await fetch(`/lookup/${barcode}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        return data;
    } catch (error) {
        console.error('Error looking up barcode:', error);
        return null;
    }
}

function updateDiscogsUI(data) {
    console.log('Updating UI with data:', data);
    const discogsResult = document.getElementById('discogs-result');
    const discogsData = document.getElementById('discogs-data');
    
    if (data && data.success) {
        // Split title into artist and album if possible
        let artist = 'N/A';
        let album = 'N/A';
        if (data.title && data.title.includes(' - ')) {
            [artist, album] = data.title.split(' - ');
        }
        
        document.getElementById('title').textContent = `Title: ${data.title || 'N/A'}`;
        document.getElementById('year').textContent = `Year: ${data.year || 'N/A'}`;
        document.getElementById('label').textContent = `Label: ${data.label || 'N/A'}`;
        document.getElementById('genres').textContent = `Genres: ${data.genres || 'N/A'}`;
        document.getElementById('styles').textContent = `Styles: ${data.styles || 'N/A'}`;
        
        // Add musicians if available
        const musiciansElement = document.getElementById('musicians');
        if (musiciansElement) {
            musiciansElement.textContent = data.musicians ? `Musicians: ${data.musicians}` : '';
        }
        
        const urlElement = document.getElementById('discogs-url');
        if (data.web_url) {
            urlElement.innerHTML = `<a href="${data.web_url}" target="_blank">View on Discogs${data.is_master ? ' (Master)' : ''}</a>`;
        } else {
            urlElement.textContent = '';
        }

        // Add release information
        const releaseElement = document.getElementById('release-info');
        if (data.release_year && data.release_url) {
            releaseElement.innerHTML = `Current Release: ${data.release_year} - <a href="${data.release_url}" target="_blank">View this version on Discogs</a>`;
        } else {
            releaseElement.textContent = '';
        }
        
        // Add to history with split artist/album
        addToHistory({...data, artist, album});
        
        discogsResult.classList.remove('hidden');
        console.log('UI updated successfully');
    } else {
        discogsResult.classList.add('hidden');
        showError('No Discogs data found for this barcode');
        console.log('No data found, showing error');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 3000);
}

function showNewScanButton() {
    const newScanBtn = document.getElementById('new-scan-btn');
    newScanBtn.classList.remove('hidden');
}

function hideNewScanButton() {
    const newScanBtn = document.getElementById('new-scan-btn');
    newScanBtn.classList.add('hidden');
}

async function onScanSuccess(decodedText, decodedResult) {
    document.getElementById('barcode-result').textContent = decodedText;
    scanner.pause(true);
    showNewScanButton();
    
    const discogsData = await lookupBarcode(decodedText);
    updateDiscogsUI(discogsData);
}

function onScanError(errorMessage) {
    // Handle scan error if needed
    console.error(errorMessage);
}

function startNewScan() {
    document.getElementById('barcode-result').textContent = 'No barcode scanned yet';
    document.getElementById('discogs-result').classList.add('hidden');
    hideNewScanButton();
    scanner.resume();
}

// Function to convert scan history to CSV
function convertToCSV(records) {
    // Define headers
    const headers = [
        'Artist',
        'Album',
        'Year',
        'Label',
        'Genres',
        'Styles',
        'Musicians',
        'Master URL',
        'Current Release URL',
        'Current Release Year'
    ];
    
    // Create CSV content
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    records.forEach(record => {
        const row = [
            `"${record.artist}"`,
            `"${record.album}"`,
            `"${record.year}"`,
            `"${record.label}"`,
            `"${record.genres}"`,
            `"${record.styles}"`,
            `"${record.musicians}"`,
            `"${record.web_url}"`,
            `"${record.release_url}"`,
            `"${record.release_year}"`
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

// Function to download CSV
async function downloadCSV() {
    // Get current date for filename
    const date = new Date().toISOString().split('T')[0];
    const defaultFilename = `vinyl_scan_history_${date}.csv`;
    
    // Prompt user for filename
    const filename = window.prompt(
        'Enter filename for the CSV file (will be saved to your default downloads folder):',
        defaultFilename
    );
    
    if (!filename) return; // User cancelled
    
    // Add .csv extension if not present
    const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    
    // Create CSV content
    const csvContent = convertToCSV(scanHistory);
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Set up download
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', finalFilename);
    
    // Show info message
    showMessage(`File will be saved as "${finalFilename}" in your downloads folder`);
    
    // Append to document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to show temporary message
function showMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'info-message';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Function to show confirmation modal
function showConfirmationModal(message, onConfirm) {
    // Create modal elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
        <h4>Confirm Action</h4>
        <p>${message}</p>
        <div class="modal-actions">
            <button class="modal-btn cancel">Cancel</button>
            <button class="modal-btn confirm">Confirm</button>
        </div>
    `;
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    // Add event listeners
    const cancelBtn = modal.querySelector('.cancel');
    const confirmBtn = modal.querySelector('.confirm');
    
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
    
    confirmBtn.addEventListener('click', () => {
        onConfirm();
        document.body.removeChild(modalOverlay);
    });
}

// Function to reset the table
function resetTable() {
    showConfirmationModal(
        'Are you sure you want to reset the table? This will delete all scan history and cannot be undone.',
        () => {
            scanHistory = [];
            saveScanHistory();
            updateHistoryTable();
            showMessage('Table has been reset');
        }
    );
}

// Initialize the scanner and history table when the page loads
window.addEventListener('load', () => {
    initializeScanner();
    updateHistoryTable();
    
    // Add click handlers
    document.getElementById('new-scan-btn').addEventListener('click', startNewScan);
    document.getElementById('download-csv').addEventListener('click', downloadCSV);
    document.getElementById('reset-table').addEventListener('click', resetTable);
}); 
