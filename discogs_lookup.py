import os
from dotenv import load_dotenv
import re
import urllib.parse
from typing import Optional, Dict, Any
from discogs_data import make_discogs_request, get_album_data_from_id
import requests

# Load environment variables
load_dotenv()

def clean_album_name(name: str) -> str:
    """Remove common suffixes and text in parentheses."""
    # Remove text in parentheses and brackets
    name = re.sub(r'\s*[\(\[].+?[\)\]]\s*', ' ', name)
    # Remove special editions, remasters, etc.
    name = re.sub(r'\s*(Deluxe|Expanded|Remastered|Edition|Version).*$', '', name, flags=re.IGNORECASE)
    return name.strip()

def search_discogs(artist: str, album: str) -> Optional[Dict[str, str]]:
    """Search Discogs for a master release using artist and album name."""
    headers = {
        'Authorization': f'Discogs token={os.getenv("DISCOGS_TOKEN")}',
        'User-Agent': 'DiscogsLookupScript/1.0'
    }

    # URL encode the parameters
    artist_encoded = urllib.parse.quote(artist)
    album_encoded = urllib.parse.quote(album)
    url = f'https://api.discogs.com/database/search?type=master&artist={artist_encoded}&release_title={album_encoded}'

    try:
        results = make_discogs_request(url, headers)
        if not results or 'results' not in results:
            return None

        # Process results to find the master URL
        results_list = results.get('results', [])
        if results_list:
            # Sort by community stats (have + want) to get the most popular release
            sorted_results = sorted(
                results_list,
                key=lambda x: x.get('community', {}).get('have', 0) + x.get('community', {}).get('want', 0),
                reverse=True
            )

            # Get the first result (most popular)
            master = sorted_results[0]
            if master.get('master_url') and master.get('uri'):
                return {
                    'master_url': master['master_url'],
                    'uri': f"https://www.discogs.com{master['uri']}"
                }
        return None
    except Exception as e:
        print(f"Error searching Discogs: {e}")
        return None

def get_discogs_master_url(artist: str, album: str) -> Optional[Dict[str, str]]:
    """Get Discogs master URL using artist and album name. Tries exact match first, then cleaned version."""
    # Try with exact album name first
    result = search_discogs(artist, album)

    # If no result found, try with cleaned album name
    if not result:
        print("No results found with exact title, trying with cleaned version...")
        cleaned_album = clean_album_name(album)
        if cleaned_album != album:  # Only search again if cleaning actually changed something
            result = search_discogs(artist, cleaned_album)

    return result

def search_by_barcode(barcode: str) -> Optional[Dict[str, Any]]:
    """Search Discogs for a release using its barcode, then get master release info if available."""
    headers = {
        'Authorization': f'Discogs token={os.getenv("DISCOGS_TOKEN")}',
        'User-Agent': 'VinylBarcodeScanner/1.0'
    }
    
    url = f'https://api.discogs.com/database/search?type=release&barcode={barcode}'
    
    try:
        # First get the release info
        response = requests.get(url, headers=headers)
        if not response.ok:
            print(f"Error from Discogs API: {response.status_code}")
            return None
            
        data = response.json()
        if not data or 'results' not in data or not data['results']:
            return None
            
        # Get the first result
        result = data['results'][0]
        print(f"Initial search result: {result}")  # Debug print
        
        # Store the release year from the search result
        current_release_year = result.get('year')
        print(f"Current release year from search: {current_release_year}")  # Debug print
        
        # Get the release ID from the URI
        release_uri = result.get('uri', '')
        if not release_uri:
            return None
            
        # Extract the release ID
        release_id_match = re.search(r'/release/(\d+)', release_uri)
        if not release_id_match:
            return None
            
        release_id = release_id_match.group(1)
        
        # Get the master ID if available
        master_id = result.get('master_id')
        print(f"Found master_id: {master_id}")  # Debug print
        
        # Use the more robust data fetching process
        album_data = get_album_data_from_id('release', release_id)
        if not album_data:
            return None
            
        # Add additional fields needed for the barcode scanner UI
        album_data['format'] = result.get('format', [])
        album_data['is_master'] = bool(master_id)
        
        # Make sure we preserve the release year from the search result
        album_data['release_year'] = current_release_year
        print(f"Setting release year to: {current_release_year}")  # Debug print
        
        # Format URLs for web display
        album_data['release_url'] = f'https://www.discogs.com/release/{release_id}'
        if master_id:
            album_data['master_url'] = f'https://www.discogs.com/master/{master_id}'
        
        print(f"Final album data: {album_data}")  # Debug print
        return album_data
        
    except Exception as e:
        print(f"Error searching Discogs: {str(e)}")
        return None

def main():
    """Example usage of the script with both barcode and artist/album lookups."""
    print("\n=== Testing Barcode Lookups ===")
    test_barcodes = [
        "8436028696758",  # Chet Baker - Chet
        "602508027727"    # Herbie Hancock - Inventions & Dimensions
    ]

    for barcode in test_barcodes:
        print(f"\nLooking up barcode: {barcode}")
        result = search_by_barcode(barcode)
        if result:
            print("Found:")
            for key, value in result.items():
                print(f"{key}: {value}")
        else:
            print("No results found")

    print("\n=== Testing Artist/Album Lookups ===")
    test_inputs = [
        ("Miles Davis", "Kind of Blue"),
        ("John Coltrane", "A Love Supreme")
    ]

    for artist, album in test_inputs:
        print(f"\nLooking up: {artist} - {album}")
        result = get_discogs_master_url(artist, album)
        if result:
            print(f"Found:")
            for key, value in result.items():
                print(f"{key}: {value}")
        else:
            print("Not found")

if __name__ == "__main__":
    main()
