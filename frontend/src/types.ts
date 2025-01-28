export interface VinylRecord {
  id?: string;
  user_id?: string;
  artist: string;
  album: string;
  year?: number;
  release_year?: number;
  barcode?: string;
  genres?: string[];
  styles?: string[];
  musicians?: string[];
  master_url?: string;
  release_url?: string;
  label?: string;
  notes?: string;
  added_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  session?: {
    access_token: string;
    user: {
      id: string;
      email: string;
    };
  };
  error?: string;
} 
