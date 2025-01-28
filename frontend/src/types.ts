export interface VinylRecord {
  id?: string;
  user_id?: string;
  artist: string;
  album: string;
  year?: number;
  barcode?: string;
  genres?: string[];
  styles?: string[];
  musicians?: string[];
  master_url?: string;
  current_release_url?: string;
  current_release_year?: number;
  label?: string;
  notes?: string;
  created_at?: string;
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
