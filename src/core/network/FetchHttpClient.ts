import { HttpError, HttpResponse, IRestHttpClient, NetworkError } from './IHttpClient';

/**
 * Implementación concreta de IHttpClient utilizando fetch nativo (SRP / LSP).
 * Maneja cabeceras predeterminadas, timeouts y transformación de respuestas JSON.
 */
export class FetchHttpClient implements IRestHttpClient {
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

  post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.enviar<T>('POST', url, body, headers);
  }

  put<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.enviar<T>('PUT', url, body, headers);
  }

  patch<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.enviar<T>('PATCH', url, body, headers);
  }

  /** Serializa a JSON salvo que el cuerpo ya sea texto (p. ej. una foto en base64 como text/plain). */
  private enviar<T>(method: string, url: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      body: body === undefined || typeof body === 'string' ? body : JSON.stringify(body),
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

