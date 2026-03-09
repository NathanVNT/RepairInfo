// Types pour l'API Dolibarr

export interface DolibarrProduct {
  id: string;
  ref: string;
  label: string;
  description?: string;
  type: '0' | '1'; // 0 = produit, 1 = service
  price: number;
  price_ttc: number;
  price_min: number;
  tva_tx: number;
  stock_reel?: number;
  stock_theorique?: number;
  seuil_stock_alerte?: number;
  barcode?: string;
  array_options?: Record<string, any>;
}

export interface DolibarrThirdParty {
  id: string;
  name: string;
  name_alias?: string;
  email?: string;
  phone?: string;
  address?: string;
  zip?: string;
  town?: string;
  country_code?: string;
  client: '0' | '1' | '2' | '3'; // 0=no customer, 1=customer, 2=prospect, 3=customer and prospect
  code_client?: string;
  array_options?: Record<string, any>;
}

export interface DolibarrInvoice {
  id: string;
  ref: string;
  socid: string;
  date: number;
  date_creation: number;
  date_validation?: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  remise_percent: number;
  remise_absolue: number;
  statut: '0' | '1' | '2' | '3'; // 0=draft, 1=validated, 2=paid, 3=abandoned
  paye: '0' | '1';
  type: '0' | '1' | '2' | '3'; // 0=standard, 1=replacement, 2=credit note, 3=deposit
  lines?: DolibarrInvoiceLine[];
  note_public?: string;
  note_private?: string;
}

export interface DolibarrInvoiceLine {
  id?: string;
  fk_product?: string;
  product_ref?: string;
  product_label?: string;
  description?: string;
  qty: number;
  subprice: number;
  tva_tx: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
}

export interface DolibarrProposal {
  id: string;
  ref: string;
  socid: string;
  date: number;
  fin_validite: number;
  date_creation: number;
  date_validation?: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  statut: '0' | '1' | '2' | '3' | '4'; // 0=draft, 1=validated, 2=signed, 3=not signed, 4=billed
  lines?: DolibarrProposalLine[];
  note_public?: string;
  note_private?: string;
}

export interface DolibarrProposalLine {
  id?: string;
  fk_product?: string;
  product_ref?: string;
  product_label?: string;
  description?: string;
  qty: number;
  subprice: number;
  tva_tx: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
}

// Types personnalisés pour l'atelier
export interface Reparation {
  id: string;
  ref: string;
  client_id: string;
  client_name: string;
  appareil: string;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  description_panne: string;
  date_depot: string;
  date_prevue?: string;
  date_fin?: string;
  statut: 'en_attente' | 'diagnostic' | 'en_reparation' | 'en_attente_piece' | 'terminee' | 'livree' | 'annulee';
  priorite: 'basse' | 'normale' | 'haute' | 'urgente';
  montant_estime?: number;
  montant_final?: number;
  technicien?: string;
  historique: ReparationHistorique[];
  pieces_utilisees?: PieceUtilisee[];
  facture_id?: string;
  devis_id?: string;
  note_interne?: string;
  note_client?: string;
  notification_statut?: boolean;
  notification_documents?: boolean;
}

export interface ReparationHistorique {
  id: string;
  date: string;
  action: string;
  description: string;
  auteur: string;
  visible_client: boolean;
}

export interface PieceUtilisee {
  id: string;
  product_id: string;
  product_ref: string;
  product_label: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
}

export interface StockMouvement {
  id: string;
  product_id: string;
  product_ref: string;
  product_label: string;
  date: string;
  type: 'entree' | 'sortie' | 'inventaire' | 'ajustement';
  quantite: number;
  origine?: string;
  utilisateur: string;
  commentaire?: string;
}

export interface DashboardStats {
  reparations_en_cours: number;
  reparations_semaine: number;
  factures_impayees: number;
  stock_alerte: number;
  ca_mois: number;
  ca_mois_precedent: number;
}
