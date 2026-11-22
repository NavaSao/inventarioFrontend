import { HttpError, IHttpClient, NetworkError } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';
import type { ApiResponse, SessionUser } from '../models/types';

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
    const { status, data: cuerpo } = await httpClient.get<ApiResponse<SessionUser>>(url, {
      Authorization: `Bearer ${token}`,
    });

    const usuario = cuerpo?.status === 'success' ? cuerpo.data : undefined;
    if (status === 200 && typeof usuario?.idUsuario === 'string') {
      return usuario;
    }

    const mensaje = cuerpo?.status === 'error' ? cuerpo.message : undefined;
    throw new HttpError(status, mensaje || 'Error al verificar sesión', cuerpo);
  } catch (error: unknown) {
    // Si el servidor rechazó el token, borro el acceso guardado.
    if (error instanceof HttpError && error.status === 401) {
      await secureStorage.eliminarToken();
      return null;
    }

    // Con otros errores conservo el token para poder reintentar.
    if (error instanceof HttpError || error instanceof NetworkError) {
      throw error;
    }

    // Por defecto ante fallo de socket/DNS/red inesperado
    throw new NetworkError('Fallo de conexión. Reintentar');
  }
}

