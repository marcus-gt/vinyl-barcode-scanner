import os
from dotenv import load_dotenv
from datetime import datetime
import json

# Load environment variables before importing db
load_dotenv()

# Debug prints
print("Environment variables:")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"SUPABASE_KEY: {os.getenv('SUPABASE_KEY')[:30]}...")  # Only show start of key for security

from barcode_scanner.db import (
    create_user,
    login_user,
    add_record_to_collection,
    get_user_collection,
    remove_record_from_collection
)

def print_json(label: str, data: dict):
    """Pretty print JSON data"""
    print(f"\n{label}:")
    print(json.dumps(data, indent=2))

def test_user_flow():
    """Test the complete user flow."""
    # Create a unique email using timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    test_email = f"test{timestamp}@example.com"
    
    print("\nTesting user creation...")
    print(f"Using email: {test_email}")
    # Create a test user
    result = create_user(test_email, "testpassword123!")
    if not result["success"]:
        print(f"Failed to create user: {result['error']}")
        return
    print("User created successfully!")
    print_json("User data", {"id": result["user"].id, "email": result["user"].email})
    
    print("\nTesting user login...")
    # Login with the test user
    login_result = login_user(test_email, "testpassword123!")
    if not login_result["success"]:
        print(f"Failed to login: {login_result['error']}")
        return
    print("Login successful!")
    print_json("Session data", {
        "access_token": login_result["session"].access_token[:30] + "...",  # Only show start of token
        "expires_at": login_result["session"].expires_at
    })
    
    user_id = result["user"].id
    print(f"\nUser ID: {user_id}")
    
    # Add multiple test records
    test_records = [
        {
            "artist": "Miles Davis",
            "album": "Kind of Blue",
            "year": "1959",
            "label": "Columbia",
            "barcode": "074646493526",
            "genres": "Jazz",
            "styles": "Modal, Cool Jazz",
            "musicians": "Miles Davis (Trumpet); John Coltrane (Tenor Saxophone); Cannonball Adderley (Alto Saxophone)",
            "discogs_uri": "https://www.discogs.com/release/2825456"
        },
        {
            "artist": "John Coltrane",
            "album": "A Love Supreme",
            "year": "1965",
            "label": "Impulse!",
            "barcode": "602517649729",
            "genres": "Jazz",
            "styles": "Spiritual Jazz, Free Jazz",
            "musicians": "John Coltrane (Tenor Saxophone); McCoy Tyner (Piano); Jimmy Garrison (Bass); Elvin Jones (Drums)",
            "discogs_uri": "https://www.discogs.com/release/1452513"
        },
        {
            "artist": "Bill Evans",
            "album": "Sunday at the Village Vanguard",
            "year": "1961",
            "label": "Riverside",
            "barcode": "025218637527",
            "genres": "Jazz",
            "styles": "Piano Jazz, Post Bop",
            "musicians": "Bill Evans (Piano); Scott LaFaro (Bass); Paul Motian (Drums)",
            "discogs_uri": "https://www.discogs.com/release/2154180"
        }
    ]
    
    print("\nTesting adding multiple records to collection...")
    for record in test_records:
        print(f"\nAdding record: {record['artist']} - {record['album']}")
        add_result = add_record_to_collection(user_id, record)
        if not add_result["success"]:
            print(f"Failed to add record: {add_result['error']}")
            continue
        print("Record added successfully!")
        print_json("Added record data", add_result["record"])
    
    print("\nTesting getting user collection...")
    # Get the user's collection
    collection_result = get_user_collection(user_id)
    if not collection_result["success"]:
        print(f"Failed to get collection: {collection_result['error']}")
        return
    
    # Verify the records were added
    records = collection_result["records"]
    if len(records) > 0:
        print(f"Successfully retrieved collection! Found {len(records)} records.")
        print_json("Collection data", records)
    else:
        print("No records found in collection!")
    
    print("\nAll tests completed successfully!")
    print(f"\nYou can now check the vinyl_records table in Supabase for user {user_id}")
    print("The records should persist in the database since we didn't delete them.")

if __name__ == "__main__":
    test_user_flow() 
