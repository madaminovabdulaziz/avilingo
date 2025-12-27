/**
 * Robust API Client
 * 
 * Features:
 * - Base URL from environment variable
 * - Automatic token attachment
 * - 401 handling with token refresh
 * - Typed responses
 * - Error parsing
 */

import { getAccessToken, refreshTokenWithDedup, isTokenExpired, clearTokens } from './auth';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

// =============================================================================
// Error Types
// =============================================================================

export interface ApiErrorResponse {
  detail: string | { msg: string; type: string; loc: string[] }[];
  message?: string;
  status_code?: number;
}

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'UNKNOWN_ERROR';
    this.details = details;
  }

  static fromResponse(status: number, data: ApiErrorResponse): ApiError {
    let message = 'An error occurred';
    let code = 'UNKNOWN_ERROR';

    if (typeof data.detail === 'string') {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      // Validation error
      message = data.detail.map(d => d.msg).join(', ');
      code = 'VALIDATION_ERROR';
    } else if (data.message) {
      message = data.message;
    }

    return new ApiError(status, message, code, data);
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isValidationError(): boolean {
    return this.status === 422 || this.code === 'VALIDATION_ERROR';
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

// =============================================================================
// Request Queue for 401 Handling
// =============================================================================

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (value: boolean) => void;
  reject: (error: Error) => void;
}> = [];

async function processQueue(success: boolean, error?: Error): Promise<void> {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (success) {
      resolve(true);
    } else {
      reject(error || new Error('Token refresh failed'));
    }
  });
  refreshQueue = [];
}

async function handleTokenRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const success = await refreshTokenWithDedup();
    processQueue(success);
    return success;
  } catch (error) {
    processQueue(false, error as Error);
    return false;
  } finally {
    isRefreshing = false;
  }
}

// =============================================================================
// Core Request Function
// =============================================================================

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  retryOn401?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, skipAuth = false, retryOn401 = true, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${API_VERSION}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  // Add auth token
  if (!skipAuth) {
    // Check if token needs refresh before request
    if (isTokenExpired()) {
      const refreshed = await handleTokenRefresh();
      if (!refreshed) {
        // Redirect to login
        if (typeof window !== 'undefined') {
          clearTokens();
          window.location.href = '/login';
        }
        throw new ApiError(401, 'Session expired', 'SESSION_EXPIRED');
      }
    }

    const token = getAccessToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  // Make request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 with retry
  if (response.status === 401 && retryOn401 && !skipAuth) {
    const refreshed = await handleTokenRefresh();
    if (refreshed) {
      // Retry request with new token
      return request<T>(endpoint, { ...options, retryOn401: false });
    } else {
      // Redirect to login
      if (typeof window !== 'undefined') {
        clearTokens();
        window.location.href = '/login';
      }
      throw new ApiError(401, 'Session expired', 'SESSION_EXPIRED');
    }
  }

  // Handle error responses
  if (!response.ok) {
    let errorData: ApiErrorResponse = { detail: response.statusText };
    try {
      errorData = await response.json();
    } catch {
      // Use default error
    }
    throw ApiError.fromResponse(response.status, errorData);
  }

  // Parse response
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

// =============================================================================
// HTTP Method Helpers
// =============================================================================

export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

// =============================================================================
// Public Request (No Auth)
// =============================================================================

export const publicApi = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body' | 'skipAuth'>) =>
    request<T>(endpoint, { ...options, method: 'GET', skipAuth: true }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'skipAuth'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body, skipAuth: true }),
};

// =============================================================================
// File Upload Helper
// =============================================================================

export async function uploadFile(
  endpoint: string,
  file: File | Blob,
  fieldName = 'file',
  additionalData?: Record<string, string>
): Promise<{ url: string; [key: string]: unknown }> {
  const formData = new FormData();
  formData.append(fieldName, file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const token = getAccessToken();
  const url = `${API_BASE_URL}${API_VERSION}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse = { detail: response.statusText };
    try {
      errorData = await response.json();
    } catch {
      // Use default error
    }
    throw ApiError.fromResponse(response.status, errorData);
  }

  return response.json();
}

// =============================================================================
// Export Types
// =============================================================================

export type { ApiErrorResponse };

