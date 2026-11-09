import { HttpError, HttpResponse, IHttpClient, NetworkError } from './IHttpClient';

/**
 * Implementación concreta de IHttpClient utilizando fetch nativo (SRP / LSP).
 * Maneja cabeceras predeterminadas, timeouts y transformación de respuestas JSON.
 */
export class FetchHttpClient implements IHttpClient {
  private readonly defaultTimeoutMs: number;

  constructor(defaultTimeoutMs: number = 10000) {
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...headers,
      },
    });
  }

  async post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  private async request<T>(url: string, init: RequestInit): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      let responseData: T;
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        responseData = (await response.json()) as T;
      } else {
        const text = await response.text();
        responseData = (text ? { mensaje: text } : {}) as T;
      }

      return {
        status: response.status,
        ok: response.ok,
        data: responseData,
      };
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error;
      }
      // AbortError por timeout o fallo de conexión/DNS/socket
      throw new NetworkError('Fallo de conexión. Reintentar');
    } finally {
      clearTimeout(timer);
    }
  }
}
