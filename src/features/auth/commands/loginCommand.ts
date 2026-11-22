import { HttpError, IHttpClient, NetworkError } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';
import type { ApiResponse, LoginCredentials, LoginResponse } from '../models/types';

/**
 * CQRS - Command de Inicio de Sesión (Escritura / Mutación)
 * - Envía credenciales al backend mediante POST /api/auth/login.
 * - Si es exitoso (200), persiste de forma segura el JWT en ISecureStorage.
 * - Mapea respuestas 400 y 401 con mensajes amigables según el contrato de la API.
 */
export async function ejecutarLoginCommand(
  credentials: LoginCredentials,
  httpClient: IHttpClient,
  secureStorage: ISecureStorage,
  baseUrl: string
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/auth/login`;

  try {
    const { status, data: cuerpo } = await httpClient.post<ApiResponse<LoginResponse>>(url, credentials);

    const token = cuerpo?.status === 'success' ? cuerpo.data?.token : undefined;
    if (status === 200 && typeof token === 'string' && token.length > 0) {
      await secureStorage.guardarToken(token);
      return token;
    }

    if (status === 401) {
      // En el formulario mostramos el mismo mensaje para cualquier rechazo de credenciales.
      throw new HttpError(401, 'Credenciales incorrectas', cuerpo);
    }

    const mensaje = cuerpo?.status === 'error' ? cuerpo.message : undefined;
    const mensajePredeterminado = status === 400
      ? 'Revisa el correo y la contraseña'
      : 'No se pudo procesar la solicitud';
    throw new HttpError(status, mensaje || mensajePredeterminado, cuerpo);
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof NetworkError) {
      throw error;
    }
    throw new NetworkError('Fallo de conexión. Reintentar');
  }
}

