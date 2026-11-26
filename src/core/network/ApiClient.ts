import { ISecureStorage } from '../storage/ISecureStorage';
import { HttpResponse, IRestHttpClient } from './IHttpClient';

interface Envoltorio<T> {
  readonly data?: T;
  readonly message?: string;
}

/**
 * Cliente de la API de AssetOps: agrega el Bearer token, desenvuelve `{ data }`
 * y convierte las respuestas de error en `Error` con el mensaje del backend.
 */
export class ApiClient {
  constructor(
    private readonly http: IRestHttpClient,
    private readonly storage: ISecureStorage,
    readonly baseUrl: string
  ) {}

  async get<T>(ruta: string): Promise<T> {
    return this.leer(await this.http.get<Envoltorio<T>>(this.url(ruta), await this.cabeceras()));
  }

  async post<T>(ruta: string, body: unknown = {}): Promise<T> {
    return this.leer(await this.http.post<Envoltorio<T>>(this.url(ruta), body, await this.cabeceras()));
  }

  async put<T>(ruta: string, body: unknown, contentType = 'application/json'): Promise<T> {
    const cabeceras = await this.cabeceras({ 'Content-Type': contentType });
    return this.leer(await this.http.put<Envoltorio<T>>(this.url(ruta), body, cabeceras));
  }

  async patch<T>(ruta: string, body: unknown = {}): Promise<T> {
    return this.leer(await this.http.patch<Envoltorio<T>>(this.url(ruta), body, await this.cabeceras()));
  }

  private url(ruta: string): string {
    return `${this.baseUrl}${ruta}`;
  }

  private async cabeceras(extra: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = await this.storage.obtenerToken();
    return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
  }

  private leer<T>({ ok, status, data }: HttpResponse<Envoltorio<T>>): T {
    if (ok && data?.data !== undefined) return data.data;
    throw new ApiError(status, data?.message || 'No se pudo completar la operación. Intenta de nuevo.');
  }
}

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
