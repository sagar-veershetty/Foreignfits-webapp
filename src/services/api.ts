const API_BASE_URL = 'http://localhost:8080/api';

// API client with authentication
class ApiClient {
  private getAuthHeaders() {
    const token = localStorage.getItem('foreignfits_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.text().then(text => {
          try {
            return JSON.parse(text);
          } catch {
            return { message: text || `HTTP ${response.status}` };
          }
        });
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) return {} as T;
      
      try {
        return JSON.parse(text);
      } catch {
        return text as unknown as T;
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Backend server is not running. Please start the backend server first.');
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string, role: string) {
    return this.request<{ user: any }>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name, email, password, role }),
    });
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  // Product endpoints
  async getProducts() {
    return this.request<any[]>('/products');
  }

  async getProductById(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async getProductBySku(sku: string) {
    return this.request<any>(`/products/sku/${sku}`);
  }

  async getProductByBarcode(barcode: string) {
    return this.request<any>(`/products/barcode/${barcode}`);
  }

  async createProduct(productData: any) {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: any) {
    return this.request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getLowStockProducts() {
    return this.request<any[]>('/products/low-stock');
  }

  async searchProducts(query: string) {
    return this.request<any[]>(`/products/search?q=${encodeURIComponent(query)}`);
  }

  // Sales endpoints
  async getSales() {
    return this.request<any[]>('/sales');
  }

  async getTodaysSales() {
    return this.request<any[]>('/sales/today');
  }

  async getTodaysRevenue() {
    return this.request<number>('/sales/revenue/today');
  }

  async createSale(saleData: any) {
    return this.request<any>('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  // Stock endpoints
  async getStockMovements() {
    return this.request<any[]>('/stock/movements');
  }

  async adjustStock(adjustmentData: any) {
    return this.request<any>('/stock/adjust', {
      method: 'POST',
      body: JSON.stringify(adjustmentData),
    });
  }

  async getStockMovementsByProduct(productId: string) {
    return this.request<any[]>(`/stock/movements/product/${productId}`);
  }
}

export const apiClient = new ApiClient();