import { Reparation, ReparationHistorique, PieceUtilisee } from '@/types';
import axios from 'axios';

// Service pour gérer les réparations via l'API
// Les réparations sont stockées dans la base de données SQLite via Prisma

class ReparationService {
  private baseUrl = '/api/reparations';

  // Créer une nouvelle réparation
  async createReparation(data: Omit<Reparation, 'id' | 'ref' | 'historique'>): Promise<Reparation> {
    try {
      const response = await axios.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la réparation:', error);
      throw error;
    }
  }

  // Récupérer toutes les réparations
  async getReparations(filters?: {
    statut?: string;
    client_id?: string;
    technicien?: string;
  }): Promise<Reparation[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.statut) params.append('statut', filters.statut);
      if (filters?.client_id) params.append('client_id', filters.client_id);
      if (filters?.technicien) params.append('technicien', filters.technicien);

      const response = await axios.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des réparations:', error);
      return [];
    }
  }

  // Récupérer une réparation par ID
  async getReparation(id: string): Promise<Reparation | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la réparation:', error);
      return null;
    }
  }

  // Récupérer une réparation par référence
  async getReparationByRef(ref: string): Promise<Reparation | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/ref/${encodeURIComponent(ref)}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la réparation par référence:', error);
      return null;
    }
  }

  // Mettre à jour une réparation
  async updateReparation(id: string, data: Partial<Reparation>): Promise<Reparation | null> {
    try {
      const response = await axios.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la réparation:', error);
      return null;
    }
  }

  // Ajouter une entrée à l'historique
  async addHistorique(
    reparationId: string,
    action: string,
    description: string,
    auteur: string,
    visibleClient: boolean = true
  ): Promise<boolean> {
    try {
      await axios.post(`${this.baseUrl}/${reparationId}/historique`, {
        action,
        description,
        auteur,
        visible_client: visibleClient,
      });
      return true;
    } catch (error) {
      console.error("Erreur lors de l'ajout à l'historique:", error);
      return false;
    }
  }

  // Ajouter une pièce utilisée
  async addPieceUtilisee(reparationId: string, piece: Omit<PieceUtilisee, 'id'>): Promise<boolean> {
    try {
      await axios.post(`${this.baseUrl}/${reparationId}/pieces`, piece);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'ajout de la pièce:", error);
      return false;
    }
  }

  // Supprimer une pièce utilisée
  async removePieceUtilisee(reparationId: string, pieceId: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/${reparationId}/pieces?pieceId=${pieceId}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la pièce:', error);
      return false;
    }
  }

  // Changer le statut d'une réparation
  async changeStatut(
    reparationId: string,
    newStatut: Reparation['statut'],
    auteur: string,
    commentaire?: string
  ): Promise<boolean> {
    try {
      await axios.post(`${this.baseUrl}/${reparationId}/statut`, {
        statut: newStatut,
        auteur,
        commentaire,
      });
      return true;
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      return false;
    }
  }

  // Supprimer une réparation
  async deleteReparation(id: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/${id}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la réparation:', error);
      return false;
    }
  }

  // Récupérer les statistiques
  async getStats() {
    try {
      const response = await axios.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      return {
        total: 0,
        en_cours: 0,
        semaine: 0,
        ca_mois: 0,
      };
    }
  }
}

export const reparationService = new ReparationService();
