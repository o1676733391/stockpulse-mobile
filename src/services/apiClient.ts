import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

function resolveApiBaseUrl(): string {
  // If user provided a specific custom URL in env
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }

  // 1. Web always uses localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api/v1';
  }

  // 2. Android Studio Emulator MUST use 10.0.2.2
  if (Platform.OS === 'android' && !Device.isDevice) {
    return 'http://10.0.2.2:5000/api/v1';
  }

  // 3. iOS Simulator uses localhost
  if (Platform.OS === 'ios' && !Device.isDevice) {
    return 'http://localhost:5000/api/v1';
  }

  // 4. Physical device (Android or iOS) detects host PC LAN IP from Metro
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000/api/v1`;
    }
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api/v1' : 'http://localhost:5000/api/v1';
}

const API_BASE_URL = resolveApiBaseUrl();
const ENABLE_MOCK_FALLBACK = false;
const DEBUG_API = process.env.EXPO_PUBLIC_DEBUG_API !== 'false';

let authToken: string | null = null;
let activeStoreId: string = '01915dfa-9012-7000-8000-000000000002'; // Default Bella Cucina Store UUID
let onUnauthorizedCallback: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function setActiveStoreId(storeId: string): void {
  activeStoreId = storeId;
}

export function getActiveStoreId(): string {
  return activeStoreId;
}

export function registerUnauthorizedCallback(callback: () => void): void {
  onUnauthorizedCallback = callback;
}

export function logApiError(
  serviceName: string,
  endpoint: string,
  method: string,
  status: number | string,
  error: any
): void {
  const timestamp = new Date().toISOString();
  console.error(
    `[API Error] Service: ${serviceName} | Endpoint: ${endpoint} | Method: ${method} | Status: ${status} | Error: ${error?.message || error || 'Unknown'} | Time: ${timestamp}`
  );
}

export function logDebugFallback(serviceName: string, endpoint: string, error: any): void {
  logApiError(serviceName, endpoint, 'UNKNOWN', 'ERROR', error);
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
  skipStoreHeader?: boolean;
  _retryCount?: number;
}

async function request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const timeoutMs = options.timeoutMs || 10000;
  const retryCount = options._retryCount || 0;

  // Retrieve current active token if not manually set
  let token = authToken;
  if (!token && !options.skipAuth) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        token = data.session.access_token;
        authToken = token;
      }
    } catch {
      // Session fetch error handled downstream
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Connection: 'close',
    ...(options.headers as Record<string, string>),
  };

  if (activeStoreId && !options.skipStoreHeader) {
    headers['X-Store-Id'] = activeStoreId;
  }

  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (DEBUG_API) {
      console.log(`\x1b[34m[API Request]\x1b[0m ${options.method || 'GET'} ${url}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(id);

    // Handle 401 Unauthorized with token refresh & single retry
    if (response.status === 401 && !options.skipAuth && retryCount === 0) {
      if (DEBUG_API) {
        console.warn(`[API Client] Received 401 on ${endpoint}, attempting token refresh...`);
      }

      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshData?.session?.access_token) {
          const newAccessToken = refreshData.session.access_token;
          setAuthToken(newAccessToken);
          // Retry request with fresh token
          return await request<T>(endpoint, {
            ...options,
            _retryCount: retryCount + 1,
          });
        }
      } catch (refreshErr) {
        if (DEBUG_API) {
          console.warn('[API Client] Refresh session failed:', refreshErr);
        }
      }

      // Refresh failed: clear token and notify context
      setAuthToken(null);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    if (!response.ok) {
      const errorBody = await response.text();
      let parsedError: any;
      try {
        parsedError = JSON.parse(errorBody);
      } catch {
        parsedError = { error: errorBody || `HTTP error ${response.status}` };
      }
      const message = parsedError.message || parsedError.detail || parsedError.error || `HTTP error ${response.status}`;
      const err: any = new Error(message);
      err.status = response.status;
      err.responseBody = parsedError;
      throw err;
    }

    const json = await response.json();
    // Unwrap global transform interceptor { success: true, data: T } if present
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T;
    }
    return json as T;
  } catch (error: any) {
    clearTimeout(id);
    throw error;
  }
}

export const apiClient = {
  get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  del<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  async upload<T>(endpoint: string, formData: FormData, options?: ApiRequestOptions): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    let token = authToken;
    if (!token && !options?.skipAuth) {
      try {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token || null;
      } catch {}
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (activeStoreId && !options?.skipStoreHeader) {
      headers['X-Store-Id'] = activeStoreId;
    }

    if (token && !options?.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || `Upload failed: ${response.status}`);
    }

    const json = await response.json();
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T;
    }
    return json as T;
  },

  isFallbackEnabled(): boolean {
    return ENABLE_MOCK_FALLBACK;
  },

  getBaseUrl(): string {
    return API_BASE_URL;
  },
};
