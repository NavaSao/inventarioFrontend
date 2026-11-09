/**
 * Capa de Infraestructura - Abstracción HTTP (DIP / ISP)
 * Desacopla la lógica de negocio y casos de uso de cualquier cliente HTTP concreto (fetch, axios, etc.)
 */

export interface HttpResponse<T = unknown> {
  readonly status: number;
  readonly ok: boolean;
  readonly data: T;
}

export class NetworkError extends Error {
  constructor(message: string = 'Fallo de conexión. Reintentar') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class HttpError extends Error {
  readonly status: number;
  readonly responseData: unknown;

  constructor(status: number, message: string, responseData?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.responseData = responseData;
  }
}

export interface IHttpClient {
  get<T>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>;
  post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>>;
}
