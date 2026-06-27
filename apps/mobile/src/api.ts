import Constants from 'expo-constants';

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
  if (!query) {
    return '';
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

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
    return this.request<T>(path, {
      ...options,
      method: 'GET',
    });
  }

  post<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'body'> = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body,
    });
  }
}

export const httpHelper = new HttpHelper();