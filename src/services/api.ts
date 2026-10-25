import {
  User,
  Product,
  BuyRequest,
  SwapRequest,
  Conversation,
  Message,
  Report,
  AdminStats,
} from '../types/index.ts';

const BASE_URL = '/api';

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('artloop_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  auth: {
    me: async (): Promise<{ user: User | null }> => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ user: User | null }>(res);
    },
    login: async (credentials: { email: string; password: string }): Promise<{ message: string; user: User; token: string }> => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      const data = await handleResponse<{ message: string; user: User; token: string }>(res);
      if (data.token) {
        localStorage.setItem('artloop_token', data.token);
      }
      return data;
    },
    register: async (form: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      location: string;
    }): Promise<{ message: string; user: User; token: string }> => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(form),
        credentials: 'include',
      });
      const data = await handleResponse<{ message: string; user: User; token: string }>(res);
      if (data.token) {
        localStorage.setItem('artloop_token', data.token);
      }
      return data;
    },
    logout: async (): Promise<{ message: string }> => {
      localStorage.removeItem('artloop_token');
      const res = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ message: string }>(res);
    },
  },

  // Products
  products: {
    getAll: async (params?: Record<string, string | number | undefined>): Promise<{ products: Product[]; count: number }> => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== '') {
            query.append(key, String(val));
          }
        });
      }
      const url = `${BASE_URL}/products${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await fetch(url, { headers: getHeaders(), credentials: 'include' });
      return handleResponse<{ products: Product[]; count: number }>(res);
    },
    getById: async (id: string): Promise<{ product: Product }> => {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ product: Product }>(res);
    },
    create: async (data: Omit<Product, 'id' | 'sellerId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<{ message: string; product: Product }> => {
      const res = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<{ message: string; product: Product }>(res);
    },
    update: async (id: string, data: Partial<Product>): Promise<{ message: string; product: Product }> => {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<{ message: string; product: Product }>(res);
    },
    updateStatus: async (id: string, status: Product['status']): Promise<{ message: string; product: Product }> => {
      const res = await fetch(`${BASE_URL}/products/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
        credentials: 'include',
      });
      return handleResponse<{ message: string; product: Product }>(res);
    },
    delete: async (id: string): Promise<{ message: string }> => {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ message: string }>(res);
    },
  },

  // Buy Requests
  buyRequests: {
    getAll: async (): Promise<{ requests: BuyRequest[] }> => {
      const res = await fetch(`${BASE_URL}/buy-requests`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ requests: BuyRequest[] }>(res);
    },
    create: async (productId: string, notes?: string): Promise<{ message: string; request: BuyRequest; conversationId: string }> => {
      const res = await fetch(`${BASE_URL}/buy-requests`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, notes }),
        credentials: 'include',
      });
      return handleResponse<{ message: string; request: BuyRequest; conversationId: string }>(res);
    },
    updateStatus: async (id: string, status: BuyRequest['status']): Promise<{ message: string; request: BuyRequest }> => {
      const res = await fetch(`${BASE_URL}/buy-requests/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
        credentials: 'include',
      });
      return handleResponse<{ message: string; request: BuyRequest }>(res);
    },
  },

  // Swap Requests
  swapRequests: {
    getAll: async (): Promise<{ swaps: SwapRequest[] }> => {
      const res = await fetch(`${BASE_URL}/swap-requests`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ swaps: SwapRequest[] }>(res);
    },
    create: async (data: { requestedProductId: string; offeredProductId: string; message?: string }): Promise<{ message: string; swap: SwapRequest; conversationId: string }> => {
      const res = await fetch(`${BASE_URL}/swap-requests`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<{ message: string; swap: SwapRequest; conversationId: string }>(res);
    },
    updateStatus: async (id: string, status: SwapRequest['status']): Promise<{ message: string; swap: SwapRequest }> => {
      const res = await fetch(`${BASE_URL}/swap-requests/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
        credentials: 'include',
      });
      return handleResponse<{ message: string; swap: SwapRequest }>(res);
    },
  },

  // Conversations & Chat
  chat: {
    getConversations: async (): Promise<{ conversations: Conversation[] }> => {
      const res = await fetch(`${BASE_URL}/conversations`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ conversations: Conversation[] }>(res);
    },
    startConversation: async (data: { recipientId: string; recipientName?: string; productId?: string; productTitle?: string }): Promise<{ conversation: Conversation }> => {
      const res = await fetch(`${BASE_URL}/conversations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<{ conversation: Conversation }>(res);
    },
    getMessages: async (conversationId: string): Promise<{ messages: Message[] }> => {
      const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ messages: Message[] }>(res);
    },
    sendMessage: async (conversationId: string, content: string): Promise<{ message: Message }> => {
      const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content }),
        credentials: 'include',
      });
      return handleResponse<{ message: Message }>(res);
    },
  },

  // Reports
  reports: {
    submit: async (productId: string, reason: string): Promise<{ message: string; report: Report }> => {
      const res = await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, reason }),
        credentials: 'include',
      });
      return handleResponse<{ message: string; report: Report }>(res);
    },
  },

  // Admin
  admin: {
    getStats: async (): Promise<{ stats: AdminStats }> => {
      const res = await fetch(`${BASE_URL}/admin/stats`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ stats: AdminStats }>(res);
    },
    getUsers: async (): Promise<{ users: User[] }> => {
      const res = await fetch(`${BASE_URL}/admin/users`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ users: User[] }>(res);
    },
    updateUserStatus: async (userId: string, status: 'active' | 'suspended'): Promise<{ message: string; user: User }> => {
      const res = await fetch(`${BASE_URL}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
        credentials: 'include',
      });
      return handleResponse<{ message: string; user: User }>(res);
    },
    getProducts: async (): Promise<{ products: Product[] }> => {
      const res = await fetch(`${BASE_URL}/admin/products`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ products: Product[] }>(res);
    },
    deleteProduct: async (productId: string): Promise<{ message: string }> => {
      const res = await fetch(`${BASE_URL}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ message: string }>(res);
    },
    getReports: async (): Promise<{ reports: Report[] }> => {
      const res = await fetch(`${BASE_URL}/admin/reports`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      return handleResponse<{ reports: Report[] }>(res);
    },
    updateReportStatus: async (reportId: string, status: Report['status']): Promise<{ message: string; report: Report }> => {
      const res = await fetch(`${BASE_URL}/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
        credentials: 'include',
      });
      return handleResponse<{ message: string; report: Report }>(res);
    },
  },
};
