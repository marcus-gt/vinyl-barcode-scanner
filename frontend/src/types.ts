export interface VinylRecord {
  id?: string;
  user_id?: string;
  artist: string;
  album: string;
  year?: number;
  release_year?: number;
  genres?: string[];
  styles?: string[];
  musicians?: string[];
  master_url?: string;
  release_url?: string;
  notes?: string;
  added_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 
