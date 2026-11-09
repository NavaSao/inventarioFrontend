import { HttpError, IHttpClient, NetworkError } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';
import { ApiErrorResponse, SessionUser } from '../models/types';

/**
 * CQRS - Query de Validación de Sesión (Lectura / Consulta)
 * - Lee el token almacenado de forma segura. Si no existe, no hay sesión activa.
 * - Realiza GET /api/auth/session con Bearer token.
 * - Regla de Negocio:
 *   • Si responde 200: Retorna los datos del usuario autenticado.
 *   • Si responde 401: El token expiró o es inválido -> BORRA el token de SecureStorage y retorna null.
 *   • Si ocurre un fallo de red/conexión: CONSERVA el token en storage y lanza NetworkError para permitir reintento.
 */
export async function ejecutarValidarSesionQuery(
  httpClient: IHttpClient,
  secureStorage: ISecureStorage,
  baseUrl: string
): Promise<SessionUser | null> {
  const token = await secureStorage.obtenerToken();
  if (!token) {
    return null;
  }

  const url = `${baseUrl.replace(/\/$/, '')}/api/auth/session`;

  try {
    const response = await httpClient.get<SessionUser | ApiErrorResponse>(url, {
      Authorization: `Bearer ${token}`,
    });

    if (response.status === 200 && 'idUsuario' in (response.data as SessionUser)) {
      return response.data as SessionUser;
    }

    if (response.status === 401) {
      // Token rechazado o expirado: se destruye de storage
      await secureStorage.eliminarToken();
      return null;
    }

    // Cualquier otro status de error del servidor que no sea 401
    throw new HttpError(
      response.status,
      'mensaje' in (response.data as ApiErrorResponse)
        ? (response.data as ApiErrorResponse).mensaje
        : 'Error al verificar sesión'
    );
  } catch (error: unknown) {
    // Si fue 401 capturado o manejado
    if (error instanceof HttpError && error.status === 401) {
      await secureStorage.eliminarToken();
      return null;
    }

    // Si es un error de red o timeout, NUNCA borramos el token
    if (error instanceof NetworkError) {
      throw error;
    }

    // Por defecto ante fallo de socket/DNS/red inesperado
    throw new NetworkError('Fallo de conexión. Reintentar');
  }
}
