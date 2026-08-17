import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

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
const ENABLE_MOCK_FALLBACK = process.env.EXPO_PUBLIC_ENABLE_MOCK_FALLBACK !== 'false';
const DEBUG_API = process.env.EXPO_PUBLIC_DEBUG_API !== 'false';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function logDebugFallback(serviceName: string, endpoint: string, error: any): void {
  if (DEBUG_API) {
    console.warn(
      `\x1b[33m[API Fallback Debug]\x1b[0m Service: \x1b[36m${serviceName}\x1b[0m | Endpoint: \x1b[35m${endpoint}\x1b[0m | Reason: ${error?.message || error || 'Network error'}. Using mock fallback data.`
    );
  }
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

async function request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const timeoutMs = options.timeoutMs || 8000;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Connection: 'close',
    ...(options.headers as Record<string, string>),
  };

  if (authToken && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${authToken}`;
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

    if (!response.ok) {
      const errorBody = await response.text();
      let parsedError: any;
      try {
        parsedError = JSON.parse(errorBody);
      } catch {
        parsedError = { error: errorBody || `HTTP error ${response.status}` };
      }
      throw new Error(parsedError.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data as T;
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
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (authToken && !options?.skipAuth) {
      headers['Authorization'] = `Bearer ${authToken}`;
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

    return response.json() as Promise<T>;
  },

  isFallbackEnabled(): boolean {
    return ENABLE_MOCK_FALLBACK;
  },

  getBaseUrl(): string {
    return API_BASE_URL;
  },
};
