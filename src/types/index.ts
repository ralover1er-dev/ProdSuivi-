// Types for the application

export interface Profile {
  id: number;
  nom: string;
  telephone: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Container {
  id: number;
  user_id: number;
  nom: string;
  statut: 'ouvert' | 'cloture';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  container_id: number;
  nom: string;
  poids_piece_kg: number;
  qte_par_carton: number;
  poids_carton_kg: number;
  created_at: string;
  updated_at: string;
}

export interface ProductEntry {
  id: number;
  product_id: number;
  qte_ajoutee: number;
  date_heure: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isSignout: boolean;
  signUp: (nom: string, telephone: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
