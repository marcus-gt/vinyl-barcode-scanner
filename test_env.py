import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Print all relevant environment variables
print("Environment Variables:")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"SUPABASE_KEY: {os.getenv('SUPABASE_KEY')}")
print(f"FLASK_SECRET_KEY: {os.getenv('FLASK_SECRET_KEY')}")
print(f"FLASK_ENV: {os.getenv('FLASK_ENV')}") 
