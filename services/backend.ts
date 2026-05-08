import { supabase } from '../config/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function requireApiUrl() {
  if (!API_URL) {
    throw new Error('[atomy] EXPO_PUBLIC_API_URL is not set. Add it to your .env file.');
  }

  return API_URL;
}

async function getAccessToken(explicitToken?: string) {
  if (explicitToken) {
    return explicitToken;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  return session.access_token;
}

async function readResponsePayload(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getErrorMessage(payload: unknown, status: number) {
  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload)) {
    const parts = payload.filter((part): part is string => typeof part === 'string');
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  if (payload && typeof payload === 'object') {
    const message = (payload as { message?: unknown }).message;
    const error = (payload as { error?: unknown }).error;

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      const parts = message.filter((part): part is string => typeof part === 'string');
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }

    if (typeof error === 'string') {
      return error;
    }
  }

  return `Request failed: ${status}`;
}

export function getApiUrl() {
  return API_URL ?? null;
}

export async function authorizedRequest(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
) {
  const token = await getAccessToken(accessToken);
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${requireApiUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = await readResponsePayload(response);
    throw new Error(getErrorMessage(payload, response.status));
  }

  return response;
}

export async function authorizedJson<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const response = await authorizedRequest(path, init, accessToken);
  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
