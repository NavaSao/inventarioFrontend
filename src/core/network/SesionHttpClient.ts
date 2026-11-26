import { HttpResponse, IRestHttpClient } from './IHttpClient';

/**
 * Decorador (OCP): si el backend responde 401 en una petición autenticada, el token
 * expiró o fue revocado. Notifica para cerrar la sesión y volver al login automáticamente.
 */
export class SesionHttpClient implements IRestHttpClient {
  constructor(
    private readonly inner: IRestHttpClient,
    private readonly onSesionExpirada: () => void
  ) {}

  get<T>(url: string, headers?: Record<string, string>) {
    return this.vigilar(this.inner.get<T>(url, headers));
  }

  post<T>(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.vigilar(this.inner.post<T>(url, body, headers));
  }

  put<T>(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.vigilar(this.inner.put<T>(url, body, headers));
  }

  patch<T>(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.vigilar(this.inner.patch<T>(url, body, headers));
  }

  private async vigilar<T>(peticion: Promise<HttpResponse<T>>): Promise<HttpResponse<T>> {
    const respuesta = await peticion;
    if (respuesta.status === 401) this.onSesionExpirada();
    return respuesta;
  }
}
