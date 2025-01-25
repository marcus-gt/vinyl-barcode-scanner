import os
import sys
from pathlib import Path
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Add parent directory to path to import discogs_lookup
parent_dir = str(Path(__file__).resolve().parent.parent)
sys.path.append(parent_dir)
from discogs_lookup import search_by_barcode

# Load environment variables from parent directory
dotenv_path = os.path.join(parent_dir, '.env')
load_dotenv(dotenv_path)

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    print("Serving index.html")
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    print(f"Serving file: {path}")
    return send_from_directory('.', path)

@app.route('/lookup/<barcode>')
def lookup(barcode):
    print(f"\n=== Looking up barcode: {barcode} ===")
    try:
        print("Making request to Discogs API...")
        result = search_by_barcode(barcode)
        print(f"Discogs API response: {result}")
        
        if result:
            response_data = {
                'success': True,
                'title': f"{result.get('artist')} - {result.get('album')}" if result.get('artist') and result.get('album') else result.get('title'),
                'year': result.get('year'),
                'format': ', '.join(result.get('format', [])),
                'label': result.get('label'),
                'web_url': result.get('uri'),
                'master_url': result.get('master_url'),
                'genres': result.get('genres'),
                'styles': result.get('styles'),
                'is_master': result.get('is_master', False),
                'release_year': result.get('release_year'),
                'release_url': result.get('release_url'),
                'musicians': result.get('musicians')
            }
            print(f"Sending response: {response_data}")
            return jsonify(response_data)
        else:
            print("No results found")
            return jsonify({
                'success': False,
                'message': 'No results found'
            })
    except Exception as e:
        print(f"Error processing barcode {barcode}: {str(e)}", file=sys.stderr)
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print("\n=== Starting server with Discogs token:", os.getenv('DISCOGS_TOKEN')[:4] + "..." if os.getenv('DISCOGS_TOKEN') else "Not found")
    app.run(debug=True, host='0.0.0.0', port=3000) 
