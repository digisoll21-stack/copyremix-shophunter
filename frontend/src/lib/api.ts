import { supabase } from './supabase.ts';

const API_URL = import.meta.env.VITE_API_URL || '';

async function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }

  return headers;
}

export const api = {
  async get(path: string) {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(response);
  },

  async post(path: string, body: any) {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return this.handleResponse(response);
  },

  async put(path: string, body: any) {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    return this.handleResponse(response);
  },

  async patch(path: string, body: any) {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    return this.handleResponse(response);
  },

  async delete(path: string) {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse(response);
  },

  async handleResponse(response: Response) {
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMessage += ` - ${errorData.error}`;
      } catch (e) {
        // Fallback if response is not JSON
      }
      throw new Error(errorMessage);
    }
    return response.json();
  }
};
