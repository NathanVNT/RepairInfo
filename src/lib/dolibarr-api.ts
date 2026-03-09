import axios, { AxiosInstance, AxiosError } from 'axios';

export class DolibarrAPI {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_DOLIBARR_URL;
    const apiKey = process.env.NEXT_PUBLIC_DOLIBARR_API_KEY;

    if (!baseURL || !apiKey) {
      throw new Error('Configuration Dolibarr manquante. Vérifiez vos variables d\'environnement.');
    }

    this.client = axios.create({
      baseURL: `${baseURL}/api/index.php`,
      headers: {
        'DOLAPIKEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour gérer les erreurs
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('Erreur API Dolibarr:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Méthodes génériques
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(endpoint, { params });
    return response.data;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(endpoint, data);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete<T>(endpoint);
    return response.data;
  }

  // ===== ENTREPOTS (WAREHOUSES) =====
  
  async getWarehouses() {
    return this.get('/warehouses');
  }

  async getWarehouse(id: string) {
    return this.get(`/warehouses/${id}`);
  }

  // ===== PRODUITS / STOCK =====
  
  async getProducts(params?: { limit?: number; sortfield?: string; sortorder?: string }) {
    return this.get('/products', params);
  }

  async getProduct(id: string) {
    return this.get(`/products/${id}`);
  }

  async createProduct(data: any) {
    return this.post('/products', data);
  }

  async updateProduct(id: string, data: any) {
    return this.put(`/products/${id}`, data);
  }

  async deleteProduct(id: string) {
    return this.delete(`/products/${id}`);
  }

  async getProductStock(productId: string) {
    return this.get(`/products/${productId}/stock`);
  }

  async updateStock(productId: string, warehouseId: string, qty: number, mouvement: number) {
    // mouvement: 1 pour entrée, 0 pour sortie
    // Utilise l'endpoint /stockmovements comme indiqué par Dolibarr
    
    try {
      // Récupérer la liste des entrepôts disponibles
      let warehouses: any[] = [];
      try {
        warehouses = await this.getWarehouses();
        console.log(`📦 Entrepôts disponibles:`, warehouses.map((w: any) => ({ id: w.id, ref: w.ref, label: w.label })));
      } catch (e: any) {
        console.warn('⚠️ Impossible de récupérer la liste des entrepôts:', e.message);
      }

      if (warehouses.length === 0) {
        throw new Error('❌ Aucun entrepôt disponible dans Dolibarr. Créez-en un dans l\'interface Dolibarr.');
      }

      // Utiliser le premier entrepôt disponible
      const finalWarehouseId = warehouses[0].id || warehouses[0].rowid;

      console.log(`🏭 Mouvement stock: Product=${productId}, Warehouse=${finalWarehouseId}, Qty=${qty}, Type=${mouvement}`);

      const response = await this.post(`/stockmovements`, {
        product_id: parseInt(productId),
        warehouse_id: parseInt(finalWarehouseId),
        qty: qty,
        type: mouvement,
        movement_reason_code: 'StockCorrection'
      });
      console.log(`✅ Mouvement enregistré:`, response);
      return response;
    } catch (error: any) {
      console.error(`❌ Erreur mouvement stock:`, error.response?.data || error.message);
      throw error;
    }
  }

  // ===== TIERS (Clients) =====
  
  async getThirdParties(params?: { limit?: number; sortfield?: string; sortorder?: string; mode?: number }) {
    return this.get('/thirdparties', params);
  }

  async getThirdParty(id: string) {
    return this.get(`/thirdparties/${id}`);
  }

  async createThirdParty(data: any) {
    return this.post('/thirdparties', data);
  }

  async updateThirdParty(id: string, data: any) {
    return this.put(`/thirdparties/${id}`, data);
  }

  // ===== FACTURES =====
  
  async getInvoices(params?: { 
    limit?: number; 
    sortfield?: string; 
    sortorder?: string;
    thirdparty_ids?: string;
    status?: string;
  }) {
    return this.get('/invoices', params);
  }

  async getInvoice(id: string) {
    return this.get(`/invoices/${id}`);
  }

  async createInvoice(data: any) {
    return this.post('/invoices', data);
  }

  async updateInvoice(id: string, data: any) {
    return this.put(`/invoices/${id}`, data);
  }

  async validateInvoice(id: string) {
    return this.post(`/invoices/${id}/validate`, {
      notrigger: 0
    });
  }

  async deleteInvoice(id: string) {
    return this.delete(`/invoices/${id}`);
  }

  async addInvoiceLine(invoiceId: string, line: any) {
    return this.post(`/invoices/${invoiceId}/lines`, line);
  }

  async updateInvoiceLine(invoiceId: string, lineId: string, line: any) {
    return this.put(`/invoices/${invoiceId}/lines/${lineId}`, line);
  }

  async deleteInvoiceLine(invoiceId: string, lineId: string) {
    return this.delete(`/invoices/${invoiceId}/lines/${lineId}`);
  }

  async addInvoicePayment(invoiceId: string, payment: any) {
    return this.post(`/invoices/${invoiceId}/payments`, payment);
  }

  // ===== DEVIS (Propositions commerciales) =====
  
  async getProposals(params?: { 
    limit?: number; 
    sortfield?: string; 
    sortorder?: string;
    thirdparty_ids?: string;
  }) {
    return this.get('/proposals', params);
  }

  async getProposal(id: string) {
    return this.get(`/proposals/${id}`);
  }

  async createProposal(data: any) {
    return this.post('/proposals', data);
  }

  async updateProposal(id: string, data: any) {
    return this.put(`/proposals/${id}`, data);
  }

  async validateProposal(id: string) {
    return this.post(`/proposals/${id}/validate`);
  }

  async closeProposal(id: string, status: number) {
    // status: 2 = signé, 3 = non signé
    return this.post(`/proposals/${id}/close`, { status });
  }

  async addProposalLine(proposalId: string, line: any) {
    return this.post(`/proposals/${proposalId}/lines`, line);
  }

  async updateProposalLine(proposalId: string, lineId: string, line: any) {
    return this.put(`/proposals/${proposalId}/lines/${lineId}`, line);
  }

  async deleteProposalLine(proposalId: string, lineId: string) {
    return this.delete(`/proposals/${proposalId}/lines/${lineId}`);
  }

  // ===== COMPTES BANCAIRES =====
  
  async getBankAccounts() {
    return this.get('/bankaccounts');
  }

  // ===== AUTRES CHAMPS PERSONNALISÉS =====
  
  async getExtraFields(elementType: string) {
    return this.get(`/setup/extrafields/${elementType}`);
  }

  async createExtraField(elementType: string, data: any) {
    return this.post(`/setup/extrafields/${elementType}`, data);
  }
}

// Instance singleton
export const dolibarrAPI = new DolibarrAPI();
