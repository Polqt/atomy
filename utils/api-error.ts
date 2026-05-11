/**
 * Unified API Error Handling Utilities
 */

import { API } from '../constants/api';

/**
 * Custom API Error class with status code support
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(response: Response, payload?: unknown): ApiError {
    const message = extractErrorMessage(payload, response.status);
    return new ApiError(message, response.status);
  }

  static networkError(cause: Error): ApiError {
    return new ApiError('Network error. Please check your connection.', undefined, true);
  }

  static timeout(): ApiError {
    return new ApiError('Request timed out. Please try again.', 408);
  }
}

/**
 * Extract user-friendly error message from various response formats
 */
function extractErrorMessage(payload: unknown, status: number): string {
  if (!payload) {
    return `Request failed: ${status}`;
  }

  // String payload
  if (typeof payload === 'string') {
    return payload;
  }

  // Array of strings (validation errors)
  if (Array.isArray(payload)) {
    const parts = payload.filter((p): p is string => typeof p === 'string');
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  // Object with message or error fields
  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const message = obj.message ?? obj.error;
    
    if (typeof message === 'string') {
      return message;
    }

    // Handle validation error arrays
    if (Array.isArray(message)) {
      const parts = message.filter((m): m is string => typeof m === 'string');
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
  }

  return `Request failed: ${status}`;
}

/**
 * Create an abort controller with timeout
 */
export function createAbortedController(timeoutMs: number = API.TIMEOUT_MS): {
  controller: AbortController;
  timeoutId: NodeJS.Timeout;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

/**
 * Parse JSON response safely
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}