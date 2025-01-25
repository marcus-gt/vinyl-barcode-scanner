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

# Load environment variables from .env file in development
if os.getenv('FLASK_ENV') != 'production':
    dotenv_path = os.path.join(parent_dir, '.env')
    load_dotenv(dotenv_path)

app = Flask(__name__, static_folder='.')
CORS(app)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

@app.route('/lookup/<barcode>')
def lookup(barcode):
    try:
        result = search_by_barcode(barcode)
        
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
            return jsonify(response_data)
        else:
            return jsonify({
                'success': False,
                'message': 'No results found'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

if __name__ == '__main__':
    # Use PORT environment variable if available (for Render deployment)
    port = int(os.environ.get('PORT', 3000))
    app.run(debug=os.getenv('FLASK_ENV') != 'production',
            host='0.0.0.0',
            port=port) 
