import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables first
parent_dir = str(Path(__file__).resolve().parent.parent)
dotenv_path = os.path.join(parent_dir, '.env')
load_dotenv(dotenv_path)

# Now import everything else
from flask import Flask, jsonify, request, session
from flask_cors import CORS
import sys

sys.path.append(parent_dir)
from discogs_lookup import search_by_barcode
from db import (
    create_user,
    login_user,
    add_record_to_collection,
    get_user_collection,
    remove_record_from_collection,
    update_record_notes
)

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')
CORS(app)

@app.route('/')
def index():
    """Test endpoint to verify server is running."""
    return jsonify({
        'status': 'ok',
        'message': 'Server is running'
    })

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

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password required'}), 400
    
    result = create_user(email, password)
    if result['success']:
        return jsonify({'success': True, 'user': {
            'id': result['user'].id,
            'email': result['user'].email
        }}), 201
    return jsonify({'success': False, 'error': result['error']}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login a user."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password required'}), 400
    
    result = login_user(email, password)
    if result['success']:
        session['user_id'] = result['session'].user.id
        return jsonify({
            'success': True,
            'session': {
                'access_token': result['session'].access_token,
                'user': {
                    'id': result['session'].user.id,
                    'email': result['session'].user.email
                }
            }
        }), 200
    return jsonify({'success': False, 'error': result['error']}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout the current user."""
    session.clear()
    return jsonify({'success': True}), 200

@app.route('/api/records', methods=['GET'])
def get_records():
    """Get all records for the current user."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    result = get_user_collection(user_id)
    if result['success']:
        return jsonify({'success': True, 'records': result['records']}), 200
    return jsonify({'success': False, 'error': result['error']}), 400

@app.route('/api/records', methods=['POST'])
def add_record():
    """Add a new record to the user's collection."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    record_data = request.get_json()
    if not record_data:
        return jsonify({'success': False, 'error': 'Record data required'}), 400
    
    result = add_record_to_collection(user_id, record_data)
    if result['success']:
        return jsonify({'success': True, 'record': result['record']}), 201
    return jsonify({'success': False, 'error': result['error']}), 400

@app.route('/api/records/<record_id>', methods=['DELETE'])
def delete_record(record_id):
    """Delete a record from the user's collection."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    result = remove_record_from_collection(user_id, record_id)
    if result['success']:
        return jsonify({'success': True}), 200
    return jsonify({'success': False, 'error': result['error']}), 400

@app.route('/api/records/<record_id>/notes', methods=['PUT'])
def update_notes(record_id):
    """Update notes for a record."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    notes = data.get('notes')
    if notes is None:
        return jsonify({'success': False, 'error': 'Notes required'}), 400
    
    result = update_record_notes(user_id, record_id, notes)
    if result['success']:
        return jsonify({'success': True, 'record': result['record']}), 200
    return jsonify({'success': False, 'error': result['error']}), 400

if __name__ == '__main__':
    print("\nStarting server...")
    print(f"Environment: {os.getenv('FLASK_ENV')}")
    print(f"Debug mode: {os.getenv('FLASK_ENV') != 'production'}")
    print(f"Supabase URL: {os.getenv('SUPABASE_URL')}")
    print("\nServer will be available at: http://localhost:3000")
    print("Test the server by visiting: http://localhost:3000/")
    print("\nPress Ctrl+C to stop the server")
    
    port = int(os.environ.get('PORT', 3000))
    app.run(debug=os.getenv('FLASK_ENV') != 'production',
            host='localhost',  # Changed from 0.0.0.0 to localhost
            port=port) 
