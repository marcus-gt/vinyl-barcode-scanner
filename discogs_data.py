import os
import re
import time
import requests
from typing import Optional, Dict, Any

def get_musicians(extraartists):
    """Filter and format musician credits, excluding non-musical roles"""
    musicians = []
    non_musical_roles = ['design', 'photography', 'artwork', 'mastered', 'mixed',
                        'lacquer cut', 'liner notes', 'recorded by', 'producer']

    for artist in extraartists:
        if 'role' in artist and 'name' in artist:
            role = artist['role'].lower()
            # Skip if any non-musical role is found in the role description
            if any(non_role in role for non_role in non_musical_roles):
                continue
            musicians.append(f"{artist['name']} ({artist['role']})")

    return musicians

def extract_master_id(discogs_uri: str) -> Optional[tuple[str, str]]:
    """Extract master ID or release ID from Discogs URI"""
    # Handle URLs like https://www.discogs.com/master/1234-Artist-Title
    if '/master/' in discogs_uri:
        master_id = re.search(r'/master/(\d+)', discogs_uri)
        if master_id:
            return ('master', master_id.group(1))
    # Handle URLs like https://www.discogs.com/release/1234-Artist-Title
    elif '/release/' in discogs_uri:
        release_id = re.search(r'/release/(\d+)', discogs_uri)
        if release_id:
            return ('release', release_id.group(1))
    return None

def make_discogs_request(url: str, headers: Dict[str, str], max_retries: int = 3, base_wait: int = 2) -> Optional[Dict[str, Any]]:
    """Make a rate-limited request to Discogs API with exponential backoff"""
    for attempt in range(max_retries):
        try:
            time.sleep(1)  # Basic rate limiting
            response = requests.get(url, headers=headers)

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:  # Rate limit exceeded
                wait_time = base_wait * (2 ** attempt)
                print(f"Rate limit hit, waiting {wait_time} seconds...")
                time.sleep(wait_time)
                continue
            else:
                print(f"Request failed with status code: {response.status_code}")
                return None

        except Exception as e:
            print(f"Request error: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(base_wait * (2 ** attempt))
                continue
            return None

    print("Max retries exceeded")
    return None

def get_album_data_from_id(id_type: str, item_id: str) -> Optional[Dict[str, Any]]:
    """Get album data from Discogs using either master ID or release ID"""
    headers = {
        'Authorization': f'Discogs token={os.getenv("DISCOGS_TOKEN")}',
        'User-Agent': 'DiscogsDataFetcher/1.0'
    }

    try:
        if id_type == 'master':
            # Get master data directly
            master_url = f"https://api.discogs.com/masters/{item_id}"
            master_data = make_discogs_request(master_url, headers)

            if not master_data:
                return None

            # Get main release ID
            main_release_id = master_data.get('main_release')
            if not main_release_id:
                print("No main release ID found")
                return None

            # Get main release data
            main_release_url = f"https://api.discogs.com/releases/{main_release_id}"
            main_release_data = make_discogs_request(main_release_url, headers)

        else:  # id_type == 'release'
            # Get release data directly
            main_release_url = f"https://api.discogs.com/releases/{item_id}"
            main_release_data = make_discogs_request(main_release_url, headers)
            print(f"Release data: {main_release_data}")  # Debug print

            if not main_release_data:
                return None

            # Get master data if available
            master_id = main_release_data.get('master_id')
            if master_id:
                master_url = f"https://api.discogs.com/masters/{master_id}"
                master_data = make_discogs_request(master_url, headers)
                print(f"Master data: {master_data}")  # Debug print
            else:
                # Use release data as master data if no master exists
                master_data = main_release_data
                master_url = main_release_url

        if not main_release_data:
            return None

        musicians = []
        if 'extraartists' in main_release_data:
            musicians = get_musicians(main_release_data['extraartists'])

        # Get label from main release
        labels = main_release_data.get('labels', [{}])[0].get('name', '')

        # Get artist and album name
        artists = main_release_data.get('artists', [])
        artist_name = artists[0].get('name', '') if artists else ''
        album_name = main_release_data.get('title', '')

        # Format URLs for web display
        master_web_url = f"https://www.discogs.com/master/{master_data.get('id')}" if master_data.get('id') else None
        release_web_url = f"https://www.discogs.com/release/{main_release_data.get('id')}" if main_release_data.get('id') else None

        # Get the original release year from master
        master_year = master_data.get('year') if master_data else None

        print(f"Master year: {master_year}")  # Debug print

        return {
            'artist': artist_name,
            'album': album_name,
            'year': master_year,  # Original release year from master
            'country': main_release_data.get('country'),
            'genres': master_data.get('genres', []),
            'styles': master_data.get('styles', []),
            'musicians': musicians,
            'master_url': master_web_url,
            'main_release_url': release_web_url,
            'uri': release_web_url,
            'label': labels
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None 
