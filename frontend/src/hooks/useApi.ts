'use client';
import { useState, useCallback } from 'react';

const API_BASE = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '')
  : '';

export { API_BASE };

export function useApi(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setError(data.message || 'Request failed');
        return null;
      }
      return data as T;
    } catch (err: any) {
      setError(err.message || 'Network error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const get = useCallback(<T = any>(endpoint: string) => request<T>(endpoint), [request]);

  const post = useCallback(<T = any>(endpoint: string, body: object) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }), [request]);

  const put = useCallback(<T = any>(endpoint: string, body: object) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }), [request]);

  const del = useCallback(<T = any>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }), [request]);

  return { loading, error, get, post, put, del, request };
}
