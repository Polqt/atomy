/**
 * Backend API Service
 * Centralized HTTP client for authenticated API calls
 */
import { supabase } from '../config/supabase';
import { API } from '../constants/api';
import { ApiError, createAbortedController, parseResponse } from '../utils/api-error';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Fail fast if API URL is not configured
if (!API_URL) {
  throw new Error('[atomy] EXPO_PUBLIC_API_URL is not set. Add it to your .env file.');
}

export function getApiUrl() {
  return API_URL;
}

async function getAccessToken(explicitToken?: string): Promise<string> {
  if (explicitToken) {
    return explicitToken;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new ApiError('Not authenticated', 401);
  }

  return session.access_token;
}

export async function authorizedRequest(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
  timeoutMs: number = API.TIMEOUT_MS,
) {
  const token = await getAccessToken(accessToken);
  const headers = new Headers(init.headers);
  
  headers.set('Authorization', `Bearer ${token}`);

  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const { controller, timeoutId } = createAbortedController(timeoutMs);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const payload = await parseResponse(response);
      throw ApiError.fromResponse(response, payload);
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw ApiError.timeout();
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.networkError(error as Error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function authorizedJson<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const response = await authorizedRequest(path, init, accessToken);
  return parseResponse<T>(response);
}
