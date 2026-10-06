export interface UserProfile {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ImportResult {
  wedding_id: string;
  mapping: Record<string, Record<string, string>>;
}
