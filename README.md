# Vinyl Barcode Scanner

A web application that scans vinyl record barcodes and fetches detailed information from Discogs, including artist, album, year, label, genres, styles, and musicians.

## Features

- Barcode scanning using device camera
- Detailed record information from Discogs
- History table of scanned records
- Export history to CSV
- Responsive design
- Works on mobile devices

## Setup

1. Clone the repository:
```bash
git clone [your-repo-url]
cd vinyl-barcode-scanner
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory with your Discogs API token:
```
DISCOGS_TOKEN=your_token_here
```

4. Run the development server:
```bash
cd barcode-scanner
python server.py
```

5. Open `http://localhost:3000` in your browser

## Development

The project structure:
```
vinyl-barcode-scanner/
├── barcode-scanner/
│   ├── app.js          # Frontend JavaScript
│   ├── index.html      # Main HTML file
│   ├── server.py       # Flask server
│   └── styles.css      # CSS styles
├── discogs_lookup.py   # Discogs API interaction
├── discogs_data.py     # Data processing
├── requirements.txt    # Python dependencies
└── render.yaml         # Render deployment config
```

## Deployment

The application is configured for deployment on Render.com. Required environment variables:
- `DISCOGS_TOKEN`: Your Discogs API token
- `FLASK_ENV`: Set to 'production' for deployment

## License

MIT 
