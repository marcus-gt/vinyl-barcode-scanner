import requests
import json
from datetime import datetime

BASE_URL = 'http://localhost:3000'

def print_response(label: str, response):
    """Pretty print API response"""
    print(f"\n=== {label} ===")
    print(f"Status Code: {response.status_code}")
    try:
        print("Response:")
        print(json.dumps(response.json(), indent=2))
    except:
        print("Raw response:", response.text)

def test_api():
    # Create a unique test user
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    test_email = f"test{timestamp}@example.com"
    test_password = "testpassword123!"
    session = requests.Session()  # Use session to maintain cookies

    print(f"\nTesting with user: {test_email}")

    # Test registration
    print("\nTesting user registration...")
    register_response = session.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": test_email, "password": test_password}
    )
    print_response("Register", register_response)
    if not register_response.ok:
        print("Registration failed! Stopping tests.")
        return

    # Test login
    print("\nTesting user login...")
    login_response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": test_email, "password": test_password}
    )
    print_response("Login", login_response)
    if not login_response.ok:
        print("Login failed! Stopping tests.")
        return

    # Get user data from login response
    user_data = login_response.json()['session']['user']
    user_id = user_data['id']

    # Test adding records
    print("\nTesting adding records...")
    test_records = [
        {
            "artist": "Miles Davis",
            "album": "Kind of Blue",
            "year": "1959",
            "label": "Columbia",
            "barcode": "074646493526",
            "genres": "Jazz",
            "styles": "Modal, Cool Jazz",
            "musicians": "Miles Davis (Trumpet); John Coltrane (Tenor Saxophone)",
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
            "musicians": "John Coltrane (Tenor Saxophone); McCoy Tyner (Piano)",
            "discogs_uri": "https://www.discogs.com/release/1452513"
        }
    ]

    added_records = []
    for record in test_records:
        add_response = session.post(f"{BASE_URL}/api/records", json=record)
        print_response(f"Add Record: {record['artist']} - {record['album']}", add_response)
        if add_response.ok:
            added_records.append(add_response.json()['record'])

    # Test getting records
    print("\nTesting getting records...")
    get_response = session.get(f"{BASE_URL}/api/records")
    print_response("Get Records", get_response)

    # Test updating notes
    if added_records:
        print("\nTesting updating notes...")
        record_id = added_records[0]['id']
        notes = "This is a test note added via API"
        update_response = session.put(
            f"{BASE_URL}/api/records/{record_id}/notes",
            json={"notes": notes}
        )
        print_response("Update Notes", update_response)

        # Test deleting a record
        print("\nTesting deleting record...")
        delete_response = session.delete(f"{BASE_URL}/api/records/{record_id}")
        print_response("Delete Record", delete_response)

    # Test logout
    print("\nTesting logout...")
    logout_response = session.post(f"{BASE_URL}/api/auth/logout")
    print_response("Logout", logout_response)

    # Verify we can't access records after logout
    print("\nVerifying authentication required...")
    get_response = session.get(f"{BASE_URL}/api/records")
    print_response("Get Records (should fail)", get_response)

if __name__ == "__main__":
    # Start the test
    print("Starting API tests...")
    print("Make sure the Flask server is running on http://localhost:3000")
    input("Press Enter to continue...")
    test_api() 
