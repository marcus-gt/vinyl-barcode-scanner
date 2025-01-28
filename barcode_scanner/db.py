import os
from supabase import create_client, Client
from typing import Optional, Dict, Any
from datetime import datetime

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def create_user(email: str, password: str) -> Dict[str, Any]:
    """Create a new user account."""
    try:
        # First sign up the user
        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })
        
        if not auth_response.user:
            return {"success": False, "error": "Failed to create user"}
        
        # Get the access token
        session = auth_response.session
        if not session:
            return {"success": False, "error": "No session created"}
            
        # Create profile with the authenticated client
        profile_data = {
            'id': auth_response.user.id,
            'email': email,
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Insert profile using the authenticated session
        profile_response = supabase.table('profiles').insert(profile_data).execute()
        
        return {"success": True, "user": auth_response.user}
    except Exception as e:
        return {"success": False, "error": str(e)}

def login_user(email: str, password: str) -> Dict[str, Any]:
    """Login a user."""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        return {"success": True, "session": response.session}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_user_collection(user_id: str) -> Dict[str, Any]:
    """Get a user's vinyl collection."""
    try:
        response = supabase.table('vinyl_records').select(
            '*'
        ).eq('user_id', user_id).execute()
        return {"success": True, "records": response.data}
    except Exception as e:
        return {"success": False, "error": str(e)}

def add_record_to_collection(user_id: str, record_data: Dict[str, Any]) -> Dict[str, Any]:
    """Add a record to user's collection."""
    try:
        print("\n=== Adding Record to Collection ===")
        print(f"User ID: {user_id}")
        print(f"Raw record data: {record_data}")
        
        # Map fields from API response to database schema
        record_to_insert = {
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'artist': record_data.get('artist'),
            'album': record_data.get('album'),
            'year': record_data.get('year'),
            'label': record_data.get('label'),
            'genres': record_data.get('genres', []),
            'styles': record_data.get('styles', []),
            'musicians': record_data.get('musicians', []),
            'master_url': record_data.get('master_url'),
            'current_release_url': record_data.get('release_url'),  # Map from release_url
            'current_release_year': record_data.get('release_year'),  # Map from release_year
            'barcode': record_data.get('barcode'),
            'notes': record_data.get('notes', '')
        }
        
        print("\nPrepared record data:")
        for key, value in record_to_insert.items():
            print(f"{key}: {type(value).__name__} = {value}")
        
        print("\nSending to Supabase...")
        response = supabase.table('vinyl_records').insert(record_to_insert).execute()
        print(f"Supabase response: {response.data}")
        
        if not response.data:
            print("Error: No data returned from Supabase")
            return {"success": False, "error": "No data returned from database"}
            
        return {"success": True, "record": response.data[0]}
    except Exception as e:
        print(f"\nError adding record: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def remove_record_from_collection(user_id: str, record_id: str) -> Dict[str, Any]:
    """Remove a record from user's collection."""
    try:
        response = supabase.table('vinyl_records').delete().match({
            'id': record_id,
            'user_id': user_id
        }).execute()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

def update_record_notes(user_id: str, record_id: str, notes: str) -> Dict[str, Any]:
    """Update notes for a record in user's collection."""
    try:
        response = supabase.table('vinyl_records').update({
            'notes': notes,
            'updated_at': datetime.utcnow().isoformat()
        }).match({
            'id': record_id,
            'user_id': user_id
        }).execute()
        return {"success": True, "record": response.data[0]}
    except Exception as e:
        return {"success": False, "error": str(e)} 
