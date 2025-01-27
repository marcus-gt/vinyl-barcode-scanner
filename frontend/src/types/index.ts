export interface User {
  id: string;
  email: string;
}

export interface VinylRecord {
  id: string;
  artist: string;
  album: string;
  year: string;
  barcode?: string;
  label?: string;
  genres?: string;
  styles?: string;
  notes?: string;
  musicians?: string;
  master_url?: string;
  release_url?: string;
  release_year?: string;
  added_at: string;
  updated_at?: string;
  user_id: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  session?: {
    access_token: string;
    user: User;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 
