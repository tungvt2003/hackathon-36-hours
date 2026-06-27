// Legacy entry — prefer src/services/api.ts for new screens
import Constants from 'expo-constants';
import {
  ConversationConfirmResponse,
  ConversationInputResponse,
  ConversationStartResponse,
  OrderStatusResponse,
  PartnerCode,
  ReviewRequest,
  ReviewResponse,
} from './types';

// ── HttpHelper (generic HTTP utility, used by UI layer) ──────────────────────

type QueryValue = string | number | boolean | null | undefined;

export interface HttpHelperOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  headers?: Record<string, string>;
  query?: Record<string, QueryValue>;
  body?: unknown;
}

function getDefaultBaseUrl(): string {
  const configuredBaseUrl = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  return configuredBaseUrl ?? 'http://localhost:3000';
}

function toQueryString(query?: Record<string, QueryValue>): string {
  if (!query) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    searchParams.append(key, String(value));
  }
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export class HttpHelper {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: HttpHelperOptions = {}) {
    this.baseUrl = (options.baseUrl ?? getDefaultBaseUrl()).replace(/\/$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...(options.defaultHeaders ?? {}),
    };
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { query, body, headers, ...requestInit } = options;
    const response = await fetch(`${this.baseUrl}${path}${toQueryString(query)}`, {
      ...requestInit,
      headers: {
        ...this.defaultHeaders,
        ...(headers ?? {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(`API ${path} failed ${response.status}: ${responseBody}`);
    }
    return response.json() as Promise<T>;
  }

  get<T>(path: string, options: Omit<RequestOptions, 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }
}

export const httpHelper = new HttpHelper();

// ── Typed API client (used by Home screen conversation/order flow) ────────────

const BASE_URL = getDefaultBaseUrl();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (err) {
    throw new Error(`Network error: ${(err as Error).message}`);
  }
  const rawBody = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${rawBody}`);
  return JSON.parse(rawBody) as T;
}

export const api = {
  health: (): Promise<{ ok: boolean }> => request('/health'),

  conversation: {
    start: (userId?: string): Promise<ConversationStartResponse> =>
      request('/conversation/start', { method: 'POST', body: JSON.stringify({ userId }) }),

    input: (sessionId: string, transcript: string): Promise<ConversationInputResponse> =>
      request('/conversation/input', {
        method: 'POST',
        body: JSON.stringify({ sessionId, transcript }),
      }),

    confirm: (sessionId: string, partner: PartnerCode): Promise<ConversationConfirmResponse> =>
      request('/conversation/confirm', {
        method: 'POST',
        body: JSON.stringify({ sessionId, partner }),
      }),
  },

  orders: {
    status: (orderId: string): Promise<OrderStatusResponse> =>
      request(`/orders/${orderId}/status`),

    review: (orderId: string, body: ReviewRequest): Promise<ReviewResponse> =>
      request(`/orders/${orderId}/review`, { method: 'POST', body: JSON.stringify(body) }),
  },
};
