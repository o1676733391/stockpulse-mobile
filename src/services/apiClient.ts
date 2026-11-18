import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

const PRODUCTION_API_URL =
  'https://stockpulse-backend-staging-847107251833.europe-west3.run.app/api/v1';

function resolveApiBaseUrl(): string {
  // If user provided a specific custom URL in env
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim();
  }

  // 1. Web always uses localhost in dev, or production URL in prod
  if (Platform.OS === 'web') {
    return typeof __DEV__ !== 'undefined' && __DEV__
      ? 'http://localhost:5000/api/v1'
      : PRODUCTION_API_URL;
  }

  // 2. Android Studio Emulator MUST use 10.0.2.2
  if (Platform.OS === 'android' && !Device.isDevice) {
    return 'http://10.0.2.2:5000/api/v1';
  }

  // 3. iOS Simulator uses localhost
  if (Platform.OS === 'ios' && !Device.isDevice) {
    return 'http://localhost:5000/api/v1';
  }

  // 4. Physical device (Android or iOS) detects host PC LAN IP or USB adb reverse from Metro in dev
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp) {
      return `http://${hostIp}:5000/api/v1`;
    }
  }

  // 5. Standalone / TestFlight / Production builds on physical devices default to staging Cloud Run URL
  return PRODUCTION_API_URL;
}

const API_BASE_URL = resolveApiBaseUrl();
const ENABLE_MOCK_FALLBACK = process.env.EXPO_PUBLIC_ENABLE_MOCK_FALLBACK === 'true';
const DEBUG_API = process.env.EXPO_PUBLIC_DEBUG_API !== 'false';

let authToken: string | null = null;
let activeStoreId: string = '';
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
  const msg = `[API Error] Service: ${serviceName} | Endpoint: ${endpoint} | Method: ${method} | Status: ${status} | Error: ${error?.message || error || 'Unknown'} | Time: ${timestamp}`;
  if (status === 'MOCK' || method === 'LOCAL_MOCK' || ENABLE_MOCK_FALLBACK) {
    if (DEBUG_API) {
      console.log(msg);
    }
    return;
  }
  console.error(msg);
}

export function logDebugFallback(serviceName: string, endpointOrContext: any, error?: any): void {
  const endpointStr = typeof endpointOrContext === 'string' ? endpointOrContext : 'fallback';
  const errObj = error !== undefined ? error : endpointOrContext;
  const methodMatch = typeof endpointStr === 'string' ? endpointStr.match(/\[([A-Z]+)\]/) : null;
  const method = methodMatch ? methodMatch[1] : (errObj?.method || 'LOCAL_MOCK');
  const cleanEndpoint = typeof endpointStr === 'string' ? endpointStr.replace(/\s*\[[A-Z]+\]\s*/, '') : 'local';
  const status = errObj?.status ? String(errObj.status) : 'MOCK';
  logApiError(serviceName, cleanEndpoint, method, status, errObj);
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
  skipStoreHeader?: boolean;
  _retryCount?: number;
}

async function request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const timeoutMs = options.timeoutMs || 8000;
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

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      // If a USB-connected device in dev mode has Wi-Fi off and cannot reach the remote staging URL,
      // automatically fall back to http://localhost:5000/api/v1 via adb reverse.
      if (
        typeof __DEV__ !== 'undefined' &&
        __DEV__ &&
        Platform.OS !== 'web' &&
        !API_BASE_URL.includes('localhost') &&
        !API_BASE_URL.includes('127.0.0.1')
      ) {
        const localUrl = `http://localhost:5000/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        response = await fetch(localUrl, {
          ...options,
          headers,
          signal: controller.signal,
        });
      } else {
        throw fetchErr;
      }
    }

    clearTimeout(id);

    // Handle 401 Unauthorized with token refresh & single retry
    if (response.status === 401 && !options.skipAuth && retryCount === 0) {
      if (DEBUG_API) {
        console.log(`[API Client] Received 401 on ${endpoint}, attempting token refresh...`);
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
          console.log('[API Client] Refresh session failed:', refreshErr);
        }
      }

      // Refresh failed: clear token and notify context only if we had an active token
      if (authToken) {
        setAuthToken(null);
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
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
      let message = parsedError.message || parsedError.detail || parsedError.error || `HTTP error ${response.status}`;
      if (Array.isArray(parsedError.invalidParams) && parsedError.invalidParams.length > 0) {
        message = `${message} (${parsedError.invalidParams.join(', ')})`;
      } else if (Array.isArray(parsedError.message)) {
        message = parsedError.message.join(', ');
      }
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

  delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
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
