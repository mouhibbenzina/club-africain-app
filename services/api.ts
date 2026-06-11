import { Platform, Alert } from 'react-native';

interface ApiRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

const BASE_URL = __DEV__
  ? 'https://dev-api.clubafricain.tn'
  : 'https://api.clubafricain.tn';

const TIMEOUT_MS = 15000;

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(
  request: RequestInfo,
  options: RequestInit,
  timeout = TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(request, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export const api = {
  async request<T>({
    url,
    method,
    body,
    headers,
  }: ApiRequest): Promise<T> {
    const token = null;

    const response = await fetchWithTimeout(`${BASE_URL}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || 'Erreur serveur',
        errorData.code,
      );
    }

    return response.json();
  },

  get<T>(url: string, headers?: Record<string, string>) {
    return this.request<T>({ url, method: 'GET', headers });
  },

  post<T>(url: string, body: unknown, headers?: Record<string, string>) {
    return this.request<T>({ url, method: 'POST', body, headers });
  },

  put<T>(url: string, body: unknown, headers?: Record<string, string>) {
    return this.request<T>({ url, method: 'PUT', body, headers });
  },

  delete<T>(url: string, headers?: Record<string, string>) {
    return this.request<T>({ url, method: 'DELETE', headers });
  },
};
